"use client";

import { useState, useEffect } from "react";
import { Search, Filter, X, ChevronDown, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LeaveApprovalsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination & Search state
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const limit = 10;
  
  const [role, setRole] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      setRole(user.role);
      
      if (!user.role || (user.role !== 'admin' && user.role !== 'staff')) {
        throw new Error("Unauthorized to view leave approvals");
      }

      const endpoint = user.role === 'admin' ? `/api/admin/leave-requests` : `/api/staff/leave-approvals`;
      
      const queryParams = new URLSearchParams({
        page,
        limit,
        ...(search && { search })
      });
      
      const response = await fetch(`${endpoint}?${queryParams}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error("Failed to fetch leave requests");
      const data = await response.json();
      
      const resolvedData = Array.isArray(data) ? data : (data.data || []);
      setRequests(resolvedData);
      setTotalPages(data.pages || 1);
      setTotalRecords(data.total || resolvedData.length);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRequests();
    }, 300);

    return () => clearTimeout(timer);
  }, [page, search]);

  const handleStatusChange = async (id, status) => {
    try {
      const token = localStorage.getItem("token") || "";
      const endpoint = role === 'admin' 
        ? `/api/admin/leave-requests/${id}/status` 
        : `/api/staff/leave-approvals/${id}/status`;
        
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchRequests(); // refresh list
      } else {
        const errData = await res.json();
        alert(errData.message || "Failed to update status");
      }
    } catch (err) {
      alert("Server error");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  };
  
  const formatShortDate = (dateStr) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-4">
      
      {/* Header */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 sm:p-5 flex items-center">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-[#FF9933] rounded-full"></div>
          <h1 className="text-xl font-black text-stone-900 tracking-tight">Leave Requests</h1>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden flex flex-col">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-stone-200 flex flex-col sm:flex-row justify-end items-center gap-2 bg-stone-50/30">
          <div className="relative w-full sm:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={14} className="text-stone-400" />
            </div>
            <input 
              type="text" 
              placeholder="Search by applicant name..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-medium text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] transition-all shadow-sm"
            />
          </div>
          
          <button className="w-full sm:w-auto px-4 py-2 bg-[#FF9933] hover:bg-orange-500 border border-transparent rounded-lg text-[13px] font-bold text-white flex items-center justify-center gap-2 transition-colors shadow-sm">
            <Filter size={14} /> 
            Filters
          </button>

          <button 
            onClick={() => { setSearch(''); setPage(1); }}
            className="w-full sm:w-auto p-2 bg-white border border-stone-200 hover:bg-stone-50 rounded-lg text-stone-400 transition-colors shadow-sm flex items-center justify-center"
          >
            <X size={16} />
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
          ) : requests.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-64 text-stone-500">
               <p className="font-bold">No leave requests found.</p>
             </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/50">
                  <th className="py-4 pl-5 pr-2 font-black text-[12px] text-stone-800 whitespace-nowrap w-12">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="w-3.5 h-3.5 rounded border-stone-300 text-[#FF9933] focus:ring-[#FF9933]" />
                      <ChevronDown size={14} className="text-stone-400" />
                    </div>
                  </th>
                  <th className="py-4 px-4 font-black text-[12px] text-stone-800 whitespace-nowrap">
                    Applicant
                  </th>
                  <th className="py-4 px-4 font-black text-[12px] text-stone-800 whitespace-nowrap">
                    Type
                  </th>
                  <th className="py-4 px-4 font-black text-[12px] text-stone-800 whitespace-nowrap">
                    <div className="flex items-center gap-1 cursor-pointer">
                      Dates
                    </div>
                  </th>
                  <th className="py-4 px-4 font-black text-[12px] text-stone-800 whitespace-nowrap">
                    Reason
                  </th>
                  <th className="py-4 px-4 font-black text-[12px] text-stone-800 whitespace-nowrap">
                    <div className="flex items-center gap-1 cursor-pointer">
                      Applied On <ChevronDown size={12} className="text-[#FF9933]" />
                    </div>
                  </th>
                  <th className="py-4 px-4 font-black text-[12px] text-stone-800 whitespace-nowrap">
                    <div className="flex items-center gap-1 cursor-pointer">
                      Status <ChevronDown size={12} className="text-stone-400" />
                    </div>
                  </th>
                  <th className="py-4 px-4 font-black text-[12px] text-stone-800 whitespace-nowrap text-right">
                    {/* Actions */}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 bg-white">
                {requests.map((req, i) => (
                  <tr key={i} className="hover:bg-stone-50/50 transition-colors group">
                    <td className="py-4 pl-5 pr-2 whitespace-nowrap">
                      <input type="checkbox" className="w-3.5 h-3.5 rounded border-stone-300 text-[#FF9933] focus:ring-[#FF9933]" />
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FF9933]"></div>
                        <div>
                          <div className="font-black text-[13px] text-stone-800">{req.studentName || "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      {/* Determine type roughly based on current role context (admin sees staff, staff sees student) */}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase ${
                        role === 'admin' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {role === 'admin' ? 'STAFF' : 'STUDENT'}
                      </span>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="font-bold text-[12px] text-stone-800">
                        {formatShortDate(req.fromDate)} – {formatShortDate(req.toDate)}
                      </span>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap max-w-[200px] truncate">
                      <span className="font-medium text-[13px] text-stone-600" title={req.reason}>{req.reason}</span>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="font-bold text-[12px] text-stone-800">{formatShortDate(req.createdAt)}</span>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest uppercase ${
                        req.status === 'approved' ? 'bg-green-50 text-green-600' :
                        req.status === 'rejected' ? 'bg-red-50 text-red-600' :
                        'bg-yellow-50 text-yellow-600'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-right">
                      {req.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleStatusChange(req._id, 'approved')}
                            className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-md text-[11px] font-black tracking-wide transition-colors"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleStatusChange(req._id, 'rejected')}
                            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-md text-[11px] font-black tracking-wide transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <div className="text-[11px] font-bold text-stone-400">—</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer / Pagination */}
        {!loading && requests.length > 0 && (
          <div className="p-4 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white">
            <div className="text-[12px] font-bold text-stone-500">
              {((page - 1) * limit) + 1}–{Math.min(page * limit, totalRecords)} of <span className="font-black text-stone-900">{totalRecords}</span>
            </div>
            <div className="flex items-center gap-3">
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
