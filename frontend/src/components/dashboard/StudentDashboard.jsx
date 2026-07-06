'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function StudentDashboard() {
  const router = useRouter();
  const [data, setData] = useState({
    profile: null,
    timetable: [],
    leaves: [],
    fees: [],
    attendance: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return router.push('/login');
        
        const headers = { Authorization: `Bearer ${token}` };
        
        const [profileRes, timetableRes, leaveRes, feesRes, attendanceRes] = await Promise.all([
          fetch(`/api/student/profile`, { headers }),
          fetch(`/api/student/timetable`, { headers }),
          fetch(`/api/student/leave`, { headers }),
          fetch(`/api/student/fees`, { headers }),
          fetch(`/api/student/attendance`, { headers })
        ]);

        if (profileRes.ok) {
          setData({
            profile: await profileRes.json(),
            timetable: await timetableRes.json(),
            leaves: await leaveRes.json(),
            fees: await feesRes.json(),
            attendance: await attendanceRes.json()
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [router]);

  if (loading) {
    return <div className="h-full flex items-center justify-center text-stone-400">Loading...</div>;
  }

  const { profile, timetable, leaves, fees, attendance } = data;
  const p = profile?.profile || {};

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  
  const currentDayStr = today.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  const todaysClasses = timetable.filter(t => t.dayOfWeek === currentDayStr);

  const pendingLeaves = leaves.filter(l => l.status === 'pending').length;
  
  const totalDue = fees.reduce((acc, inv) => acc + (parseInt((inv.balance || inv.amount).replace(/[^0-9]/g, ''), 10) || 0), 0);
  
  const totalDays = attendance.length;
  const presentDays = attendance.filter(a => a.status === 'Present').length;
  const attendancePercentage = totalDays > 0 ? Math.round((presentDays / (totalDays - attendance.filter(a => a.status === 'Weekend').length)) * 100) || 0 : 0;

  return (
    <div className="h-full flex flex-col gap-4 p-5 overflow-hidden bg-white">

      {/* Page Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-stone-900">{greeting}, {profile?.name?.split(' ')[0]}!</h1>
          <p className="text-sm text-stone-500 mt-0.5">{dateStr}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-stone-700 bg-stone-100 px-2.5 py-1 rounded-lg">{p.className || '-'}</span>
          <span className="text-sm text-stone-500">{p.section || '-'}</span>
          <span className="text-xs text-[#22C55E] font-black tracking-widest uppercase">ENGLISH</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 flex-shrink-0">
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-[3px] h-4 bg-[#F97316] rounded-full inline-block"></span>
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Attendance</span>
          </div>
          <p className="text-3xl font-black text-[#22C55E] leading-none">{attendancePercentage}%</p>
          <p className="text-xs text-stone-400 mt-1.5">{presentDays} days present</p>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-[3px] h-4 bg-[#F97316] rounded-full inline-block"></span>
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Outstanding Fees</span>
          </div>
          <p className="text-3xl font-black text-[#EF4444] leading-none">₹{totalDue.toLocaleString()}</p>
          <p className="text-xs text-stone-400 mt-1.5">Due</p>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-[3px] h-4 bg-[#F97316] rounded-full inline-block"></span>
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Leave</span>
          </div>
          <p className="text-3xl font-black text-stone-900 leading-none">{pendingLeaves}</p>
          <p className="text-xs text-stone-400 mt-1.5">pending requests</p>
        </div>
      </div>

      {/* Today's Classes */}
      <div className="bg-white border border-stone-200 rounded-xl shadow-sm flex-shrink-0 overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between border-b border-stone-100">
          <div className="flex items-center gap-2">
            <span className="w-[3px] h-4 bg-[#F97316] rounded-full"></span>
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Today's Classes</span>
          </div>
          <Link href="/dashboard/timetable" className="text-[#F97316] text-[10px] font-black uppercase tracking-widest hover:underline">
            Full Timetable
          </Link>
        </div>
        <div className="px-4 py-3 overflow-x-auto">
          <div className="flex gap-2.5" style={{ minWidth: "max-content" }}>
            {todaysClasses.length > 0 ? todaysClasses.map((cls, idx) => (
              <div
                key={idx}
                className="flex-shrink-0 w-[130px] rounded-xl p-3 text-white flex flex-col justify-between"
                style={{ backgroundColor: cls.colorCode, height: "82px" }}
              >
                <p className="text-[10px] font-semibold opacity-80">{cls.timeRange.split(' - ')[0]}</p>
                <div>
                  <p className="text-[12px] font-black leading-tight truncate">{cls.subject}</p>
                  <p className="text-[10px] opacity-70 mt-0.5 truncate">{cls.teacher}</p>
                </div>
              </div>
            )) : <div className="text-sm text-stone-400">No classes scheduled for today.</div>}
          </div>
        </div>
      </div>

      {/* Leave Requests */}
      <div className="bg-white border border-stone-200 rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="px-4 py-3 flex items-center justify-between border-b border-stone-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-[3px] h-4 bg-[#F97316] rounded-full"></span>
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Leave Requests</span>
          </div>
          <Link href="/dashboard/leave" className="text-[#F97316] text-[10px] font-black uppercase tracking-widest hover:underline">
            View All
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto">
          {leaves.slice(0, 3).map((leave, idx) => (
            <div key={idx} className="px-4 py-3 flex items-center justify-between border-b border-stone-50">
              <div>
                <p className="text-sm font-bold text-stone-900">
                  {new Date(leave.fromDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – {new Date(leave.toDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </p>
                <p className="text-xs text-stone-500 mt-0.5">{leave.reason}</p>
              </div>
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wide border ${
                leave.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                leave.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                'bg-yellow-50 text-yellow-700 border-yellow-200'
              }`}>
                {leave.status}
              </span>
            </div>
          ))}
          {leaves.length === 0 && <div className="p-4 text-sm text-stone-400">No recent leave requests.</div>}
        </div>

        <div className="px-4 py-3 border-t border-stone-100 flex-shrink-0">
          <Link href="/dashboard/leave" className="inline-block text-xs font-semibold text-stone-700 border border-stone-300 bg-white px-3 py-1.5 rounded-lg hover:border-[#F97316] hover:text-[#F97316] transition-colors">
            + Apply for leave
          </Link>
        </div>
      </div>

    </div>
  );
}
