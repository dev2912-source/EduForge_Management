"use client";

import { useState, useEffect } from 'react';
import { Search, Filter, ChevronDown, Square, ChevronLeft, ChevronRight, RefreshCw, Plus, Edit, Trash2, X, Loader2 } from 'lucide-react';

const INITIAL_FORM = {
  name: "",
  email: "",
  phone: "",
  gender: "",
  address: "",
};

const genders = ["Male", "Female", "Other"];

export default function StaffPage() {
    const [staffList, setStaffList] = useState([]);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/admin/staff?page=${page}&limit=${limit}&search=${search}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setStaffList(data.data);
                    setTotal(data.total);
                }
            }
        } catch (error) {
            console.error("Failed to fetch staff data", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchStaff();
    }, [page, limit, search]);

    const getStatusBadge = (status) => {
        const s = (status || 'active').toLowerCase();
        if (s === 'active') {
            return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-green-100 text-green-700">ACTIVE</span>;
        }
        if (s === 'inactive') {
            return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-100 text-red-700">INACTIVE</span>;
        }
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-stone-100 text-stone-600">{s}</span>;
    };

    const getStaffName = (staff) => {
        if (!staff) return 'Unknown';
        if (staff.firstName || staff.lastName) return `${staff.firstName || ''} ${staff.lastName || ''}`.trim();
        if (staff.name) return staff.name; 
        return 'Unknown';
    };

    const getStaffID = (staff) => {
        if (!staff) return 'STF-0000';
        if (staff.rollNumber) return staff.rollNumber;
        if (staff.schoolId) return staff.schoolId;
        return 'STF-2026-0001';
    };

    const getDepartment = (staff) => {
        if (!staff) return '\u2014';
        return 'Administration';
    };

    const getDesignation = (staff) => {
        if (!staff) return '\u2014';
        return 'Administrative Staff';
    };
    
    const getTypeBadge = (staff) => {
        return <span className="px-2 py-1 rounded text-[10px] font-bold tracking-wide bg-stone-100 text-stone-600 border border-stone-200">FULL-TIME</span>;
    };

    const openAddModal = () => {
        setEditingId(null);
        setFormData(INITIAL_FORM);
        setFormError("");
        setShowModal(true);
    };

    const openEditModal = (staff) => {
        setEditingId(staff._id);
        setFormData({
            name: staff.name || `${staff.firstName || ''} ${staff.lastName || ''}`.trim(),
            email: staff.email || "",
            phone: staff.phone || "",
            gender: staff.profile?.gender || "",
            address: staff.profile?.address || "",
        });
        setFormError("");
        setShowModal(true);
    };

    const handleFormChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setFormError("Full Name is required");
            return;
        }
        setSaving(true);
        setFormError("");
        try {
            const token = localStorage.getItem("token") || "";
            const payload = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                profile: {
                    gender: formData.gender,
                    address: formData.address,
                },
            };

            const url = editingId ? `/api/admin/staff/${editingId}` : "/api/admin/staff";
            const method = editingId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || "Failed to save staff member");
            }

            setShowModal(false);
            fetchStaff();
        } catch (err) {
            setFormError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            const token = localStorage.getItem("token") || "";
            const res = await fetch(`/api/admin/staff/${deleteTarget._id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to delete staff member");
            setDeleteTarget(null);
            fetchStaff();
        } catch (err) {
            alert(err.message);
        } finally {
            setDeleting(false);
        }
    };

    const totalPages = Math.ceil(total / limit) || 1;
    const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
    const endItem = Math.min(page * limit, total);

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            
            {/* Header */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-5 rounded-full" style={{ backgroundColor: 'var(--orange)' }}></div>
                    <h1 className="text-xl font-bold text-stone-900 tracking-tight">Staff</h1>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button 
                        onClick={fetchStaff}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-bold rounded-lg transition-colors border border-stone-200 whitespace-nowrap"
                    >
                        <RefreshCw size={14} strokeWidth={2.5} className={loading ? "animate-spin" : ""} /> Refresh
                    </button>
                    <button
                        onClick={openAddModal}
                        className="flex items-center justify-center gap-2 px-4 py-2 text-white text-sm font-bold rounded-lg transition-colors whitespace-nowrap shadow-sm hover:scale-105" style={{ backgroundColor: 'var(--orange)' }}
                    >
                        <Plus size={16} strokeWidth={3} /> Add
                    </button>
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
                            placeholder="Search by name or staff code." 
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
                                    <button className="flex items-center gap-1.5 group text-sm font-bold text-stone-700 hover:text-stone-900 transition-colors">
                                        Staff Name <span className="text-orange-400 text-[10px]">&#9660;</span>
                                    </button>
                                </th>
                                <th className="py-4 px-3">
                                    <button className="flex items-center gap-1.5 group text-sm font-bold text-stone-700 hover:text-stone-900 transition-colors">
                                        ID <span className="text-stone-300 text-[10px]">&#9660;</span>
                                    </button>
                                </th>
                                <th className="py-4 px-3">
                                    <button className="flex items-center gap-1.5 group text-sm font-bold text-stone-700 hover:text-stone-900 transition-colors">
                                        Department <span className="text-stone-300 text-[10px]">&#9660;</span>
                                    </button>
                                </th>
                                <th className="py-4 px-3">
                                    <button className="flex items-center gap-1.5 group text-sm font-bold text-stone-700 hover:text-stone-900 transition-colors">
                                        Designation <span className="text-stone-300 text-[10px]">&#9660;</span>
                                    </button>
                                </th>
                                <th className="py-4 px-3">
                                    <button className="flex items-center gap-1.5 group text-sm font-bold text-stone-700 hover:text-stone-900 transition-colors">
                                        Type <span className="text-stone-300 text-[10px]">&#9660;</span>
                                    </button>
                                </th>
                                <th className="py-4 px-3">
                                    <button className="flex items-center gap-1.5 group text-sm font-bold text-stone-700 hover:text-stone-900 transition-colors">
                                        Status <span className="text-stone-300 text-[10px]">&#9660;</span>
                                    </button>
                                </th>
                                <th className="py-4 px-3 text-right">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-50">
                            {loading ? (
                                <tr><td colSpan="8" className="py-8 text-center text-sm text-stone-500">Loading staff data...</td></tr>
                            ) : staffList.length === 0 ? (
                                <tr><td colSpan="8" className="py-8 text-center text-sm text-stone-500">No staff found.</td></tr>
                            ) : (
                                staffList.map((staff) => (
                                    <tr key={staff._id} className="group transition-all duration-100 hover:bg-stone-50/70">
                                        <td className="w-14 py-4 pl-4 pr-1 align-middle">
                                            <div className="w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer border-stone-300 bg-white hover:border-orange mt-1"></div>
                                        </td>
                                        <td className="py-4 px-3 align-middle">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0"></div>
                                                <span className="text-[13px] font-black text-stone-800">{getStaffName(staff)}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-3 align-middle">
                                            <span className="text-[11px] font-bold text-stone-400 font-mono tracking-wide">{getStaffID(staff)}</span>
                                        </td>
                                        <td className="py-4 px-3 align-middle">
                                            <span className="text-[13px] font-bold text-stone-600">{getDepartment(staff)}</span>
                                        </td>
                                        <td className="py-4 px-3 align-middle">
                                            <span className="text-[13px] font-bold text-stone-600">{getDesignation(staff)}</span>
                                        </td>
                                        <td className="py-4 px-3 align-middle">
                                            {getTypeBadge(staff)}
                                        </td>
                                        <td className="py-4 px-3 align-middle">
                                            {getStatusBadge(staff.profile?.status || 'active')}
                                        </td>
                                        <td className="py-4 px-4 align-middle text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => openEditModal(staff)}
                                                    className="p-1.5 rounded-md text-stone-400 hover:text-orange-500 hover:bg-orange-50 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit size={16} strokeWidth={2.5} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteTarget(staff)}
                                                    className="p-1.5 rounded-md text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} strokeWidth={2.5} />
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

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl border border-stone-200 w-full max-w-lg max-h-[90vh] overflow-y-auto m-4">
                        <div className="flex items-center justify-between p-5 border-b border-stone-200">
                            <h2 className="text-lg font-black text-stone-900">
                                {editingId ? "Edit Staff" : "Add Staff"}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-1 rounded-md text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            {formError && (
                                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-bold">
                                    {formError}
                                </div>
                            )}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[12px] font-black text-stone-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                                    <input type="text" name="name" value={formData.name} onChange={handleFormChange} className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] transition-all shadow-sm" placeholder="Enter full name" />
                                </div>
                                <div>
                                    <label className="block text-[12px] font-black text-stone-700 mb-1">Email</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleFormChange} className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] transition-all shadow-sm" placeholder="email@example.com" />
                                </div>
                                <div>
                                    <label className="block text-[12px] font-black text-stone-700 mb-1">Phone</label>
                                    <input type="text" name="phone" value={formData.phone} onChange={handleFormChange} className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] transition-all shadow-sm" placeholder="Phone number" />
                                </div>
                                <div>
                                    <label className="block text-[12px] font-black text-stone-700 mb-1">Gender</label>
                                    <select name="gender" value={formData.gender} onChange={handleFormChange} className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] transition-all shadow-sm">
                                        <option value="">Select Gender</option>
                                        {genders.map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[12px] font-black text-stone-700 mb-1">Address</label>
                                    <textarea name="address" value={formData.address} onChange={handleFormChange} rows={2} className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] transition-all shadow-sm" />
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-3 pt-2 border-t border-stone-100">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-bold text-stone-700 hover:bg-stone-50 transition-colors shadow-sm">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving} className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-[13px] font-bold flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50">
                                    {saving && <Loader2 size={14} className="animate-spin" />}
                                    {editingId ? "Update Staff" : "Add Staff"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl border border-stone-200 w-full max-w-md m-4 p-5">
                        <h3 className="text-lg font-black text-stone-900 mb-2">Delete Staff Member</h3>
                        <p className="text-sm font-medium text-stone-600 mb-5">
                            Are you sure you want to delete <span className="font-black text-stone-800">{getStaffName(deleteTarget)}</span>? This action cannot be undone.
                        </p>
                        <div className="flex items-center justify-end gap-3">
                            <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-bold text-stone-700 hover:bg-stone-50 transition-colors shadow-sm">
                                Cancel
                            </button>
                            <button onClick={confirmDelete} disabled={deleting} className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[13px] font-bold flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50">
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
