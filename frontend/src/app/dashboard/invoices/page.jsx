"use client";

import { useState, useEffect } from "react";
import { Search, Filter, ChevronDown, ChevronLeft, ChevronRight, MoreHorizontal, Info, Download, Loader2 } from "lucide-react";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination & Search state
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const limit = 10;

  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token") || "";
        const queryParams = new URLSearchParams({
          page,
          limit,
          ...(search && { search })
        });
        
        const response = await fetch(`/api/admin/invoices?${queryParams}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        
        if (!response.ok) throw new Error("Failed to fetch invoices");
        const data = await response.json();
        
        const resolvedData = Array.isArray(data) ? data : (data.data || []);
        setInvoices(resolvedData);
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
      fetchInvoices();
    }, 300);

    return () => clearTimeout(timer);
  }, [page, search]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-4">
      
      {/* Header */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1 h-5 bg-[#FF9933] rounded-full"></div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">Fee Invoices</h1>
        </div>
        <p className="text-[13px] font-medium text-stone-500">
          <span className="text-[#FF9933] font-black">{totalRecords}</span> invoices total
        </p>
      </div>

      {/* Info & Stats Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-blue-50/50 border border-blue-100 rounded-xl p-5 flex gap-4">
          <div className="text-blue-500 flex-shrink-0 mt-0.5">
            <Info size={20} strokeWidth={2.5} />
          </div>
          <div className="text-[13px] font-medium text-stone-600 leading-relaxed">
            <p className="mb-2">
              <strong className="text-stone-800">Invoices are automatically generated</strong> on the 1st of each month for all active students based on the fee structures defined for their class and academic year.
            </p>
            <p>
              Changes to fee structures — including updates to amounts or newly added structures — will only apply to invoices generated in the <strong>next cycle</strong>. Already-generated invoices are not affected retroactively.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 grid grid-cols-2 gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-stone-400 mb-1">Total Invoices</p>
            <p className="text-xl font-black text-stone-900">{totalRecords}</p>
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-stone-400 mb-1">Pending</p>
            {/* Real calculation could be done here if backend sends aggregates, keeping static placeholder as requested */}
            <p className="text-xl font-black text-amber-600">-</p>
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-stone-400 mb-1">Collected</p>
            <p className="text-xl font-black text-green-600">-</p>
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-stone-400 mb-1">Outstanding</p>
            <p className="text-xl font-black text-red-600">-</p>
          </div>
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
              placeholder="Search invoices..." 
              value={search}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-medium text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] transition-all shadow-sm"
            />
          </div>
          <button className="w-full sm:w-auto px-4 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-bold text-stone-700 flex items-center justify-center gap-2 hover:bg-stone-50 transition-colors shadow-sm">
            <Filter size={14} /> Filters
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-orange-400">
              <Loader2 className="animate-spin" size={48} />
            </div>
          ) : error ? (
             <div className="flex items-center justify-center h-64 text-red-500 font-bold">
               {error}
             </div>
          ) : invoices.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-64 text-stone-500">
               <p className="font-bold">No invoices found.</p>
               <p className="text-sm">Try adjusting your search filters.</p>
             </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/50">
                  <th className="py-4 pl-5 pr-2 font-black text-[12px] text-stone-800 whitespace-nowrap">
                    <input type="checkbox" className="w-3.5 h-3.5 rounded border-stone-300 text-[#FF9933] focus:ring-[#FF9933]" />
                  </th>
                  <th className="py-4 px-3 font-black text-[12px] text-stone-800 whitespace-nowrap">
                    Invoice # <ChevronDown size={12} className="inline text-stone-400" />
                  </th>
                  <th className="py-4 px-3 font-black text-[12px] text-stone-800 whitespace-nowrap">
                    Student <ChevronDown size={12} className="inline text-stone-400" />
                  </th>
                  <th className="py-4 px-3 font-black text-[12px] text-stone-800 whitespace-nowrap text-right">
                    Amount
                  </th>
                  <th className="py-4 px-3 font-black text-[12px] text-stone-800 whitespace-nowrap text-right">
                    Paid
                  </th>
                  <th className="py-4 px-3 font-black text-[12px] text-stone-800 whitespace-nowrap text-right">
                    Balance
                  </th>
                  <th className="py-4 px-3 font-black text-[12px] text-stone-800 whitespace-nowrap">
                    Due Date <ChevronDown size={12} className="inline text-stone-400" />
                  </th>
                  <th className="py-4 px-3 font-black text-[12px] text-stone-800 whitespace-nowrap">
                    Status <ChevronDown size={12} className="inline text-stone-400" />
                  </th>
                  <th className="py-4 px-3 font-black text-[12px] text-stone-800 whitespace-nowrap">
                    Academic Year
                  </th>
                  <th className="py-4 px-3 font-black text-[12px] text-stone-800 whitespace-nowrap text-right">
                    {/* Actions */}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 bg-white">
                {invoices.map((inv, i) => (
                  <tr key={i} className="hover:bg-stone-50/50 transition-colors group">
                    <td className="py-4 pl-5 pr-2 whitespace-nowrap">
                      <input type="checkbox" className="w-3.5 h-3.5 rounded border-stone-300 text-[#FF9933] focus:ring-[#FF9933]" />
                    </td>
                    <td className="py-4 px-3 whitespace-nowrap">
                      <span className="font-bold text-[12px] text-[#FF9933] hover:underline cursor-pointer">{inv.invoiceId || inv._id}</span>
                    </td>
                    <td className="py-4 px-3 whitespace-nowrap">
                      <div className="font-black text-[13px] text-stone-800">{inv.studentName || "—"}</div>
                      <div className="font-bold text-[10px] text-stone-400 tracking-wider font-mono mt-0.5">{inv.student || "—"}</div>
                    </td>
                    <td className="py-4 px-3 whitespace-nowrap text-right">
                      <span className="font-bold text-[13px] text-stone-800">₹{inv.amount || 0}</span>
                    </td>
                    <td className="py-4 px-3 whitespace-nowrap text-right">
                      <span className="font-bold text-[13px] text-green-600">₹{inv.paidAmount || 0}</span>
                    </td>
                    <td className="py-4 px-3 whitespace-nowrap text-right">
                      <span className="font-bold text-[13px] text-red-600">₹{(inv.amount || 0) - (inv.paidAmount || 0)}</span>
                    </td>
                    <td className="py-4 px-3 whitespace-nowrap">
                      <span className="font-bold text-[12px] text-stone-600">{formatDate(inv.dueDate)}</span>
                    </td>
                    <td className="py-4 px-3 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest uppercase border ${
                        inv.status === 'Paid' ? 'bg-green-50 text-green-600 border-green-200' :
                        inv.status === 'Overdue' ? 'bg-red-50 text-red-600 border-red-200' :
                        'bg-amber-50 text-amber-600 border-amber-200'
                      }`}>
                        {inv.status || "Pending"}
                      </span>
                    </td>
                    <td className="py-4 px-3 whitespace-nowrap">
                      <span className="font-bold text-[12px] text-stone-500">{inv.academicYear || "—"}</span>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-right">
                      <button className="text-stone-400 hover:text-stone-600 transition-colors">
                        <Download size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer / Pagination */}
        {!loading && invoices.length > 0 && (
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
