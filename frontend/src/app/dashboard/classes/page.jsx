"use client";

import { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit2, Trash2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ClassesPage() {
    const [classes, setClasses] = useState([]);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    
    // Pagination state
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const fetchClasses = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/admin/classes?search=${search}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setClasses(data.data);
                    setTotal(data.count);
                }
            }
        } catch (error) {
            console.error("Failed to fetch classes", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchClasses();
    }, [search]);

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const getMediumBadgeClass = (medium) => {
        const lower = (medium || '').toLowerCase();
        if (lower === 'english') return 'bg-emerald-50 text-emerald-700';
        if (lower === 'marathi') return 'bg-teal-50 text-teal-700';
        if (lower === 'hindi') return 'bg-green-50 text-green-700';
        if (lower === 'gujarati') return 'bg-cyan-50 text-cyan-700';
        return 'bg-stone-100 text-stone-600';
    };

    // Simple frontend pagination logic
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedClasses = classes.slice(startIndex, startIndex + limit);
    const startItem = total === 0 ? 0 : startIndex + 1;
    const endItem = Math.min(page * limit, total);

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
                        <span className="font-bold" style={{ color: 'var(--orange)' }}>{total}</span> classes
                    </p>
                </div>
                
                <button className="flex items-center gap-1.5 py-2 px-5 text-sm font-semibold rounded-xl text-white transition-all shadow-sm self-start sm:self-auto" style={{ backgroundColor: '#111' }}>
                    <Plus size={16} /> Add Class
                </button>
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
                            placeholder="Search classes..." 
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
                    <table className="w-full min-w-[700px]">
                        <thead>
                            <tr className="bg-white border-b border-stone-200 text-left">
                                <th className="py-4 pl-5 pr-3">
                                    <button className="flex items-center gap-1.5 group text-xs font-bold text-stone-700 hover:text-stone-900 transition-colors">
                                        Class <ChevronUp size={12} style={{ color: 'var(--orange)' }} strokeWidth={3} />
                                    </button>
                                </th>
                                <th className="py-4 px-3">
                                    <span className="text-xs font-bold text-stone-700">Medium</span>
                                </th>
                                <th className="py-4 px-3">
                                    <button className="flex items-center gap-1.5 group text-xs font-bold text-stone-700 hover:text-stone-900 transition-colors">
                                        Sections <ChevronDown size={12} className="text-stone-400 opacity-0 group-hover:opacity-100" strokeWidth={3} />
                                    </button>
                                </th>
                                <th className="py-4 px-3">
                                    <button className="flex items-center gap-1.5 group text-xs font-bold text-stone-700 hover:text-stone-900 transition-colors">
                                        Students <ChevronDown size={12} className="text-stone-400 opacity-0 group-hover:opacity-100" strokeWidth={3} />
                                    </button>
                                </th>
                                <th className="py-4 px-3">
                                    <button className="flex items-center gap-1.5 group text-xs font-bold text-stone-700 hover:text-stone-900 transition-colors">
                                        Created At <ChevronDown size={12} className="text-stone-400 opacity-0 group-hover:opacity-100" strokeWidth={3} />
                                    </button>
                                </th>
                                <th className="py-4 pr-5 pl-3 text-right">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-50">
                            {loading ? (
                                <tr><td colSpan="6" className="py-6 text-center text-sm text-stone-500">Loading classes...</td></tr>
                            ) : paginatedClasses.length === 0 ? (
                                <tr><td colSpan="6" className="py-6 text-center text-sm text-stone-500">No classes found</td></tr>
                            ) : (
                                paginatedClasses.map((cls) => (
                                    <tr key={cls._id} className="group transition-all duration-100 cursor-pointer hover:bg-stone-50/70">
                                        <td className="py-3 pl-5 pr-3">
                                            <span className="text-sm font-black text-stone-800 group-hover:text-stone-900">{cls.name}</span>
                                        </td>
                                        <td className="py-3 px-3">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${getMediumBadgeClass(cls.medium)}`}>
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
                                        <td className="py-3 pr-5 pl-3 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-1.5 text-stone-400 hover:text-orange-500 transition-colors" title="Edit">
                                                    <Edit2 size={15} />
                                                </button>
                                                <button className="p-1.5 text-stone-400 hover:text-red-500 transition-colors" title="Delete">
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
                                className="p-1.5 rounded-lg border border-stone-200 bg-white text-stone-400 hover:text-orange-500 hover:border-orange-300 hover:bg-orange-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            
                            {Array.from({ length: Math.min(3, totalPages) }).map((_, idx) => {
                                let p = page;
                                if (page === 1) p = idx + 1;
                                else if (page === totalPages && totalPages >= 3) p = totalPages - 2 + idx;
                                else p = page - 1 + idx;
                                
                                if (p > totalPages) return null;
                                
                                return (
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
                                );
                            })}
                            
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

            </div>
        </div>
    );
}
