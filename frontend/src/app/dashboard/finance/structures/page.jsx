"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Filter, Plus, Upload, Edit2, Trash2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Loader2, X, AlertCircle, DollarSign, FileSpreadsheet } from 'lucide-react';

const FREQUENCY_BADGES = {
    Monthly: 'bg-blue-50 text-blue-700',
    Quarterly: 'bg-purple-50 text-purple-700',
    Annually: 'bg-green-50 text-green-700',
    'One-Time': 'bg-orange-50 text-orange-700',
    'Bi-Annually': 'bg-stone-50 text-stone-700',
};

const FREQUENCIES = ['Monthly', 'Quarterly', 'Annually', 'Bi-Annually', 'One-Time'];

function formatCurrency(amount) {
    if (amount == null) return '—';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

function formatDate(dateString) {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(dateString) {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString('en-US', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function getFrequencyBadge(freq) {
    return FREQUENCY_BADGES[freq] || 'bg-stone-100 text-stone-600';
}

export default function FeeStructuresPage() {
    const [structures, setStructures] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [filters, setFilters] = useState({ category: null, academicYear: null });
    const [sort, setSort] = useState({ key: 'createdAt', dir: 'desc' });
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(() => {
        if (typeof window !== 'undefined') {
            return parseInt(localStorage.getItem('feeStructuresPerPage')) || 10;
        }
        return 10;
    });
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({ className: '', academicYear: '', category: '', amount: '', frequency: 'Monthly', dueDay: 1 });
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState(null);
    const [classesList, setClassesList] = useState([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState(null);
    const [showImportModal, setShowImportModal] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 350);
        return () => clearTimeout(timer);
    }, [search]);

    // Fetch structures
    const fetchStructures = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            let url = `http://localhost:5000/api/admin/fee-structures?page=${page}&limit=${perPage}&search=${debouncedSearch}`;
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            if (data.success) {
                setStructures(data.data);
                setTotal(data.total);
            } else {
                throw new Error(data.message || 'Failed to fetch');
            }
        } catch (err) {
            setError(err.message);
            setStructures([]);
            setTotal(0);
        }
        setLoading(false);
    }, [page, perPage, debouncedSearch]);

    useEffect(() => { fetchStructures(); }, [fetchStructures]);

    // Fetch classes for modal select
    const fetchClasses = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/admin/classes?limit=1000', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success) setClassesList(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch classes', err);
        }
    }, []);

    // Derive unique filter options from data
    const filterOptions = useMemo(() => {
        const categories = [...new Set(structures.map(s => s.category).filter(Boolean))];
        const years = [...new Set(structures.map(s => s.academicYear).filter(Boolean))];
        return { categories, years };
    }, [structures]);

    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const startItem = total === 0 ? 0 : (page - 1) * perPage + 1;
    const endItem = Math.min(page * perPage, total);
    const hasActiveFilters = filters.category !== null || filters.academicYear !== null;

    // Apply client-side filters (on top of server search)
    const filteredStructures = useMemo(() => {
        let result = [...structures];
        if (filters.category) {
            result = result.filter(s => s.category === filters.category);
        }
        if (filters.academicYear) {
            result = result.filter(s => s.academicYear === filters.academicYear);
        }
        // Client-side sort
        result.sort((a, b) => {
            let cmp = 0;
            switch (sort.key) {
                case 'className': cmp = (a.className || '').localeCompare(b.className || ''); break;
                case 'academicYear': cmp = (a.academicYear || '').localeCompare(b.academicYear || ''); break;
                case 'category': cmp = (a.category || '').localeCompare(b.category || ''); break;
                case 'amount': cmp = (a.amount || 0) - (b.amount || 0); break;
                case 'frequency': cmp = (a.frequency || '').localeCompare(b.frequency || ''); break;
                case 'dueDay': cmp = (a.dueDay || 0) - (b.dueDay || 0); break;
                case 'createdAt': cmp = new Date(a.createdAt || 0) - new Date(b.createdAt || 0); break;
                case 'updatedAt': cmp = new Date(a.updatedAt || 0) - new Date(b.updatedAt || 0); break;
            }
            return sort.dir === 'asc' ? cmp : -cmp;
        });
        return result;
    }, [structures, filters, sort]);

    const handleSort = (key) => {
        setSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));
    };

    const toggleFilter = (type, value) => {
        setFilters(prev => ({ ...prev, [type]: prev[type] === value ? null : value }));
        setPage(1);
    };

    const clearFilters = () => {
        setFilters({ category: null, academicYear: null });
        setPage(1);
    };

    const SortIcon = ({ columnKey }) => {
        if (sort.key !== columnKey) return <ChevronDown size={12} className="text-stone-400 opacity-0 group-hover:opacity-100" strokeWidth={3} />;
        return sort.dir === 'asc'
            ? <ChevronUp size={12} style={{ color: 'var(--orange)' }} strokeWidth={3} />
            : <ChevronDown size={12} style={{ color: 'var(--orange)' }} strokeWidth={3} />;
    };

    const openAddModal = () => {
        setEditingItem(null);
        setFormData({ className: '', academicYear: '', category: '', amount: '', frequency: 'Monthly', dueDay: 1 });
        setFormError(null);
        fetchClasses();
        setShowModal(true);
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        setFormData({
            className: item.className,
            academicYear: item.academicYear,
            category: item.category,
            amount: item.amount,
            frequency: item.frequency,
            dueDay: item.dueDay
        });
        setFormError(null);
        fetchClasses();
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingItem(null);
        setFormError(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'amount' || name === 'dueDay' ? Number(value) : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setFormError(null);
        try {
            const token = localStorage.getItem('token');
            const url = editingItem
                ? `http://localhost:5000/api/admin/fee-structures/${editingItem._id}`
                : 'http://localhost:5000/api/admin/fee-structures';
            const method = editingItem ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || 'Failed to save');
            closeModal();
            fetchStructures();
        } catch (err) {
            setFormError(err.message);
        }
        setSubmitting(false);
    };

    const openDeleteModal = (id) => {
        setDeletingId(id);
        setDeleteError(null);
        setShowDeleteModal(true);
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setDeletingId(null);
        setDeleteError(null);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingId) return;
        setDeleting(true);
        setDeleteError(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/admin/fee-structures/${deletingId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || 'Failed to delete');
            closeDeleteModal();
            fetchStructures();
        } catch (err) {
            setDeleteError(err.message);
        }
        setDeleting(false);
    };

    const handlePerPageChange = (val) => {
        setPerPage(val);
        localStorage.setItem('feeStructuresPerPage', val.toString());
        setPage(1);
    };

    const handleImport = async () => {
        if (!importFile) return;
        setImporting(true);
        setImportResult(null);
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('file', importFile);
            const res = await fetch('http://localhost:5000/api/admin/fee-structures/import', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();
            setImportResult(data);
            if (data.success) {
                fetchStructures();
            }
        } catch (err) {
            setImportResult({ success: false, message: err.message });
        }
        setImporting(false);
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

    const FilterChip = ({ label, onRemove }) => (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
            {label}
            <button onClick={onRemove} className="hover:text-orange-900"><X size={12} /></button>
        </span>
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-5 rounded-full" style={{ backgroundColor: 'var(--orange)' }}></div>
                        <h1 className="text-xl font-bold text-stone-900 tracking-tight">Fee Structures</h1>
                    </div>
                    <p className="text-sm text-stone-500 font-medium pl-3.5">
                        <span className="font-bold" style={{ color: 'var(--orange)' }}>{total}</span> structures defined
                    </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button onClick={() => { setImportResult(null); setImportFile(null); setShowImportModal(true); }} className="flex items-center gap-1.5 py-2 px-4 text-sm font-semibold rounded-xl border border-stone-300 bg-white text-stone-600 hover:border-stone-400 hover:bg-stone-50 transition-all shadow-sm">
                        <Upload size={16} /> Import
                    </button>
                    <button onClick={openAddModal} className="flex items-center gap-1.5 py-2 px-5 text-sm font-semibold rounded-xl text-white transition-all shadow-sm hover:opacity-90" style={{ backgroundColor: '#111' }}>
                        <Plus size={16} strokeWidth={3} /> Add Structure
                    </button>
                </div>
            </div>

            {/* Main Table Card */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                {/* Search & Filter Bar */}
                <div className="px-3 py-3 border-b border-stone-100 bg-white">
                    <div className="flex items-center gap-2">
                        <div className="relative group flex-1 max-w-xs">
                            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-stone-400 group-focus-within:text-orange">
                                <Search size={14} strokeWidth={2.5} />
                            </div>
                            <input
                                type="text"
                                className="block rounded-lg border border-stone-200 bg-white pl-8 pr-7 py-1.5 text-sm text-stone-800 shadow-sm transition-all focus:outline-none focus:ring-2 w-full"
                                placeholder="Search by class or category..."
                                style={{ '--tw-ring-color': 'rgba(255, 153, 51, 0.2)' }}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowFilterPanel(!showFilterPanel)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold border transition-all whitespace-nowrap ${
                                hasActiveFilters
                                    ? 'bg-orange-50 text-orange-700 border-orange-200'
                                    : 'bg-white text-stone-600 border-[#E8E0D4] hover:border-[#C8BEB4]'
                            }`}
                        >
                            <Filter size={14} strokeWidth={2.5} /> Filters
                            {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
                        </button>
                        {hasActiveFilters && (
                            <button onClick={clearFilters} className="text-xs font-semibold text-stone-400 hover:text-stone-600 transition-colors whitespace-nowrap">
                                Clear all
                            </button>
                        )}
                    </div>
                    {hasActiveFilters && (
                        <div className="flex items-center gap-2 mt-2 ml-1">
                            {filters.category && (
                                <FilterChip label={`Category: ${filters.category}`} onRemove={() => toggleFilter('category', filters.category)} />
                            )}
                            {filters.academicYear && (
                                <FilterChip label={`Year: ${filters.academicYear}`} onRemove={() => toggleFilter('academicYear', filters.academicYear)} />
                            )}
                        </div>
                    )}
                    {showFilterPanel && (
                        <div className="mt-3 pt-3 border-t border-stone-100">
                            {filterOptions.categories.length > 0 && (
                                <div className="mb-3">
                                    <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-2">Category</span>
                                    <div className="flex gap-1.5 flex-wrap">
                                        {filterOptions.categories.map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => toggleFilter('category', cat)}
                                                className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                                                    filters.category === cat
                                                        ? 'bg-orange-50 text-orange-700 border-orange-200'
                                                        : 'bg-white text-stone-500 border-stone-200 hover:border-stone-300'
                                                }`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {filterOptions.years.length > 0 && (
                                <div>
                                    <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-2">Academic Year</span>
                                    <div className="flex gap-1.5 flex-wrap">
                                        {filterOptions.years.map(yr => (
                                            <button
                                                key={yr}
                                                onClick={() => toggleFilter('academicYear', yr)}
                                                className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                                                    filters.academicYear === yr
                                                        ? 'bg-orange-50 text-orange-700 border-orange-200'
                                                        : 'bg-white text-stone-500 border-stone-200 hover:border-stone-300'
                                                }`}
                                            >
                                                {yr}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {filterOptions.categories.length === 0 && filterOptions.years.length === 0 && (
                                <p className="text-xs text-stone-400 py-2">No filter options available.</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Error State */}
                {error && (
                    <div className="flex flex-col items-center justify-center py-12 px-4">
                        <AlertCircle size={40} className="text-red-300 mb-3" />
                        <p className="text-sm font-semibold text-stone-600 mb-3">{error}</p>
                        <button onClick={fetchStructures} className="px-4 py-2 rounded-lg text-sm font-semibold bg-stone-900 text-white hover:opacity-90 transition-all">
                            Try Again
                        </button>
                    </div>
                )}

                {/* Empty State */}
                {!error && !loading && filteredStructures.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 px-4">
                        <DollarSign size={40} className="text-stone-300 mb-3" />
                        {debouncedSearch || hasActiveFilters ? (
                            <>
                                <p className="text-sm font-semibold text-stone-600 mb-1">No fee structures match your search</p>
                                <p className="text-xs text-stone-400">Try different search terms or clear filters</p>
                            </>
                        ) : (
                            <>
                                <p className="text-sm font-semibold text-stone-600 mb-1">No fee structures yet</p>
                                <p className="text-xs text-stone-400 mb-4">Add your first fee structure to get started</p>
                                <button onClick={openAddModal} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all" style={{ backgroundColor: '#111' }}>
                                    <Plus size={14} /> Add Structure
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* Table */}
                {!error && (loading || filteredStructures.length > 0) && (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px]">
                            <thead>
                                <tr className="bg-white border-b border-stone-200 text-left">
                                    <th className="w-12 py-4 pl-5 pr-2">
                                        <div className="w-4 h-4 rounded border-2 border-stone-300" />
                                    </th>
                                    <th className="py-4 px-3">
                                        <button onClick={() => handleSort('className')} className="flex items-center gap-1.5 group text-xs font-bold text-stone-700 hover:text-stone-900 transition-colors">
                                            Class <SortIcon columnKey="className" />
                                        </button>
                                    </th>
                                    <th className="py-4 px-3">
                                        <button onClick={() => handleSort('academicYear')} className="flex items-center gap-1.5 group text-xs font-bold text-stone-700 hover:text-stone-900 transition-colors">
                                            Academic Year <SortIcon columnKey="academicYear" />
                                        </button>
                                    </th>
                                    <th className="py-4 px-3">
                                        <button onClick={() => handleSort('category')} className="flex items-center gap-1.5 group text-xs font-bold text-stone-700 hover:text-stone-900 transition-colors">
                                            Category <SortIcon columnKey="category" />
                                        </button>
                                    </th>
                                    <th className="py-4 px-3">
                                        <button onClick={() => handleSort('amount')} className="flex items-center gap-1.5 group text-xs font-bold text-stone-700 hover:text-stone-900 transition-colors">
                                            Amount <SortIcon columnKey="amount" />
                                        </button>
                                    </th>
                                    <th className="py-4 px-3">
                                        <button onClick={() => handleSort('frequency')} className="flex items-center gap-1.5 group text-xs font-bold text-stone-700 hover:text-stone-900 transition-colors">
                                            Frequency <SortIcon columnKey="frequency" />
                                        </button>
                                    </th>
                                    <th className="py-4 px-3">
                                        <button onClick={() => handleSort('dueDay')} className="flex items-center gap-1.5 group text-xs font-bold text-stone-700 hover:text-stone-900 transition-colors">
                                            Due Day <SortIcon columnKey="dueDay" />
                                        </button>
                                    </th>
                                    <th className="py-4 px-3">
                                        <button onClick={() => handleSort('createdAt')} className="flex items-center gap-1.5 group text-xs font-bold text-stone-700 hover:text-stone-900 transition-colors">
                                            Created At <SortIcon columnKey="createdAt" />
                                        </button>
                                    </th>
                                    <th className="py-4 px-3 pr-5">
                                        <button onClick={() => handleSort('updatedAt')} className="flex items-center gap-1.5 group text-xs font-bold text-stone-700 hover:text-stone-900 transition-colors">
                                            Updated At <SortIcon columnKey="updatedAt" />
                                        </button>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan="9" className="py-8 text-center">
                                            <div className="flex items-center justify-center gap-2 text-sm text-stone-400">
                                                <Loader2 size={16} className="animate-spin" />
                                                Loading fee structures...
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStructures.map((struct) => (
                                        <tr
                                            key={struct._id}
                                            onClick={() => openEditModal(struct)}
                                            className="group transition-all duration-100 cursor-pointer hover:bg-stone-50/70"
                                        >
                                            <td className="w-12 py-3 pl-5 pr-2" onClick={e => e.stopPropagation()}>
                                                <div className="w-4 h-4 rounded border-2 border-stone-300" />
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className="text-sm font-black text-stone-800 group-hover:text-stone-900">{struct.className}</span>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className="text-xs font-semibold text-stone-500">{struct.academicYear}</span>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className="text-sm font-semibold text-stone-600">{struct.category}</span>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className="text-sm font-black text-stone-800">{formatCurrency(struct.amount)}</span>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${getFrequencyBadge(struct.frequency)}`}>
                                                    {struct.frequency}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className="text-xs font-semibold text-stone-500">{struct.dueDay}</span>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className="text-xs text-stone-400 font-medium whitespace-nowrap">{formatDateTime(struct.createdAt)}</span>
                                            </td>
                                            <td className="py-3 px-3 pr-5">
                                                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                                    <span className="text-xs text-stone-400 font-medium whitespace-nowrap flex-1">
                                                        {struct.updatedAt && struct.createdAt && new Date(struct.updatedAt).getTime() === new Date(struct.createdAt).getTime() ? '—' : formatDateTime(struct.updatedAt)}
                                                    </span>
                                                    <button onClick={() => openEditModal(struct)} className="p-1 text-stone-400 hover:text-orange-500 transition-colors opacity-0 group-hover:opacity-100" title="Edit">
                                                        <Edit2 size={13} strokeWidth={2.5} />
                                                    </button>
                                                    <button onClick={() => openDeleteModal(struct._id)} className="p-1 text-stone-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100" title="Delete">
                                                        <Trash2 size={13} strokeWidth={2.5} />
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

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={closeModal}>
                    <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-stone-900">{editingItem ? 'Edit Fee Structure' : 'Add Fee Structure'}</h2>
                            <button onClick={closeModal} className="p-1 text-stone-400 hover:text-stone-600 transition-colors"><X size={20} /></button>
                        </div>
                        {formError && (
                            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm font-medium text-red-700">{formError}</div>
                        )}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-stone-700 mb-1">Class Name</label>
                                <select name="className" value={formData.className} onChange={handleChange} required
                                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500">
                                    <option value="">Select Class</option>
                                    {classesList.map(cls => (
                                        <option key={cls._id} value={cls.name}>{cls.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-stone-700 mb-1">Academic Year</label>
                                <input type="text" name="academicYear" value={formData.academicYear} onChange={handleChange} required
                                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-stone-700 mb-1">Category</label>
                                <input type="text" name="category" value={formData.category} onChange={handleChange} required
                                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-stone-700 mb-1">Amount (₹)</label>
                                <input type="number" name="amount" value={formData.amount} onChange={handleChange} required min="0"
                                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-stone-700 mb-1">Frequency</label>
                                <select name="frequency" value={formData.frequency} onChange={handleChange}
                                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500">
                                    {FREQUENCIES.map(f => (
                                        <option key={f} value={f}>{f}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-stone-700 mb-1">Due Day (1-31)</label>
                                <input type="number" name="dueDay" value={formData.dueDay} onChange={handleChange} min="1" max="31" required
                                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" />
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg text-sm font-semibold bg-stone-200 text-stone-700 hover:bg-stone-300 transition-colors">Cancel</button>
                                <button type="submit" disabled={submitting} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed" style={{ backgroundColor: '#FF9F43' }}>
                                    {submitting && <Loader2 size={14} className="animate-spin" />}
                                    {editingItem ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={closeDeleteModal}>
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                                <Trash2 size={18} className="text-red-500" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-stone-900">Delete Fee Structure</h2>
                                <p className="text-sm text-stone-500">This action cannot be undone.</p>
                            </div>
                        </div>
                        {deleteError && (
                            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm font-medium text-red-700">{deleteError}</div>
                        )}
                        <p className="text-sm text-stone-600 mb-6">Are you sure you want to delete this fee structure?</p>
                        <div className="flex items-center justify-end gap-2">
                            <button onClick={closeDeleteModal} className="px-4 py-2 rounded-lg text-sm font-semibold bg-stone-200 text-stone-700 hover:bg-stone-300 transition-colors">Cancel</button>
                            <button onClick={handleDeleteConfirm} disabled={deleting} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                                {deleting && <Loader2 size={14} className="animate-spin" />}
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setShowImportModal(false)}>
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-stone-900">Import Fee Structures</h2>
                            <button onClick={() => setShowImportModal(false)} className="p-1 text-stone-400 hover:text-stone-600 transition-colors"><X size={20} /></button>
                        </div>
                        {importResult ? (
                            <div>
                                {importResult.success ? (
                                    <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-sm font-medium text-green-700">
                                        Successfully imported {importResult.count} fee structures.
                                        {importResult.errors?.length > 0 && (
                                            <div className="mt-2 text-xs text-red-600">
                                                {importResult.errors.length} rows failed: {importResult.errors.map(e => `Row ${e.row}: ${e.message}`).join(', ')}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm font-medium text-red-700">{importResult.message || 'Import failed'}</div>
                                )}
                                <button onClick={() => setShowImportModal(false)} className="w-full py-2 rounded-lg text-sm font-semibold bg-stone-200 text-stone-700 hover:bg-stone-300 transition-colors">Close</button>
                            </div>
                        ) : (
                            <div>
                                <p className="text-sm text-stone-600 mb-4">Upload a CSV or Excel file with fee structure data. Required columns: className, category, amount.</p>
                                <label className="block mb-4">
                                    <div className="flex items-center justify-center p-6 border-2 border-dashed border-stone-200 rounded-xl cursor-pointer hover:border-orange-300 hover:bg-orange-50/30 transition-all">
                                        <div className="text-center">
                                            <FileSpreadsheet size={32} className="mx-auto mb-2 text-stone-300" />
                                            <p className="text-sm font-semibold text-stone-600">{importFile ? importFile.name : 'Click to select file'}</p>
                                            <p className="text-xs text-stone-400 mt-1">CSV, XLSX, or XLS (max 10MB)</p>
                                        </div>
                                        <input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => setImportFile(e.target.files[0])} className="hidden" />
                                    </div>
                                </label>
                                <div className="flex items-center justify-end gap-2">
                                    <button onClick={() => setShowImportModal(false)} className="px-4 py-2 rounded-lg text-sm font-semibold bg-stone-200 text-stone-700 hover:bg-stone-300 transition-colors">Cancel</button>
                                    <button onClick={handleImport} disabled={!importFile || importing} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-stone-900 hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                                        {importing && <Loader2 size={14} className="animate-spin" />}
                                        Import
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}