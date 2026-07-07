"use client";

import { useState, useEffect } from 'react';
import { Search, Filter, FileText, Loader2, RotateCcw, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function TrashPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [actionLoading, setActionLoading] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const limit = 10;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";

    const fetchTrash = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({ page, limit, ...(search && { search }) });
            const res = await fetch(`/api/admin/trash?${queryParams}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const list = Array.isArray(data) ? data : (data.data || []);
                setItems(list);
                setTotal(data.total || list.length);
                setTotalPages(data.pages || 1);
            }
        } catch (_) {}
        setLoading(false);
    };

    useEffect(() => {
        const timer = setTimeout(fetchTrash, 300);
        return () => clearTimeout(timer);
    }, [page, search, token]);

    const handleRestore = async (id) => {
        setActionLoading(id);
        try {
            const res = await fetch(`/api/admin/trash/restore/${id}`, {
                method: "PUT",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) fetchTrash();
        } catch (_) {}
        setActionLoading(null);
    };

    const handlePermanentDelete = async (id) => {
        setConfirmDelete(null);
        setActionLoading(id);
        try {
            const res = await fetch(`/api/admin/trash/permanent/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) fetchTrash();
        } catch (_) {}
        setActionLoading(null);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-4 max-w-7xl mx-auto">
            
            {/* Header Card */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-5 rounded-full" style={{ backgroundColor: 'var(--orange)' }}></div>
                    <h1 className="text-xl font-bold text-stone-900 tracking-tight">Trash</h1>
                </div>
                <div className="pl-3.5 flex items-center gap-1.5">
                    <span className="text-[13px] font-medium text-stone-500">
                        <span className="font-bold text-orange-500">{total}</span> trashed records — restore or permanently delete
                    </span>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm min-h-[500px] flex flex-col">
                
                {/* Search & Filter Bar */}
                <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-end gap-3 bg-white">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400 group-focus-within:text-orange">
                            <Search size={14} strokeWidth={2.5} />
                        </div>
                        <input 
                            type="text" 
                            className="block rounded-lg border border-stone-200 bg-white pl-9 pr-7 py-2 text-sm text-stone-800 shadow-sm transition-all focus:outline-none focus:ring-2 w-[240px]" 
                            placeholder="Search trash..." 
                            style={{ '--tw-ring-color': 'rgba(255, 153, 51, 0.2)' }}
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        />
                    </div>
                    <div className="relative flex-shrink-0">
                        <button type="button" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold border transition-all whitespace-nowrap bg-white text-stone-600 border-[#E8E0D4] hover:border-[#C8BEB4]">
                            <Filter size={14} strokeWidth={2.5} /> Filters
                        </button>
                    </div>
                </div>
                
                {/* Table or Empty State */}
                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="animate-spin" size={48} style={{ color: 'var(--orange)' }} />
                    </div>
                ) : items.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8">
                        <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mb-4 border border-stone-200 text-stone-300">
                            <FileText size={32} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-stone-500 font-bold text-lg mb-1">Trash is Empty</h3>
                        <p className="text-stone-400 text-sm font-medium">Deleted records will show up here.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-stone-200 bg-stone-50/50">
                                        <th className="py-4 pl-5 pr-3 font-black text-[12px] text-stone-800">Name</th>
                                        <th className="py-4 px-3 font-black text-[12px] text-stone-800">School ID</th>
                                        <th className="py-4 px-3 font-black text-[12px] text-stone-800">Role</th>
                                        <th className="py-4 px-3 font-black text-[12px] text-stone-800">Deleted At</th>
                                        <th className="py-4 pr-5 pl-3 font-black text-[12px] text-stone-800 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {items.map((item) => (
                                        <tr key={item._id} className="hover:bg-stone-50/50 transition-colors group">
                                            <td className="py-4 pl-5 pr-3">
                                                <span className="font-bold text-[13px] text-stone-800">{item.name || "—"}</span>
                                            </td>
                                            <td className="py-4 px-3">
                                                <span className="font-bold text-[12px] text-stone-500 font-mono">{item.schoolId || item.profile?.rollNumber || "—"}</span>
                                            </td>
                                            <td className="py-4 px-3">
                                                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-stone-100 text-stone-600">
                                                    {item.role || "—"}
                                                </span>
                                            </td>
                                            <td className="py-4 px-3">
                                                <span className="text-[12px] font-medium text-stone-500">{formatDate(item.deletedAt || item.updatedAt)}</span>
                                            </td>
                                            <td className="py-4 pr-5 pl-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleRestore(item._id)}
                                                        disabled={actionLoading === item._id}
                                                        className="p-2 rounded-lg border border-stone-200 text-stone-400 hover:text-green-600 hover:border-green-300 hover:bg-green-50 transition-all disabled:opacity-50"
                                                        title="Restore"
                                                    >
                                                        {actionLoading === item._id ? (
                                                            <Loader2 className="animate-spin" size={15} />
                                                        ) : (
                                                            <RotateCcw size={15} />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmDelete(item._id)}
                                                        className="p-2 rounded-lg border border-stone-200 text-stone-400 hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition-all"
                                                        title="Delete Permanently"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="px-4 py-3 border-t border-stone-100 bg-stone-50/30 flex items-center justify-between gap-3">
                            <span className="text-xs font-bold text-stone-500 whitespace-nowrap">
                                {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of <span className="text-stone-800 font-black">{total}</span>
                            </span>
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
                                        >{p}</button>
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
                    </>
                )}
            </div>

            {/* Confirm Permanent Delete Dialog */}
            {confirmDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
                        <h3 className="text-lg font-black text-stone-800 mb-2">Delete Permanently?</h3>
                        <p className="text-sm text-stone-500 font-medium mb-6">
                            This action cannot be undone. The record will be permanently removed.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setConfirmDelete(null)}
                                className="px-4 py-2 border border-card-border rounded-xl text-sm font-bold text-text-muted hover:bg-stone-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handlePermanentDelete(confirmDelete)}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-all"
                            >
                                Delete Forever
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
