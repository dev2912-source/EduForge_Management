"use client";

import { useState, useEffect, useCallback } from 'react';
import { Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Loader2, X, AlertCircle, CheckCircle2, XCircle, Clock, Users, CalendarCheck } from 'lucide-react';

const STATUS_TABS = ['All', 'Pending', 'Approved', 'Rejected'];
const TYPE_FILTERS = ['All', 'Student', 'Staff'];

const STATUS_BADGE = {
    approved: 'bg-green-100 text-green-700 border-green-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
    pending: 'bg-orange-100 text-orange-700 border-orange-200',
};

const TYPE_BADGE = {
    staff: 'bg-purple-100 text-purple-700 border-purple-200',
    teacher: 'bg-purple-100 text-purple-700 border-purple-200',
    student: 'bg-blue-100 text-blue-700 border-blue-200',
};

function formatDateRange(start, end) {
    if (!start || !end) return '—';
    const s = new Date(start);
    const e = new Date(end);
    const opts = { day: 'numeric', month: 'short' };
    return `${s.toLocaleDateString('en-US', opts)} - ${e.toLocaleDateString('en-US', opts)}`;
}

function formatDateTime(dateString) {
    if (!dateString) return '—';
    const d = new Date(dateString);
    if (isNaN(d)) return dateString;
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getStatusBadge(status) {
    const s = (status || '').toLowerCase();
    const colors = STATUS_BADGE[s] || 'bg-stone-100 text-stone-600 border-stone-200';
    return (
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${colors}`}>
            {s || 'PENDING'}
        </span>
    );
}

function getTypeBadge(role) {
    const r = (role || '').toLowerCase();
    const colors = TYPE_BADGE[r] || 'bg-blue-100 text-blue-700 border-blue-200';
    return (
        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${colors}`}>
            {r === 'staff' || r === 'teacher' ? 'STAFF' : 'STUDENT'}
        </span>
    );
}

export default function LeaveRequestsPage() {
    const [requests, setRequests] = useState([]);
    const [total, setTotal] = useState(0);
    const [summary, setSummary] = useState({ pending: 0, approved: 0, rejected: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [typeFilter, setTypeFilter] = useState('All');
    const [sort, setSort] = useState({ key: 'createdAt', dir: 'desc' });
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(() => {
        if (typeof window !== 'undefined') {
            return parseInt(localStorage.getItem('leaveRequestsPerPage')) || 10;
        }
        return 10;
    });

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 350);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            let url = `http://localhost:5000/api/admin/leave-requests?page=${page}&limit=${perPage}&search=${debouncedSearch}&sort=${sort.key}:${sort.dir}`;
            if (statusFilter !== 'All') url += `&status=${statusFilter.toLowerCase()}`;
            if (typeFilter !== 'All') url += `&type=${typeFilter.toLowerCase()}`;
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            if (data.success) {
                setRequests(data.data);
                setTotal(data.total);
                setSummary(data.summary || { pending: 0, approved: 0, rejected: 0 });
            } else {
                throw new Error(data.message || 'Failed to fetch');
            }
        } catch (err) {
            setError(err.message);
            setRequests([]);
            setTotal(0);
        }
        setLoading(false);
    }, [page, perPage, debouncedSearch, sort, statusFilter, typeFilter]);

    useEffect(() => { fetchRequests(); }, [fetchRequests]);

    const updateStatus = async (id, status) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/admin/leave-requests/${id}/status`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (res.ok) fetchRequests();
        } catch (err) {
            console.error('Failed to update status', err);
        }
    };

    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const startItem = total === 0 ? 0 : (page - 1) * perPage + 1;
    const endItem = Math.min(page * perPage, total);

    const handleSort = (key) => {
        setSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));
    };

    const SortIcon = ({ columnKey }) => {
        if (sort.key !== columnKey) return <ChevronDown size={12} className="text-stone-400 opacity-0 group-hover:opacity-100" strokeWidth={3} />;
        return sort.dir === 'asc'
            ? <ChevronUp size={12} style={{ color: 'var(--orange)' }} strokeWidth={3} />
            : <ChevronDown size={12} style={{ color: 'var(--orange)' }} strokeWidth={3} />;
    };

    const handlePerPageChange = (val) => {
        setPerPage(val);
        localStorage.setItem('leaveRequestsPerPage', val.toString());
        setPage(1);
    };

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            let start = Math.max(2, page - 1);
            let end = Math.min(totalPages - 1, page + 1);
            if (page <= 2) { start = 2; end = Math.min(4, totalPages - 1); }
            if (page >= totalPages - 1) { start = Math.max(totalPages - 3, 2); end = totalPages - 1; }
            if (start > 2) pages.push('...');
            for (let i = start; i <= end; i++) pages.push(i);
            if (end < totalPages - 1) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 sm:p-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-5 rounded-full" style={{ backgroundColor: 'var(--orange)' }}></div>
                    <h1 className="text-xl font-bold text-stone-900 tracking-tight">Leave Requests</h1>
                </div>
                <span className="text-sm font-bold text-stone-400">
                    <span className="text-stone-800 font-black">{total}</span> total
                </span>
            </div>

            {/* Summary Cards */}
            {!error && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
                    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                            <Clock size={18} className="text-orange-600" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-stone-500">Pending</p>
                            <p className="text-lg font-black text-orange-600">{summary.pending}</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 size={18} className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-stone-500">Approved</p>
                            <p className="text-lg font-black text-green-600">{summary.approved}</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                            <XCircle size={18} className="text-red-600" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-stone-500">Rejected</p>
                            <p className="text-lg font-black text-red-600">{summary.rejected}</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                            <Users size={18} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-stone-500">Applicants</p>
                            <p className="text-lg font-black text-stone-800">{new Set(requests.map(r => r.student?._id)).size}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Table Card */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                {/* Search & Filter Bar */}
                <div className="px-3 py-3 border-b border-stone-100 bg-white">
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="relative group flex-1 max-w-xs min-w-[200px]">
                            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-stone-400 group-focus-within:text-orange">
                                <Search size={14} strokeWidth={2.5} />
                            </div>
                            <input
                                type="text"
                                className="block rounded-lg border border-stone-200 bg-white pl-8 pr-7 py-1.5 text-sm text-stone-800 shadow-sm transition-all focus:outline-none focus:ring-2 w-full"
                                placeholder="Search by name or ID..."
                                style={{ '--tw-ring-color': 'rgba(255, 153, 51, 0.2)' }}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-1">
                            {TYPE_FILTERS.map(t => (
                                <button
                                    key={t}
                                    onClick={() => { setTypeFilter(t); setPage(1); }}
                                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all ${
                                        typeFilter === t
                                            ? 'bg-stone-900 text-white shadow-sm'
                                            : 'text-stone-500 hover:text-stone-700 hover:bg-stone-100'
                                    }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-1">
                            {STATUS_TABS.map(t => (
                                <button
                                    key={t}
                                    onClick={() => { setStatusFilter(t); setPage(1); }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        statusFilter === t
                                            ? 'bg-stone-900 text-white shadow-sm'
                                            : 'text-stone-500 hover:text-stone-700 hover:bg-stone-100'
                                    }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Error State */}
                {error && (
                    <div className="flex flex-col items-center justify-center py-12 px-4">
                        <AlertCircle size={40} className="text-red-300 mb-3" />
                        <p className="text-sm font-semibold text-stone-600 mb-3">{error}</p>
                        <button onClick={fetchRequests} className="px-4 py-2 rounded-lg text-sm font-semibold bg-stone-900 text-white hover:opacity-90 transition-all">
                            Try Again
                        </button>
                    </div>
                )}

                {/* Empty State */}
                {!error && !loading && requests.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 px-4">
                        <CalendarCheck size={40} className="text-stone-300 mb-3" />
                        {debouncedSearch || statusFilter !== 'All' || typeFilter !== 'All' ? (
                            <>
                                <p className="text-sm font-semibold text-stone-600 mb-1">No leave requests match your search</p>
                                <p className="text-xs text-stone-400">Try different search terms or clear filters</p>
                            </>
                        ) : (
                            <>
                                <p className="text-sm font-semibold text-stone-600 mb-1">No leave requests yet</p>
                                <p className="text-xs text-stone-400">Leave requests submitted by students and staff will appear here</p>
                            </>
                        )}
                    </div>
                )}

                {/* Table */}
                {!error && (loading || requests.length > 0) && (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px]">
                            <thead>
                                <tr className="bg-white border-b border-stone-200 text-left">
                                    <th className="w-12 py-4 pl-5 pr-2">
                                        <div className="w-4 h-4 rounded border-2 border-stone-300" />
                                    </th>
                                    <th className="py-4 px-3">
                                        <button onClick={() => handleSort('applicant')} className="flex items-center gap-1.5 group text-xs font-bold text-stone-700 hover:text-stone-900 transition-colors">
                                            Applicant <SortIcon columnKey="applicant" />
                                        </button>
                                    </th>
                                    <th className="py-4 px-3">
                                        <span className="text-xs font-bold text-stone-700">Type</span>
                                    </th>
                                    <th className="py-4 px-3">
                                        <button onClick={() => handleSort('fromDate')} className="flex items-center gap-1.5 group text-xs font-bold text-stone-700 hover:text-stone-900 transition-colors">
                                            Dates <SortIcon columnKey="fromDate" />
                                        </button>
                                    </th>
                                    <th className="py-4 px-3">
                                        <span className="text-xs font-bold text-stone-700">Reason</span>
                                    </th>
                                    <th className="py-4 px-3">
                                        <button onClick={() => handleSort('createdAt')} className="flex items-center gap-1.5 group text-xs font-bold text-stone-700 hover:text-stone-900 transition-colors">
                                            Applied On <SortIcon columnKey="createdAt" />
                                        </button>
                                    </th>
                                    <th className="py-4 px-3">
                                        <button onClick={() => handleSort('status')} className="flex items-center gap-1.5 group text-xs font-bold text-stone-700 hover:text-stone-900 transition-colors">
                                            Status <SortIcon columnKey="status" />
                                        </button>
                                    </th>
                                    <th className="py-4 px-3 pr-5 w-32" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan="8" className="py-8 text-center">
                                            <div className="flex items-center justify-center gap-2 text-sm text-stone-400">
                                                <Loader2 size={16} className="animate-spin" />
                                                Loading leave requests...
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    requests.map((req) => (
                                        <tr key={req._id} className="group transition-all duration-100 hover:bg-stone-50/70">
                                            <td className="w-12 py-3 pl-5 pr-2">
                                                <div className="w-4 h-4 rounded border-2 border-stone-300" />
                                            </td>
                                            <td className="py-3 px-3">
                                                <div className="flex items-start gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-2 flex-shrink-0" />
                                                    <div className="flex flex-col">
                                                        <span className="text-[13px] font-black text-stone-800">{req.student?.name || 'Unknown'}</span>
                                                        {req.student?.schoolId && (
                                                            <span className="text-[10px] font-bold text-stone-400 font-mono tracking-wide">{req.student.schoolId}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-3">
                                                {getTypeBadge(req.student?.role)}
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className="text-xs font-bold text-stone-600 whitespace-nowrap">{formatDateRange(req.fromDate, req.toDate)}</span>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className="text-xs text-stone-500 font-medium">{req.reason}</span>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className="text-xs font-bold text-stone-500 whitespace-nowrap">{formatDateTime(req.createdAt)}</span>
                                            </td>
                                            <td className="py-3 px-3">
                                                {getStatusBadge(req.status)}
                                            </td>
                                            <td className="py-3 px-3 pr-5">
                                                {req.status === 'pending' ? (
                                                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => updateStatus(req._id, 'approved')}
                                                            className="px-2.5 py-1 rounded bg-green-100 text-green-700 text-[10px] font-black hover:bg-green-200 transition-colors"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => updateStatus(req._id, 'rejected')}
                                                            className="px-2.5 py-1 rounded bg-red-100 text-red-700 text-[10px] font-black hover:bg-red-200 transition-colors"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-stone-200 font-bold text-xs">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {!error && total > 0 && (
                    <div className="px-4 py-3 border-t border-stone-100 bg-stone-50/30 flex items-center justify-between gap-3">
                        <span className="text-xs font-bold text-stone-500 whitespace-nowrap">
                            {startItem}–{endItem} of <span className="text-stone-800 font-black">{total}</span>
                        </span>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <select
                                    value={perPage}
                                    onChange={(e) => handlePerPageChange(Number(e.target.value))}
                                    className="appearance-none rounded-lg border-[1.5px] bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 border-[#E8E0D4] hover:border-[#C8BEB4] focus:outline-none cursor-pointer pr-6"
                                >
                                    {[10, 25, 50, 100].map(n => (
                                        <option key={n} value={n}>{n}</option>
                                    ))}
                                </select>
                                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400" />
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    className="p-1.5 rounded-lg border border-stone-200 bg-white text-stone-400 hover:text-orange-500 hover:border-orange-300 hover:bg-orange-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                {getPageNumbers().map((p, idx) =>
                                    p === '...' ? (
                                        <span key={`ellipsis-${idx}`} className="px-1 text-xs text-stone-400">...</span>
                                    ) : (
                                        <button
                                            key={p}
                                            onClick={() => setPage(p)}
                                            className={`min-w-[32px] h-8 rounded-lg text-xs font-black transition-all border ${
                                                page === p
                                                    ? 'bg-[#F9932B] border-[#F9932B] text-white shadow-sm shadow-orange-500/20'
                                                    : 'bg-white border-stone-200 text-stone-500 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-500'
                                            }`}
                                        >
                                            {p}
                                        </button>
                                    )
                                )}
                                <button
                                    disabled={page === totalPages}
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    className="p-1.5 rounded-lg border border-stone-200 bg-white text-stone-400 hover:text-orange-500 hover:border-orange-300 hover:bg-orange-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
