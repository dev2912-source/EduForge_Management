"use client";

import { useState, useEffect } from 'react';
import { Search, Filter, Plus, Download, FileText, ChevronDown, Square, ChevronLeft, ChevronRight } from 'lucide-react';

export default function FeePaymentsPage() {
    const [payments, setPayments] = useState([]);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    
    // Pagination state
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/admin/payments?page=${page}&limit=${limit}&search=${search}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setPayments(data.data);
                    setTotal(data.total);
                }
            }
        } catch (error) {
            console.error("Failed to fetch payments", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchPayments();
    }, [page, limit, search]);

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '—';
        const date = new Date(dateString);
        return date.toLocaleString('en-US', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    };

    const getMethodBadge = (method) => {
        const m = (method || '').toLowerCase();
        if (m.includes('card')) {
            return <span className="px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wide bg-blue-50 text-blue-700 border border-blue-200">{method}</span>;
        }
        if (m.includes('cash')) {
            return <span className="px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200">{method}</span>;
        }
        if (m.includes('upi')) {
            return <span className="px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wide bg-purple-50 text-purple-700 border border-purple-200">{method}</span>;
        }
        if (m.includes('bank') || m.includes('transfer')) {
            return <span className="px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wide bg-stone-100 text-stone-700 border border-stone-200">{method}</span>;
        }
        return <span className="px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wide bg-stone-50 text-stone-600 border border-stone-200">{method || 'Unknown'}</span>;
    };

    const totalPages = Math.ceil(total / limit) || 1;
    const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
    const endItem = Math.min(page * limit, total);

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            
            {/* Header */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-5 rounded-full" style={{ backgroundColor: 'var(--orange)' }}></div>
                        <h1 className="text-xl font-bold text-stone-900 tracking-tight">Fee Payments</h1>
                    </div>
                    <p className="text-sm text-stone-500 font-medium pl-3.5">
                        <span className="font-bold" style={{ color: 'var(--orange)' }}>{total}</span> successful payments
                    </p>
                </div>
                
                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button className="flex items-center gap-1.5 py-2 px-4 text-sm font-semibold rounded-xl border border-stone-300 bg-white text-stone-600 hover:border-stone-400 hover:bg-stone-50 transition-all shadow-sm">
                        <Download size={16} /> Export
                    </button>
                    <button className="flex items-center gap-1.5 py-2 px-5 text-sm font-semibold rounded-xl text-white transition-all shadow-sm" style={{ backgroundColor: '#111' }}>
                        <Plus size={16} strokeWidth={3} /> Record Payment
                    </button>
                </div>
            </div>

            {/* Main Table Card */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                
                {/* Search & Filter Bar */}
                <div className="px-3 py-3 border-b border-stone-100 flex items-center justify-end gap-2 bg-white">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-stone-400 group-focus-within:text-orange">
                            <Search size={14} strokeWidth={2.5} />
                        </div>
                        <input 
                            type="text" 
                            className="block rounded-lg border border-stone-200 bg-white pl-8 pr-7 py-1.5 text-sm text-stone-800 shadow-sm transition-all focus:outline-none focus:ring-2 w-64" 
                            placeholder="Search by Receipt, Invoice, or Student..." 
                            style={{ '--tw-ring-color': 'rgba(255, 153, 51, 0.2)' }}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="relative flex-shrink-0">
                        <button type="button" className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold border transition-all whitespace-nowrap bg-white text-stone-600 border-[#E8E0D4] hover:border-[#C8BEB4]">
                            <Filter size={14} strokeWidth={2.5} /> Filters
                        </button>
                    </div>
                </div>
                
                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                        <thead>
                            <tr className="bg-white border-b border-stone-200 text-left">
                                <th className="w-16 py-4 pl-5 pr-2">
                                    <button className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-bold border transition-all bg-white border-[#E8E0D4] text-stone-500 hover:border-[#C8BEB4]">
                                        <Square size={14} className="text-stone-300" /> <ChevronDown size={14} />
                                    </button>
                                </th>
                                <th className="py-4 px-3">
                                    <span className="text-xs font-bold text-stone-700">Receipt ID</span>
                                </th>
                                <th className="py-4 px-3">
                                    <span className="text-xs font-bold text-stone-700">Invoice ID</span>
                                </th>
                                <th className="py-4 px-3">
                                    <span className="text-xs font-bold text-stone-700">Student Name</span>
                                </th>
                                <th className="py-4 px-3">
                                    <button className="flex items-center gap-1.5 group text-xs font-bold text-stone-700 hover:text-stone-900 transition-colors">
                                        Amount <ChevronDown size={12} className="text-stone-400 opacity-0 group-hover:opacity-100" strokeWidth={3} />
                                    </button>
                                </th>
                                <th className="py-4 px-3">
                                    <button className="flex items-center gap-1.5 group text-xs font-bold text-stone-700 hover:text-stone-900 transition-colors">
                                        Method <ChevronDown size={12} className="text-stone-400 opacity-0 group-hover:opacity-100" strokeWidth={3} />
                                    </button>
                                </th>
                                <th className="py-4 px-3">
                                    <button className="flex items-center gap-1.5 group text-xs font-bold text-stone-700 hover:text-stone-900 transition-colors">
                                        Date <ChevronDown size={12} className="text-stone-400 opacity-0 group-hover:opacity-100" strokeWidth={3} />
                                    </button>
                                </th>
                                <th className="py-4 px-3 pr-5">
                                    <button className="flex items-center gap-1.5 group text-xs font-bold text-stone-700 hover:text-stone-900 transition-colors">
                                        Created At <ChevronDown size={12} style={{ color: 'var(--orange)' }} strokeWidth={3} />
                                    </button>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-50">
                            {loading ? (
                                <tr><td colSpan="8" className="py-6 text-center text-sm text-stone-500">Loading payments...</td></tr>
                            ) : payments.length === 0 ? (
                                <tr><td colSpan="8" className="py-6 text-center text-sm text-stone-500">No fee payments found</td></tr>
                            ) : (
                                payments.map((payment) => (
                                    <tr key={payment._id} className="group transition-all duration-100 cursor-pointer hover:bg-stone-50/70">
                                        <td className="w-16 py-3 pl-5 pr-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 rounded border-2 flex items-center justify-center transition-all cursor-pointer flex-shrink-0 border-stone-300 bg-white hover:border-orange"></div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button className="flex items-center justify-center w-6 h-6 rounded text-stone-400 hover:text-stone-700 bg-white hover:bg-stone-100 shadow-sm border border-transparent hover:border-stone-200 transition-all flex-shrink-0" title="Print Receipt">
                                                        <FileText size={13} strokeWidth={2.5} />
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-3">
                                            <span className="text-xs font-mono font-bold text-orange-600">{payment.receiptId}</span>
                                        </td>
                                        <td className="py-3 px-3">
                                            <span className="text-xs font-mono font-bold text-stone-500">{payment.invoiceId || '—'}</span>
                                        </td>
                                        <td className="py-3 px-3">
                                            <span className="text-sm font-black text-stone-700 group-hover:text-stone-900">{payment.studentName}</span>
                                        </td>
                                        <td className="py-3 px-3">
                                            <span className="text-sm font-black text-emerald-600">{payment.amount}</span>
                                        </td>
                                        <td className="py-3 px-3">
                                            {getMethodBadge(payment.method)}
                                        </td>
                                        <td className="py-3 px-3">
                                            <span className="text-sm font-semibold text-stone-600">{formatDate(payment.date)}</span>
                                        </td>
                                        <td className="py-3 px-3 pr-5">
                                            <span className="text-xs text-stone-400 font-medium whitespace-nowrap">{formatDateTime(payment.createdAt)}</span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-4 py-3 border-t border-stone-100 bg-stone-50/30 flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-stone-500 whitespace-nowrap">
                        {startItem}–{endItem} of <span className="text-stone-800 font-black">{total}</span>
                    </span>
                    
                    <div className="flex items-center gap-2">
                        <div className="relative w-16">
                            <button type="button" className="w-full flex items-center justify-between gap-1.5 text-left rounded-lg transition-all duration-150 border-[1.5px] bg-white focus:outline-none px-2.5 py-1.5 text-xs border-[#E8E0D4] hover:border-[#C8BEB4] cursor-pointer">
                                <span className="flex items-center gap-1.5 min-w-0 flex-1 text-stone-800 font-medium">
                                    <span className="truncate">{limit}</span>
                                </span>
                                <span className="flex items-center flex-shrink-0">
                                    <ChevronDown size={14} className="text-stone-400" />
                                </span>
                            </button>
                        </div>
                        
                        <div className="flex items-center gap-1">
                            <button 
                                disabled={page === 1}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                className="flex items-center justify-center min-w-[28px] h-7 rounded bg-white text-stone-400 hover:text-orange-500 hover:bg-orange-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft size={16} />
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
                                        className={`min-w-[28px] h-7 rounded text-xs font-bold transition-all ${
                                            page === p 
                                            ? 'bg-[#FF9933] text-white shadow-sm shadow-orange-500/20' 
                                            : 'bg-white text-stone-500 hover:bg-orange-50 hover:text-orange-500'
                                        }`}
                                    >
                                        {p}
                                    </button>
                                );
                            })}
                            
                            {totalPages > 4 && page < totalPages - 1 && (
                                <span className="px-1 text-stone-400 text-xs">...</span>
                            )}
                            
                            {totalPages > 4 && page < totalPages - 1 && (
                                <button 
                                    onClick={() => setPage(totalPages)}
                                    className="min-w-[28px] h-7 rounded text-xs font-bold transition-all bg-white text-stone-500 hover:bg-orange-50 hover:text-orange-500"
                                >
                                    {totalPages}
                                </button>
                            )}
                            
                            <button 
                                disabled={page === totalPages}
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                className="flex items-center justify-center min-w-[28px] h-7 rounded bg-white text-stone-400 hover:text-orange-500 hover:bg-orange-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
