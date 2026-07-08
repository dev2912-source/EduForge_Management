"use client";

import { useState, useEffect } from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

const CLOCK_LABELS = {
  not_in: "Not Clocked In",
  clocked_in: "Clocked In",
  on_break: "On Break",
  clocked_out: "Done for Day"
};

const CLOCK_COLORS = {
  not_in: "bg-stone-100 text-stone-500 border-stone-200",
  clocked_in: "bg-green-50 text-green-700 border-green-200",
  on_break: "bg-amber-50 text-amber-700 border-amber-200",
  clocked_out: "bg-blue-50 text-blue-600 border-blue-200"
};

const STATUS_COLORS = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-600 border-red-200"
};

const COLORS = ["#3B82F6","#FF9933","#7C3AED","#059669","#E11D48","#0891B2","#D97706","#4F46E5","#BE185D"];

function hashCode(str) {
  if (!str) return 0;
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) & 0x7fffffff;
  return h;
}

function formatTime(dateStr) {
  if (!dateStr) return "\u2014";
  try {
    return new Date(dateStr).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
  } catch { return "\u2014"; }
}

function formatDate(dateStr) {
  if (!dateStr) return "\u2014";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch { return "\u2014"; }
}

function formatCurrency(n) {
  if (!n && n !== 0) return "\u2014";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function formatTimeRange(range) {
  if (!range) return "";
  const parts = range.split(/[-–—]/).map(s => s.trim());
  return parts.length === 2 ? `${parts[0]} \u2013 ${parts[1]}` : range;
}

export default function StaffDashboard() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [todaysClasses, setTodaysClasses] = useState([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try { setProfile(JSON.parse(stored)); } catch {}
    }
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setClassesLoading(true);
      try {
        const token = localStorage.getItem("token") || "";
        const headers = { Authorization: `Bearer ${token}` };

        const [dashRes, classesRes] = await Promise.allSettled([
          fetch(`/api/dashboard/staff`, { headers }),
          fetch(`/api/staff/timetable/today`, { headers })
        ]);

        if (dashRes.status === 'fulfilled' && dashRes.value.ok) {
          const d = await dashRes.value.json();
          setData(d);
          if (d.profile) setProfile(prev => ({ ...prev, ...d.profile }));
        }
        if (classesRes.status === 'fulfilled' && classesRes.value.ok) {
          const c = await classesRes.value.json();
          if (c.success) setTodaysClasses(c.data?.entries || []);
        }
      } catch {} finally { setLoading(false); setClassesLoading(false); }
    };
    fetchAll();
  }, []);

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  })();

  const todayStr = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });

  const weekdayStr = new Date().toLocaleDateString("en-IN", { weekday: "long" });

  const p = data?.profile;
  const initials = p?.firstName && p?.lastName
    ? (p.firstName[0] + p.lastName[0]).toUpperCase()
    : p?.name
      ? p.name.split(" ").map(s => s[0]).join("").substring(0, 2).toUpperCase()
      : profile?.name
        ? profile.name.split(" ").map(s => s[0]).join("").substring(0, 2).toUpperCase()
        : "ST";

  const firstname = p?.firstName || profile?.name?.split(" ")[0] || "there";
  const department = p?.department || profile?.department;
  const designation = p?.designation || profile?.designation;
  const staffCode = p?.schoolId || profile?.schoolId || profile?.profile?.rollNumber;

  const tc = data?.todayClock || {};
  const clockStatus = tc.clock_status || "not_in";

  const month = data?.thisMonth || {};
  const totalDays = (month.present || 0) + (month.absent || 0) + (month.late || 0) + (month.on_leave || 0);

  const pendingLeavesCount = data?.pendingLeaves || 0;
  const approvedThisMonth = (data?.recentLeaves || []).filter(l => {
    if (l.status !== "approved") return false;
    const d = new Date(l.start_date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const salary = data?.latestSalary;
  const recentLeaves = data?.recentLeaves || [];

  const salaryMonth = salary?.slipMonth
    ? new Date(salary.slipMonth).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : salary?.month || "";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[#FF9933]" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black text-white flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #FF9933, #e8841f)" }}>
              {initials}
            </div>
            <div>
              <h1 className="text-xl font-black text-stone-900 tracking-tight leading-snug">{greeting}, {firstname}</h1>
              <p className="text-sm text-stone-500 font-medium mt-0.5">
                {department && <>{department}</>}
                {department && designation && <span> \u00B7 </span>}
                {designation && <>{designation}</>}
                {!department && !designation && <>Welcome back</>}
              </p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            {staffCode && (
              <div className="text-[10px] font-black font-mono px-2 py-1 rounded-md inline-block"
                style={{ color: "#D47115", background: "#FDF1E6" }}>
                {staffCode}
              </div>
            )}
            <p className="text-[10px] text-stone-400 font-semibold mt-1.5 tracking-wide">{todayStr}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Today's Clock */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-3">Today's Clock</p>
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${CLOCK_COLORS[clockStatus]}`}>
              {CLOCK_LABELS[clockStatus]}
            </span>
            {tc.is_late && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Late</span>}
          </div>
          {tc.clock_in_at ? (
            <p className="text-sm font-bold text-stone-700">In: {formatTime(tc.clock_in_at)}</p>
          ) : (
            <p className="text-sm text-stone-400 font-semibold">Haven't clocked in yet</p>
          )}
          <button onClick={() => router.push('/dashboard/clock')}
            className="inline-flex items-center gap-1 text-xs font-bold mt-3 text-[#FF9933] hover:text-[#e8841f] transition-colors">
            Go to Clock <ChevronRight size={12} />
          </button>
        </div>

        {/* This Month */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-3">This Month</p>
          <div className="text-2xl font-black text-stone-900 leading-none">
            {month.present || 0} <span className="text-base font-semibold text-stone-400">/ {totalDays} days</span>
          </div>
          <p className="text-[10px] font-semibold text-stone-400 mt-1">present this month</p>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {(month.late || 0) > 0 && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{month.late} late</span>}
            {(month.absent || 0) > 0 && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-600">{month.absent} absent</span>}
            {(month.total_worked_minutes || 0) > 0 && <span className="text-[10px] font-semibold text-stone-400">{Math.round(month.total_worked_minutes / 60)}h worked</span>}
          </div>
        </div>

        {/* Leave Status */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-3">Leave Status</p>
          <div className="flex items-center gap-2 flex-wrap">
            {pendingLeavesCount > 0
              ? <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">{pendingLeavesCount} pending</span>
              : <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-stone-100 text-stone-500">No pending</span>
            }
            {approvedThisMonth > 0 && <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-green-100 text-green-700">{approvedThisMonth} approved</span>}
          </div>
          <button onClick={() => router.push('/dashboard/leave')}
            className="inline-flex items-center gap-1 text-xs font-bold mt-3 text-[#FF9933] hover:text-[#e8841f] transition-colors">
            Manage leave <ChevronRight size={12} />
          </button>
        </div>
      </div>

      {/* Today's Classes */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3 bg-[#FF9933] rounded-full" />
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Today's Classes</p>
          </div>
          <span className="text-[10px] font-semibold text-stone-400">{weekdayStr}</span>
        </div>
        {classesLoading ? (
          <div className="px-5 py-8 text-center">
            <Loader2 size={20} className="animate-spin text-[#FF9933] mx-auto" />
          </div>
        ) : todaysClasses.length > 0 ? (
          <div className="px-4 py-4 flex gap-3 overflow-x-auto">
            {todaysClasses.map(cls => (
              <div key={cls.id} className="flex-shrink-0 w-36 rounded-xl overflow-hidden border border-stone-100 shadow-sm">
                <div className="h-1.5 w-full" style={{ backgroundColor: cls.color || COLORS[hashCode(cls.subject?.name) % COLORS.length] }} />
                <div className="p-3">
                  <p className="text-xs font-bold text-stone-900 leading-snug line-clamp-2">{cls.subject?.name || "\u2014"}</p>
                  <p className="text-[10px] text-stone-500 font-semibold mt-1">
                    {cls.class?.name}{cls.section?.name ? ` \u00B7 ${cls.section.name}` : ""}
                  </p>
                  <p className="text-[10px] font-black text-stone-400 mt-2 tabular-nums">{formatTimeRange(cls.time_range)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-8 text-center">
            <p className="text-sm font-bold text-stone-400">No classes today</p>
            <p className="text-xs text-stone-300 font-medium mt-0.5">Enjoy your free day</p>
          </div>
        )}
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Latest Salary Slip */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-3 mb-4">
            <div className="w-1 h-3 bg-[#FF9933] rounded-full" />
            <h2 className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Latest Salary Slip</h2>
          </div>
          {salary ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-stone-800">{salaryMonth}</span>
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${
                  salary.payment_status === "Paid" ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"
                }`}>{salary.payment_status}</span>
              </div>
              <div className="space-y-2 pt-1">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Gross Salary</span>
                  <span className="font-bold text-stone-900">{formatCurrency(salary.gross_salary)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Deductions</span>
                  <span className="font-bold text-red-500">-{formatCurrency(salary.gross_salary - salary.net_salary)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t border-stone-100 pt-2">
                  <span className="text-stone-700">Net Salary</span>
                  <span className="text-green-600">{formatCurrency(salary.net_salary)}</span>
                </div>
              </div>
              <button onClick={() => router.push('/dashboard/salary')}
                className="inline-flex items-center gap-1.5 text-xs font-bold mt-1 text-[#FF9933] hover:text-[#e8841f] transition-colors">
                View all slips <ChevronRight size={12} />
              </button>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm font-bold text-stone-400">No salary slips</p>
              <p className="text-xs text-stone-300 font-medium mt-0.5">Your salary slips will appear here once generated.</p>
            </div>
          )}
        </div>

        {/* Recent Leave Requests */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-3 mb-4">
            <div className="w-1 h-3 bg-[#FF9933] rounded-full" />
            <h2 className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Recent Leave Requests</h2>
          </div>
          {recentLeaves.length > 0 ? (
            <div className="divide-y divide-stone-100 -mx-5 px-5">
              {recentLeaves.map(l => (
                <div key={l._id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-stone-800 leading-none">
                      {formatDate(l.start_date)}{l.end_date && l.end_date !== l.start_date ? <span className="text-stone-400 font-medium"> \u2013 {formatDate(l.end_date)}</span> : ""}
                    </p>
                    {l.reason && <p className="text-[10px] text-stone-400 font-medium mt-0.5 truncate">{l.reason}</p>}
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border flex-shrink-0 ${
                    STATUS_COLORS[l.status] || "bg-stone-100 text-stone-600 border-stone-200"
                  }`}>{l.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm font-bold text-stone-400">No leave requests</p>
              <p className="text-xs text-stone-300 font-medium mt-0.5">Your leave requests will appear here.</p>
            </div>
          )}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-stone-100">
            <button onClick={() => router.push('/dashboard/leave')}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#FF9933] hover:text-[#e8841f] transition-colors">
              View all <ChevronRight size={12} />
            </button>
            <button onClick={() => router.push('/dashboard/leave')}
              className="text-xs font-black px-3 py-1.5 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors">
              Apply for leave
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
