"use client";

import { useState, useEffect } from 'react';
import { ChevronDown, FileText, Loader2, Check, Users } from 'lucide-react';

export default function PromotionsPage() {
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [classes, setClasses] = useState([]);
    const [students, setStudents] = useState([]);
    const [studentsLoading, setStudentsLoading] = useState(false);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [fromClass, setFromClass] = useState("");
    const [toClass, setToClass] = useState("");
    const [academicYear, setAcademicYear] = useState("2025-2026");
    const [message, setMessage] = useState(null);
    const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const res = await fetch(`/api/admin/classes`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setClasses(data.data || data || []);
                }
            } catch (_) {}
        };
        if (token) fetchClasses();
    }, [token]);

    useEffect(() => {
        if (!fromClass) {
            setStudents([]);
            return;
        }
        const fetchStudents = async () => {
            setStudentsLoading(true);
            setSelectedStudents([]);
            try {
                const res = await fetch(`/api/admin/students?className=${encodeURIComponent(fromClass)}&page=1&limit=500`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    const list = Array.isArray(data) ? data : (data.data || []);
                    setStudents(list);
                }
            } catch (_) {}
            setStudentsLoading(false);
        };
        fetchStudents();
    }, [fromClass, token]);

    const toggleStudent = (id) => {
        setSelectedStudents(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        if (selectedStudents.length === students.length) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(students.map(s => s._id));
        }
    };

    const handlePromote = async () => {
        if (!fromClass || !toClass || selectedStudents.length === 0) return;
        setSubmitting(true);
        setMessage(null);
        try {
            const res = await fetch(`/api/admin/promotions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    studentIds: selectedStudents,
                    fromClass,
                    toClass,
                    newAcademicYear: academicYear
                })
            });
            if (res.ok) {
                setMessage({ type: "success", text: `${selectedStudents.length} student(s) promoted successfully!` });
                setSelectedStudents([]);
                setFromClass("");
                setToClass("");
                setStudents([]);
            } else {
                const err = await res.json().catch(() => ({}));
                setMessage({ type: "error", text: err.message || "Promotion failed" });
            }
        } catch (_) {
            setMessage({ type: "error", text: "Network error" });
        }
        setSubmitting(false);
    };

    const availableToClasses = classes.filter(c => c.name !== fromClass);

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Header Card */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 sm:p-5 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-5 rounded-full" style={{ backgroundColor: 'var(--orange)' }}></div>
                    <h1 className="text-xl font-bold text-stone-900 tracking-tight">Student Promotions</h1>
                </div>
                <p className="text-sm text-stone-500 font-medium pl-3.5">
                    Transfer students to next class or mark them as graduated
                </p>
            </div>

            {/* Message */}
            {message && (
                <div className={`px-4 py-3 rounded-xl border text-sm font-bold ${
                    message.type === "success"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-red-50 text-red-700 border-red-200"
                }`}>
                    {message.text}
                    <button className="ml-3 float-right" onClick={() => setMessage(null)}>✕</button>
                </div>
            )}

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Column (Source Class) */}
                <div className="lg:col-span-5">
                    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-5">
                        
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-black" style={{ backgroundColor: 'var(--orange)' }}>
                                1
                            </div>
                            <h2 className="text-sm font-black tracking-widest uppercase" style={{ color: 'var(--text-secondary)' }}>
                                Source Class
                            </h2>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[11px] font-black text-stone-500 uppercase tracking-widest">
                                From Class
                            </label>
                            <div className="relative">
                                <select 
                                    value={fromClass}
                                    onChange={(e) => setFromClass(e.target.value)}
                                    className="w-full appearance-none rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-600 focus:outline-none focus:ring-2 focus:ring-orange-200 transition-colors"
                                >
                                    <option value="">Select Class</option>
                                    {classes.map(c => (
                                        <option key={c._id} value={c.name}>{c.name}</option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-stone-400">
                                    <ChevronDown size={16} />
                                </div>
                            </div>
                        </div>

                        {/* Students List */}
                        {fromClass && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="block text-[11px] font-black text-stone-500 uppercase tracking-widest">
                                        Students ({students.length})
                                    </label>
                                    {students.length > 0 && (
                                        <button
                                            onClick={toggleAll}
                                            className="text-[11px] font-bold text-orange-500 hover:text-orange-600 transition-colors"
                                        >
                                            {selectedStudents.length === students.length ? "Deselect All" : "Select All"}
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-72 overflow-y-auto border border-stone-200 rounded-lg divide-y divide-stone-100">
                                    {studentsLoading ? (
                                        <div className="flex items-center justify-center py-8 text-stone-400">
                                            <Loader2 className="animate-spin" size={24} />
                                        </div>
                                    ) : students.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-8 text-stone-400">
                                            <Users size={24} strokeWidth={1.5} />
                                            <p className="text-xs font-bold mt-2">No students found</p>
                                        </div>
                                    ) : (
                                        students.map(s => (
                                            <label
                                                key={s._id}
                                                className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                                                    selectedStudents.includes(s._id) ? "bg-orange-50" : "hover:bg-stone-50"
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedStudents.includes(s._id)}
                                                    onChange={() => toggleStudent(s._id)}
                                                    className="w-4 h-4 rounded border-stone-300 text-orange-500 focus:ring-orange-400"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-stone-800 truncate">{s.name}</p>
                                                    <p className="text-[11px] font-medium text-stone-400">{s.schoolId || s.profile?.rollNumber || "—"}</p>
                                                </div>
                                                {s.profile?.section && (
                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-stone-100 text-stone-500">
                                                        {s.profile.section}
                                                    </span>
                                                )}
                                            </label>
                                        ))
                                    )}
                                </div>
                                {selectedStudents.length > 0 && (
                                    <p className="text-xs font-bold text-orange-600">
                                        {selectedStudents.length} selected
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column (Target & Action) */}
                <div className="lg:col-span-7">
                    {!fromClass || students.length === 0 ? (
                        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-10 flex flex-col items-center justify-center min-h-[400px]">
                            <FileText size={48} className="text-stone-300 mb-4" strokeWidth={1.5} />
                            <h3 className="text-lg font-bold text-stone-600 mb-1">
                                {!fromClass ? "No Class Selected" : "No Students Loaded"}
                            </h3>
                            <p className="text-sm text-stone-500 font-medium">
                                {!fromClass
                                    ? "Select a source class to view students."
                                    : "This class has no students to promote."
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-5">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-black" style={{ backgroundColor: 'var(--orange)' }}>
                                    2
                                </div>
                                <h2 className="text-sm font-black tracking-widest uppercase" style={{ color: 'var(--text-secondary)' }}>
                                    Promotion Details
                                </h2>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[11px] font-black text-stone-500 uppercase tracking-widest">
                                    To Class
                                </label>
                                <div className="relative">
                                    <select
                                        value={toClass}
                                        onChange={(e) => setToClass(e.target.value)}
                                        className="w-full appearance-none rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-600 focus:outline-none focus:ring-2 focus:ring-orange-200 transition-colors"
                                    >
                                        <option value="">Select Target Class</option>
                                        {availableToClasses.map(c => (
                                            <option key={c._id} value={c.name}>{c.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-stone-400">
                                        <ChevronDown size={16} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[11px] font-black text-stone-500 uppercase tracking-widest">
                                    Academic Year
                                </label>
                                <input
                                    type="text"
                                    value={academicYear}
                                    onChange={(e) => setAcademicYear(e.target.value)}
                                    className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-600 focus:outline-none focus:ring-2 focus:ring-orange-200 transition-colors"
                                />
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-black" style={{ backgroundColor: 'var(--orange)' }}>
                                        3
                                    </div>
                                    <h2 className="text-sm font-black tracking-widest uppercase" style={{ color: 'var(--text-secondary)' }}>
                                        Confirm
                                    </h2>
                                </div>
                                <button
                                    onClick={handlePromote}
                                    disabled={submitting || !toClass || selectedStudents.length === 0}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-black tracking-wide uppercase transition-all"
                                    style={{
                                        backgroundColor: (submitting || !toClass || selectedStudents.length === 0) ? '#E8E0D4' : '#F97316',
                                        color: (submitting || !toClass || selectedStudents.length === 0) ? '#A89A8A' : '#FFFFFF',
                                    }}
                                >
                                    {submitting ? (
                                        <Loader2 className="animate-spin" size={16} />
                                    ) : (
                                        <Check size={16} />
                                    )}
                                    Promote Selected
                                </button>
                            </div>

                            {selectedStudents.length > 0 && toClass && (
                                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                                    <p className="text-xs font-bold text-amber-700">
                                        Will promote <span className="text-amber-900">{selectedStudents.length}</span> student(s) from <span className="text-amber-900">{fromClass}</span> to <span className="text-amber-900">{toClass}</span> (AY {academicYear})
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
