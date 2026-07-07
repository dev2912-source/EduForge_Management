"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit2, Trash2, Loader2, X, Layers, Users, ExternalLink, BookOpen, Clock } from 'lucide-react';

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

const SECTION_LETTERS = ['A', 'B', 'C', 'D'];

export default function ClassDetailPage() {
    const router = useRouter();
    const params = useParams();
    const [classData, setClassData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sectionCounts, setSectionCounts] = useState({});
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', medium: 'ENGLISH', sections: 1 });
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState(null);

    const fetchClass = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/admin/classes/${params.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) {
                if (res.status === 404) throw new Error('Class not found');
                throw new Error('Failed to fetch class');
            }
            const data = await res.json();
            if (!data.success) throw new Error(data.message || 'Failed to fetch class');
            setClassData(data.data);
            setFormData({ name: data.data.name, medium: data.data.medium, sections: data.data.sections });

            const counts = {};
            const sectionPromises = SECTION_LETTERS.slice(0, data.data.sections).map(async (letter) => {
                try {
                    const sRes = await fetch(`http://localhost:5000/api/admin/students?className=${data.data.name}&section=${letter}&limit=1`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (sRes.ok) {
                        const sData = await sRes.json();
                        counts[letter] = sData.total || sData.data?.length || 0;
                    }
                } catch (e) {
                    counts[letter] = 0;
                }
            });
            await Promise.all(sectionPromises);
            setSectionCounts(counts);
        } catch (err) {
            setError(err.message);
        }
        setLoading(false);
    };

    useEffect(() => { if (params.id) fetchClass(); }, [params.id]);

    const handleEdit = () => {
        setFormData({ name: classData.name, medium: classData.medium, sections: classData.sections });
        setFormError(null);
        setShowEditModal(true);
    };

    const closeEditModal = () => {
        setShowEditModal(false);
        setFormError(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'sections' ? Number(value) : value }));
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setFormError(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/admin/classes/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || 'Failed to update class');
            closeEditModal();
            await fetchClass();
        } catch (err) {
            setFormError(err.message);
        }
        setSubmitting(false);
    };

    const handleDeleteClick = () => {
        setDeleteError(null);
        setShowDeleteModal(true);
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setDeleteError(null);
    };

    const handleDeleteConfirm = async () => {
        setDeleting(true);
        setDeleteError(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/admin/classes/${params.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || 'Failed to delete class');
            router.push('/dashboard/classes');
        } catch (err) {
            setDeleteError(err.message);
        }
        setDeleting(false);
    };

    if (loading) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="animate-pulse space-y-6">
                        <div className="h-8 bg-stone-200 rounded w-1/3" />
                        <div className="grid grid-cols-2 gap-4">
                            <div className="h-24 bg-stone-100 rounded-xl" />
                            <div className="h-24 bg-stone-100 rounded-xl" />
                        </div>
                        <div className="h-48 bg-stone-100 rounded-xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto text-center py-12">
                    <p className="text-lg font-semibold text-stone-600 mb-2">{error}</p>
                    <button onClick={() => router.push('/dashboard/classes')} className="text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors">
                        ← Back to Classes
                    </button>
                </div>
            </div>
        );
    }

    if (!classData) return null;

    const sections = SECTION_LETTERS.slice(0, classData.sections);

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                    <div className="p-4 sm:p-5">
                        <button
                            onClick={() => router.push('/dashboard/classes')}
                            className="flex items-center gap-1 text-sm font-semibold text-stone-500 hover:text-stone-700 transition-colors mb-3"
                        >
                            <ArrowLeft size={14} /> Classes
                        </button>
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-bold text-stone-900">{classData.name}</h1>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${getMediumBadge(classData.medium)}`}>
                                    {classData.medium}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={handleEdit} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border border-stone-200 text-stone-600 hover:bg-stone-50 hover:text-orange-500 transition-all">
                                    <Edit2 size={14} /> Edit
                                </button>
                                <button onClick={handleDeleteClick} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border border-stone-200 text-stone-600 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all">
                                    <Trash2 size={14} /> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="h-1 w-full" style={{ backgroundColor: 'var(--orange)' }} />
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                                <Layers size={18} className="text-orange-500" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Sections</p>
                                <p className="text-2xl font-black text-stone-900">{classData.sections}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                <Users size={18} className="text-blue-500" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Students</p>
                                <p className="text-2xl font-black text-stone-900">{classData.studentsCount || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sections Card */}
                <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-stone-800 uppercase tracking-wider flex items-center gap-2">
                            <Layers size={16} className="text-stone-400" /> Sections
                        </h2>
                        <button onClick={handleEdit} className="text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors">
                            Edit Sections
                        </button>
                    </div>
                    <div className="p-5">
                        {sections.length === 0 ? (
                            <p className="text-sm text-stone-400">No sections configured.</p>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {sections.map((letter) => {
                                    const count = sectionCounts[letter] ?? 0;
                                    return (
                                        <div key={letter} className="border border-stone-200 rounded-xl p-4 text-center hover:border-orange-200 hover:shadow-sm transition-all group">
                                            <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-2 group-hover:bg-orange-50 transition-colors">
                                                <span className="text-sm font-black text-stone-600 group-hover:text-orange-500">{letter}</span>
                                            </div>
                                            <p className="text-xs font-semibold text-stone-400">Students</p>
                                            <p className="text-lg font-black text-stone-800">{count}</p>
                                            <button
                                                onClick={() => router.push(`/dashboard/students?className=${classData.name}&section=${letter}`)}
                                                className="mt-2 text-[10px] font-bold text-orange-500 hover:text-orange-600 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-1 mx-auto"
                                            >
                                                View Students <ExternalLink size={10} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Subjects Card (Placeholder) */}
                <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-stone-100">
                        <h2 className="text-sm font-bold text-stone-800 uppercase tracking-wider flex items-center gap-2">
                            <BookOpen size={16} className="text-stone-400" /> Subjects
                        </h2>
                    </div>
                    <div className="p-5">
                        <div className="flex flex-col items-center justify-center py-6">
                            <BookOpen size={32} className="text-stone-300 mb-2" />
                            <p className="text-sm font-semibold text-stone-500 mb-1">Subject management coming soon</p>
                            <p className="text-xs text-stone-400 text-center max-w-sm">
                                You&apos;ll be able to assign subjects to this class and manage the curriculum.
                            </p>
                            <button
                                onClick={() => router.push(`/dashboard/timetable?class=${params.id}`)}
                                className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border border-stone-200 text-stone-600 hover:bg-stone-50 transition-all"
                            >
                                <Clock size={14} /> Open Timetable
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={closeEditModal}>
                    <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-stone-900">Edit Class</h2>
                            <button onClick={closeEditModal} className="p-1 text-stone-400 hover:text-stone-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        {formError && (
                            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm font-medium text-red-700">{formError}</div>
                        )}
                        <form onSubmit={handleEditSubmit} className="space-y-4">
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
                                <button type="button" onClick={closeEditModal} className="px-4 py-2 rounded-lg text-sm font-semibold bg-stone-200 text-stone-700 hover:bg-stone-300 transition-colors">Cancel</button>
                                <button type="submit" disabled={submitting} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed" style={{ backgroundColor: '#FF9F43' }}>
                                    {submitting && <Loader2 size={14} className="animate-spin" />}
                                    Update
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
                                <h2 className="text-lg font-bold text-stone-900">Delete Class</h2>
                                <p className="text-sm text-stone-500">This action cannot be undone.</p>
                            </div>
                        </div>
                        {deleteError && (
                            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm font-medium text-red-700">{deleteError}</div>
                        )}
                        <p className="text-sm text-stone-600 mb-6">
                            Are you sure you want to delete <span className="font-bold">{classData.name}</span>?
                        </p>
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
        </div>
    );
}
