"use client";

import { useState, useEffect } from 'react';
import { Search, Filter, Plus, Upload, Edit2, ChevronDown, Square, ChevronLeft, ChevronRight, Loader2, X, Trash2 } from 'lucide-react';

export default function FeeStructuresPage() {
    const [structures, setStructures] = useState([]);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    
    // Pagination state
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [classesList, setClassesList] = useState([]);
    const [formData, setFormData] = useState({ className: '', academicYear: '', category: '', amount: '', frequency: 'Monthly', dueDay: 1 });

    const fetchStructures = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/admin/fee-structures?page=${page}&limit=${limit}&search=${search}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setStructures(data.data);
                    setTotal(data.total);
                }
            }
        } catch (error) {
            console.error("Failed to fetch fee structures", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchStructures();
    }, [page, limit, search]);

    const fetchClasses = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/admin/classes?limit=1000', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success) setClassesList(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch classes", error);
        }
    };

    const openAddModal = () => {
        setEditingItem(null);
        setFormData({ className: '', academicYear: '', category: '', amount: '', frequency: 'Monthly', dueDay: 1 });
        fetchClasses();
        setShowModal(true);
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        setFormData({ className: item.className, academicYear: item.academicYear, category: item.category, amount: item.amount, frequency: item.frequency, dueDay: item.dueDay });
        fetchClasses();
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingItem(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'amount' || name === 'dueDay' ? Number(value) : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
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
            if (res.ok) {
                closeModal();
                fetchStructures();
            }
        } catch (error) {
            console.error('Failed to save fee structure', error);
        }
        setSubmitting(false);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this fee structure?')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/admin/fee-structures/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchStructures();
        } catch (error) {
            console.error('Failed to delete fee structure', error);
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '—';
        const date = new Date(dateString);
        return date.toLocaleString('en-US', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    };

    const formatCurrency = (amount) => {
        if (amount == null) return '—';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
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
                        <h1 className="text-xl font-bold text-stone-900 tracking-tight">Fee Structures</h1>
                    </div>
                    <p className="text-sm text-stone-500 font-medium pl-3.5">
                        <span className="font-bold" style={{ color: 'var(--orange)' }}>{total}</span> structures defined
                    </p>
                </div>
                
                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button className="flex items-center gap-1.5 py-2 px-4 text-sm font-semibold rounded-xl border border-stone-300 bg-white text-stone-600 hover:border-stone-400 hover:bg-stone-50 transition-all shadow-sm">
                        <Upload size={16} /> Import
                    </button>
                    <button onClick={openAddModal} className="flex items-center gap-1.5 py-2 px-5 text-sm font-semibold rounded-xl text-white transition-all shadow-sm" style={{ backgroundColor: '#111' }}>
                        <Plus size={16} strokeWidth={3} /> Add Structure
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
                            className="block rounded-lg border border-stone-200 bg-white pl-8 pr-7 py-1.5 text-sm text-stone-800 shadow-sm transition-all focus:outline-none focus:ring-2 w-52" 
                            placeholder="Search..." 
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
                                    <span className="text-xs font-bold text-stone-700">Class</span>
                                </th>
                                <th className="py-4 px-3">
                                    <span className="text-xs font-bold text-stone-700">Academic Year</span>
                                </th>
                                <th className="py-4 px-3">
                                    <span className="text-xs font-bold text-stone-700">Category</span>
                                </th>
                                <th className="py-4 px-3">
                                    <button className="flex items-center gap-1.5 group text-xs font-bold text-stone-700 hover:text-stone-900 transition-colors">
                                        Amount <ChevronDown size={12} className="text-stone-400 opacity-0 group-hover:opacity-100" strokeWidth={3} />
                                    </button>
                                </th>
                                <th className="py-4 px-3">
                                    <button className="flex items-center gap-1.5 group text-xs font-bold text-stone-700 hover:text-stone-900 transition-colors">
                                        Frequency <ChevronDown size={12} className="text-stone-400 opacity-0 group-hover:opacity-100" strokeWidth={3} />
                                    </button>
                                </th>
                                <th className="py-4 px-3">
                                    <button className="flex items-center gap-1.5 group text-xs font-bold text-stone-700 hover:text-stone-900 transition-colors">
                                        Due Day <ChevronDown size={12} className="text-stone-400 opacity-0 group-hover:opacity-100" strokeWidth={3} />
                                    </button>
                                </th>
                                <th className="py-4 px-3">
                                    <button className="flex items-center gap-1.5 group text-xs font-bold text-stone-700 hover:text-stone-900 transition-colors">
                                        Created At <ChevronDown size={12} style={{ color: 'var(--orange)' }} strokeWidth={3} />
                                    </button>
                                </th>
                                <th className="py-4 px-3 pr-5">
                                    <button className="flex items-center gap-1.5 group text-xs font-bold text-stone-700 hover:text-stone-900 transition-colors">
                                        Updated At <ChevronDown size={12} className="text-stone-400 opacity-0 group-hover:opacity-100" strokeWidth={3} />
                                    </button>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-50">
                            {loading ? (
                                <tr><td colSpan="9" className="py-6 text-center text-sm text-stone-500">Loading structures...</td></tr>
                            ) : structures.length === 0 ? (
                                <tr><td colSpan="9" className="py-6 text-center text-sm text-stone-500">No fee structures found</td></tr>
                            ) : (
                                structures.map((struct) => (
                                    <tr key={struct._id} className="group transition-all duration-100 cursor-pointer hover:bg-stone-50/70">
                                        <td className="w-16 py-3 pl-5 pr-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 rounded border-2 flex items-center justify-center transition-all cursor-pointer flex-shrink-0 border-stone-300 bg-white hover:border-orange"></div>
                                                    <button onClick={() => openEditModal(struct)} className="flex items-center justify-center w-5 h-5 rounded text-stone-400 hover:text-stone-600 transition-all flex-shrink-0" title="Edit">
                                                        <Edit2 size={13} strokeWidth={2.5} />
                                                    </button>
                                                    <button onClick={() => handleDelete(struct._id)} className="flex items-center justify-center w-5 h-5 rounded text-stone-400 hover:text-red-500 transition-all flex-shrink-0" title="Delete">
                                                        <Trash2 size={13} strokeWidth={2.5} />
                                                    </button>
                                                </div>
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
                                            <span className="text-xs font-semibold text-stone-500">{struct.frequency}</span>
                                        </td>
                                        <td className="py-3 px-3">
                                            <span className="text-xs font-semibold text-stone-500">{struct.dueDay}</span>
                                        </td>
                                        <td className="py-3 px-3">
                                            <span className="text-xs text-stone-400 font-medium whitespace-nowrap">{formatDateTime(struct.createdAt)}</span>
                                        </td>
                                        <td className="py-3 px-3 pr-5">
                                            <span className="text-xs text-stone-400 font-medium whitespace-nowrap">{formatDateTime(struct.updatedAt) === formatDateTime(struct.createdAt) ? '—' : formatDateTime(struct.updatedAt)}</span>
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

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={closeModal}>
                    <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-stone-900">{editingItem ? 'Edit Fee Structure' : 'Add Fee Structure'}</h2>
                            <button onClick={closeModal} className="p-1 text-stone-400 hover:text-stone-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
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
                                <label className="block text-sm font-semibold text-stone-700 mb-1">Amount</label>
                                <input type="number" name="amount" value={formData.amount} onChange={handleChange} required min="0"
                                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-stone-700 mb-1">Frequency</label>
                                <select name="frequency" value={formData.frequency} onChange={handleChange}
                                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500">
                                    <option value="Monthly">Monthly</option>
                                    <option value="Quarterly">Quarterly</option>
                                    <option value="Annually">Annually</option>
                                    <option value="Bi-Annually">Bi-Annually</option>
                                    <option value="One-Time">One-Time</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-stone-700 mb-1">Due Day (1-31)</label>
                                <input type="number" name="dueDay" value={formData.dueDay} onChange={handleChange} min="1" max="31" required
                                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" />
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg text-sm font-semibold bg-stone-200 text-stone-700 hover:bg-stone-300 transition-colors">Cancel</button>
                                <button type="submit" disabled={submitting} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors" style={{ backgroundColor: '#FF9F43' }}>
                                    {submitting && <Loader2 size={14} className="animate-spin" />}
                                    {editingItem ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
