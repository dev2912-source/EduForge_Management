'use client';
import React, { Fragment, useState, useEffect } from 'react';

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

export default function StudentTimetable() {
  const [timetableData, setTimetableData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/student/timetable`, {
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
    fetchTimetable();
  }, []);

  const today = new Date().getDay(); // 0=Sun,1=Mon,...,6=Sat
  const todayCol = today === 0 ? -1 : today - 1; // -1 if Sunday

  // Get unique subjects for legend
  const subjectsMap = {};
  timetableData.forEach(item => {
    if (!subjectsMap[item.subject]) {
      subjectsMap[item.subject] = { color: item.colorCode };
    }
  });

  // Helper to find class by period and day
  const getClass = (timeRange, day) => {
    return timetableData.find(c => c.timeRange === timeRange && c.dayOfWeek === day);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white p-5">

      {/* Header */}
      <div className="flex items-center gap-2 mb-4 flex-shrink-0">
        <span className="w-[3px] h-5 bg-[#F97316] rounded-full"></span>
        <div>
          <h1 className="text-lg font-bold text-stone-900">Class Timetable</h1>
          <p className="text-xs text-stone-400">Your weekly class schedule</p>
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
                    <span
                      className={`text-xs font-black tracking-widest ${
                        todayCol === dIdx ? "text-[#F97316]" : "text-stone-500"
                      }`}
                    >
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
                <td colSpan={7} className="py-8 text-center text-stone-400">Loading...</td>
              </tr>
            ) : periods.map((period, pIdx) => (
              <Fragment key={pIdx}>
                {/* Lunch break row after period 4 (index 3) */}
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
                      <td key={dIdx} className="px-2 py-2">
                        {cls ? (
                          <div
                            className={`rounded-lg px-2.5 py-2 text-white transition-all ${
                              isToday ? "shadow-md scale-[1.02]" : ""
                            }`}
                            style={{ backgroundColor: cls.colorCode }}
                          >
                            <p className="text-[11px] font-black leading-tight">{cls.subject}</p>
                            <p className="text-[9px] opacity-80 mt-0.5 truncate">{cls.teacher}</p>
                          </div>
                        ) : (
                          <div className="rounded-lg px-2.5 py-2 bg-stone-50 text-stone-300 text-center text-[10px] italic">
                            Free
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

      {/* Subject Legend */}
      {!loading && (
        <div className="flex-shrink-0 flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-3">
          <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Subjects</span>
          {Object.entries(subjectsMap).map(([name, { color }]) => (
            <div key={name} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: color }}></span>
              <span className="text-[11px] font-medium text-stone-600">{name}</span>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
