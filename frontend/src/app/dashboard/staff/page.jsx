"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Loader2, AlertCircle, Plus, Edit, Trash2, Users, X, RefreshCw } from 'lucide-react';

const SORT_COLUMNS = [
    { key: 'firstName', label: 'Staff Name', sortKey: 'firstName' },
    { key: 'staffCode', label: 'ID', sortKey: 'staffCode' },
    { key: 'department', label: 'Department', sortKey: 'department' },
    { key: 'designation', label: 'Designation', sortKey: 'designation' },
    { key: 'employmentType', label: 'Type', sortKey: 'employmentType' },
    { key: 'status', label: 'Status', sortKey: null },
];

const TYPE_OPTIONS = [
    { value: '', label: 'All Types' },
    { value: 'full-time', label: 'Full-time' },
    { value: 'part-time', label: 'Part-time' },
    { value: 'contract', label: 'Contract' },
];

const STATUS_OPTIONS = [
    { value: '', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
];

function getStatusBadge(isActive) {
    if (isActive) {
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-green-100 text-green-700 border border-green-200">ACTIVE</span>;
    }
    return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-100 text-red-700 border border-red-200">INACTIVE</span>;
}

function getTypeBadge(type) {
    const t = (type || '').toLowerCase();
    const colors = t === 'full-time' ? 'bg-blue-100 text-blue-700 border-blue-200'
        : t === 'part-time' ? 'bg-orange-100 text-orange-700 border-orange-200'
        : 'bg-purple-100 text-purple-700 border-purple-200';
    return <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wide uppercase ${colors} border`}>{t || 'FULL-TIME'}</span>;
}

export default function StaffDirectoryPage() {
    const [staffData, setStaffData] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [department, setDepartment] = useState('');
    const [employmentType, setEmploymentType] = useState('');
    const [status, setStatus] = useState('');
    const [departments, setDepartments] = useState([]);
    const [sortBy, setSortBy] = useState('firstName');
    const [sortDir, setSortDir] = useState('asc');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(() => {
        if (typeof window !== 'undefined') return parseInt(localStorage.getItem('staffPerPage')) || 10;
        return 10;
    });

    // Selection
    const [selected, setSelected] = useState(new Set());
    const [selectAllRecords, setSelectAllRecords] = useState(false);
    const selectAllRef = useRef(false);

    // Delete modals
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [bulkDelete, setBulkDelete] = useState(false);
    const [bulkDeleting, setBulkDeleting] = useState(false);

    // Filter panel
    const [showFilters, setShowFilters] = useState(false);
    const hasActiveFilters = department || employmentType || status;

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 350);
        return () => clearTimeout(timer);
    }, [search]);

    // Fetch departments
    useEffect(() => {
        (async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('http://localhost:5000/api/admin/departments', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.success) setDepartments(data.data || []);
                }
            } catch {}
        })();
    }, []);

    const fetchStaff = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams({
                page, limit: perPage, sort_by: sortBy, sort_dir: sortDir
            });
            if (debouncedSearch) params.set('search', debouncedSearch);
            if (department) params.set('department', department);
            if (employmentType) params.set('employmentType', employmentType);
            if (status) params.set('status', status);

            const res = await fetch(`http://localhost:5000/api/admin/staff?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || 'Failed to fetch');
            }
            const data = await res.json();
            if (data.success) {
                setStaffData(data.data);
                setTotal(data.total);
                if (!selectAllRef.current) setSelected(new Set());
            } else {
                throw new Error(data.message || 'Failed to fetch');
            }
        } catch (err) {
            setError(err.message);
            setStaffData([]);
            setTotal(0);
        }
        setLoading(false);
    }, [page, perPage, debouncedSearch, department, employmentType, status, sortBy, sortDir]);

    useEffect(() => { fetchStaff(); }, [fetchStaff]);

    const isAllSelected = staffData.length > 0 && staffData.every(s => selected.has(s.id));
    const isPartialSelected = !isAllSelected && selected.size > 0;

    const toggleSelect = (id) => {
        setSelectAllRecords(false);
        selectAllRef.current = false;
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelected(new Set());
            selectAllRef.current = false;
            setSelectAllRecords(false);
        } else {
            const all = new Set(staffData.map(s => s.id));
            setSelected(all);
            selectAllRef.current = false;
        }
    };

    const handleSort = (key) => {
        if (!key) return;
        if (sortBy === key) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(key);
            setSortDir('asc');
        }
        setPage(1);
    };

    const handlePerPageChange = (val) => {
        setPerPage(val);
        localStorage.setItem('staffPerPage', val.toString());
        setPage(1);
    };

    const clearFilters = () => {
        setDepartment('');
        setEmploymentType('');
        setStatus('');
        setPage(1);
    };

    // Export
    const exportData = (format) => {
        const rows = staffData.filter(s => selectAllRecords || selected.size === 0 || selected.has(s.id));
        const headers = ['Staff Code', 'First Name', 'Last Name', 'Department', 'Designation', 'Type', 'Status', 'Email'];
        const data = rows.map(s => [
            s.staffCode || '', s.firstName || '', s.lastName || '',
            s.department || '', s.designation || '',
            s.employmentType || '', s.isActive ? 'active' : 'inactive', s.email || ''
        ]);

        let content;
        if (format === 'csv') {
            content = [headers, ...data].map(row =>
                row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
            ).join('\n');
        } else {
            content = [headers, ...data].map(row => row.join('\t')).join('\n');
        }

        const mime = format === 'csv' ? 'text/csv' : 'application/vnd.ms-excel';
        const ext = format === 'csv' ? 'csv' : 'xls';
        const blob = new Blob([content], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `staff.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Delete handlers
    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/admin/staff/${deleteTarget.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Delete failed');
            setDeleteTarget(null);
            fetchStaff();
        } catch (err) {
            alert(err.message);
        }
        setDeleting(false);
    };

    const confirmBulkDelete = async () => {
        setBulkDeleting(true);
        try {
            const token = localStorage.getItem('token');
            const ids = selectAllRecords
                ? [...Array(total).keys()].map((_, i) => i)
                : [...selected];
            const results = await Promise.allSettled(
                [...selected].map(id =>
                    fetch(`http://localhost:5000/api/admin/staff/${id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                )
            );
            const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.ok));
            if (failed.length > 0) {
                alert(`${failed.length} deletion(s) failed`);
            }
            setBulkDelete(false);
            setSelected(new Set());
            setSelectAllRecords(false);
            selectAllRef.current = false;
            fetchStaff();
        } catch (err) {
            alert('Some deletions failed');
        }
        setBulkDeleting(false);
    };

    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const startItem = total === 0 ? 0 : (page - 1) * perPage + 1;
    const endItem = Math.min(page * perPage, total);

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
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-5 rounded-full" style={{ backgroundColor: 'var(--orange)' }}></div>
                    <h1 className="text-xl font-bold text-stone-900 tracking-tight">Staff Directory</h1>
                    <span className="text-sm font-bold text-stone-400 ml-2">
                        <span className="text-stone-800 font-black">{total}</span> staff members
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchStaff}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-bold rounded-lg transition-colors border border-stone-200"
                    >
                        <RefreshCw size={14} strokeWidth={2.5} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                    <a
                        href="/dashboard/staff/new"
                        className="flex items-center justify-center gap-2 px-5 py-2 text-white text-sm font-bold rounded-lg transition-all shadow-sm hover:scale-105 bg-stone-900 hover:bg-stone-800"
                    >
                        <Plus size={16} strokeWidth={3} /> Add Staff
                    </a>
                </div>
            </div>

            {/* Main Card */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                {/* Toolbar */}
                <div className="px-3 py-3 border-b border-stone-100 bg-white">
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Search */}
                        <div className="relative group flex-1 max-w-xs min-w-[180px]">
                            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-stone-400 group-focus-within:text-orange">
                                <Search size={14} strokeWidth={2.5} />
                            </div>
                            <input
                                type="text"
                                className="block rounded-lg border border-stone-200 bg-white pl-8 pr-7 py-1.5 text-sm text-stone-800 shadow-sm transition-all focus:outline-none focus:ring-2 w-full"
                                placeholder="Search by name or staff code..."
                                style={{ '--tw-ring-color': 'rgba(255, 153, 51, 0.2)' }}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        {/* Filter button */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all shadow-sm ${
                                showFilters || hasActiveFilters
                                    ? 'bg-stone-900 text-white border-stone-900'
                                    : 'bg-white text-stone-600 border-stone-300 hover:border-stone-400 hover:bg-stone-50'
                            }`}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            Filters
                            {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />}
                        </button>

                        {/* Active filter labels */}
                        {hasActiveFilters && (
                            <button onClick={clearFilters} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold text-stone-400 hover:text-red-500 hover:bg-red-50 border border-stone-200 transition-all">
                                <X size={12} strokeWidth={2.5} /> Clear
                            </button>
                        )}

                        {/* Selection actions */}
                        <div className="flex items-center gap-1 ml-auto">
                            {selected.size > 0 && (
                                <>
                                    <span className="text-xs font-bold text-stone-500 mr-1">{selected.size} selected</span>
                                    <button
                                        onClick={() => setBulkDelete(true)}
                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-red-600 hover:bg-red-50 border border-red-200 hover:border-red-300 transition-all"
                                    >
                                        <Trash2 size={12} /> Delete
                                    </button>
                                </>
                            )}
                            {/* Export buttons */}
                            {(selected.size > 0 || selectAllRecords) && (
                                <div className="flex items-center gap-1 ml-1">
                                    <button onClick={() => exportData('csv')} className="px-2 py-1.5 rounded-lg text-[10px] font-bold text-stone-600 hover:bg-stone-100 border border-stone-200 transition-all">CSV</button>
                                    <button onClick={() => exportData('xls')} className="px-2 py-1.5 rounded-lg text-[10px] font-bold text-stone-600 hover:bg-stone-100 border border-stone-200 transition-all">Excel</button>
                                </div>
                            )}
                            {(selected.size === 0 && !selectAllRecords) && (
                                <div className="flex items-center gap-1">
                                    <button onClick={() => exportData('csv')} className="px-2 py-1.5 rounded-lg text-[10px] font-bold text-stone-600 hover:bg-stone-100 border border-stone-200 transition-all">CSV</button>
                                    <button onClick={() => exportData('xls')} className="px-2 py-1.5 rounded-lg text-[10px] font-bold text-stone-600 hover:bg-stone-100 border border-stone-200 transition-all">Excel</button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Filter Panel */}
                    {showFilters && (
                        <div className="mt-3 pt-3 border-t border-stone-100 flex items-center gap-3 flex-wrap">
                            <div>
                                <label className="block text-[10px] font-bold text-stone-500 mb-1 uppercase tracking-wider">Department</label>
                                <select
                                    value={department}
                                    onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
                                    className="rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 focus:outline-none focus:ring-2 min-w-[140px]"
                                >
                                    <option value="">All Departments</option>
                                    {departments.map(d => (
                                        <option key={d.id} value={d.name}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-stone-500 mb-1 uppercase tracking-wider">Type</label>
                                <select
                                    value={employmentType}
                                    onChange={(e) => { setEmploymentType(e.target.value); setPage(1); }}
                                    className="rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 focus:outline-none focus:ring-2 min-w-[120px]"
                                >
                                    {TYPE_OPTIONS.map(o => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-stone-500 mb-1 uppercase tracking-wider">Status</label>
                                <select
                                    value={status}
                                    onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                                    className="rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 focus:outline-none focus:ring-2 min-w-[120px]"
                                >
                                    {STATUS_OPTIONS.map(o => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Error State */}
                {error && (
                    <div className="flex flex-col items-center justify-center py-12 px-4">
                        <AlertCircle size={40} className="text-red-300 mb-3" />
                        <p className="text-sm font-semibold text-stone-600 mb-3">{error}</p>
                        <button onClick={fetchStaff} className="px-4 py-2 rounded-lg text-sm font-semibold bg-stone-900 text-white hover:opacity-90 transition-all">Try Again</button>
                    </div>
                )}

                {/* Empty State */}
                {!error && !loading && staffData.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 px-4">
                        <Users size={40} className="text-stone-300 mb-3" />
                        {(debouncedSearch || hasActiveFilters) ? (
                            <>
                                <p className="text-sm font-semibold text-stone-600 mb-1">No staff match your search</p>
                                <p className="text-xs text-stone-400">Try different search terms or clear filters</p>
                            </>
                        ) : (
                            <>
                                <p className="text-sm font-semibold text-stone-600 mb-1">No staff yet</p>
                                <p className="text-xs text-stone-400">Add your first staff member to get started</p>
                            </>
                        )}
                    </div>
                )}

                {/* Table */}
                {!error && (loading || staffData.length > 0) && (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[850px]">
                            <thead>
                                <tr className="bg-white border-b border-stone-200 text-left">
                                    <th className="w-12 py-4 pl-5 pr-2">
                                        <div
                                            className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer transition-all ${
                                                isAllSelected || isPartialSelected
                                                    ? 'bg-orange-500 border-orange-500'
                                                    : 'border-stone-300 hover:border-orange-400'
                                            }`}
                                            onClick={toggleSelectAll}
                                        >
                                            {isAllSelected && (
                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                            {isPartialSelected && (
                                                <div className="w-2 h-0.5 bg-white rounded" />
                                            )}
                                        </div>
                                    </th>
                                    {SORT_COLUMNS.map(col => (
                                        <th key={col.key} className="py-4 px-3">
                                            <button
                                                onClick={() => handleSort(col.sortKey)}
                                                className={`flex items-center gap-1 group text-xs font-bold transition-colors ${
                                                    sortBy === col.sortKey
                                                        ? 'text-stone-900'
                                                        : 'text-stone-700 hover:text-stone-900'
                                                } ${!col.sortKey ? 'cursor-default' : ''}`}
                                            >
                                                {col.label}
                                                {col.sortKey && (
                                                    sortBy === col.sortKey
                                                        ? (sortDir === 'asc' ? <ChevronUp size={12} style={{ color: 'var(--orange)' }} strokeWidth={3} /> : <ChevronDown size={12} style={{ color: 'var(--orange)' }} strokeWidth={3} />)
                                                        : <ChevronDown size={12} className="text-stone-400 opacity-0 group-hover:opacity-100" strokeWidth={3} />
                                                )}
                                            </button>
                                        </th>
                                    ))}
                                    <th className="py-4 px-3 pr-5 w-24" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-50">
                                {loading ? (
                                    <tr key="loading">
                                        <td colSpan="7" className="py-8 text-center">
                                            <div className="flex items-center justify-center gap-2 text-sm text-stone-400">
                                                <Loader2 size={16} className="animate-spin" />
                                                Loading staff...
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    staffData.map(staff => (
                                        <tr key={staff.id} className="group transition-all duration-100 hover:bg-stone-50/70">
                                            <td className="w-12 py-3 pl-5 pr-2">
                                                <div
                                                    className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer transition-all ${
                                                        selected.has(staff.id)
                                                            ? 'bg-orange-500 border-orange-500'
                                                            : 'border-stone-300 hover:border-orange-400'
                                                    }`}
                                                    onClick={(e) => { e.stopPropagation(); toggleSelect(staff.id); }}
                                                >
                                                    {selected.has(staff.id) && (
                                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 px-3">
                                                <a href={`/dashboard/staff/${staff.id}`} className="flex items-start gap-2 group/link">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-2 flex-shrink-0" />
                                                    <div className="flex flex-col">
                                                        <span className="text-[13px] font-black text-stone-800 group-hover/link:text-orange-600 transition-colors">
                                                            {staff.firstName} {staff.lastName}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-stone-400 font-mono tracking-wide">{staff.staffCode || '—'}</span>
                                                    </div>
                                                </a>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className="text-[11px] font-bold text-stone-400 font-mono tracking-wide">{staff.staffCode || '—'}</span>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className="text-xs font-bold text-stone-600">{staff.department || '—'}</span>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className="text-xs font-bold text-stone-600">{staff.designation || '—'}</span>
                                            </td>
                                            <td className="py-3 px-3">
                                                {getTypeBadge(staff.employmentType)}
                                            </td>
                                            <td className="py-3 px-3">
                                                {getStatusBadge(staff.isActive)}
                                            </td>
                                            <td className="py-3 px-3 pr-5">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <a
                                                        href={`/dashboard/staff/${staff.id}/edit`}
                                                        className="p-1.5 rounded-md text-stone-400 hover:text-orange-500 hover:bg-orange-50 transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit size={15} strokeWidth={2.5} />
                                                    </a>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(staff); }}
                                                        className="p-1.5 rounded-md text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={15} strokeWidth={2.5} />
                                                    </button>
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

            {/* Delete Single Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl border border-stone-200 w-full max-w-md m-4 p-5">
                        <h3 className="text-lg font-black text-stone-900 mb-2">Remove Staff Member</h3>
                        <p className="text-sm font-medium text-stone-600 mb-5">
                            Are you sure you want to remove <span className="font-black text-stone-800">{deleteTarget.firstName} {deleteTarget.lastName}</span>? This action cannot be undone.
                        </p>
                        <div className="flex items-center justify-end gap-3">
                            <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-bold text-stone-700 hover:bg-stone-50 transition-colors shadow-sm">
                                Cancel
                            </button>
                            <button onClick={confirmDelete} disabled={deleting} className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[13px] font-bold flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50">
                                {deleting && <Loader2 size={14} className="animate-spin" />}
                                Remove Staff
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Delete Modal */}
            {bulkDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl border border-stone-200 w-full max-w-md m-4 p-5">
                        <h3 className="text-lg font-black text-stone-900 mb-2">Remove Selected Staff</h3>
                        <p className="text-sm font-medium text-stone-600 mb-5">
                            Permanently remove {selected.size} selected staff member{selected.size === 1 ? '' : 's'}? This cannot be undone.
                        </p>
                        <div className="flex items-center justify-end gap-3">
                            <button onClick={() => setBulkDelete(false)} className="px-4 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-bold text-stone-700 hover:bg-stone-50 transition-colors shadow-sm">
                                Cancel
                            </button>
                            <button onClick={confirmBulkDelete} disabled={bulkDeleting} className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[13px] font-bold flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50">
                                {bulkDeleting && <Loader2 size={14} className="animate-spin" />}
                                Remove All
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
