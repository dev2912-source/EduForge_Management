"use client";

import { useState, useEffect } from 'react';
import { 
    Search, 
    Filter, 
    Download, 
    UserPlus, 
    ChevronDown, 
    Edit2, 
    ChevronLeft, 
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Square
} from 'lucide-react';

export default function StudentDirectory() {
    const [students, setStudents] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            // Include token from localStorage
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/admin/students?page=${page}&limit=${limit}&search=${search}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!res.ok) {
                const text = await res.text();
                console.error("API Error Response:", text);
                throw new Error(`API returned ${res.status}: ${res.statusText}`);
            }
            
            const data = await res.json();
            if (data.success) {
                setStudents(data.data);
                setTotal(data.total);
            }
        } catch (error) {
            console.error("Failed to fetch students", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchStudents();
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

    const calculateAge = (dob) => {
        if (!dob) return '';
        const diffMs = Date.now() - new Date(dob).getTime();
        const ageDate = new Date(diffMs);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    };

    const totalPages = Math.ceil(total / limit) || 1;
    const startItem = (page - 1) * limit + 1;
    const endItem = Math.min(page * limit, total);

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-2xl border border-stone-200 shadow-sm">
                <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                        <div className="w-1.5 h-5 rounded-full" style={{ backgroundColor: 'var(--orange)' }}></div>
                        <h1 className="text-xl font-bold text-stone-900 tracking-tight">Student Directory</h1>
                    </div>
                    <p className="text-sm text-stone-500 font-medium">
                        <span className="font-bold" style={{ color: 'var(--orange)' }}>{total}</span> students enrolled
                    </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button className="flex items-center gap-1.5 py-2 px-4 text-sm font-semibold rounded-xl border border-stone-300 bg-white text-stone-600 hover:border-stone-400 hover:bg-stone-50 transition-all" title="Import students from CSV or Excel">
                        <Download size={16} /> Import
                    </button>
                    <a href="/dashboard/students/new" className="flex items-center gap-1.5 py-2 px-5 text-sm font-semibold rounded-xl text-white transition-all shadow-sm" style={{ backgroundColor: 'var(--text-primary)' }}>
                        <UserPlus size={16} /> Admit Student
                    </a>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="px-3 py-2 border-b border-stone-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-shrink-0"></div>
                    <div className="flex items-center gap-2">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-stone-400 group-focus-within:text-orange">
                                <Search size={16} />
                            </div>
                            <input 
                                type="text" 
                                className="block rounded-lg border border-stone-200 bg-white pl-8 pr-7 py-1.5 text-sm text-stone-800 shadow-sm transition-all focus:outline-none focus:ring-2 w-52" 
                                placeholder="Search students…" 
                                style={{ '--tw-ring-color': 'rgba(255, 153, 51, 0.2)', focusBorderColor: 'var(--orange)' }}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="relative flex-shrink-0">
                            <button type="button" className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold border transition-all whitespace-nowrap bg-white text-stone-600 border-[#E8E0D4] hover:border-[#C8BEB4]">
                                <Filter size={16} /> Filters
                            </button>
                        </div>
                    </div>
                </div>
                
                <div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[560px]">
                            <thead>
                                <tr className="bg-white border-b border-stone-200">
                                    <th className="w-16 py-3 pl-3 pr-2">
                                        <div>
                                            <button className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-bold border transition-all bg-white border-[#E8E0D4] text-stone-500 hover:border-[#C8BEB4]">
                                                <Square size={14} className="text-stone-300" /> <ChevronDown size={14} />
                                            </button>
                                        </div>
                                    </th>
                                    <th className="text-left py-3 px-3"><button className="flex items-center gap-1.5 group text-sm font-bold text-stone-700 hover:text-stone-900 transition-colors">Full Name <ChevronDown size={14} className="text-stone-400 opacity-0 group-hover:opacity-100" /></button></th>
                                    <th className="text-left py-3 px-3"><button className="flex items-center gap-1.5 group text-sm font-bold text-stone-700 hover:text-stone-900 transition-colors">Enrollment ID <ChevronDown size={14} className="text-stone-400 opacity-0 group-hover:opacity-100" /></button></th>
                                    <th className="hidden sm:table-cell text-left py-3 px-3"><button className="flex items-center gap-1.5 group text-sm font-bold text-stone-700 hover:text-stone-900 transition-colors">Gender <ChevronDown size={14} className="text-stone-400 opacity-0 group-hover:opacity-100" /></button></th>
                                    <th className="hidden md:table-cell text-left py-3 px-3"><button className="flex items-center gap-1.5 group text-sm font-bold text-stone-700 hover:text-stone-900 transition-colors">DOB / Age <ChevronDown size={14} className="text-stone-400 opacity-0 group-hover:opacity-100" /></button></th>
                                    <th className="text-left py-3 px-3"><span className="text-sm font-bold text-stone-700">Class</span></th>
                                    <th className="text-left py-3 px-3"><button className="flex items-center gap-1.5 group text-sm font-bold text-stone-700 hover:text-stone-900 transition-colors">Status <ChevronDown size={14} className="text-stone-400 opacity-0 group-hover:opacity-100" /></button></th>
                                    <th className="hidden lg:table-cell text-left py-3 px-3"><button className="flex items-center gap-1.5 group text-sm font-bold text-stone-700 hover:text-stone-900 transition-colors">Created At <ChevronDown size={14} className="text-stone-400 opacity-0 group-hover:opacity-100" /></button></th>
                                    <th className="hidden lg:table-cell text-left py-3 px-3"><button className="flex items-center gap-1.5 group text-sm font-bold text-stone-700 hover:text-stone-900 transition-colors">Updated At <ChevronDown size={14} className="text-stone-400 opacity-0 group-hover:opacity-100" /></button></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-50">
                                {loading ? (
                                    <tr><td colSpan="9" className="py-4 text-center text-sm text-stone-500">Loading...</td></tr>
                                ) : students.length === 0 ? (
                                    <tr><td colSpan="9" className="py-4 text-center text-sm text-stone-500">No students found</td></tr>
                                ) : (
                                    students.map(student => (
                                        <tr key={student._id} className="group transition-all duration-100 cursor-pointer hover:bg-stone-50/70">
                                            <td className="w-16 py-2.5 pl-3 pr-2">
                                                <div className="flex items-center gap-1">
                                                    <div className="w-4 h-4 rounded border-2 flex items-center justify-center transition-all cursor-pointer flex-shrink-0 border-stone-300 bg-white hover:border-orange"></div>
                                                    <button className="flex items-center justify-center w-5 h-5 rounded text-stone-400 hover:text-orange transition-all flex-shrink-0" title="Edit">
                                                        <Edit2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="py-2.5 px-3">
                                                <span className="text-sm font-semibold text-stone-700 group-hover:text-stone-800 leading-tight">{student.name}</span>
                                            </td>
                                            <td className="py-2.5 px-3">
                                                <span className="text-xs font-mono font-bold text-stone-400">{student.schoolId || student.profile?.rollNumber || '—'}</span>
                                            </td>
                                            <td className="hidden sm:table-cell py-2.5 px-3">
                                                <span className="text-xs font-semibold text-stone-500 capitalize">{student.profile?.gender || '—'}</span>
                                            </td>
                                            <td className="hidden md:table-cell py-2.5 px-3">
                                                {student.profile?.dateOfBirth ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-xs font-semibold text-stone-600">{formatDate(student.profile.dateOfBirth)}</span>
                                                        <span className="text-[11px] text-stone-400 font-medium">({calculateAge(student.profile.dateOfBirth)} yrs)</span>
                                                    </div>
                                                ) : <span className="text-xs text-stone-400">—</span>}
                                            </td>
                                            <td className="py-2.5 px-3">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="text-sm font-semibold text-stone-600">{student.profile?.className || '—'}</span>
                                                    {student.profile?.section && (
                                                        <span className="text-[10px] font-black text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded uppercase tracking-wide">{student.profile.section}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-2.5 px-3">
                                                {student.profile?.status === 'active' ? (
                                                    <span className="px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wide bg-green-50 text-green-700 border border-green-200">Active</span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wide bg-stone-100 text-stone-600 border border-stone-200">{student.profile?.status || 'Unknown'}</span>
                                                )}
                                            </td>
                                            <td className="hidden lg:table-cell py-2.5 px-3">
                                                <span className="text-xs text-stone-400 font-medium whitespace-nowrap">{formatDateTime(student.createdAt)}</span>
                                            </td>
                                            <td className="hidden lg:table-cell py-2.5 px-3">
                                                <span className="text-xs text-stone-400 font-medium whitespace-nowrap">{formatDateTime(student.updatedAt)}</span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-4 py-3 border-t border-stone-100 bg-stone-50/30 flex items-center justify-between gap-3">
                        <span className="text-xs font-bold text-stone-500 whitespace-nowrap">
                            {total === 0 ? '0' : `${startItem}–${endItem}`} of <span className="text-stone-800 font-black">{total}</span>
                        </span>
                        
                        <div className="flex items-center gap-2">
                            <div className="relative w-20">
                                <button type="button" className="w-full flex items-center justify-between gap-2 text-left rounded-lg transition-all duration-150 border-[1.5px] bg-white focus:outline-none px-2.5 py-1.5 text-xs border-[#E8E0D4] hover:border-[#C8BEB4] cursor-pointer">
                                    <span className="flex items-center gap-1.5 min-w-0 flex-1 text-stone-800 font-medium">
                                        <span className="truncate">{limit}</span>
                                    </span>
                                    <span className="flex items-center gap-1 flex-shrink-0">
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
                                                ? 'bg-orange-500 border-orange-500 text-white shadow-sm shadow-orange-500/20' 
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
        </div>
    );
}
