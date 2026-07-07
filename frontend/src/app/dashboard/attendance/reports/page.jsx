"use client";

import { useState } from 'react';
import { ChevronDown, Calendar as CalendarIcon } from 'lucide-react';

export default function StudentAttendanceReportPage() {
    const [academicYear, setAcademicYear] = useState('2025-2026');
    const [classSelection, setClassSelection] = useState('');
    const [section, setSection] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-4 max-w-7xl mx-auto">
            
            {/* Header Card */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 flex items-center">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-4 rounded-full" style={{ backgroundColor: 'var(--orange)' }}></div>
                    <h1 className="text-[17px] font-bold text-stone-800 tracking-tight">Student Attendance Report</h1>
                </div>
            </div>

            {/* Filter Card */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 sm:p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 lg:grid-cols-5 gap-3 md:gap-4">
                    
                    {/* ACADEMIC YEAR */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-black text-stone-600 uppercase tracking-widest">Academic Year</label>
                        <div className="relative">
                            <select 
                                value={academicYear}
                                onChange={(e) => setAcademicYear(e.target.value)}
                                className="w-full appearance-none rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-700 shadow-sm transition-all focus:outline-none focus:ring-2"
                                style={{ '--tw-ring-color': 'rgba(255, 153, 51, 0.2)' }}
                            >
                                <option value="2025-2026">2025-2026</option>
                                <option value="2024-2025">2024-2025</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-stone-400">
                                <ChevronDown size={14} strokeWidth={2.5} />
                            </div>
                        </div>
                    </div>

                    {/* CLASS */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-black text-stone-600 uppercase tracking-widest">Class</label>
                        <div className="relative">
                            <select 
                                value={classSelection}
                                onChange={(e) => setClassSelection(e.target.value)}
                                className={`w-full appearance-none rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 ${classSelection === '' ? 'text-stone-400' : 'text-stone-700'}`}
                                style={{ '--tw-ring-color': 'rgba(255, 153, 51, 0.2)' }}
                            >
                                <option value="" disabled hidden>Select Class</option>
                                <option value="Class 1">Class 1</option>
                                <option value="Class 2">Class 2</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-stone-400">
                                <ChevronDown size={14} strokeWidth={2.5} />
                            </div>
                        </div>
                    </div>

                    {/* SECTION */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-black text-stone-600 uppercase tracking-widest">Section</label>
                        <div className="relative">
                            <select 
                                value={section}
                                onChange={(e) => setSection(e.target.value)}
                                className={`w-full appearance-none rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 ${section === '' ? 'text-stone-400' : 'text-stone-700'}`}
                                style={{ '--tw-ring-color': 'rgba(255, 153, 51, 0.2)' }}
                            >
                                <option value="" disabled hidden>All Sections</option>
                                <option value="A">Section A</option>
                                <option value="B">Section B</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-stone-400">
                                <ChevronDown size={14} strokeWidth={2.5} />
                            </div>
                        </div>
                    </div>

                    {/* FROM */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-black text-stone-600 uppercase tracking-widest">From</label>
                        <div className="relative">
                            <input 
                                type="date" 
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className={`w-full appearance-none rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 ${fromDate === '' ? 'text-stone-400' : 'text-stone-700'}`}
                                style={{ '--tw-ring-color': 'rgba(255, 153, 51, 0.2)' }}
                            />
                        </div>
                    </div>

                    {/* TO */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-black text-stone-600 uppercase tracking-widest">To</label>
                        <div className="relative">
                            <input 
                                type="date" 
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className={`w-full appearance-none rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 ${toDate === '' ? 'text-stone-400' : 'text-stone-700'}`}
                                style={{ '--tw-ring-color': 'rgba(255, 153, 51, 0.2)' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Generate Button Row */}
                <div className="flex justify-end pt-2">
                    <button className="bg-[#888888] hover:bg-[#777777] text-white font-bold text-[13px] py-1.5 px-6 rounded-[4px] transition-colors shadow-sm">
                        Generate Report
                    </button>
                </div>
            </div>

            {/* Empty State Card */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm py-24 px-4 flex items-center justify-center">
                <p className="text-sm font-bold text-stone-500 text-center">
                    Select filters and click Generate Report
                </p>
            </div>
            
        </div>
    );
}
