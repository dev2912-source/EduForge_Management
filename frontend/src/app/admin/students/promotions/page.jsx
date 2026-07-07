"use client";

import { useState } from 'react';
import { ChevronDown, FileText, CheckSquare, Square, ChevronRight } from 'lucide-react';

export default function StudentPromotions() {
    const [sourceClass, setSourceClass] = useState('');
    const [destinationClass, setDestinationClass] = useState('');
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [isPromoting, setIsPromoting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const classOptions = ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"];

    const findStudents = async () => {
        if (!sourceClass) return;
        
        setLoading(true);
        setHasSearched(true);
        setSuccessMessage('');
        
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/admin/students?className=${encodeURIComponent(sourceClass)}&limit=1000`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                const data = await res.json();
                setStudents(data.data || []);
                // Select all by default when found
                setSelectedStudents((data.data || []).map(s => s._id));
            }
        } catch (error) {
            console.error("Failed to fetch students:", error);
        }
        setLoading(false);
    };

    const promoteStudents = async () => {
        if (selectedStudents.length === 0 || !destinationClass) return;
        
        setIsPromoting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/admin/promotions`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    studentIds: selectedStudents,
                    targetClass: destinationClass
                })
            });
            
            if (res.ok) {
                setSuccessMessage(`Successfully promoted ${selectedStudents.length} students to ${destinationClass}.`);
                // Clear state
                setStudents([]);
                setSelectedStudents([]);
                setHasSearched(false);
                setSourceClass('');
                setDestinationClass('');
            }
        } catch (error) {
            console.error("Failed to promote students:", error);
        }
        setIsPromoting(false);
    };

    const toggleStudent = (id) => {
        if (selectedStudents.includes(id)) {
            setSelectedStudents(selectedStudents.filter(s => s !== id));
        } else {
            setSelectedStudents([...selectedStudents, id]);
        }
    };

    const toggleAll = () => {
        if (selectedStudents.length === students.length) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(students.map(s => s._id));
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex items-start gap-3">
                <div className="w-1.5 h-6 rounded-full mt-1" style={{ backgroundColor: 'var(--orange)' }}></div>
                <div>
                    <h1 className="text-lg font-bold text-stone-900 tracking-tight">Student Promotions</h1>
                    <p className="text-sm text-stone-500 font-medium mt-0.5">Transfer students to next class or mark them as graduated</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Left Column - Actions */}
                <div className="w-full md:w-1/3 space-y-6">
                    {/* Source Class Card */}
                    <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: 'var(--orange)' }}>1</div>
                            <h2 className="text-sm font-bold text-stone-700 tracking-wide uppercase">Source Class</h2>
                        </div>
                        
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wide">From Class</label>
                            <div className="relative">
                                <select 
                                    className="w-full appearance-none rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 shadow-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                                    style={{ '--tw-ring-color': 'rgba(255, 153, 51, 0.2)' }}
                                    value={sourceClass}
                                    onChange={(e) => setSourceClass(e.target.value)}
                                >
                                    <option value="" disabled>Select Class</option>
                                    {classOptions.map(cls => (
                                        <option key={cls} value={cls}>{cls}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-2.5 text-stone-400 pointer-events-none" size={16} />
                            </div>
                        </div>

                        <button 
                            onClick={findStudents}
                            disabled={!sourceClass || loading}
                            className={`w-full py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all ${
                                !sourceClass 
                                ? 'bg-[#F9E6C9] text-[#CF9759] cursor-not-allowed' 
                                : 'bg-orange-400 text-white hover:bg-orange-500 shadow-sm'
                            }`}
                            style={!sourceClass ? { backgroundColor: '#FCD8B0', color: '#D88A3C' } : { backgroundColor: 'var(--orange)' }}
                        >
                            {loading ? 'FINDING...' : 'FIND STUDENTS'}
                        </button>
                    </div>

                    {/* Destination Class Card (Only visible if students loaded) */}
                    {hasSearched && students.length > 0 && (
                        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: 'var(--orange)' }}>2</div>
                                <h2 className="text-sm font-bold text-stone-700 tracking-wide uppercase">Destination Class</h2>
                            </div>
                            
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wide">To Class</label>
                                <div className="relative">
                                    <select 
                                        className="w-full appearance-none rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 shadow-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                                        style={{ '--tw-ring-color': 'rgba(255, 153, 51, 0.2)' }}
                                        value={destinationClass}
                                        onChange={(e) => setDestinationClass(e.target.value)}
                                    >
                                        <option value="" disabled>Select Target Class</option>
                                        {classOptions.map(cls => (
                                            <option key={cls} value={cls}>{cls}</option>
                                        ))}
                                        <option value="Graduated" className="font-bold text-green-600">Graduated (Alumni)</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-2.5 text-stone-400 pointer-events-none" size={16} />
                                </div>
                            </div>

                            <button 
                                onClick={promoteStudents}
                                disabled={!destinationClass || selectedStudents.length === 0 || isPromoting}
                                className={`w-full py-2.5 rounded-lg text-sm font-bold tracking-wide flex items-center justify-center gap-2 transition-all ${
                                    !destinationClass || selectedStudents.length === 0
                                    ? 'bg-stone-100 text-stone-400 cursor-not-allowed' 
                                    : 'bg-green-600 text-white hover:bg-green-700 shadow-sm'
                                }`}
                            >
                                {isPromoting ? 'PROMOTING...' : 'PROMOTE STUDENTS'} <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Right Column - Results Area */}
                <div className="w-full md:w-2/3">
                    <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden min-h-[300px] flex flex-col">
                        
                        {successMessage && (
                            <div className="m-4 p-4 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm font-semibold flex items-center gap-2">
                                <CheckSquare size={18} className="text-green-600" />
                                {successMessage}
                            </div>
                        )}

                        {!hasSearched && !successMessage ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-stone-500">
                                <FileText size={48} className="text-stone-300 mb-4" strokeWidth={1.5} />
                                <h3 className="text-lg font-semibold text-stone-600 mb-1">No Students Loaded</h3>
                                <p className="text-sm">Select a source class and click Find Students.</p>
                            </div>
                        ) : hasSearched && students.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-stone-500">
                                <FileText size={48} className="text-stone-300 mb-4" strokeWidth={1.5} />
                                <h3 className="text-lg font-semibold text-stone-600 mb-1">No Students Found</h3>
                                <p className="text-sm">No students are currently enrolled in {sourceClass}.</p>
                            </div>
                        ) : hasSearched && students.length > 0 ? (
                            <>
                                <div className="p-3 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                                    <div className="text-sm font-bold text-stone-700">
                                        <span style={{ color: 'var(--orange)' }}>{selectedStudents.length}</span> / {students.length} Selected
                                    </div>
                                </div>
                                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                                    <table className="w-full text-left">
                                        <thead className="sticky top-0 bg-white border-b border-stone-200 z-10">
                                            <tr>
                                                <th className="py-3 px-4 w-12">
                                                    <button onClick={toggleAll} className="text-stone-400 hover:text-orange-500 transition-colors">
                                                        {selectedStudents.length === students.length ? <CheckSquare size={18} style={{ color: 'var(--orange)' }} /> : <Square size={18} />}
                                                    </button>
                                                </th>
                                                <th className="py-3 px-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Student Name</th>
                                                <th className="py-3 px-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Enrollment ID</th>
                                                <th className="py-3 px-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Current Class</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-stone-100">
                                            {students.map(student => (
                                                <tr key={student._id} className="hover:bg-stone-50/70 transition-colors cursor-pointer" onClick={() => toggleStudent(student._id)}>
                                                    <td className="py-3 px-4">
                                                        {selectedStudents.includes(student._id) ? (
                                                            <CheckSquare size={18} style={{ color: 'var(--orange)' }} />
                                                        ) : (
                                                            <Square size={18} className="text-stone-300" />
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 text-sm font-semibold text-stone-700">{student.name}</td>
                                                    <td className="py-3 px-4 text-xs font-mono font-medium text-stone-500">{student.schoolId || student.profile?.rollNumber || '—'}</td>
                                                    <td className="py-3 px-4 text-sm text-stone-600">{student.profile?.className}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
