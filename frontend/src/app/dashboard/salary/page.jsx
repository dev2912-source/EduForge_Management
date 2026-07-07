"use client";

import { useState, useEffect } from "react";
import { Filter, ChevronDown, ChevronLeft, ChevronRight, Eye, Download, Loader2 } from "lucide-react";

export default function MySalarySlipsPage() {
  const [slips, setSlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSlips = async () => {
      try {
        const token = localStorage.getItem("token") || "";
        const response = await fetch(`/api/staff/salary`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (!response.ok) throw new Error("Failed to fetch salary slips");
        const data = await response.json();
        setSlips(Array.isArray(data) ? data : (data.data || []));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSlips();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-4">
      
      {/* Header */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 sm:p-5 flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1 h-5 bg-[#FF9933] rounded-full"></div>
          <h1 className="text-xl font-black text-stone-900 tracking-tight">My Salary Slips</h1>
        </div>
        <p className="text-[13px] font-medium text-stone-500">
          View and download your monthly salary slips
        </p>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden flex flex-col">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-stone-200 flex justify-end items-center bg-stone-50/30">
          <button className="px-4 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-bold text-stone-700 flex items-center justify-center gap-2 hover:bg-stone-50 transition-colors shadow-sm">
            <Filter size={14} /> Filters
          </button>
        </div>

        {/* Table Wrapper for Horizontal Scroll */}
        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
             <div className="flex items-center justify-center h-64 text-orange-400">
               <Loader2 className="animate-spin" size={48} />
             </div>
          ) : error ? (
             <div className="flex items-center justify-center h-64 text-red-500 font-bold">
               {error}
             </div>
          ) : slips.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-64 text-stone-500">
               <p className="font-bold">No salary slips found.</p>
             </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/50">
                  <th className="py-4 pl-6 pr-4 font-black text-[12px] text-stone-800 whitespace-nowrap">
                    <div className="flex items-center gap-1 cursor-pointer">
                      Month / Year <ChevronDown size={12} className="text-[#FF9933]" />
                    </div>
                  </th>
                  <th className="py-4 px-4 font-black text-[12px] text-stone-800 whitespace-nowrap">
                    <div className="flex items-center gap-1 cursor-pointer">
                      Gross <ChevronDown size={12} className="text-stone-400" />
                    </div>
                  </th>
                  <th className="py-4 px-4 font-black text-[12px] text-stone-800 whitespace-nowrap">
                    Deductions
                  </th>
                  <th className="py-4 px-4 font-black text-[12px] text-stone-800 whitespace-nowrap">
                    <div className="flex items-center gap-1 cursor-pointer">
                      Net Salary <ChevronDown size={12} className="text-stone-400" />
                    </div>
                  </th>
                  <th className="py-4 px-4 font-black text-[12px] text-stone-800 whitespace-nowrap">
                    <div className="flex items-center gap-1 cursor-pointer">
                      Status <ChevronDown size={12} className="text-stone-400" />
                    </div>
                  </th>
                  <th className="py-4 pr-6 pl-4 font-black text-[12px] text-stone-800 whitespace-nowrap text-right">
                    {/* Actions */}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 bg-white">
                {slips.map((slip, i) => (
                  <tr key={i} className="hover:bg-stone-50/50 transition-colors group">
                    <td className="py-4 pl-6 pr-4 whitespace-nowrap">
                      <span className="font-bold text-[13px] text-stone-800">{formatDate(slip.createdAt)}</span>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="font-black text-[13px] text-stone-800">₹{slip.grossSalary || 0}</span>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="font-bold text-[13px] text-red-600">-₹{slip.deductions || 0}</span>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="font-black text-[13px] text-green-600">₹{slip.netSalary || 0}</span>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest uppercase ${
                        slip.status === 'Paid' 
                          ? 'bg-green-50 text-green-600' 
                          : 'bg-amber-50 text-amber-600'
                      }`}>
                        {slip.status || "PENDING"}
                      </span>
                    </td>
                    <td className="py-4 pr-6 pl-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-3 text-stone-400">
                        <button className="hover:text-[#FF9933] transition-colors">
                          <Eye size={16} />
                        </button>
                        <button className="hover:text-[#FF9933] transition-colors">
                          <Download size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer / Pagination */}
        {!loading && slips.length > 0 && (
          <div className="p-4 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white">
            <div className="text-[12px] font-bold text-stone-500">
              1–{slips.length} of <span className="font-black text-stone-900">{slips.length}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 border border-stone-200 rounded-lg px-2 py-1.5 shadow-sm bg-white cursor-pointer hover:bg-stone-50 transition-colors">
                <span className="text-[12px] font-bold text-stone-700 pl-1">10</span>
                <ChevronDown size={14} className="text-stone-400" />
              </div>
              
              <div className="flex items-center gap-1">
                <button className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-300 border border-transparent cursor-not-allowed">
                  <ChevronLeft size={16} />
                </button>
                
                <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#FF9933] text-white font-black text-[13px] shadow-sm">
                  1
                </button>
                
                <button className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-300 border border-transparent cursor-not-allowed ml-1">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
