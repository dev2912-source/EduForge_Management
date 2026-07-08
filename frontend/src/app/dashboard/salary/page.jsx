"use client";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  X, ChevronDown, ChevronLeft, ChevronRight,
  Loader2, Eye, Download, Check
} from "lucide-react";
import { useRouter } from "next/navigation";
import FilterPanel from "@/components/FilterPanel";

const PAGE_LIMIT_KEY = "staff_salary_slips_page_limit";

const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-700",
  paid: "bg-green-50 text-green-700",
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function formatMonth(slipMonth) {
  if (!slipMonth) return "—";
  const d = new Date(slipMonth);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export default function MySalarySlipsPage() {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState("slip_month");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(PAGE_LIMIT_KEY);
        const n = parseInt(saved, 10);
        if ([10, 25, 50, 100].includes(n)) return n;
      } catch {}
    }
    return 10;
  });
  const [actionLoading, setActionLoading] = useState(new Set());
  const [downloading, setDownloading] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [pdfViewer, setPdfViewer] = useState({ show: false, url: null, label: "", filename: "", downloading: false });
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token") || "";
      const params = new URLSearchParams({ all: "true" });
      if (filters.month) params.set("month", filters.month);
      if (filters.year) params.set("year", filters.year);
      if (filters.payment_status) params.set("payment_status", filters.payment_status);
      params.set("sort_by", sortBy);
      params.set("sort_dir", sortDir);

      const res = await fetch(`/api/staff/salary?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to fetch");
      const items = result.data || [];
      setData(items);
    } catch (err) {
      console.error(err);
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy, sortDir]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const sortedData = useMemo(() => {
    const arr = [...data];
    arr.sort((a, b) => {
      let va, vb;
      if (sortBy === "slip_month") {
        va = a.slip_month ? new Date(a.slip_month).getTime() : 0;
        vb = b.slip_month ? new Date(b.slip_month).getTime() : 0;
      } else if (["gross_salary", "deductions", "net_salary"].includes(sortBy)) {
        va = a[sortBy] || 0;
        vb = b[sortBy] || 0;
      } else if (sortBy === "payment_status") {
        const order = { pending: 0, paid: 1 };
        va = order[a.payment_status] || 0;
        vb = order[b.payment_status] || 0;
      } else {
        va = String(a[sortBy] || "").toLowerCase();
        vb = String(b[sortBy] || "").toLowerCase();
      }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [data, sortBy, sortDir]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * limit;
    return sortedData.slice(start, start + limit);
  }, [sortedData, page, limit]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / limit));
  const total = sortedData.length;
  const startItem = sortedData.length === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, sortedData.length);

  const hasActiveFilters = filters.month || filters.year || filters.payment_status;

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDir(d => d === "desc" ? "asc" : "desc");
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
    setPage(1);
  };

  const handleLimitChange = (val) => {
    setLimit(val);
    setPage(1);
    try { localStorage.setItem(PAGE_LIMIT_KEY, String(val)); } catch {}
  };

  const clearFilters = () => {
    setFilters({});
    setPage(1);
  };

  const getPdfUrl = async (slip) => {
    const token = localStorage.getItem("token") || "";
    const res = await fetch(`/api/staff/salary/${slip._id}/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await res.json();
    if (!result.success || !result.data?.url) throw new Error("PDF not available");
    return result.data;
  };

  const handleViewSlip = async (slip) => {
    try {
      const data = await getPdfUrl(slip);
      setPdfViewer({
        show: true,
        url: data.url,
        label: formatMonth(slip.slip_month),
        filename: `Salary-Slip-${(slip.month || formatMonth(slip.slip_month)).replace(/\s+/g, "-")}.pdf`,
        downloading: false,
      });
    } catch (err) {
      alert("PDF not available for this slip");
    }
  };

  const handleDownloadPdf = async (slip) => {
    setDownloading(slip._id);
    try {
      const data = await getPdfUrl(slip);
      const pdfRes = await fetch(data.url);
      const blob = await pdfRes.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Salary-Slip-${(slip.month || formatMonth(slip.slip_month)).replace(/\s+/g, "-")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Download failed");
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadFromViewer = async () => {
    if (!pdfViewer.url) return;
    setPdfViewer(prev => ({ ...prev, downloading: true }));
    try {
      const res = await fetch(pdfViewer.url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = pdfViewer.filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setPdfViewer(prev => ({ ...prev, downloading: false }));
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/staff/salary/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to generate");
      await fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkPaid = async (id) => {
    setActionLoading(prev => new Set(prev).add(id));
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`/api/staff/salary/${id}/mark-paid`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.message || "Failed to mark as paid");
        return;
      }
      await fetchData();
    } catch (err) {
      alert("Server error");
    } finally {
      setActionLoading(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return <ChevronDown size={12} className="text-stone-300" />;
    return (
      <ChevronDown
        size={12}
        className={`text-[#FF9933] transition-transform ${sortDir === "asc" ? "rotate-180" : ""}`}
      />
    );
  };

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let s = Math.max(2, page - 1);
      let e = Math.min(totalPages - 1, page + 1);
      if (page <= 2) { s = 2; e = Math.min(4, totalPages - 1); }
      if (page >= totalPages - 1) { s = Math.max(totalPages - 3, 2); e = totalPages - 1; }
      if (s > 2) pages.push("...");
      for (let i = s; i <= e; i++) pages.push(i);
      if (e < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
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

      {/* Main Card */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden flex flex-col">

        {/* Toolbar */}
        <div className="px-3 py-2 border-b border-stone-200 bg-stone-50/30 flex items-center justify-end gap-2 min-h-[52px]">
          <FilterPanel
            namespace="staff-salary-slips"
            fields={[
              { key: "month", label: "Month", type: "select", options: MONTHS.map((m, i) => ({ value: String(i + 1), label: m })) },
              { key: "year", label: "Year", type: "select", options: Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => ({ value: String(y), label: String(y) })) },
              { key: "payment_status", label: "Status", type: "select", options: [{ value: "pending", label: "Pending" }, { value: "paid", label: "Paid" }] },
            ]}
            onApply={(results) => {
              const f = {};
              results.forEach((r) => {
                if (r.value && r.value !== "") f[r.field] = r.value;
              });
              setFilters(f);
              setPage(1);
            }}
          />
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="p-2 bg-white border border-stone-200 hover:bg-stone-50 rounded-lg text-stone-400 transition-colors shadow-sm flex items-center justify-center"
              title="Clear filters"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-[#FF9933]">
              <Loader2 className="animate-spin" size={48} />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-stone-500">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
                <X size={20} className="text-red-400" />
              </div>
              <p className="font-black text-[15px] text-stone-700">Failed to Load</p>
              <p className="text-[13px] text-stone-400 mt-1">{error}</p>
              <button
                onClick={fetchData}
                className="mt-4 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : sortedData.length === 0 && !error ? (
            <div className="flex flex-col items-center justify-center h-64 text-stone-500">
              <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mb-3">
                <X size={20} className="text-stone-400" />
              </div>
              <p className="font-black text-[15px] text-stone-700">No Salary Slips Yet</p>
              <p className="text-[13px] text-stone-400 mt-1">Your salary slips will appear here once generated.</p>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="mt-4 px-4 py-2 bg-[#FF9933] hover:bg-[#e68a00] text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {generating && <Loader2 size={14} className="animate-spin" />}
                Generate Salary Slip
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/50">
                  <th className="py-4 pl-6 pr-4 font-black text-[12px] text-stone-800 whitespace-nowrap">
                    <button onClick={() => handleSort("slip_month")} className="flex items-center gap-1 cursor-pointer hover:text-stone-900">
                      Month / Year <SortIcon field="slip_month" />
                    </button>
                  </th>
                  <th className="py-4 px-4 font-black text-[12px] text-stone-800 whitespace-nowrap hidden sm:table-cell">
                    <button onClick={() => handleSort("gross_salary")} className="flex items-center gap-1 cursor-pointer hover:text-stone-900">
                      Gross <SortIcon field="gross_salary" />
                    </button>
                  </th>
                  <th className="py-4 px-4 font-black text-[12px] text-stone-800 whitespace-nowrap hidden md:table-cell">
                    Deductions
                  </th>
                  <th className="py-4 px-4 font-black text-[12px] text-stone-800 whitespace-nowrap">
                    <button onClick={() => handleSort("net_salary")} className="flex items-center gap-1 cursor-pointer hover:text-stone-900">
                      Net Salary <SortIcon field="net_salary" />
                    </button>
                  </th>
                  <th className="py-4 px-4 font-black text-[12px] text-stone-800 whitespace-nowrap">
                    <button onClick={() => handleSort("payment_status")} className="flex items-center gap-1 cursor-pointer hover:text-stone-900">
                      Status <SortIcon field="payment_status" />
                    </button>
                  </th>
                  <th className="py-4 pr-6 pl-4 font-black text-[12px] text-stone-800 whitespace-nowrap text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 bg-white">
                {paginatedData.map((slip) => (
                  <tr
                    key={slip._id}
                    onClick={() => router.push(`/dashboard/staff/salary/${slip._id}`)}
                    className="hover:bg-stone-50/50 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 pl-6 pr-4 whitespace-nowrap">
                      <span className="font-bold text-[13px] text-stone-800">{formatMonth(slip.slip_month)}</span>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap hidden sm:table-cell">
                      <span className="font-black text-[13px] text-stone-800">{formatCurrency(slip.gross_salary)}</span>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap hidden md:table-cell">
                      <span className="font-bold text-[13px] text-red-600">-{formatCurrency(slip.deductions)}</span>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="font-black text-[13px] text-green-700">{formatCurrency(slip.net_salary)}</span>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest uppercase ${STATUS_STYLES[slip.payment_status] || "bg-stone-50 text-stone-500"}`}>
                        {slip.payment_status}
                      </span>
                    </td>
                    <td className="py-4 pr-6 pl-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* View Slip - opens PDF viewer */}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleViewSlip(slip); }}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="View Slip"
                        >
                          <Eye size={16} />
                        </button>
                        {/* Download PDF */}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDownloadPdf(slip); }}
                          disabled={downloading === slip._id}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-40"
                          title="Download PDF"
                        >
                          {downloading === slip._id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Download size={16} />
                          )}
                        </button>
                        {/* Mark as Paid */}
                        {slip.payment_status === "pending" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleMarkPaid(slip._id); }}
                            disabled={actionLoading.has(slip._id)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-green-600 hover:bg-green-50 transition-colors disabled:opacity-40"
                            title="Mark as Paid"
                          >
                            {actionLoading.has(slip._id) ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Check size={16} />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        {!loading && sortedData.length > 0 && (
          <div className="p-4 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white">
            <div className="text-[12px] font-bold text-stone-500 flex items-center gap-3">
              <span>
                {startItem}–{endItem} of <span className="font-black text-stone-900">{total}</span>
              </span>
              <div className="flex items-center gap-1">
                <span className="text-stone-400">Per page:</span>
                <select
                  value={limit}
                  onChange={(e) => handleLimitChange(parseInt(e.target.value, 10))}
                  className="text-[12px] font-bold text-stone-700 bg-white border border-stone-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20"
                >
                  {[10, 25, 50, 100].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
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
                {getPageNumbers().map((p, idx) =>
                  p === "..." ? (
                    <span key={`e${idx}`} className="px-1 text-xs text-stone-400">...</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg font-black text-[13px] transition-all ${
                        page === p
                          ? "bg-[#FF9933] text-white shadow-sm"
                          : "text-stone-600 hover:bg-stone-50 border border-stone-200 shadow-sm"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
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

      {/* PDF Viewer Modal */}
      {pdfViewer.show && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setPdfViewer(p => ({ ...p, show: false })); }}
        >
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="p-4 border-b border-stone-100 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-sm font-bold text-stone-900">Salary Slip</h2>
                <p className="text-xs text-stone-500 mt-0.5">{pdfViewer.label}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadFromViewer}
                  disabled={pdfViewer.downloading}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {pdfViewer.downloading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Download size={14} />
                  )}
                  Download
                </button>
                <button
                  onClick={() => setPdfViewer(p => ({ ...p, show: false }))}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            {/* PDF Content */}
            <div className="flex-1 bg-stone-50 overflow-hidden">
              <iframe
                src={pdfViewer.url}
                className="w-full h-[70vh]"
                title="Salary Slip PDF"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
