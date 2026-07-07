"use client";

import { useState } from 'react';
import { ChevronDown, FileText } from 'lucide-react';

export default function PromotionsPage() {
    const [selectedClass, setSelectedClass] = useState("");

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

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Column (Source Class) */}
                <div className="lg:col-span-4">
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
                                    className="w-full appearance-none rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-600 focus:outline-none focus:ring-2 focus:ring-orange-200 transition-colors"
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                >
                                    <option value="" disabled>Select Class</option>
                                    <option value="class-1">Class 1</option>
                                    <option value="class-2">Class 2</option>
                                    <option value="class-3">Class 3</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-stone-400">
                                    <ChevronDown size={16} />
                                </div>
                            </div>
                        </div>

                        <button 
                            className="w-full rounded-lg py-2.5 text-sm font-black tracking-wide uppercase transition-colors"
                            style={{ 
                                backgroundColor: '#FCD3A1', // soft orange
                                color: '#CC6600', // darker orange text
                            }}
                        >
                            Find Students
                        </button>
                    </div>
                </div>

                {/* Right Column (Empty State) */}
                <div className="lg:col-span-8">
                    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-10 flex flex-col items-center justify-center min-h-[400px]">
                        <FileText size={48} className="text-stone-300 mb-4" strokeWidth={1.5} />
                        <h3 className="text-lg font-bold text-stone-600 mb-1">
                            No Students Loaded
                        </h3>
                        <p className="text-sm text-stone-500 font-medium">
                            Select a source class and click Find Students.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}
