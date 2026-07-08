"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Loader2, AlertCircle, Plus, RefreshCw, FileText, X } from 'lucide-react';

const MONTHS = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

const SORT_COLUMNS = [
    { key: 'staff', label: 'Staff', sortKey: null },
    { key: 'slip_month', label: 'Month', sortKey: 'slip_month' },
    { key: 'gross_salary', label: 'Gross', sortKey: 'gross_salary' },
    { key: 'deductions', label: 'Deductions', sortKey: null },
    { key: 'net_salary', label: 'Net', sortKey: 'net_salary' },
    { key: 'payment_status', label: 'Status', sortKey: 'payment_status' },
];

function formatCurrency(amount) {
    if (amount === undefined || amount === null) return '₹0';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

function formatMonth(slipMonth) {
    if (!slipMonth) return '—';
    if (typeof slipMonth === 'string') return slipMonth;
    const d = new Date(slipMonth);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function formatDate(d) {
    if (!d) return '—';
    const dt = new Date(d);
    return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getStatusBadge(status) {
    const s = (status || '').toLowerCase();
    if (s === 'paid') return <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-green-50 text-green-700 border border-green-100">PAID</span>;
    return <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100">PENDING</span>;
}

export default function SalarySlipsPage() {
    const [slips, setSlips] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [sortBy, setSortBy] = useState('slip_month');
    const [sortDir, setSortDir] = useState('desc');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(() => {
        if (typeof window !== 'undefined') return parseInt(localStorage.getItem('salarySlipsPerPage')) || 10;
        return 10;
    });
    const [staffList, setStaffList] = useState([]);

    // Generate modal
    const [showGenerate, setShowGenerate] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [genForm, setGenForm] = useState({ staffId: '', month: '', year: CURRENT_YEAR });
    const [genError, setGenError] = useState('');

    // Filter panel
    const [showFilters, setShowFilters] = useState(false);
    const [filterStaff, setFilterStaff] = useState('');
    const [filterMonth, setFilterMonth] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const hasActiveFilters = filterStaff || filterMonth || filterYear || filterStatus;

    // Bulk selected
    const [selected, setSelected] = useState(new Set());
    const [markingPaid, setMarkingPaid] = useState(false);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 350);
        return () => clearTimeout(timer);
    }, [search]);

    // Load staff for filter
    useEffect(() => {
        (async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('/api/admin/staff?limit=500', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.success) setStaffList(data.data || []);
                }
            } catch {}
        })();
    }, []);

    const buildParams = useCallback(() => {
        const params = new URLSearchParams({ page, limit: perPage, sort_by: sortBy, sort_dir: sortDir });
        if (debouncedSearch) params.set('search', debouncedSearch);
        if (filterStaff) params.set('staff_id', filterStaff);
        if (filterMonth) params.set('month', filterMonth);
        if (filterYear) params.set('year', filterYear);
        if (filterStatus) params.set('payment_status', filterStatus);
        return params;
    }, [page, perPage, sortBy, sortDir, debouncedSearch, filterStaff, filterMonth, filterYear, filterStatus]);

    const fetchSlips = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/admin/salary-slips?${buildParams()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || 'Failed to fetch');
            }
            const data = await res.json();
            if (data.success) {
                setSlips(data.data);
                setTotal(data.total);
                setSelected(new Set());
            } else {
                throw new Error(data.message || 'Failed to fetch');
            }
        } catch (err) {
            setError(err.message);
            setSlips([]);
            setTotal(0);
        }
        setLoading(false);
    }, [buildParams]);

    useEffect(() => { fetchSlips(); }, [fetchSlips]);

    const isAllSelected = slips.length > 0 && slips.every(s => selected.has(s.id));
    const isPartialSelected = !isAllSelected && selected.size > 0;

    const toggleSelect = (id) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (isAllSelected) setSelected(new Set());
        else setSelected(new Set(slips.map(s => s.id)));
    };

    const handleSort = (key) => {
        if (!key) return;
        if (sortBy === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortBy(key); setSortDir('asc'); }
        setPage(1);
    };

    const handlePerPageChange = (val) => {
        setPerPage(val);
        localStorage.setItem('salarySlipsPerPage', val.toString());
        setPage(1);
    };

    const clearFilters = () => {
        setFilterStaff(''); setFilterMonth(''); setFilterYear(''); setFilterStatus('');
        setPage(1);
    };

    // Generate slip
    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!genForm.month) { setGenError('Month is required'); return; }
        setGenerating(true);
        setGenError('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/admin/salary-slips/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(genForm)
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || 'Generation failed');
            const msg = data.data.created > 0
                ? `Generated ${data.data.created} slip(s), skipped ${data.data.skipped}`
                : 'Salary slip(s) generated';
            alert(msg);
            setShowGenerate(false);
            setGenForm({ staffId: '', month: '', year: CURRENT_YEAR });
            fetchSlips();
        } catch (err) {
            setGenError(err.message);
        }
        setGenerating(false);
    };

    // Mark selected as paid
    const markSelectedPaid = async () => {
        setMarkingPaid(true);
        try {
            const token = localStorage.getItem('token');
            const pendingIds = slips.filter(s => selected.has(s.id) && s.payment_status !== 'paid').map(s => s.id);
            let success = 0;
            for (const id of pendingIds) {
                const res = await fetch(`/api/admin/salary-slips/${id}/mark-paid`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ payment_date: new Date().toISOString().split('T')[0] })
                });
                if (res.ok) success++;
            }
            if (success > 0) alert(`${success} slip(s) marked as paid`);
            setSelected(new Set());
            fetchSlips();
        } catch {}
        setMarkingPaid(false);
    };

    // Export
    const exportData = (format) => {
        const exportItems = selected.size > 0 ? slips.filter(s => selected.has(s.id)) : slips;
        const headers = ['Staff', 'Staff Code', 'Month', 'Gross', 'Deductions', 'Net', 'Status'];
        const rows = exportItems.map(s => [
            s.staff_name || '', s.staff_code || '', formatMonth(s.slip_month),
            formatCurrency(s.gross_salary), formatCurrency(s.deductions),
            formatCurrency(s.net_salary), s.payment_status || ''
        ]);
        const content = [headers, ...rows].map(row =>
            row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(format === 'csv' ? ',' : '\t')
        ).join('\n');
        const mime = format === 'csv' ? 'text/csv' : 'application/vnd.ms-excel';
        const ext = format === 'csv' ? 'csv' : 'xls';
        const blob = new Blob([content], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `salary-slips.${ext}`; a.click();
        URL.revokeObjectURL(url);
    };

    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const startItem = total === 0 ? 0 : (page - 1) * perPage + 1;
    const endItem = Math.min(page * perPage, total);

    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 5) { for (let i = 1; i <= totalPages; i++) pages.push(i); return pages; }
        pages.push(1);
        let s = Math.max(2, page - 1), e = Math.min(totalPages - 1, page + 1);
        if (page <= 2) { s = 2; e = 4; }
        if (page >= totalPages - 1) { s = totalPages - 3; e = totalPages - 1; }
        if (s > 2) pages.push('...');
        for (let i = s; i <= e; i++) pages.push(i);
        if (e < totalPages - 1) pages.push('...');
        pages.push(totalPages);
        return pages;
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-5 rounded-full" style={{ backgroundColor: 'var(--orange)' }}></div>
                        <h1 className="text-xl font-bold text-stone-900 tracking-tight">Salary Slips</h1>
                    </div>
                    <p className="text-sm text-stone-500 font-medium mt-0.5 ml-3.5">View, generate and manage monthly salary slips</p>
                </div>
                <button
                    onClick={() => setShowGenerate(true)}
                    className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white rounded-lg transition-all shadow-sm hover:scale-105 bg-stone-900 hover:bg-stone-800"
                >
                    <FileText size={16} strokeWidth={2.5} /> Generate Slip
                </button>
            </div>

            {/* Main Card */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                {/* Toolbar */}
                <div className="px-3 py-3 border-b border-stone-100 bg-white">
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="relative group flex-1 max-w-xs min-w-[180px]">
                            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-stone-400 group-focus-within:text-orange">
                                <Search size={14} strokeWidth={2.5} />
                            </div>
                            <input type="text" className="block rounded-lg border border-stone-200 bg-white pl-8 pr-7 py-1.5 text-sm text-stone-800 shadow-sm transition-all focus:outline-none focus:ring-2 w-full" placeholder="Search by staff name or code..." style={{ '--tw-ring-color': 'rgba(255, 153, 51, 0.2)' }} value={search} onChange={e => setSearch(e.target.value)} />
                        </div>

                        <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all shadow-sm ${showFilters || hasActiveFilters ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-600 border-stone-300 hover:border-stone-400 hover:bg-stone-50'}`}>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            Filters {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />}
                        </button>

                        {hasActiveFilters && (
                            <button onClick={clearFilters} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold text-stone-400 hover:text-red-500 hover:bg-red-50 border border-stone-200 transition-all">
                                <X size={12} /> Clear
                            </button>
                        )}

                        {/* Export */}
                        <div className="ml-auto flex items-center gap-1">
                            {selected.size > 0 && (
                                <>
                                    <span className="text-xs font-bold text-stone-500 mr-1">{selected.size} selected</span>
                                    <button
                                        onClick={markSelectedPaid}
                                        disabled={markingPaid}
                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-green-700 hover:bg-green-50 border border-green-200 hover:border-green-300 transition-all disabled:opacity-50"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Mark Paid
                                    </button>
                                </>
                            )}
                            <button onClick={() => exportData('csv')} className="px-2 py-1.5 rounded-lg text-[10px] font-bold text-stone-600 hover:bg-stone-100 border border-stone-200 transition-all">CSV</button>
                            <button onClick={() => exportData('xls')} className="px-2 py-1.5 rounded-lg text-[10px] font-bold text-stone-600 hover:bg-stone-100 border border-stone-200 transition-all">Excel</button>
                        </div>
                    </div>

                    {/* Filter Panel */}
                    {showFilters && (
                        <div className="mt-3 pt-3 border-t border-stone-100 flex items-center gap-3 flex-wrap">
                            <div>
                                <label className="block text-[10px] font-bold text-stone-500 mb-1 uppercase tracking-wider">Staff</label>
                                <select value={filterStaff} onChange={e => { setFilterStaff(e.target.value); setPage(1); }} className="rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 focus:outline-none min-w-[160px]">
                                    <option value="">All Staff</option>
                                    {staffList.map(s => (
                                        <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.staffCode})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-stone-500 mb-1 uppercase tracking-wider">Month</label>
                                <select value={filterMonth} onChange={e => { setFilterMonth(e.target.value); setPage(1); }} className="rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 focus:outline-none min-w-[120px]">
                                    <option value="">All Months</option>
                                    {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-stone-500 mb-1 uppercase tracking-wider">Year</label>
                                <select value={filterYear} onChange={e => { setFilterYear(e.target.value); setPage(1); }} className="rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 focus:outline-none min-w-[100px]">
                                    <option value="">All Years</option>
                                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-stone-500 mb-1 uppercase tracking-wider">Status</label>
                                <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} className="rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 focus:outline-none min-w-[120px]">
                                    <option value="">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="paid">Paid</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Error */}
                {error && (
                    <div className="flex flex-col items-center justify-center py-12 px-4">
                        <AlertCircle size={40} className="text-red-300 mb-3" />
                        <p className="text-sm font-semibold text-stone-600 mb-3">{error}</p>
                        <button onClick={fetchSlips} className="px-4 py-2 rounded-lg text-sm font-semibold bg-stone-900 text-white hover:opacity-90">Try Again</button>
                    </div>
                )}

                {/* Empty */}
                {!error && !loading && slips.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 px-4">
                        <FileText size={40} className="text-stone-300 mb-3" />
                        <p className="text-sm font-semibold text-stone-600 mb-1">No Salary Slips</p>
                        <p className="text-xs text-stone-400">Generate salary slips for staff members.</p>
                    </div>
                )}

                {/* Table */}
                {!error && (loading || slips.length > 0) && (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[750px]">
                            <thead>
                                <tr className="bg-white border-b border-stone-200 text-left">
                                    <th className="w-12 py-4 pl-5 pr-2">
                                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer transition-all ${isAllSelected || isPartialSelected ? 'bg-orange-500 border-orange-500' : 'border-stone-300 hover:border-orange-400'}`} onClick={toggleSelectAll}>
                                            {isAllSelected && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                            {isPartialSelected && <div className="w-2 h-0.5 bg-white rounded" />}
                                        </div>
                                    </th>
                                    {SORT_COLUMNS.map(col => (
                                        <th key={col.key} className="py-4 px-3">
                                            <button onClick={() => handleSort(col.sortKey)} className={`flex items-center gap-1 group text-xs font-bold transition-colors ${sortBy === col.sortKey ? 'text-stone-900' : 'text-stone-700 hover:text-stone-900'} ${!col.sortKey ? 'cursor-default' : ''}`}>
                                                {col.label}
                                                {col.sortKey && (sortBy === col.sortKey
                                                    ? (sortDir === 'asc' ? <ChevronUp size={12} style={{ color: 'var(--orange)' }} strokeWidth={3} /> : <ChevronDown size={12} style={{ color: 'var(--orange)' }} strokeWidth={3} />)
                                                    : <ChevronDown size={12} className="text-stone-400 opacity-0 group-hover:opacity-100" strokeWidth={3} />
                                                )}
                                            </button>
                                        </th>
                                    ))}
                                    <th className="py-4 px-3 pr-5 w-28" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-50">
                                {loading ? (
                                    <tr key="loading"><td colSpan="7" className="py-8 text-center"><div className="flex items-center justify-center gap-2 text-sm text-stone-400"><Loader2 size={16} className="animate-spin" /> Loading salary slips...</div></td></tr>
                                ) : (
                                    slips.map(slip => (
                                        <tr key={slip.id} className="group transition-all duration-100 hover:bg-stone-50/70">
                                            <td className="w-12 py-3 pl-5 pr-2">
                                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer transition-all ${selected.has(slip.id) ? 'bg-orange-500 border-orange-500' : 'border-stone-300 hover:border-orange-400'}`} onClick={(e) => { e.stopPropagation(); toggleSelect(slip.id); }}>
                                                    {selected.has(slip.id) && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                                </div>
                                            </td>
                                            <td className="py-3 px-3">
                                                <a href={`/dashboard/staff/salary/${slip.id}`} className="flex items-start gap-2 group/link">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-2 flex-shrink-0" />
                                                    <div className="flex flex-col">
                                                        <span className="text-[13px] font-black text-stone-800 group-hover/link:text-orange-600 transition-colors">{slip.staff_name}</span>
                                                        <span className="text-[10px] font-bold text-stone-400 font-mono">{slip.staff_code}</span>
                                                    </div>
                                                </a>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className="text-xs font-bold text-stone-700">{formatMonth(slip.slip_month)}</span>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className="text-xs font-bold text-stone-700">{formatCurrency(slip.gross_salary)}</span>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className="text-xs font-bold text-red-500">{formatCurrency(slip.deductions)}</span>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className="text-xs font-black text-green-700">{formatCurrency(slip.net_salary)}</span>
                                            </td>
                                            <td className="py-3 px-3">
                                                {getStatusBadge(slip.payment_status)}
                                            </td>
                                            <td className="py-3 px-3 pr-5">
                                                <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <a href={`/dashboard/staff/salary/${slip.id}`} className="p-1.5 rounded-lg text-stone-400 hover:text-indigo-500 hover:bg-indigo-50 transition-colors" title="View">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </a>
                                                    {slip.payment_status !== 'paid' && (
                                                        <button
                                                            onClick={async () => {
                                                                if (!confirm(`Mark ${slip.staff_name}'s ${formatMonth(slip.slip_month)} salary as paid?`)) return;
                                                                const token = localStorage.getItem('token');
                                                                const res = await fetch(`/api/admin/salary-slips/${slip.id}/mark-paid`, {
                                                                    method: 'PATCH',
                                                                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                                                    body: JSON.stringify({ payment_date: new Date().toISOString().split('T')[0] })
                                                                });
                                                                if (res.ok) fetchSlips();
                                                            }}
                                                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 transition-colors"
                                                            title="Mark Paid"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            Mark Paid
                                                        </button>
                                                    )}
                                                </div>
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
                        <span className="text-xs font-bold text-stone-500 whitespace-nowrap">{startItem}–{endItem} of <span className="text-stone-800 font-black">{total}</span></span>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <select value={perPage} onChange={e => handlePerPageChange(Number(e.target.value))} className="appearance-none rounded-lg border-[1.5px] bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 border-[#E8E0D4] hover:border-[#C8BEB4] focus:outline-none cursor-pointer pr-6">
                                    {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400" />
                            </div>
                            <div className="flex items-center gap-1">
                                <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="p-1.5 rounded-lg border border-stone-200 bg-white text-stone-400 hover:text-orange-500 hover:border-orange-300 hover:bg-orange-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"><ChevronLeft size={16} /></button>
                                {getPageNumbers().map((p, idx) =>
                                    p === '...' ? <span key={`e-${idx}`} className="px-1 text-xs text-stone-400">...</span>
                                        : <button key={p} onClick={() => setPage(p)} className={`min-w-[32px] h-8 rounded-lg text-xs font-black transition-all border ${page === p ? 'bg-[#F9932B] border-[#F9932B] text-white shadow-sm shadow-orange-500/20' : 'bg-white border-stone-200 text-stone-500 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-500'}`}>{p}</button>
                                )}
                                <button disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="p-1.5 rounded-lg border border-stone-200 bg-white text-stone-400 hover:text-orange-500 hover:border-orange-300 hover:bg-orange-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"><ChevronRight size={16} /></button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Generate Modal */}
            {showGenerate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="fixed inset-0 bg-black/40" onClick={() => setShowGenerate(false)} />
                    <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-md border border-stone-200">
                        <h3 className="text-base font-black text-stone-900 uppercase tracking-widest mb-4">Generate Salary Slip</h3>
                        <form onSubmit={handleGenerate} className="space-y-4">
                            {genError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-bold">{genError}</div>}
                            <div>
                                <label className="form-label text-[10px] uppercase tracking-wider font-black text-stone-400">Staff Member</label>
                                <select value={genForm.staffId} onChange={e => setGenForm(f => ({ ...f, staffId: e.target.value }))} className="form-select">
                                    <option value="">All active staff</option>
                                    {staffList.map(s => (
                                        <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.staffCode})</option>
                                    ))}
                                </select>
                                <p className="text-[10px] text-stone-400 mt-1">Leave blank to generate for all active staff</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="form-label text-[10px] uppercase tracking-wider font-black text-stone-400">Month *</label>
                                    <select value={genForm.month} onChange={e => setGenForm(f => ({ ...f, month: e.target.value }))} className="form-select" required>
                                        <option value="">Select month</option>
                                        {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label text-[10px] uppercase tracking-wider font-black text-stone-400">Year *</label>
                                    <select value={genForm.year} onChange={e => setGenForm(f => ({ ...f, year: e.target.value }))} className="form-select" required>
                                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowGenerate(false)} className="px-4 py-2 text-xs font-black text-stone-400 uppercase tracking-widest hover:text-stone-600">Cancel</button>
                                <button type="submit" disabled={generating} className="px-6 py-2 text-xs font-black uppercase tracking-widest text-white rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-50">{generating ? 'Generating...' : 'Generate'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
