'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const SUBJECT_COLORS = ["#3B82F6","#FF9933","#7C3AED","#059669","#E11D48","#0891B2","#D97706","#4F46E5","#BE185D"];

function getSubjectColor(name) {
  if (!name) return "#94A3B8";
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 2147483647;
  return SUBJECT_COLORS[Math.abs(hash) % SUBJECT_COLORS.length];
}

function formatTime(timeRange) {
  if (!timeRange) return "";
  const parts = timeRange.split(' - ');
  if (parts.length < 2) return timeRange;
  const [h, m] = parts[0].split(':').map(Number);
  if (isNaN(h)) return parts[0];
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function formatCurrency(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
}

function statusBadge(s) {
  return {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-600'
  }[s] || 'bg-stone-100 text-stone-600';
}

export default function StudentDashboard() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return router.push('/login');

        const res = await fetch('/api/dashboard/student', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Failed to load dashboard');

        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dateStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-stone-400">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-stone-400 font-semibold mb-3">Could not load dashboard data</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm font-bold text-[#F97316] border border-[#F97316] px-4 py-2 rounded-lg hover:bg-orange-50 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { profile, attendanceStats, feeSummary, todaysClasses, pendingLeaves, recentLeaves } = data;
  const p = profile?.profile || {};
  const firstName = profile?.firstName || profile?.name?.split(' ')[0] || 'Student';
  const className = p.className || profile?.class_name;
  const sectionName = p.section || profile?.section_name;
  const classMedium = (p.medium || profile?.class_medium || '').toUpperCase();

  const pctColor = attendanceStats.percentage >= 75 ? '#16a34a' : attendanceStats.percentage >= 60 ? '#d97706' : '#dc2626';
  const hasOutstanding = feeSummary.totalDue > 0;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">{greeting}, {firstName}!</h1>
          <p className="text-sm text-stone-500 font-medium mt-0.5">{dateStr}</p>
        </div>
        {className && (
          <div className="flex items-center gap-2 bg-stone-50 rounded-xl px-3 py-1.5 border border-stone-200">
            <span className="text-xs font-bold text-stone-600">{className}</span>
            {sectionName && (
              <>
                <span className="text-xs text-stone-400">·</span>
                <span className="text-xs font-bold text-stone-500">{sectionName}</span>
              </>
            )}
            {classMedium && (
              <>
                <span className="text-xs text-stone-400">·</span>
                <span className="text-[10px] font-black text-teal-700 uppercase">{classMedium}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1 h-3 bg-[#F97316] rounded-full"></span>
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Attendance</p>
          </div>
          <p className="text-3xl font-black leading-none" style={{ color: pctColor }}>
            {attendanceStats.percentage}%
          </p>
          <p className="text-xs text-stone-400 font-medium mt-1">{attendanceStats.presentDays} days present</p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1 h-3 bg-[#F97316] rounded-full"></span>
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Outstanding Fees</p>
          </div>
          <p className={`text-2xl font-black ${hasOutstanding ? 'text-red-500' : 'text-green-500'}`}>
            {formatCurrency(feeSummary.totalDue)}
          </p>
          <p className="text-xs text-stone-400 font-medium mt-1">{hasOutstanding ? 'Due' : 'All fees cleared'}</p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1 h-3 bg-[#F97316] rounded-full"></span>
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Leave</p>
          </div>
          <p className="text-2xl font-black text-stone-800">{pendingLeaves}</p>
          <p className="text-xs text-stone-400 font-medium mt-1">
            {pendingLeaves === 1 ? 'pending request' : 'pending requests'}
          </p>
        </div>
      </div>

      {/* Today's Classes */}
      {todaysClasses.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-1 h-3 bg-[#F97316] rounded-full"></span>
              <h2 className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Today's Classes</h2>
            </div>
            <Link
              href="/dashboard/timetable"
              className="text-[10px] font-black uppercase tracking-widest"
              style={{ color: '#F97316' }}
            >
              Full timetable
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {todaysClasses.map((cls, idx) => {
              const bgColor = cls.colorCode || getSubjectColor(cls.subject);
              return (
                <div
                  key={idx}
                  className="flex-shrink-0 rounded-xl p-3 min-w-[130px] flex flex-col justify-between"
                  style={{ backgroundColor: bgColor }}
                >
                  <p className="text-[10px] font-bold leading-none" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    {formatTime(cls.timeRange)}
                  </p>
                  <div>
                    <p className="text-sm font-bold text-white leading-snug mt-2 line-clamp-2">{cls.subject}</p>
                    {cls.teacher && (
                      <p className="text-[10px] font-medium mt-1.5 leading-none truncate" style={{ color: 'rgba(255,255,255,0.65)' }}>
                        {cls.teacher}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Leave Requests */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-1 h-3 bg-[#F97316] rounded-full"></span>
            <h2 className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Leave Requests</h2>
          </div>
          <Link
            href="/dashboard/leave"
            className="text-[10px] font-black uppercase tracking-widest"
            style={{ color: '#F97316' }}
          >
            View all
          </Link>
        </div>
        {recentLeaves.length === 0 ? (
          <p className="text-sm text-stone-400 font-medium text-center py-4">No leave requests yet</p>
        ) : (
          <div className="divide-y divide-stone-50">
            {recentLeaves.map((leave, idx) => (
              <div key={idx} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-semibold text-stone-800">
                    {formatDate(leave.fromDate)} – {formatDate(leave.toDate)}
                  </p>
                  {leave.reason && (
                    <p className="text-xs text-stone-400 mt-0.5 line-clamp-1">{leave.reason}</p>
                  )}
                </div>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex-shrink-0 ml-3 ${statusBadge(leave.status)}`}>
                  {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        )}
        <Link
          href="/dashboard/leave"
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold border border-stone-200 rounded-lg px-3 py-1.5 text-stone-600 hover:bg-stone-50 transition-colors"
        >
          + Apply for leave
        </Link>
      </div>

    </div>
  );
}
