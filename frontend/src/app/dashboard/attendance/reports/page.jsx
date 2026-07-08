"use client";

import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, Calendar, Download, Loader2, AlertCircle, BarChart3, Users, CheckCircle2, XCircle } from 'lucide-react';

function formatDate(dateString) {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getToday() {
    return new Date().toISOString().split('T')[0];
}

function getMonthAgo() {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
}

function getPercentageColor(pct) {
    if (pct >= 90) return 'text-green-600';
    if (pct >= 75) return 'text-emerald-600';
    if (pct >= 60) return 'text-amber-600';
    return 'text-red-600';
}

function getPercentageBarColor(pct) {
    if (pct >= 90) return 'bg-green-500';
    if (pct >= 75) return 'bg-emerald-500';
    if (pct >= 60) return 'bg-amber-400';
    return 'bg-red-400';
}

function exportCSV(data) {
    const headers = ['Name', 'School ID', 'Roll No', 'Class', 'Section', 'Working Days', 'Present', 'Late', 'Absent', 'Leave', 'Attendance %'];
    const rows = data.map(d => [
        d.name,
        d.schoolId || '—',
        d.rollNumber || '—',
        d.className || '—',
        d.section || '—',
        d.workingDays,
        d.present,
        d.late,
        d.absent,
        d.leave,
        `${d.percentage}%`
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

export default function StudentAttendanceReportPage() {
    const [classes, setClasses] = useState([]);
    const [loadingClasses, setLoadingClasses] = useState(true);
    const [className, setClassName] = useState('');
    const [section, setSection] = useState('');
    const [fromDate, setFromDate] = useState(getMonthAgo());
    const [toDate, setToDate] = useState(getToday());
    const [reportData, setReportData] = useState(null);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [generated, setGenerated] = useState(false);

    // Fetch classes for dropdown
    const fetchClasses = useCallback(async () => {
        setLoadingClasses(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/admin/classes?limit=100', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success) setClasses(data.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch classes', err);
        }
        setLoadingClasses(false);
    }, []);

    useEffect(() => { fetchClasses(); }, [fetchClasses]);

    // Derive sections from selected class
    const selectedClass = classes.find(c => c.name === className);
    const sections = selectedClass ? Array.from({ length: selectedClass.sections || 1 }, (_, i) => String.fromCharCode(65 + i)) : [];

    const handleGenerate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setGenerated(true);
        try {
            const token = localStorage.getItem('token');
            let url = `http://localhost:5000/api/admin/attendance/report?fromDate=${fromDate}&toDate=${toDate}`;
            if (className) url += `&className=${encodeURIComponent(className)}`;
            if (section) url += `&section=${section}`;
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) {
                let msg = `Server error (${res.status})`;
                try { const errData = await res.json(); msg = errData.detail || errData.message || msg; } catch(e) {}
                throw new Error(msg);
            }
            const data = await res.json();
            if (data.success) {
                setReportData(data.data);
                setSummary(data.summary);
            } else {
                throw new Error(data.message || 'Report generation failed');
            }
        } catch (err) {
            console.error('Attendance report error:', err);
            setError(err.message);
            setReportData(null);
            setSummary(null);
        }
        setLoading(false);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-5 rounded-full" style={{ backgroundColor: 'var(--orange)' }}></div>
                    <h1 className="text-xl font-bold text-stone-900 tracking-tight">Student Attendance Report</h1>
                </div>
                {reportData && reportData.length > 0 && (
                    <button onClick={() => exportCSV(reportData)} className="flex items-center gap-1.5 py-2 px-4 text-sm font-semibold rounded-xl border border-stone-300 bg-white text-stone-600 hover:border-stone-400 hover:bg-stone-50 transition-all shadow-sm">
                        <Download size={16} /> Export CSV
                    </button>
                )}
            </div>

            {/* Filter Card */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 sm:p-5">
                <form onSubmit={handleGenerate} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
                        {/* CLASS */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-black text-stone-600 uppercase tracking-widest">Class</label>
                            <div className="relative">
                                <select
                                    value={className}
                                    onChange={(e) => { setClassName(e.target.value); setSection(''); }}
                                    className={`w-full appearance-none rounded-lg border border-stone-200 bg-white pl-3 pr-8 py-2 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 ${className === '' ? 'text-stone-400' : 'text-stone-700'}`}
                                    style={{ '--tw-ring-color': 'rgba(255, 153, 51, 0.2)' }}
                                >
                                    <option value="">All Classes</option>
                                    {loadingClasses ? (
                                        <option disabled>Loading...</option>
                                    ) : (
                                        classes.map(c => (
                                            <option key={c._id} value={c.name}>{c.name}</option>
                                        ))
                                    )}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-stone-400">
                                    <ChevronDown size={14} strokeWidth={2.5} />
                                </div>
                            </div>
                        </div>

                        {/* SECTION */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-black text-stone-600 uppercase tracking-widest">Section</label>
                            <div className="relative">
                                <select
                                    value={section}
                                    onChange={(e) => setSection(e.target.value)}
                                    disabled={!className}
                                    className={`w-full appearance-none rounded-lg border border-stone-200 bg-white pl-3 pr-8 py-2 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 ${section === '' ? 'text-stone-400' : 'text-stone-700'} ${!className ? 'bg-stone-50 text-stone-300 cursor-not-allowed' : ''}`}
                                    style={{ '--tw-ring-color': 'rgba(255, 153, 51, 0.2)' }}
                                >
                                    <option value="">All Sections</option>
                                    {sections.map(s => (
                                        <option key={s} value={s}>Section {s}</option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-stone-400">
                                    <ChevronDown size={14} strokeWidth={2.5} />
                                </div>
                            </div>
                        </div>

                        {/* FROM */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-black text-stone-600 uppercase tracking-widest">From</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    required
                                    className="w-full rounded-lg border border-stone-200 bg-white pl-3 pr-3 py-2 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 text-stone-700"
                                    style={{ '--tw-ring-color': 'rgba(255, 153, 51, 0.2)' }}
                                />
                                <Calendar size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* TO */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-black text-stone-600 uppercase tracking-widest">To</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    required
                                    className="w-full rounded-lg border border-stone-200 bg-white pl-3 pr-3 py-2 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 text-stone-700"
                                    style={{ '--tw-ring-color': 'rgba(255, 153, 51, 0.2)' }}
                                />
                                <Calendar size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* GENERATE BUTTON */}
                        <div className="flex flex-col gap-1.5 justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                                style={{ backgroundColor: '#111' }}
                            >
                                {loading ? <Loader2 size={14} className="animate-spin" /> : <BarChart3 size={14} />}
                                Generate Report
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Error State */}
            {error && (
                <div className="flex flex-col items-center justify-center py-12 px-4 bg-white rounded-xl border border-stone-200 shadow-sm">
                    <AlertCircle size={40} className="text-red-300 mb-3" />
                    <p className="text-sm font-semibold text-stone-600 mb-3">{error}</p>
                    <button onClick={handleGenerate} className="px-4 py-2 rounded-lg text-sm font-semibold bg-stone-900 text-white hover:opacity-90 transition-all">
                        Try Again
                    </button>
                </div>
            )}

            {/* Summary Cards */}
            {summary && !error && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
                    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                            <Users size={18} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-stone-500">Students</p>
                            <p className="text-lg font-black text-stone-800">{summary.totalStudents}</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 size={18} className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-stone-500">Avg Attendance</p>
                            <p className={`text-lg font-black ${getPercentageColor(summary.averagePercentage)}`}>{summary.averagePercentage}%</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 size={18} className="text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-stone-500">Total Present</p>
                            <p className="text-lg font-black text-emerald-700">{summary.totalPresent.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                            <XCircle size={18} className="text-red-600" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-stone-500">Total Absent</p>
                            <p className="text-lg font-black text-red-600">{summary.totalAbsent.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Results Table */}
            {generated && !loading && !error && (
                <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                    {reportData && reportData.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1000px]">
                                <thead>
                                    <tr className="bg-stone-50 border-b border-stone-200 text-left">
                                        <th className="w-10 py-3.5 pl-5 pr-2 text-xs font-bold text-stone-500">#</th>
                                        <th className="py-3.5 px-3 text-xs font-bold text-stone-500">Student Name</th>
                                        <th className="py-3.5 px-3 text-xs font-bold text-stone-500">School ID</th>
                                        <th className="py-3.5 px-3 text-xs font-bold text-stone-500">Roll No</th>
                                        <th className="py-3.5 px-3 text-xs font-bold text-stone-500">Class</th>
                                        <th className="py-3.5 px-3 text-xs font-bold text-stone-500">Working Days</th>
                                        <th className="py-3.5 px-3 text-xs font-bold text-stone-500">Present</th>
                                        <th className="py-3.5 px-3 text-xs font-bold text-stone-500">Late</th>
                                        <th className="py-3.5 px-3 text-xs font-bold text-stone-500">Absent</th>
                                        <th className="py-3.5 px-3 text-xs font-bold text-stone-500">Leave</th>
                                        <th className="py-3.5 px-3 pr-5 text-xs font-bold text-stone-500">Attendance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-50">
                                    {reportData.map((row, idx) => (
                                        <tr key={row._id} className="group transition-all duration-100 hover:bg-stone-50/70">
                                            <td className="py-3 pl-5 pr-2 text-xs font-bold text-stone-400">{idx + 1}</td>
                                            <td className="py-3 px-3">
                                                <span className="text-sm font-black text-stone-700">{row.name}</span>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className="text-xs font-mono font-bold text-stone-500">{row.schoolId || '—'}</span>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className="text-xs font-semibold text-stone-500">{row.rollNumber || '—'}</span>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className="text-xs font-semibold text-stone-600">{row.className || '—'}{row.section ? ` ${row.section}` : ''}</span>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className="text-sm font-semibold text-stone-600">{row.workingDays}</span>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className="text-sm font-bold text-emerald-600">{row.present}</span>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className="text-sm font-bold text-amber-600">{row.late}</span>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className="text-sm font-bold text-red-600">{row.absent}</span>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className="text-sm font-bold text-purple-600">{row.leave}</span>
                                            </td>
                                            <td className="py-3 px-3 pr-5">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="flex-1 max-w-[100px] h-2 bg-stone-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all ${getPercentageBarColor(row.percentage)}`}
                                                            style={{ width: `${Math.min(row.percentage, 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className={`text-sm font-black min-w-[48px] text-right ${getPercentageColor(row.percentage)}`}>
                                                        {row.percentage}%
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="py-16 px-4 flex flex-col items-center justify-center">
                            <BarChart3 size={40} className="text-stone-300 mb-3" />
                            <p className="text-sm font-semibold text-stone-600 mb-1">No data found</p>
                            <p className="text-xs text-stone-400">No attendance records found for the selected criteria</p>
                        </div>
                    )}
                </div>
            )}

            {/* Initial State */}
            {!generated && !error && (
                <div className="bg-white rounded-xl border border-stone-200 shadow-sm py-24 px-4 flex flex-col items-center justify-center">
                    <BarChart3 size={48} className="text-stone-200 mb-4" />
                    <p className="text-sm font-bold text-stone-500 text-center">
                        Select filters and click Generate Report
                    </p>
                </div>
            )}
        </div>
    );
}
