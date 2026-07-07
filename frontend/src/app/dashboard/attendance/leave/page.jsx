"use client";

import { useState, useEffect } from 'react';
import { Search, Filter, ChevronDown, Square, ChevronLeft, ChevronRight } from 'lucide-react';

export default function LeaveRequestsPage() {
    const [requests, setRequests] = useState([]);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    
    // Pagination state
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/admin/leave-requests?page=${page}&limit=${limit}&search=${search}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setRequests(data.data);
                    setTotal(data.total);
                }
            }
        } catch (error) {
            console.error("Failed to fetch leave requests", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchRequests();
    }, [page, limit, search]);

    const updateStatus = async (id, status) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/admin/leave-requests/${id}/status`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                fetchRequests(); // Refresh the list
            }
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    const formatDateRange = (start, end) => {
        if (!start || !end) return '—';
        const s = new Date(start);
        const e = new Date(end);
        const formatOptions = { day: 'numeric', month: 'short' };
        return `${s.toLocaleDateString('en-US', formatOptions)} - ${e.toLocaleDateString('en-US', formatOptions)}`;
    };

    const formatDateSingle = (dateString) => {
        if (!dateString) return '—';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    };

    const getStatusBadge = (status) => {
        const s = (status || '').toLowerCase();
        if (s === 'approved') {
            return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-green-100 text-green-700">APPROVED</span>;
        }
        if (s === 'rejected') {
            return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-100 text-red-700">REJECTED</span>;
        }
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-orange-100 text-orange-700">PENDING</span>;
    };

    const getTypeBadge = (role) => {
        const r = (role || 'student').toLowerCase();
        if (r === 'staff' || r === 'teacher') {
            return <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-purple-100 text-purple-700">STAFF</span>;
        }
        return <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-blue-100 text-blue-700">STUDENT</span>;
    };

    const getUserID = (user) => {
        if (!user) return 'UNKNOWN';
        if (user.rollNumber) return user.rollNumber;
        // fallback dummy ID if not present
        const prefix = user.role === 'staff' ? 'STF' : 'STU';
        return `${prefix}-2026-0000`;
    };

    const totalPages = Math.ceil(total / limit) || 1;
    const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
    const endItem = Math.min(page * limit, total);

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            
            {/* Header */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 sm:p-5 flex items-center">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-5 rounded-full" style={{ backgroundColor: 'var(--orange)' }}></div>
                    <h1 className="text-xl font-bold text-stone-900 tracking-tight">Leave Requests</h1>
                </div>
            </div>

            {/* Main Table Card */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                
                {/* Search & Filter Bar */}
                <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-end gap-3 bg-white">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400 group-focus-within:text-orange">
                            <Search size={14} strokeWidth={2.5} />
                        </div>
                        <input 
                            type="text" 
                            className="block rounded-lg border border-stone-200 bg-white pl-9 pr-7 py-2 text-sm text-stone-800 shadow-sm transition-all focus:outline-none focus:ring-2 w-[280px]" 
                            placeholder="Search by applicant name or" 
                            style={{ '--tw-ring-color': 'rgba(255, 153, 51, 0.2)' }}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="relative flex-shrink-0">
                        <button type="button" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold border transition-all whitespace-nowrap bg-white text-stone-600 border-[#E8E0D4] hover:border-[#C8BEB4]">
                            <Filter size={14} strokeWidth={2.5} /> Filters
                        </button>
                    </div>
                </div>
                
                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                        <thead>
                            <tr className="bg-white border-b border-stone-200 text-left">
                                <th className="w-14 py-4 pl-4 pr-1">
                                    <button className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-bold border transition-all bg-white border-[#E8E0D4] text-stone-500 hover:border-[#C8BEB4]">
                                        <Square size={14} className="text-stone-300" /> <ChevronDown size={14} />
                                    </button>
                                </th>
                                <th className="py-4 px-3 w-64">
                                    <span className="text-xs font-black text-stone-800">Applicant</span>
                                </th>
                                <th className="py-4 px-3">
                                    <span className="text-xs font-black text-stone-800">Type</span>
                                </th>
                                <th className="py-4 px-3">
                                    <button className="flex items-center gap-1.5 group text-xs font-black text-stone-800 hover:text-stone-900 transition-colors">
                                        Dates <span className="text-stone-300 text-[10px]">▼</span>
                                    </button>
                                </th>
                                <th className="py-4 px-3">
                                    <span className="text-xs font-black text-stone-800">Reason</span>
                                </th>
                                <th className="py-4 px-3">
                                    <button className="flex items-center gap-1.5 group text-xs font-black text-stone-800 hover:text-stone-900 transition-colors">
                                        Applied On <span className="text-orange-400 text-[10px]">▼</span>
                                    </button>
                                </th>
                                <th className="py-4 px-3">
                                    <button className="flex items-center gap-1.5 group text-xs font-black text-stone-800 hover:text-stone-900 transition-colors">
                                        Status <span className="text-stone-300 text-[10px]">▼</span>
                                    </button>
                                </th>
                                <th className="py-4 px-4 text-right w-32">
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-50">
                            {loading ? (
                                <tr><td colSpan="8" className="py-8 text-center text-sm text-stone-500">Loading leave requests...</td></tr>
                            ) : requests.length === 0 ? (
                                <tr><td colSpan="8" className="py-8 text-center text-sm text-stone-500">No leave requests found</td></tr>
                            ) : (
                                requests.map((req) => (
                                    <tr key={req._id} className="group transition-all duration-100 hover:bg-stone-50/70">
                                        <td className="w-14 py-4 pl-4 pr-1 align-top">
                                            <div className="w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer border-stone-300 bg-white hover:border-orange mt-1"></div>
                                        </td>
                                        <td className="py-3 px-3">
                                            <div className="flex items-start gap-2">
                                                <div className="w-1 h-1 rounded-full bg-orange-400 mt-2 flex-shrink-0"></div>
                                                <div className="flex flex-col">
                                                    <span className="text-[13px] font-black text-stone-800">{req.student ? `${req.student.firstName} ${req.student.lastName}` : 'Unknown'}</span>
                                                    <span className="text-[10px] font-bold text-stone-400 font-mono tracking-wide">{getUserID(req.student)}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-3 align-top">
                                            {getTypeBadge(req.student?.role)}
                                        </td>
                                        <td className="py-4 px-3 align-top">
                                            <span className="text-xs font-bold text-stone-600 whitespace-nowrap">{formatDateRange(req.fromDate, req.toDate)}</span>
                                        </td>
                                        <td className="py-4 px-3 align-top">
                                            <span className="text-xs text-stone-500 font-medium">{req.reason}</span>
                                        </td>
                                        <td className="py-4 px-3 align-top">
                                            <span className="text-xs font-bold text-stone-600">{formatDateSingle(req.createdAt)}</span>
                                        </td>
                                        <td className="py-4 px-3 align-top">
                                            {getStatusBadge(req.status)}
                                        </td>
                                        <td className="py-4 px-4 align-top text-right w-32">
                                            {req.status === 'pending' ? (
                                                <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => updateStatus(req._id, 'approved')}
                                                        className="px-2 py-1 rounded bg-green-100 text-green-700 text-[10px] font-black hover:bg-green-200 transition-colors"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button 
                                                        onClick={() => updateStatus(req._id, 'rejected')}
                                                        className="px-2 py-1 rounded bg-red-100 text-red-700 text-[10px] font-black hover:bg-red-200 transition-colors"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-stone-300 font-bold pr-4">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-4 py-3 border-t border-stone-100 bg-stone-50/30 flex items-center justify-between gap-3">
                    <span className="text-[11px] font-bold text-stone-500 whitespace-nowrap">
                        {startItem}–{endItem} of <span className="text-stone-800 font-black">{total}</span>
                    </span>
                    
                    <div className="flex items-center gap-2">
                        <div className="relative w-20">
                            <button type="button" className="w-full flex items-center justify-between gap-1.5 text-left rounded-lg transition-all duration-150 border-[1.5px] bg-white focus:outline-none px-2.5 py-1.5 text-[11px] border-[#E8E0D4] hover:border-[#C8BEB4] cursor-pointer font-bold text-stone-600">
                                Select...
                                <ChevronDown size={14} className="text-stone-400" />
                            </button>
                        </div>
                        
                        <div className="flex items-center gap-1">
                            <button 
                                disabled={page === 1}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                className="flex items-center justify-center min-w-[26px] h-7 rounded text-stone-400 hover:text-orange-500 hover:bg-orange-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            
                            {Array.from({ length: Math.min(4, totalPages) }).map((_, idx) => {
                                let p = page;
                                if (page === 1) p = idx + 1;
                                else if (page === totalPages && totalPages >= 4) p = totalPages - 3 + idx;
                                else p = page - 1 + idx;
                                
                                if (p > totalPages) return null;
                                
                                return (
                                    <button 
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className={`min-w-[26px] h-7 rounded text-[11px] font-black transition-all ${
                                            page === p 
                                            ? 'bg-[#FF9933] text-white shadow-sm shadow-orange-500/20' 
                                            : 'text-stone-500 hover:bg-orange-50 hover:text-orange-500'
                                        }`}
                                    >
                                        {p}
                                    </button>
                                );
                            })}
                            
                            <button 
                                disabled={page === totalPages}
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                className="flex items-center justify-center min-w-[26px] h-7 rounded text-stone-400 hover:text-orange-500 hover:bg-orange-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
