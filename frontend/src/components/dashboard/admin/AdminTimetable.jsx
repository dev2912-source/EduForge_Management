'use client';
import React, { Fragment, useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];

const periods = [
  { label: "Period 1", time: "8:00 AM\n8:45 AM", range: "8:00 AM - 8:45 AM" },
  { label: "Period 2", time: "8:45 AM\n9:30 AM", range: "8:45 AM - 9:30 AM" },
  { label: "Period 3", time: "9:30 AM\n10:15 AM", range: "9:30 AM - 10:15 AM" },
  { label: "Period 4", time: "10:15 AM\n11:00 AM", range: "10:15 AM - 11:00 AM" },
  // Lunch break after period 4
  { label: "Period 5", time: "11:30 AM\n12:15 PM", range: "11:30 AM - 12:15 PM" },
  { label: "Period 6", time: "12:15 PM\n1:00 PM", range: "12:15 PM - 1:00 PM" },
  { label: "Period 7", time: "1:00 PM\n1:45 PM", range: "1:00 PM - 1:45 PM" },
  { label: "Period 8", time: "1:45 PM\n2:30 PM", range: "1:45 PM - 2:30 PM" },
];

const predefinedSubjects = [
  { name: 'Free Period', teacher: '', color: 'transparent' },
  { name: 'Mathematics', teacher: 'Mr. Sharma', color: '#6C63FF' },
  { name: 'Science', teacher: 'Mrs. Gupta', color: '#10B981' },
  { name: 'English', teacher: 'Mr. Davis', color: '#F59E0B' },
  { name: 'History', teacher: 'Ms. Patel', color: '#EF4444' },
  { name: 'Hindi', teacher: 'Krishna Deshpande', color: '#E53E3E' },
  { name: 'Environmental Studies', teacher: 'Vivek Khanna', color: '#D97706' },
  { name: 'Computer Science', teacher: 'Rishabh Mehta', color: '#2B6CB0' },
  { name: 'Art & Craft', teacher: 'Tara Modi', color: '#C05621' },
  { name: 'Physical Education', teacher: 'Varsha Sharma', color: '#276749' },
];

export default function AdminTimetable() {
  const [timetableData, setTimetableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('Class 1');
  const [selectedSection, setSelectedSection] = useState('A');
  const [editCell, setEditCell] = useState(null); // { day, periodObj }
  const [saving, setSaving] = useState(false);

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/timetable?className=${selectedClass}&section=${selectedSection}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTimetableData(data);
      }
    } catch (error) {
      console.error('Error fetching timetable:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, [selectedClass, selectedSection]);

  const today = new Date().getDay(); // 0=Sun,1=Mon,...,6=Sat
  const todayCol = today === 0 ? -1 : today - 1; // -1 if Sunday

  const getClass = (timeRange, day) => {
    return timetableData.find(c => c.timeRange === timeRange && c.dayOfWeek === day);
  };

  const handleCellClick = (day, periodObj) => {
    setEditCell({ day, periodObj });
  };

  const handleSaveCell = async (subjectObj) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      
      const payload = {
        className: selectedClass,
        section: selectedSection,
        dayOfWeek: editCell.day,
        period: periods.findIndex(p => p.range === editCell.periodObj.range) + 1,
        timeRange: editCell.periodObj.range,
        subject: subjectObj.name,
        teacher: subjectObj.teacher,
        colorCode: subjectObj.color
      };

      const res = await fetch(`/api/admin/timetable`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        await fetchTimetable();
      }
    } catch (error) {
      console.error('Error saving cell', error);
    } finally {
      setSaving(false);
      setEditCell(null);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white p-5 relative">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-[3px] h-5 bg-[#F97316] rounded-full"></span>
          <div>
            <h1 className="text-lg font-bold text-stone-900">Manage Timetable</h1>
            <p className="text-xs text-stone-400">Edit class schedules dynamically</p>
          </div>
        </div>
        
        {/* Class / Section Selectors */}
        <div className="flex items-center gap-3">
          <select 
            className="text-sm border border-stone-200 rounded-lg px-3 py-1.5 bg-stone-50 font-medium text-stone-700 focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316] outline-none"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            {[1,2,3,4,5,6,7,8,9,10].map(c => (
              <option key={c} value={`Class ${c}`}>Class {c}</option>
            ))}
          </select>
          <select 
            className="text-sm border border-stone-200 rounded-lg px-3 py-1.5 bg-stone-50 font-medium text-stone-700 focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316] outline-none"
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
          >
            {['A', 'B', 'C'].map(s => (
              <option key={s} value={s}>Section {s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto rounded-xl border border-stone-200 shadow-sm">
        <table className="w-full border-collapse text-sm" style={{ minWidth: "720px" }}>
          <thead>
            <tr className="bg-white border-b border-stone-200">
              <th className="text-left px-3 py-3 text-xs font-semibold text-stone-400 w-[90px] sticky left-0 bg-white border-r border-stone-100 z-10"></th>
              {days.map((day, dIdx) => (
                <th key={day} className="px-3 py-3 text-center">
                  <div className={`inline-flex flex-col items-center gap-0.5`}>
                    <span className={`text-xs font-black tracking-widest ${todayCol === dIdx ? "text-[#F97316]" : "text-stone-500"}`}>
                      {day}
                    </span>
                    {todayCol === dIdx && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F97316] block"></span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-stone-400">Loading schedule...</td>
              </tr>
            ) : periods.map((period, pIdx) => (
              <Fragment key={pIdx}>
                {/* Lunch break row after period 4 */}
                {pIdx === 4 && (
                  <tr key="lunch" className="bg-[#FFFBEB]">
                    <td
                      colSpan={7}
                      className="px-4 py-2 text-center text-xs font-black text-[#D97706] uppercase tracking-widest border-y border-[#FDE68A]"
                    >
                      Lunch Break &nbsp;·&nbsp; 11:00 AM – 11:30 AM
                    </td>
                  </tr>
                )}

                <tr
                  key={pIdx}
                  className="border-b border-stone-100 hover:bg-stone-50/50 transition-colors"
                >
                  {/* Period label */}
                  <td className="px-3 py-2.5 sticky left-0 bg-white border-r border-stone-100 z-10">
                    <p className="text-[11px] font-bold text-stone-700">{period.label}</p>
                    {period.time.split("\n").map((t, i) => (
                      <p key={i} className="text-[10px] text-stone-400 leading-tight">{t}</p>
                    ))}
                  </td>

                  {/* Subject cells */}
                  {days.map((day, dIdx) => {
                    const cls = getClass(period.range, day);
                    const isToday = todayCol === dIdx;
                    return (
                      <td key={dIdx} className="px-2 py-2 cursor-pointer group" onClick={() => handleCellClick(day, period)}>
                        {cls && cls.subject !== 'Free Period' ? (
                          <div
                            className={`rounded-lg px-2.5 py-2 text-white transition-all group-hover:ring-2 ring-offset-1 ring-[#F97316] ${
                              isToday ? "shadow-md scale-[1.02]" : ""
                            }`}
                            style={{ backgroundColor: cls.colorCode }}
                          >
                            <p className="text-[11px] font-black leading-tight">{cls.subject}</p>
                            <p className="text-[9px] opacity-80 mt-0.5 truncate">{cls.teacher}</p>
                          </div>
                        ) : (
                          <div className="rounded-lg px-2.5 py-2 bg-stone-50 text-stone-400 text-center text-[10px] italic border border-dashed border-stone-200 group-hover:border-[#F97316] transition-colors group-hover:text-[#F97316] group-hover:bg-[#F97316]/5">
                            + Assign
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal Overlay */}
      {editCell && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-sm overflow-hidden flex flex-col max-h-full">
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 bg-stone-50/50">
              <div>
                <h3 className="text-sm font-bold text-stone-900">Assign Subject</h3>
                <p className="text-[11px] text-stone-500 mt-0.5">{editCell.day} • {editCell.periodObj.range}</p>
              </div>
              <button 
                onClick={() => setEditCell(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="overflow-y-auto p-3 grid gap-1.5">
              {predefinedSubjects.map((sub, i) => (
                <button
                  key={i}
                  onClick={() => handleSaveCell(sub)}
                  disabled={saving}
                  className="flex items-center justify-between w-full text-left px-4 py-2.5 rounded-xl hover:bg-stone-50 transition-colors border border-transparent hover:border-stone-200 disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <span 
                      className="w-3 h-3 rounded-full shadow-sm" 
                      style={{ backgroundColor: sub.color === 'transparent' ? '#e5e7eb' : sub.color }}
                    />
                    <div>
                      <p className="text-sm font-bold text-stone-800">{sub.name}</p>
                      {sub.teacher && <p className="text-[11px] text-stone-500 font-medium">{sub.teacher}</p>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
