"use client";

import { Calendar as CalendarIcon, Filter } from "lucide-react";

export default function MyLeaveRequestsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-4">
      
      {/* Header Card */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 sm:p-5 flex items-center">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-[#FF9933] rounded-full"></div>
          <h1 className="text-xl font-black text-stone-900 tracking-tight">My Leave Requests</h1>
        </div>
      </div>

      {/* Apply Form Card */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 sm:p-6 flex flex-col space-y-6">
        <div>
          <h2 className="text-[11px] font-black tracking-widest text-stone-500 uppercase mb-4">Apply for Leave</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* From Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-black text-stone-700 uppercase tracking-widest">From</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Select date"
                  className="w-full bg-white border border-stone-200 rounded-md py-2.5 pl-3 pr-10 text-[13px] font-medium text-stone-400 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] transition-all shadow-sm cursor-pointer"
                  readOnly
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-stone-400">
                  <CalendarIcon size={14} />
                </div>
              </div>
            </div>

            {/* To Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-black text-stone-700 uppercase tracking-widest">To</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Select date"
                  className="w-full bg-white border border-stone-200 rounded-md py-2.5 pl-3 pr-10 text-[13px] font-medium text-stone-400 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] transition-all shadow-sm cursor-pointer"
                  readOnly
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-stone-400">
                  <CalendarIcon size={14} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reason Textarea */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-black text-stone-700 uppercase tracking-widest">Reason</label>
          <textarea 
            placeholder="Reason for leave"
            rows={4}
            className="w-full bg-white border border-stone-200 rounded-md py-2.5 px-3 text-[13px] font-medium text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] transition-all shadow-sm resize-y"
          ></textarea>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button className="bg-stone-900 hover:bg-stone-800 text-white font-bold py-2.5 px-6 rounded-md text-[13px] transition-colors shadow-sm">
            Submit Request
          </button>
        </div>
      </div>

      {/* History Card */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        {/* Header/Toolbar */}
        <div className="p-4 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-[11px] font-black tracking-widest text-stone-500 uppercase">Request History</h2>
            <span className="text-[12px] font-bold text-stone-600">All records</span>
          </div>
          <button className="flex items-center gap-1.5 bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200 px-3 py-1.5 rounded-md text-[11px] font-black tracking-widest uppercase transition-colors">
            <Filter size={12} strokeWidth={2.5} /> Filter
          </button>
        </div>

        {/* History List */}
        <div className="divide-y divide-stone-100">
          
          <div className="p-4 sm:p-5 flex items-start justify-between hover:bg-stone-50/50 transition-colors">
            <div>
              <p className="font-bold text-[14px] text-stone-900 tracking-tight">15 Dec 2025 – 16 Dec 2025</p>
              <p className="font-medium text-[13px] text-stone-500 mt-1">Family function</p>
            </div>
            <div className="flex-shrink-0 ml-4">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-green-50 text-green-600">
                Approved
              </span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
