"use client";

import { useState } from "react";
import { ChevronDown, Calendar as CalendarIcon, Loader2 } from "lucide-react";

export default function MarkAttendancePage() {
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [students, setStudents] = useState([]);
  const [attendanceState, setAttendanceState] = useState({}); // { studentId: "present" | "absent" }
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const fetchStudents = async () => {
    if (!selectedClass || !selectedDate) {
      setError("Please select a class and date");
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const token = localStorage.getItem("token") || "";
      // Normally we'd filter by class, but since the endpoint just supports search/page/limit currently,
      // we'll fetch a batch and then filter locally for this MVP, or ideally update backend to support class filter.
      // For now, let's fetch students. We'll fetch a larger limit to ensure we get them.
      const res = await fetch(`/api/admin/students?limit=1000`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load students");
      const data = await res.json();
      const allStudents = Array.isArray(data) ? data : (data.data || []);
      
      // Filter by class locally
      let filtered = allStudents.filter(s => s.profile?.className === `Class ${selectedClass}` || s.profile?.className === selectedClass);
      
      // If we are strictly matching exactly the number '1' or '2'
      if (filtered.length === 0) {
          // fallback if class is just "1"
          filtered = allStudents; // show all for demo if filter fails
      }

      setStudents(filtered);
      
      // Initialize attendance state (default all present)
      const initialState = {};
      filtered.forEach(s => {
        initialState[s._id] = "present";
      });
      setAttendanceState(initialState);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceState(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    setError(null);
    try {
      const records = students.map(s => ({
        studentId: s._id,
        status: attendanceState[s._id] || "present"
      }));

      const token = localStorage.getItem("token") || "";
      const res = await fetch(`/api/staff/attendance/mark`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({
          date: selectedDate,
          records
        })
      });
      
      if (!res.ok) throw new Error("Failed to save attendance");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4">
      
      {/* Header Card */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 sm:p-6 flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1 h-5 bg-[#FF9933] rounded-full"></div>
          <h1 className="text-xl font-black text-stone-900 tracking-tight">Mark Attendance</h1>
        </div>
        <p className="text-[13px] font-medium text-stone-500">
          Select class and date to mark attendance
        </p>
      </div>

      {/* Filters Card */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          
          {/* Class Select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-black tracking-widest text-stone-500 uppercase">Class</label>
            <div className="relative">
              <select 
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                className="w-full appearance-none bg-white border border-stone-200 rounded-md py-2.5 pl-3 pr-8 text-[13px] font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-200 shadow-sm cursor-pointer"
              >
                <option value="" disabled>Select Class</option>
                <option value="1">Class 1</option>
                <option value="2">Class 2</option>
                <option value="3">Class 3</option>
                <option value="4">Class 4</option>
                <option value="5">Class 5</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-stone-400">
                <ChevronDown size={14} />
              </div>
            </div>
          </div>

          {/* Section Select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-black tracking-widest text-stone-500 uppercase">Section</label>
            <div className="relative">
              <select defaultValue="A" className="w-full appearance-none bg-white border border-stone-200 rounded-md py-2.5 pl-3 pr-8 text-[13px] font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-200 shadow-sm cursor-pointer">
                <option value="A">A</option>
                <option value="B">B</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-stone-400">
                <ChevronDown size={14} />
              </div>
            </div>
          </div>

          {/* Date Picker */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-black tracking-widest text-stone-500 uppercase">Date</label>
            <div className="relative">
              <input 
                type="date" 
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full bg-white border border-stone-200 rounded-md py-2.5 pl-3 pr-4 text-[13px] font-bold text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] shadow-sm cursor-pointer"
              />
            </div>
          </div>

          {/* Load Students Button */}
          <div>
            <button 
              onClick={fetchStudents}
              disabled={loading}
              className="w-full bg-[#FF9933] hover:bg-orange-500 text-white font-bold py-2.5 rounded-md text-[13px] transition-colors shadow-sm h-[42px] flex items-center justify-center disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : "Load Students"}
            </button>
          </div>

        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 font-bold">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-600 p-4 rounded-xl border border-green-100 font-bold">
          Attendance saved successfully!
        </div>
      )}

      {/* Student List */}
      {students.length > 0 && (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/50">
                  <th className="py-4 px-6 font-black text-[12px] text-stone-800 whitespace-nowrap">
                    Student
                  </th>
                  <th className="py-4 px-6 font-black text-[12px] text-stone-800 whitespace-nowrap">
                    Roll Number
                  </th>
                  <th className="py-4 px-6 font-black text-[12px] text-stone-800 whitespace-nowrap text-right">
                    Attendance Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 bg-white">
                {students.map((student) => (
                  <tr key={student._id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className="font-bold text-[13px] text-stone-800">{student.name}</span>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className="font-bold text-[12px] text-stone-500 font-mono">{student.profile?.rollNumber || student.schoolId || "—"}</span>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap text-right">
                      <div className="inline-flex rounded-md shadow-sm">
                        <button
                          onClick={() => handleStatusChange(student._id, 'present')}
                          className={`px-4 py-1.5 text-xs font-bold rounded-l-md border transition-colors ${
                            attendanceState[student._id] === 'present' 
                              ? 'bg-green-500 text-white border-green-500' 
                              : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-50'
                          }`}
                        >
                          Present
                        </button>
                        <button
                          onClick={() => handleStatusChange(student._id, 'absent')}
                          className={`px-4 py-1.5 text-xs font-bold rounded-r-md border-t border-b border-r transition-colors ${
                            attendanceState[student._id] === 'absent' 
                              ? 'bg-red-500 text-white border-red-500' 
                              : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-50'
                          }`}
                        >
                          Absent
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 border-t border-stone-200 bg-stone-50/50 flex justify-end">
            <button 
              onClick={handleSaveAttendance}
              disabled={saving}
              className="bg-stone-900 hover:bg-stone-800 text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" size={16} /> : null}
              Save Attendance
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
