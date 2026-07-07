"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Filter, ChevronDown, Edit, ChevronLeft, ChevronRight, MoreHorizontal, Loader2 } from "lucide-react";

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination & Search state
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const limit = 10;

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token") || "";
        const queryParams = new URLSearchParams({
          page,
          limit,
          ...(search && { search })
        });
        
        const response = await fetch(`/api/admin/students?${queryParams}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        
        if (!response.ok) throw new Error("Failed to fetch students");
        const data = await response.json();
        
        const resolvedData = Array.isArray(data) ? data : (data.data || []);
        setStudents(resolvedData);
        setTotalPages(data.pages || 1);
        setTotalRecords(data.total || resolvedData.length);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search slightly
    const timer = setTimeout(() => {
      fetchStudents();
    }, 300);

    return () => clearTimeout(timer);
  }, [page, search]);

  const calculateAge = (dob) => {
    if (!dob) return "";
    const diff = Date.now() - new Date(dob).getTime();
    const ageDate = new Date(diff);
    return `(${Math.abs(ageDate.getUTCFullYear() - 1970)} yrs)`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1); // Reset to page 1 on new search
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-4">
      
      {/* Header */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 sm:p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-5 bg-[#FF9933] rounded-full"></div>
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">Students</h1>
          </div>
          <p className="text-[13px] font-medium text-stone-500">
            <span className="text-[#FF9933] font-black">{totalRecords}</span> students enrolled
          </p>
        </div>
        <div>
          <button className="bg-stone-900 hover:bg-stone-800 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
            <Plus size={16} strokeWidth={3} /> Admit Student
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden flex flex-col">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-stone-200 flex flex-col sm:flex-row justify-end items-center gap-3 bg-stone-50/30">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={14} className="text-stone-400" />
            </div>
            <input 
              type="text" 
              placeholder="Search students..." 
              value={search}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-medium text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] transition-all shadow-sm"
            />
          </div>
          <button className="w-full sm:w-auto px-4 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-bold text-stone-700 flex items-center justify-center gap-2 hover:bg-stone-50 transition-colors shadow-sm">
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
          ) : students.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-64 text-stone-500">
               <p className="font-bold">No students found.</p>
               <p className="text-sm">Try adjusting your search filters.</p>
             </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/50">
                  <th className="py-4 pl-5 pr-2 font-black text-[12px] text-stone-800 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="w-3.5 h-3.5 rounded border-stone-300 text-[#FF9933] focus:ring-[#FF9933]" />
                      <ChevronDown size={14} className="text-stone-400" />
                    </div>
                  </th>
                  <th className="py-4 px-3 font-black text-[12px] text-stone-800 whitespace-nowrap">
                    <div className="flex items-center gap-1 cursor-pointer">
                      Full Name <ChevronDown size={12} className="text-stone-400" />
                    </div>
                  </th>
                  <th className="py-4 px-3 font-black text-[12px] text-stone-800 whitespace-nowrap">
                    <div className="flex items-center gap-1 cursor-pointer">
                      Enrollment ID <ChevronDown size={12} className="text-stone-400" />
                    </div>
                  </th>
                  <th className="py-4 px-3 font-black text-[12px] text-stone-800 whitespace-nowrap">
                    <div className="flex items-center gap-1 cursor-pointer">
                      Gender <ChevronDown size={12} className="text-stone-400" />
                    </div>
                  </th>
                  <th className="py-4 px-3 font-black text-[12px] text-stone-800 whitespace-nowrap">
                    <div className="flex items-center gap-1 cursor-pointer">
                      DOB / Age <ChevronDown size={12} className="text-stone-400" />
                    </div>
                  </th>
                  <th className="py-4 px-3 font-black text-[12px] text-stone-800 whitespace-nowrap">
                    Class
                  </th>
                  <th className="py-4 px-3 font-black text-[12px] text-stone-800 whitespace-nowrap">
                    <div className="flex items-center gap-1 cursor-pointer">
                      Status <ChevronDown size={12} className="text-stone-400" />
                    </div>
                  </th>
                  <th className="py-4 px-3 font-black text-[12px] text-stone-800 whitespace-nowrap">
                    <div className="flex items-center gap-1 cursor-pointer">
                      Created At <ChevronDown size={12} className="text-[#FF9933]" />
                    </div>
                  </th>
                  <th className="py-4 px-3 font-black text-[12px] text-stone-800 whitespace-nowrap">
                    <div className="flex items-center gap-1 cursor-pointer">
                      Updated At <ChevronDown size={12} className="text-stone-400" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 bg-white">
                {students.map((s, i) => (
                  <tr key={i} className="hover:bg-stone-50/50 transition-colors group">
                    <td className="py-4 pl-5 pr-2 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" className="w-3.5 h-3.5 rounded border-stone-300 text-[#FF9933] focus:ring-[#FF9933]" />
                        <button className="text-stone-400 hover:text-stone-600 transition-colors">
                          <Edit size={14} />
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-3 whitespace-nowrap">
                      <span className="font-black text-[13px] text-stone-800">{s.name}</span>
                    </td>
                    <td className="py-4 px-3 whitespace-nowrap">
                      <span className="font-bold text-[11px] text-stone-400 tracking-wider font-mono">{s.profile?.rollNumber || s.schoolId || "—"}</span>
                    </td>
                    <td className="py-4 px-3 whitespace-nowrap">
                      <span className="font-bold text-[12px] text-stone-700">{s.profile?.gender || "—"}</span>
                    </td>
                    <td className="py-4 px-3 whitespace-nowrap">
                      <span className="font-bold text-[12px] text-stone-700">{formatDate(s.profile?.dateOfBirth)}</span>
                      {s.profile?.dateOfBirth && <span className="text-[11px] font-medium text-stone-400 ml-1">{calculateAge(s.profile?.dateOfBirth)}</span>}
                    </td>
                    <td className="py-4 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-[12px] text-stone-800">{s.profile?.className || "—"}</span>
                        {s.profile?.section && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-stone-100 text-stone-500">
                            {s.profile?.section}
                          </span>
                        )}
                        {/* We don't have medium in User model currently, omitting for now unless added */}
                      </div>
                    </td>
                    <td className="py-4 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black tracking-widest uppercase ${
                        s.profile?.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {s.profile?.status || "active"}
                      </span>
                    </td>
                    <td className="py-4 px-3 whitespace-nowrap">
                      <span className="font-bold text-[11px] text-stone-500">{formatDate(s.createdAt)}</span>
                    </td>
                    <td className="py-4 px-3 whitespace-nowrap">
                      <span className="font-bold text-[11px] text-stone-500">{formatDate(s.updatedAt)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer / Pagination */}
        {!loading && students.length > 0 && (
          <div className="p-4 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white">
            <div className="text-[12px] font-bold text-stone-500">
              {((page - 1) * limit) + 1}–{Math.min(page * limit, totalRecords)} of <span className="font-black text-stone-900">{totalRecords}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 border border-stone-200 rounded-lg px-2 py-1.5 shadow-sm">
                <span className="text-[12px] font-bold text-stone-700 pl-1">{limit}</span>
                <ChevronDown size={14} className="text-stone-400" />
              </div>
              
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:bg-stone-50 transition-colors border border-transparent disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
                </button>
                
                <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#FF9933] text-white font-black text-[13px] shadow-sm">
                  {page}
                </button>

                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-600 hover:bg-stone-50 transition-colors border border-stone-200 shadow-sm ml-1 disabled:opacity-50"
                >
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
