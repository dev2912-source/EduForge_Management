"use client";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Search, X, ChevronDown, ChevronLeft, ChevronRight,
  Loader2, Check, FileText, FileSpreadsheet, Download,
  CheckCircle2
} from "lucide-react";
import FilterPanel from "@/components/FilterPanel";

const PAGE_LIMIT_KEY = "leave_requests_page_limit";

const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-600",
};

const TYPE_STYLES = {
  student: "bg-blue-50 text-blue-600",
  staff: "bg-purple-50 text-purple-600",
  teacher: "bg-purple-50 text-purple-600",
};

export default function LeaveApprovalsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState({});
  const [selected, setSelected] = useState(new Set());
  const [selectAllMode, setSelectAllMode] = useState(false);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [confirmModal, setConfirmModal] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(new Set());
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(PAGE_LIMIT_KEY);
        const n = parseInt(saved, 10);
        if ([10, 20, 25, 50, 100].includes(n)) return n;
      } catch {}
    }
    return 20;
  });
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportBtnRef = useRef(null);
  const exportDropRef = useRef(null);
  const debounceRef = useRef(null);
  const searchRef = useRef(null);

  const clearSelection = () => {
    setSelected(new Set());
    setSelectAllMode(false);
  };

  const handleSearchInput = (e) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
      clearSelection();
    }, 350);
  };

  const clearSearch = () => {
    setSearch("");
    setDebouncedSearch("");
    setPage(1);
    clearSelection();
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const params = new URLSearchParams({ all: "true" });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (filters.status) params.set("status", filters.status);
      if (filters.requester_type) params.set("requester_type", filters.requester_type);
      if (filters.date_from) params.set("date_from", filters.date_from);
      if (filters.date_to) params.set("date_to", filters.date_to);
      params.set("sort_by", sortBy);
      params.set("sort_dir", sortDir);

      const endpoint = user.role === "admin"
        ? "/api/admin/leave-requests"
        : "/api/staff/leave-approvals";

      const res = await fetch(`${endpoint}?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to fetch");
      const items = Array.isArray(result) ? result : (result.data || []);
      setData(items);
    } catch (err) {
      console.error(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filters, sortBy, sortDir]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    function handleClick(e) {
      if (
        showExportMenu &&
        exportBtnRef.current && !exportBtnRef.current.contains(e.target) &&
        exportDropRef.current && !exportDropRef.current.contains(e.target)
      ) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showExportMenu]);

  const hasActiveFilters = debouncedSearch || filters.status || filters.requester_type || filters.date_from || filters.date_to;
  const activeFilterCount = [filters.status, filters.requester_type, filters.date_from, filters.date_to].filter(Boolean).length;

  const sortedData = useMemo(() => {
    const arr = [...data];
    arr.sort((a, b) => {
      let va, vb;
      if (sortBy === "createdAt" || sortBy === "fromDate" || sortBy === "toDate") {
        va = new Date(a[sortBy]).getTime();
        vb = new Date(b[sortBy]).getTime();
      } else if (sortBy === "status") {
        const order = { pending: 0, approved: 1, rejected: 2 };
        va = order[a.status] || 0;
        vb = order[b.status] || 0;
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

  const allOnPageSelected = paginatedData.length > 0 && paginatedData.every(r => selected.has(r._id));
  const someOnPageSelected = !allOnPageSelected && paginatedData.some(r => selected.has(r._id));

  const handleSelectOne = (id) => {
    setSelectAllMode(false);
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectAllMode(false);
    if (allOnPageSelected) {
      setSelected(prev => {
        const next = new Set(prev);
        paginatedData.forEach(r => next.delete(r._id));
        return next;
      });
    } else {
      setSelected(prev => {
        const next = new Set(prev);
        paginatedData.forEach(r => next.add(r._id));
        return next;
      });
    }
  };

  const selectAllRecords = () => {
    setSelectAllMode(true);
    setSelected(new Set(sortedData.map(r => r._id)));
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDir(d => d === "desc" ? "asc" : "desc");
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
    setPage(1);
    clearSelection();
  };

  const handleAction = async (id, action) => {
    setActionLoading(prev => new Set(prev).add(id));
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`/api/staff/leave-approvals/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: action }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.message || "Action failed");
        return;
      }
      await fetchData();
      clearSelection();
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

  const handleBulkAction = async () => {
    if (!confirmModal) return;
    setConfirmLoading(true);
    const { ids, action } = confirmModal;
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/staff/leave-approvals/bulk-action", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ids: Array.from(ids), action }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.message || "Bulk action failed");
        return;
      }
      setConfirmModal(null);
      clearSelection();
      await fetchData();
    } catch (err) {
      alert("Server error");
    } finally {
      setConfirmLoading(false);
    }
  };

  const exportData = (format) => {
    const rows = selectAllMode ? sortedData : data.filter(r => selected.has(r._id));
    if (rows.length === 0) return;
    const headers = ["Applicant", "Code", "Type", "From", "To", "Reason", "Applied On", "Status"];
    const sep = format === "csv" ? "," : "\t";
    const ext = format === "csv" ? "csv" : "xls";
    const mime = format === "csv" ? "text/csv" : "application/vnd.ms-excel";
    const content = [
      headers.join(sep),
      ...rows.map(r => [
        r.student?.name || "—",
        r.student?.schoolId || r.student?.profile?.rollNumber || "—",
        r.student?.role || "—",
        new Date(r.fromDate).toLocaleDateString("en-CA"),
        new Date(r.toDate).toLocaleDateString("en-CA"),
        r.reason || "",
        new Date(r.createdAt).toLocaleDateString("en-CA"),
        r.status,
      ].map(v => format === "csv" ? `"${String(v).replace(/"/g, '""')}"` : v).join(sep))
    ].join("\n");
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leave-requests.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handleLimitChange = (val) => {
    setLimit(val);
    setPage(1);
    clearSelection();
    try { localStorage.setItem(PAGE_LIMIT_KEY, String(val)); } catch {}
  };

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setFilters({});
    setPage(1);
    clearSelection();
    if (searchRef.current) searchRef.current.value = "";
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, page - 1);
      let end = Math.min(totalPages - 1, page + 1);
      if (page <= 2) { start = 2; end = Math.min(4, totalPages - 1); }
      if (page >= totalPages - 1) { start = Math.max(totalPages - 3, 2); end = totalPages - 1; }
      if (start > 2) pages.push("...");
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-4">

      {/* Header */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 sm:p-5 flex items-center">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-[#FF9933] rounded-full"></div>
          <h1 className="text-xl font-black text-stone-900 tracking-tight">Leave Requests</h1>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden flex flex-col">

        {/* Toolbar */}
        <div className="px-3 py-2 border-b border-stone-200 bg-stone-50/30 flex items-center justify-between gap-2 flex-wrap min-h-[52px]">
          {/* Left: selection count + actions + export */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {(selected.size > 0 || selectAllMode) && (
              <>
                <span className="text-[13px] font-bold text-stone-700 whitespace-nowrap">
                  {selectAllMode ? `All ${sortedData.length}` : selected.size} selected
                </span>
                <button
                  onClick={() => setConfirmModal({ ids: selected, action: "approved" })}
                  className="px-2.5 py-1.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-md text-[11px] font-black tracking-wide transition-colors flex items-center gap-1"
                >
                  <Check size={12} /> Approve
                </button>
                <button
                  onClick={() => setConfirmModal({ ids: selected, action: "rejected" })}
                  className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-md text-[11px] font-black tracking-wide transition-colors flex items-center gap-1"
                >
                  <X size={12} /> Reject
                </button>
                <div className="relative">
                  <button
                    ref={exportBtnRef}
                    onClick={() => setShowExportMenu(v => !v)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-green-600 hover:bg-green-50 border border-transparent hover:border-green-100 transition-all"
                    title="Export"
                  >
                    <Download size={14} />
                  </button>
                  {showExportMenu && (
                    <div
                      ref={exportDropRef}
                      className="fixed z-[9999] w-36 bg-white rounded-xl border border-stone-200 py-1 shadow-lg shadow-stone-200/60"
                      style={{
                        top: (exportBtnRef.current?.getBoundingClientRect().bottom + 4) + "px",
                        left: (exportBtnRef.current?.getBoundingClientRect().left) + "px"
                      }}
                    >
                      <button
                        onClick={() => exportData("csv")}
                        className="w-full text-left px-3.5 py-2 text-xs font-bold text-stone-700 hover:bg-stone-50 transition-colors flex items-center gap-2"
                      >
                        <FileText size={14} className="text-stone-400" /> Export CSV
                      </button>
                      <button
                        onClick={() => exportData("xls")}
                        className="w-full text-left px-3.5 py-2 text-xs font-bold text-stone-700 hover:bg-green-50 transition-colors flex items-center gap-2"
                      >
                        <FileSpreadsheet size={14} className="text-green-500" /> Export Excel
                      </button>
                    </div>
                  )}
                </div>
                <div className="w-px h-5 bg-stone-200 mx-1" />
              </>
            )}
          </div>

          {/* Right: search + filters + clear */}
          <div className="flex items-center gap-2 flex-1 justify-end">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={14} className="text-stone-400" />
              </div>
              <input
                ref={searchRef}
                type="text"
                placeholder="Search by applicant name or code..."
                value={search}
                onInput={handleSearchInput}
                className="w-full pl-9 pr-8 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-medium text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] transition-all shadow-sm"
              />
              {search && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500"
                >
                  <X size={12} strokeWidth={2.5} />
                </button>
              )}
            </div>

            {/* Filters */}
            <FilterPanel
              namespace="leave-approvals"
              fields={[
                { key: "status", label: "Status", type: "select", options: [
                  { value: "pending", label: "Pending" },
                  { value: "approved", label: "Approved" },
                  { value: "rejected", label: "Rejected" },
                ]},
                { key: "requester_type", label: "Type", type: "select", options: [
                  { value: "staff", label: "Staff" },
                  { value: "student", label: "Student" },
                ]},
                { key: "date_from", label: "From date", type: "date" },
                { key: "date_to", label: "To date", type: "date" },
              ]}
              onApply={(results) => {
                const f = {};
                results.forEach((r) => {
                  if (r.value && r.value !== "") f[r.field] = r.value;
                });
                setFilters(f);
                setPage(1);
                clearSelection();
              }}
            />

            {/* Clear filters */}
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
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-[#FF9933]">
              <Loader2 className="animate-spin" size={48} />
            </div>
          ) : sortedData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-stone-500">
              <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mb-3">
                <X size={20} className="text-stone-400" />
              </div>
              <p className="font-black text-[15px] text-stone-700">No Leave Requests</p>
              <p className="text-[13px] text-stone-400 mt-1">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <>
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/50">
                    <th className="py-4 pl-5 pr-2 font-black text-[12px] text-stone-800 whitespace-nowrap w-12">
                      <button
                        onClick={handleSelectAll}
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                          allOnPageSelected || selectAllMode
                            ? "bg-[#FF9933] border-[#FF9933]"
                            : someOnPageSelected
                              ? "border-[#FF9933]"
                              : "border-stone-300 hover:border-[#FF9933]"
                        }`}
                      >
                        {(allOnPageSelected || selectAllMode) && (
                          <CheckCircle2 size={12} className="text-white" />
                        )}
                      </button>
                    </th>
                    <th className="py-4 px-4 font-black text-[12px] text-stone-800 whitespace-nowrap">
                      Applicant
                    </th>
                    <th className="py-4 px-4 font-black text-[12px] text-stone-800 whitespace-nowrap">
                      Type
                    </th>
                    <th className="py-4 px-4 font-black text-[12px] text-stone-800 whitespace-nowrap">
                      <button onClick={() => handleSort("fromDate")} className="flex items-center gap-1 cursor-pointer hover:text-stone-900">
                        Dates <SortIcon field="fromDate" />
                      </button>
                    </th>
                    <th className="py-4 px-4 font-black text-[12px] text-stone-800 whitespace-nowrap">
                      Reason
                    </th>
                    <th className="py-4 px-4 font-black text-[12px] text-stone-800 whitespace-nowrap">
                      <button onClick={() => handleSort("createdAt")} className="flex items-center gap-1 cursor-pointer hover:text-stone-900">
                        Applied On <SortIcon field="createdAt" />
                      </button>
                    </th>
                    <th className="py-4 px-4 font-black text-[12px] text-stone-800 whitespace-nowrap">
                      <button onClick={() => handleSort("status")} className="flex items-center gap-1 cursor-pointer hover:text-stone-900">
                        Status <SortIcon field="status" />
                      </button>
                    </th>
                    <th className="py-4 px-4 font-black text-[12px] text-stone-800 whitespace-nowrap text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white">
                  {paginatedData.map((req) => (
                    <tr key={req._id} className={`hover:bg-stone-50/50 transition-colors group ${
                      selected.has(req._id) ? "bg-[#FF9933]/5" : ""
                    }`}>
                      <td className="py-4 pl-5 pr-2 whitespace-nowrap">
                        <button
                          onClick={() => handleSelectOne(req._id)}
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                            selected.has(req._id)
                              ? "bg-[#FF9933] border-[#FF9933]"
                              : "border-stone-300 hover:border-[#FF9933]"
                          }`}
                        >
                          {selected.has(req._id) && (
                            <CheckCircle2 size={12} className="text-white" />
                          )}
                        </button>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#FF9933]"></div>
                          <div>
                            <div className="font-black text-[13px] text-stone-800">{req.student?.name || "—"}</div>
                            <div className="text-[11px] font-bold text-stone-400">{req.student?.schoolId || req.student?.profile?.rollNumber || "—"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase ${TYPE_STYLES[req.student?.role] || "bg-stone-50 text-stone-500"}`}>
                          {req.student?.role || "—"}
                        </span>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="font-bold text-[12px] text-stone-800">
                          {new Date(req.fromDate).toLocaleDateString("en-US", { month: "short", day: "2-digit" })}
                          {" – "}
                          {new Date(req.toDate).toLocaleDateString("en-US", { month: "short", day: "2-digit" })}
                        </span>
                      </td>
                      <td className="py-4 px-4 max-w-[200px]">
                        <span className="font-medium text-[13px] text-stone-600 block truncate" title={req.reason}>{req.reason || "—"}</span>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="font-bold text-[12px] text-stone-800">
                          {new Date(req.createdAt).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
                        </span>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest uppercase ${STATUS_STYLES[req.status] || ""}`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap text-right">
                        {req.status === "pending" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleAction(req._id, "approved")}
                              disabled={actionLoading.has(req._id)}
                              className="px-2.5 py-1.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-md text-[11px] font-black tracking-wide transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                              {actionLoading.has(req._id) ? (
                                <Loader2 size={10} className="animate-spin" />
                              ) : (
                                <Check size={10} />
                              )}
                              Approve
                            </button>
                            <button
                              onClick={() => handleAction(req._id, "rejected")}
                              disabled={actionLoading.has(req._id)}
                              className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-md text-[11px] font-black tracking-wide transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                              {actionLoading.has(req._id) ? (
                                <Loader2 size={10} className="animate-spin" />
                              ) : (
                                <X size={10} />
                              )}
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

              {/* Select all records */}
              {!loading && sortedData.length > limit && allOnPageSelected && !selectAllMode && (
                <div className="px-4 py-2 border-t border-stone-100 bg-stone-50/30">
                  <button
                    onClick={selectAllRecords}
                    className="text-xs font-bold text-[#FF9933] hover:text-[#e68a00] transition-colors"
                  >
                    Select all {sortedData.length} records
                  </button>
                </div>
              )}
            </>
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
                  {[10, 20, 25, 50, 100].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setPage(p => Math.max(1, p - 1)); if (!selectAllMode) clearSelection(); }}
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
                      onClick={() => { setPage(p); if (!selectAllMode) clearSelection(); }}
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
                  onClick={() => { setPage(p => Math.min(totalPages, p + 1)); if (!selectAllMode) clearSelection(); }}
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

      {/* Confirm Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-stone-200 shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-[16px] font-black text-stone-900 mb-2">Confirm Action</h3>
            <p className="text-[13px] text-stone-600 mb-6">
              Are you sure you want to <span className="font-black text-stone-800">{confirmModal.action}</span>{" "}
              <span className="font-black text-stone-800">{confirmModal.ids.size}</span> leave request{confirmModal.ids.size !== 1 ? "s" : ""}?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                disabled={confirmLoading}
                className="px-4 py-2 bg-white border border-stone-200 hover:bg-stone-50 rounded-lg text-[13px] font-bold text-stone-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkAction}
                disabled={confirmLoading}
                className={`px-4 py-2 rounded-lg text-[13px] font-bold text-white transition-colors flex items-center gap-1.5 disabled:opacity-50 ${
                  confirmModal.action === "approved"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {confirmLoading && <Loader2 size={14} className="animate-spin" />}
                {confirmModal.action === "approved" ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
