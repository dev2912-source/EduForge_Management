"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, Plus, Edit2, Trash2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Loader2, X, AlertCircle, Layers, Users } from 'lucide-react';

const MEDIUM_COLORS = {
    ENGLISH: 'bg-emerald-50 text-emerald-700',
    GUJARATI: 'bg-cyan-50 text-cyan-700',
    HINDI: 'bg-green-50 text-green-700',
    MARATHI: 'bg-teal-50 text-teal-700',
};

const MEDIUMS = ['ENGLISH', 'HINDI', 'MARATHI', 'GUJARATI'];

function getMediumBadge(medium) {
    const cls = MEDIUM_COLORS[(medium || '').toUpperCase()];
    return cls || 'bg-stone-100 text-stone-600';
}

function formatDate(dateString) {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function ClassesPage() {
    const router = useRouter();
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [filters, setFilters] = useState({ sections: null, students: null });
    const [sort, setSort] = useState({ key: 'name', dir: 'asc' });
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(() => {
        if (typeof window !== 'undefined') {
            return parseInt(localStorage.getItem('classesPerPage')) || 10;
        }
        return 10;
    });
    const [showModal, setShowModal] = useState(false);
    const [editingClass, setEditingClass] = useState(null);
    const [formData, setFormData] = useState({ name: '', medium: 'ENGLISH', sections: 1 });
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingClass, setDeletingClass] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 350);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchClasses = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/admin/classes?search=${debouncedSearch}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            if (data.success) {
                setClasses(data.data);
            } else {
                throw new Error(data.message || 'Failed to fetch');
            }
        } catch (err) {
            setError(err.message);
            setClasses([]);
        }
        setLoading(false);
    }, [debouncedSearch]);

    useEffect(() => { fetchClasses(); }, [fetchClasses]);

    const filteredClasses = useMemo(() => {
        let result = [...classes];

        if (filters.sections === 'has') {
            result = result.filter(c => c.sections > 1);
        } else if (filters.sections === 'none') {
            result = result.filter(c => c.sections <= 1);
        }
        if (filters.students === 'has') {
            result = result.filter(c => (c.studentsCount || 0) > 0);
        } else if (filters.students === 'none') {
            result = result.filter(c => (c.studentsCount || 0) === 0);
        }

        result.sort((a, b) => {
            let cmp = 0;
            switch (sort.key) {
                case 'name': cmp = a.name.localeCompare(b.name); break;
                case 'medium': cmp = (a.medium || '').localeCompare(b.medium || ''); break;
                case 'sections': cmp = (a.sections || 0) - (b.sections || 0); break;
                case 'studentsCount': cmp = (a.studentsCount || 0) - (b.studentsCount || 0); break;
                case 'createdAt': cmp = new Date(a.createdAt || 0) - new Date(b.createdAt || 0); break;
            }
            return sort.dir === 'asc' ? cmp : -cmp;
        });

        return result;
    }, [classes, filters, sort]);

    const totalPages = Math.max(1, Math.ceil(filteredClasses.length / perPage));
    const paginatedClasses = filteredClasses.slice((page - 1) * perPage, page * perPage);
    const startItem = filteredClasses.length === 0 ? 0 : (page - 1) * perPage + 1;
    const endItem = Math.min(page * perPage, filteredClasses.length);
    const hasActiveFilters = filters.sections !== null || filters.students !== null;

    const handleSort = (key) => {
        setSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));
    };

    const toggleFilter = (type, value) => {
        setFilters(prev => ({ ...prev, [type]: prev[type] === value ? null : value }));
        setPage(1);
    };

    const clearFilters = () => {
        setFilters({ sections: null, students: null });
        setPage(1);
    };

    const SortIcon = ({ columnKey }) => {
        if (sort.key !== columnKey) return <ChevronDown size={12} className="text-stone-400 opacity-0 group-hover:opacity-100" strokeWidth={3} />;
        return sort.dir === 'asc'
            ? <ChevronUp size={12} style={{ color: 'var(--orange)' }} strokeWidth={3} />
            : <ChevronDown size={12} style={{ color: 'var(--orange)' }} strokeWidth={3} />;
    };

    const openAddModal = () => {
        setEditingClass(null);
        setFormData({ name: '', medium: 'ENGLISH', sections: 1 });
        setFormError(null);
        setShowModal(true);
    };

    const openEditModal = (cls) => {
        setEditingClass(cls);
        setFormData({ name: cls.name, medium: cls.medium, sections: cls.sections });
        setFormError(null);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingClass(null);
        setFormError(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'sections' ? Number(value) : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setFormError(null);
        try {
            const token = localStorage.getItem('token');
            const url = editingClass
                ? `http://localhost:5000/api/admin/classes/${editingClass._id}`
                : 'http://localhost:5000/api/admin/classes';
            const method = editingClass ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Failed to save class');
            }
            closeModal();
            fetchClasses();
        } catch (err) {
            setFormError(err.message);
        }
        setSubmitting(false);
    };

    const openDeleteModal = (cls) => {
        setDeletingClass(cls);
        setDeleteError(null);
        setShowDeleteModal(true);
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setDeletingClass(null);
        setDeleteError(null);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingClass) return;
        setDeleting(true);
        setDeleteError(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/admin/classes/${deletingClass._id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Failed to delete class');
            }
            closeDeleteModal();
            fetchClasses();
        } catch (err) {
            setDeleteError(err.message);
        }
        setDeleting(false);
    };

    const handlePerPageChange = (val) => {
        setPerPage(val);
        localStorage.setItem('classesPerPage', val.toString());
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
                        <h1 className="text-xl font-bold text-stone-900 tracking-tight">Classes & Sections</h1>
                    </div>
                    <p className="text-sm text-stone-500 font-medium pl-3.5">
                        <span className="font-bold" style={{ color: 'var(--orange)' }}>{filteredClasses.length}</span> classes
                        {hasActiveFilters && <span className="text-stone-400"> (filtered)</span>}
                    </p>
                </div>
                <button onClick={openAddModal} className="flex items-center gap-1.5 py-2 px-5 text-sm font-semibold rounded-xl text-white transition-all shadow-sm self-start sm:self-auto hover:opacity-90" style={{ backgroundColor: '#111' }}>
                    <Plus size={16} /> Add Class
                </button>
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
                                placeholder="Search classes..."
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
                            {filters.sections && (
                                <FilterChip
                                    label={`Sections: ${filters.sections === 'has' ? 'Has' : 'No'} Sections`}
                                    onRemove={() => toggleFilter('sections', filters.sections)}
                                />
                            )}
                            {filters.students && (
                                <FilterChip
                                    label={`Students: ${filters.students === 'has' ? 'Has' : 'No'} Students`}
                                    onRemove={() => toggleFilter('students', filters.students)}
                                />
                            )}
                        </div>
                    )}
                    {showFilterPanel && (
                        <div className="mt-3 pt-3 border-t border-stone-100 flex items-center gap-4 flex-wrap">
                            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Sections</span>
                            <div className="flex gap-1.5">
                                {['has', 'none'].map(val => (
                                    <button
                                        key={val}
                                        onClick={() => toggleFilter('sections', val)}
                                        className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                                            filters.sections === val
                                                ? 'bg-orange-50 text-orange-700 border-orange-200'
                                                : 'bg-white text-stone-500 border-stone-200 hover:border-stone-300'
                                        }`}
                                    >
                                        {val === 'has' ? 'Has Sections' : 'No Sections'}
                                    </button>
                                ))}
                            </div>
                            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-2">Students</span>
                            <div className="flex gap-1.5">
                                {['has', 'none'].map(val => (
                                    <button
                                        key={val}
                                        onClick={() => toggleFilter('students', val)}
                                        className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                                            filters.students === val
                                                ? 'bg-orange-50 text-orange-700 border-orange-200'
                                                : 'bg-white text-stone-500 border-stone-200 hover:border-stone-300'
                                        }`}
                                    >
                                        {val === 'has' ? 'Has Students' : 'No Students'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Error State */}
                {error && (
                    <div className="flex flex-col items-center justify-center py-12 px-4">
                        <AlertCircle size={40} className="text-red-300 mb-3" />
                        <p className="text-sm font-semibold text-stone-600 mb-3">{error}</p>
                        <button onClick={fetchClasses} className="px-4 py-2 rounded-lg text-sm font-semibold bg-stone-900 text-white hover:opacity-90 transition-all">
                            Try Again
                        </button>
                    </div>
                )}

                {/* Empty State */}
                {!error && !loading && filteredClasses.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 px-4">
                        <Layers size={40} className="text-stone-300 mb-3" />
                        {debouncedSearch || hasActiveFilters ? (
                            <>
                                <p className="text-sm font-semibold text-stone-600 mb-1">No classes match your search</p>
                                <p className="text-xs text-stone-400">Try different search terms or clear filters</p>
                            </>
                        ) : (
                            <>
                                <p className="text-sm font-semibold text-stone-600 mb-1">No classes yet</p>
                                <p className="text-xs text-stone-400 mb-4">Add your first class to get started</p>
                                <button onClick={openAddModal} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all" style={{ backgroundColor: '#111' }}>
                                    <Plus size={14} /> Add Class
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* Table */}
                {!error && (loading || filteredClasses.length > 0) && (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px]">
                            <thead>
                                <tr className="bg-white border-b border-stone-200 text-left">
                                    <th className="py-4 pl-5 pr-3">
                                        <button onClick={() => handleSort('name')} className="flex items-center gap-1.5 group text-xs font-bold text-stone-700 hover:text-stone-900 transition-colors">
                                            Class <SortIcon columnKey="name" />
                                        </button>
                                    </th>
                                    <th className="py-4 px-3">
                                        <button onClick={() => handleSort('medium')} className="flex items-center gap-1.5 group text-xs font-bold text-stone-700 hover:text-stone-900 transition-colors">
                                            Medium <SortIcon columnKey="medium" />
                                        </button>
                                    </th>
                                    <th className="py-4 px-3">
                                        <button onClick={() => handleSort('sections')} className="flex items-center gap-1.5 group text-xs font-bold text-stone-700 hover:text-stone-900 transition-colors">
                                            Sections <SortIcon columnKey="sections" />
                                        </button>
                                    </th>
                                    <th className="py-4 px-3">
                                        <button onClick={() => handleSort('studentsCount')} className="flex items-center gap-1.5 group text-xs font-bold text-stone-700 hover:text-stone-900 transition-colors">
                                            Students <SortIcon columnKey="studentsCount" />
                                        </button>
                                    </th>
                                    <th className="py-4 px-3">
                                        <button onClick={() => handleSort('createdAt')} className="flex items-center gap-1.5 group text-xs font-bold text-stone-700 hover:text-stone-900 transition-colors">
                                            Created At <SortIcon columnKey="createdAt" />
                                        </button>
                                    </th>
                                    <th className="py-4 pr-5 pl-3 text-right">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="py-8 text-center">
                                            <div className="flex items-center justify-center gap-2 text-sm text-stone-400">
                                                <Loader2 size={16} className="animate-spin" />
                                                Loading classes...
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedClasses.map((cls) => (
                                        <tr
                                            key={cls._id}
                                            onClick={() => router.push(`/dashboard/classes/${cls._id}`)}
                                            className="group transition-all duration-100 cursor-pointer hover:bg-stone-50/70"
                                        >
                                            <td className="py-3 pl-5 pr-3">
                                                <span className="text-sm font-black text-stone-800 group-hover:text-stone-900">{cls.name}</span>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${getMediumBadge(cls.medium)}`}>
                                                    {cls.medium}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className="text-sm font-semibold text-stone-600">{cls.sections}</span>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className="text-sm font-semibold text-stone-600">{cls.studentsCount || 0}</span>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className="text-xs text-stone-500 font-medium">{formatDate(cls.createdAt)}</span>
                                            </td>
                                            <td className="py-3 pr-5 pl-3 text-right" onClick={e => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => openEditModal(cls)} className="p-1.5 text-stone-400 hover:text-orange-500 transition-colors" title="Edit">
                                                        <Edit2 size={15} />
                                                    </button>
                                                    <button onClick={() => openDeleteModal(cls)} className="p-1.5 text-stone-400 hover:text-red-500 transition-colors" title="Delete">
                                                        <Trash2 size={15} />
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
                {!error && filteredClasses.length > 0 && (
                    <div className="px-4 py-3 border-t border-stone-100 bg-stone-50/30 flex items-center justify-between gap-3">
                        <span className="text-xs font-bold text-stone-500 whitespace-nowrap">
                            {startItem}–{endItem} of <span className="text-stone-800 font-black">{filteredClasses.length}</span>
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
                            <h2 className="text-lg font-bold text-stone-900">{editingClass ? 'Edit Class' : 'Add Class'}</h2>
                            <button onClick={closeModal} className="p-1 text-stone-400 hover:text-stone-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        {formError && (
                            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm font-medium text-red-700">
                                {formError}
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-stone-700 mb-1">Name</label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} required
                                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-stone-700 mb-1">Medium</label>
                                <select name="medium" value={formData.medium} onChange={handleChange}
                                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500">
                                    {MEDIUMS.map(m => (
                                        <option key={m} value={m}>{m.charAt(0) + m.slice(1).toLowerCase()}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-stone-700 mb-1">Sections (1-4)</label>
                                <input type="number" name="sections" value={formData.sections} onChange={handleChange} min="1" max="4" required
                                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" />
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg text-sm font-semibold bg-stone-200 text-stone-700 hover:bg-stone-300 transition-colors">Cancel</button>
                                <button type="submit" disabled={submitting} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed" style={{ backgroundColor: '#FF9F43' }}>
                                    {submitting && <Loader2 size={14} className="animate-spin" />}
                                    {editingClass ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && deletingClass && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={closeDeleteModal}>
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                                <Trash2 size={18} className="text-red-500" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-stone-900">Delete Class</h2>
                                <p className="text-sm text-stone-500">This action cannot be undone.</p>
                            </div>
                        </div>
                        {deleteError && (
                            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm font-medium text-red-700">
                                {deleteError}
                            </div>
                        )}
                        <p className="text-sm text-stone-600 mb-6">
                            Are you sure you want to delete <span className="font-bold">{deletingClass.name}</span>?
                        </p>
                        <div className="flex items-center justify-end gap-2">
                            <button type="button" onClick={closeDeleteModal} className="px-4 py-2 rounded-lg text-sm font-semibold bg-stone-200 text-stone-700 hover:bg-stone-300 transition-colors">Cancel</button>
                            <button type="button" onClick={handleDeleteConfirm} disabled={deleting} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                                {deleting && <Loader2 size={14} className="animate-spin" />}
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
