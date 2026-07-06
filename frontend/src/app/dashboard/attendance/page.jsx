'use client';
import { Calendar, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function AttendancePage() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/student/attendance`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAttendance(data);
        }
      } catch (error) {
        console.error('Error fetching attendance:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  const totalDays = attendance.length;
  const presentCount = attendance.filter(a => a.status === 'Present').length;
  const absentCount = attendance.filter(a => a.status === 'Absent').length;
  const lateCount = attendance.filter(a => a.status === 'Late').length;
  const leaveCount = attendance.filter(a => a.status === 'Leave').length;
  const weekendCount = attendance.filter(a => a.status === 'Weekend').length;

  const schoolDays = totalDays - weekendCount;
  const attendancePercentage = schoolDays > 0 ? Math.round((presentCount / schoolDays) * 100) : 0;

  return (
    <div className="h-full flex flex-col gap-4 p-5 overflow-hidden bg-[#FAFAFA]">
      
      {/* Header Controls */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-wrap items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-2 mr-auto">
          <div className="w-1.5 h-5 bg-[#F97316] rounded-full"></div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">
            My Attendance
          </h1>
        </div>
        
        <div className="flex rounded-xl overflow-hidden border border-stone-200">
          <button className="px-3 py-1.5 text-xs font-bold transition-all bg-stone-900 text-white">
            Monthly
          </button>
          <button className="px-3 py-1.5 text-xs font-bold transition-all border-l border-stone-200 text-stone-500 hover:bg-stone-50">
            Yearly
          </button>
        </div>
        
        <div className="w-44">
          <div className="relative">
            <button className="py-1 px-3 text-sm border border-stone-200 bg-stone-50 rounded-lg flex items-center gap-2 cursor-pointer hover:border-stone-300 transition-colors w-full" type="button">
              <Calendar className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" strokeWidth={2.5} />
              <span className="font-bold text-stone-700 flex-1 text-left truncate">
                Jul 2026
              </span>
              <ChevronDown className="w-3 h-3 text-stone-400 flex-shrink-0" />
            </button>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm px-5 py-3 flex-shrink-0">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-black ${attendancePercentage >= 75 ? 'text-green-600' : 'text-red-600'}`}>{attendancePercentage}%</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">
              Attended
            </span>
          </div>
          <div className="h-5 w-px bg-stone-200 hidden sm:block"></div>
          
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            <span className="text-xs">
              <span className="font-black text-green-600">{presentCount}</span>
              <span className="text-stone-400 ml-1">Present</span>
            </span>
            <span className="text-xs">
              <span className="font-black text-red-500">{absentCount}</span>
              <span className="text-stone-400 ml-1">Absent</span>
            </span>
            <span className="text-xs">
              <span className="font-black text-amber-600">{lateCount}</span>
              <span className="text-stone-400 ml-1">Late</span>
            </span>
            <span className="text-xs">
              <span className="font-black text-blue-500">{leaveCount}</span>
              <span className="text-stone-400 ml-1">Leave</span>
            </span>
            <span className="text-xs">
              <span className="font-black text-stone-700">{totalDays}</span>
              <span className="text-stone-400 ml-1">Total days</span>
            </span>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="overflow-x-auto flex-1">
          <table className="w-full min-w-[380px]">
            <thead className="sticky top-0 bg-white z-10 shadow-sm">
              <tr className="border-b border-stone-200">
                <th className="text-left py-3 px-4 text-sm font-bold text-stone-700">Date</th>
                <th className="text-left py-3 px-4 text-sm font-bold text-stone-700 hidden sm:table-cell">Day</th>
                <th className="text-left py-3 px-4 text-sm font-bold text-stone-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-bold text-stone-700 hidden md:table-cell">Remark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {loading ? (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-stone-400">Loading...</td>
                </tr>
              ) : attendance.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-stone-400">No attendance records found.</td>
                </tr>
              ) : attendance.map((row, idx) => {
                const isWeekend = row.status === 'Weekend';
                return (
                  <tr 
                    key={idx} 
                    className={`transition-colors ${isWeekend ? 'bg-stone-50/60' : 'hover:bg-stone-50/50'}`}
                  >
                    <td className={`py-2.5 px-4 text-sm font-semibold ${isWeekend ? 'text-stone-400' : 'text-stone-800'}`}>
                      {new Date(row.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className={`py-2.5 px-4 text-sm hidden sm:table-cell ${isWeekend ? 'text-stone-300' : 'text-stone-500'}`}>
                      {new Date(row.date).toLocaleDateString('en-GB', { weekday: 'long' })}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md border
                        ${row.status === 'Present' ? 'bg-green-50 text-green-700 border-green-200' : 
                          row.status === 'Absent' ? 'bg-red-50 text-red-700 border-red-200' :
                          row.status === 'Late' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          row.status === 'Weekend' ? 'bg-stone-100 text-stone-500 border-stone-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                        }
                      `}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-xs hidden md:table-cell text-stone-400">
                      {row.remark || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
