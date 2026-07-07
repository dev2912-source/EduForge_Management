"use client";

import { useState } from 'react';
import { Search, Filter, FileText } from 'lucide-react';

export default function TrashPage() {
    const [search, setSearch] = useState('');
    
    // Hardcoded to 0 as per the empty state design requested
    const trashedCount = 0;

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
                        <span className="font-bold text-orange-500">{trashedCount}</span> trashed records — restore or permanently delete
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
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="relative flex-shrink-0">
                        <button type="button" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold border transition-all whitespace-nowrap bg-white text-stone-600 border-[#E8E0D4] hover:border-[#C8BEB4]">
                            <Filter size={14} strokeWidth={2.5} /> Filters
                        </button>
                    </div>
                </div>
                
                {/* Empty State Body */}
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                    <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mb-4 border border-stone-200 text-stone-300">
                        <FileText size={32} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-stone-500 font-bold text-lg mb-1">Trash is Empty</h3>
                    <p className="text-stone-400 text-sm font-medium">Deleted records will show up here.</p>
                </div>
            </div>
            
        </div>
    );
}
