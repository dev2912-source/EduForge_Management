'use client';
import { useState, useEffect, useMemo } from 'react';

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function statusBadgeClass(s) {
  return {
    present: 'bg-green-100 text-green-700',
    absent: 'bg-red-100 text-red-600',
    late: 'bg-amber-100 text-amber-700',
    leave: 'bg-blue-100 text-blue-600',
    holiday: 'bg-violet-100 text-violet-600',
    weekend: 'text-stone-300 font-medium',
    future: 'text-stone-300 font-medium',
    notmarked: 'text-stone-300 font-medium'
  }[s] || 'bg-stone-100 text-stone-600';
}

function pctColor(p) {
  return p >= 75 ? '#16a34a' : p >= 60 ? '#d97706' : '#dc2626';
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateShort(d) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function getDayName(d) {
  if (!d) return '—';
  return DAY_NAMES[new Date(d + 'T00:00:00').getDay()];
}

function computeStats(records) {
  const stats = { present: 0, absent: 0, late: 0, leave: 0, total: records.length };
  for (const r of records) {
    const s = (r.status || '').toLowerCase();
    if (s in stats) stats[s]++;
  }
  stats.percentage = stats.total > 0 ? Math.round((stats.present + stats.late) / stats.total * 100) : 0;
  return stats;
}

export default function StudentAttendancePage() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [workingDays, setWorkingDays] = useState([0, 1, 2, 3, 4]);
  const [holidays, setHolidays] = useState([]);
  const [viewMode, setViewMode] = useState('monthly');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedYearId, setSelectedYearId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch('/api/student/attendance', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to load attendance');
        const json = await res.json();
        setRecords(json.records || []);
        setAcademicYears(json.academic_years || []);
        if (json.working_days) setWorkingDays(json.working_days);
        setHolidays(json.holidays || []);
        const current = (json.academic_years || []).find(y => y.is_current);
        if (current) setSelectedYearId(current.id);
        else if (json.academic_years?.length) setSelectedYearId(json.academic_years[0].id);
      } catch (err) {
        console.error('Error loading attendance:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const recordsByDate = useMemo(() => {
    const map = {};
    for (const r of records) map[r.date] = r;
    return map;
  }, [records]);

  const holidaysByDate = useMemo(() => {
    const map = {};
    for (const h of holidays) map[h.date] = h.name;
    return map;
  }, [holidays]);

  const selectedYear = useMemo(() => {
    return academicYears.find(y => y.id === selectedYearId) || null;
  }, [academicYears, selectedYearId]);

  // Monthly calendar computation
  const monthDays = useMemo(() => {
    if (!selectedMonth) return [];
    const [y, m] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = [];
    for (let d = daysInMonth; d >= 1; d--) {
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dt = new Date(dateStr + 'T00:00:00');
      const dayIdx = dt.getDay() === 0 ? 6 : dt.getDay() - 1;
      const isWeekend = !workingDays.includes(dayIdx);
      const isHoliday = !!holidaysByDate[dateStr];
      const isFuture = dt > today;
      days.push({
        date: dateStr,
        isWeekend,
        isHoliday,
        holidayName: holidaysByDate[dateStr] || '',
        isFuture,
        record: recordsByDate[dateStr] || null
      });
    }
    return days;
  }, [selectedMonth, workingDays, holidaysByDate, recordsByDate]);

  const monthlyStats = useMemo(() => {
    const monthRecords = records.filter(r => r.date && r.date.startsWith(selectedMonth));
    return computeStats(monthRecords);
  }, [records, selectedMonth]);

  // Yearly computation
  const yearlyRecords = useMemo(() => {
    if (!selectedYear) return [];
    return records.filter(r => r.date >= selectedYear.start_date && r.date <= selectedYear.end_date);
  }, [records, selectedYear]);

  const yearlyStats = useMemo(() => computeStats(yearlyRecords), [yearlyRecords]);

  const monthlyBreakdown = useMemo(() => {
    if (!selectedYear) return [];
    const breakdown = [];
    const start = new Date(selectedYear.start_date + 'T00:00:00');
    const end = new Date(selectedYear.end_date + 'T00:00:00');
    for (let d = new Date(start); d <= end; d.setMonth(d.getMonth() + 1)) {
      const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthRecs = yearlyRecords.filter(r => r.date && r.date.startsWith(prefix));
      const stats = computeStats(monthRecs);
      breakdown.push({
        prefix,
        label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`,
        ...stats,
        percentage: monthRecs.length > 0 ? stats.percentage : null
      });
    }
    return breakdown;
  }, [selectedYear, yearlyRecords]);

  const weekDayOptions = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => i);
  }, []);

  const currentStats = viewMode === 'monthly' ? monthlyStats : yearlyStats;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 mr-auto">
          <span className="w-1.5 h-5 bg-[#F97316] rounded-full" />
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">My Attendance</h1>
        </div>

        {/* Monthly/Yearly Toggle */}
        <div className="flex rounded-xl overflow-hidden border border-stone-200">
          <button
            onClick={() => {
              setViewMode('monthly');
              const d = new Date();
              setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
            }}
            className={`px-3 py-1.5 text-xs font-bold transition-all ${
              viewMode === 'monthly' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:bg-stone-50'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setViewMode('yearly')}
            className={`px-3 py-1.5 text-xs font-bold transition-all border-l border-stone-200 ${
              viewMode === 'yearly' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:bg-stone-50'
            }`}
          >
            Yearly
          </button>
        </div>

        {/* Picker */}
        {viewMode === 'monthly' ? (
          <div className="w-44">
            <input
              type="month"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              max={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`}
              className="w-full text-xs font-bold border border-stone-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316] outline-none"
            />
          </div>
        ) : (
          <div className="w-44">
            <select
              value={selectedYearId || ''}
              onChange={e => setSelectedYearId(e.target.value)}
              className="w-full text-xs font-bold border border-stone-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316] outline-none bg-white"
            >
              {academicYears.length === 0 && <option value="">No academic years</option>}
              {academicYears.map(y => (
                <option key={y.id} value={y.id}>{y.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-stone-200 py-16 flex justify-center">
          <div className="w-8 h-8 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Summary Bar */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm px-5 py-3">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black" style={{ color: pctColor(currentStats.percentage) }}>
                  {currentStats.percentage}%
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Attended</span>
              </div>
              <div className="h-5 w-px bg-stone-200 hidden sm:block" />
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                <span className="text-xs">
                  <span className="font-black text-green-600">{currentStats.present}</span>
                  <span className="text-stone-400 ml-1">Present</span>
                </span>
                <span className="text-xs">
                  <span className="font-black text-red-500">{currentStats.absent}</span>
                  <span className="text-stone-400 ml-1">Absent</span>
                </span>
                <span className="text-xs">
                  <span className="font-black text-amber-600">{currentStats.late}</span>
                  <span className="text-stone-400 ml-1">Late</span>
                </span>
                <span className="text-xs">
                  <span className="font-black text-blue-500">{currentStats.leave}</span>
                  <span className="text-stone-400 ml-1">Leave</span>
                </span>
                <span className="text-xs">
                  <span className="font-black text-stone-700">{currentStats.total}</span>
                  <span className="text-stone-400 ml-1">Total days</span>
                </span>
              </div>
            </div>
          </div>

          {/* Monthly View */}
          {viewMode === 'monthly' ? (
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[380px]">
                  <thead>
                    <tr className="bg-white border-b border-stone-200">
                      <th className="text-left py-3 px-4 text-sm font-bold text-stone-700">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-bold text-stone-700 hidden sm:table-cell">Day</th>
                      <th className="text-left py-3 px-4 text-sm font-bold text-stone-700">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-bold text-stone-700 hidden md:table-cell">Remark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {monthDays.map(day => {
                      let statusClass = '';
                      let statusLabel = '';
                      if (day.record) {
                        statusClass = statusBadgeClass(day.record.status.toLowerCase());
                        statusLabel = day.record.status.charAt(0).toUpperCase() + day.record.status.slice(1);
                      } else if (day.isHoliday) {
                        statusClass = 'bg-violet-100 text-violet-600';
                        statusLabel = (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-100 text-violet-600">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-14 9V3z" />
                            </svg>
                            Holiday
                          </span>
                        );
                      } else if (day.isWeekend) {
                        statusClass = 'text-stone-300 font-medium';
                        statusLabel = 'Weekend';
                      } else if (day.isFuture) {
                        statusClass = 'text-stone-300 font-medium';
                        statusLabel = '—';
                      } else {
                        statusClass = 'text-stone-300 font-medium';
                        statusLabel = 'Not marked';
                      }

                      const rowBg = day.isHoliday ? 'bg-violet-50/40' : day.isWeekend ? 'bg-stone-50/60' : 'hover:bg-stone-50/50';

                      return (
                        <tr key={day.date} className={`transition-colors ${rowBg}`}>
                          <td className={`py-2.5 px-4 text-sm font-semibold ${day.isWeekend || day.isHoliday ? 'text-stone-400' : 'text-stone-800'}`}>
                            {formatDate(day.date)}
                          </td>
                          <td className={`py-2.5 px-4 text-sm hidden sm:table-cell ${day.isWeekend || day.isHoliday ? 'text-stone-300' : 'text-stone-500'}`}>
                            {getDayName(day.date)}
                          </td>
                          <td className="py-2.5 px-4">
                            {typeof statusLabel === 'string' ? (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${statusClass}`}>
                                {statusLabel}
                              </span>
                            ) : statusLabel}
                          </td>
                          <td className={`py-2.5 px-4 text-xs hidden md:table-cell ${day.isHoliday ? 'text-violet-400 font-medium' : 'text-stone-400'}`}>
                            {day.isHoliday ? day.holidayName : (day.record?.remark || '—')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Yearly View */
            academicYears.length === 0 ? (
              <div className="bg-white rounded-2xl border border-stone-200 shadow-sm py-10">
                <div className="flex flex-col items-center justify-center text-stone-500">
                  <p className="font-bold text-stone-700">No academic years</p>
                  <p className="text-sm font-medium text-stone-400 mt-1">Academic years have not been set up yet.</p>
                </div>
              </div>
            ) : yearlyRecords.length === 0 ? (
              <div className="bg-white rounded-2xl border border-stone-200 shadow-sm py-10">
                <div className="flex flex-col items-center justify-center text-stone-500">
                  <p className="font-bold text-stone-700">No records</p>
                  <p className="text-sm font-medium text-stone-400 mt-1">No attendance recorded for this academic year.</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[500px]">
                    <thead>
                      <tr className="bg-white border-b border-stone-200">
                        <th className="text-left py-3 px-4 text-sm font-bold text-stone-700">Month</th>
                        <th className="text-center py-3 px-4 text-sm font-bold text-green-600">Present</th>
                        <th className="text-center py-3 px-4 text-sm font-bold text-red-500">Absent</th>
                        <th className="text-center py-3 px-4 text-sm font-bold text-amber-600">Late</th>
                        <th className="text-center py-3 px-4 text-sm font-bold text-blue-500">Leave</th>
                        <th className="text-center py-3 px-4 text-sm font-bold text-stone-500">Total</th>
                        <th className="text-right py-3 px-4 text-sm font-bold text-stone-700">%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {monthlyBreakdown.map(m => (
                        <tr key={m.prefix} className={`transition-colors ${m.total > 0 ? 'hover:bg-stone-50/50' : 'opacity-35'}`}>
                          <td className="py-2.5 px-4 text-sm font-semibold text-stone-800">{m.label}</td>
                          <td className="py-2.5 px-4 text-sm text-center font-bold text-green-600">{m.present || '—'}</td>
                          <td className="py-2.5 px-4 text-sm text-center font-bold text-red-500">{m.absent || '—'}</td>
                          <td className="py-2.5 px-4 text-sm text-center font-bold text-amber-600">{m.late || '—'}</td>
                          <td className="py-2.5 px-4 text-sm text-center font-bold text-blue-500">{m.leave || '—'}</td>
                          <td className="py-2.5 px-4 text-sm text-center text-stone-500">{m.total || '—'}</td>
                          <td className="py-2.5 px-4 text-sm text-right">
                            {m.percentage !== null ? (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                                m.percentage >= 75 ? 'bg-green-100 text-green-700' :
                                m.percentage >= 60 ? 'bg-amber-100 text-amber-700' :
                                'bg-red-100 text-red-600'
                              }`}>
                                {m.percentage}%
                              </span>
                            ) : (
                              <span className="text-xs text-stone-300">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}
