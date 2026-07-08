"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search, Filter, X, ChevronDown, ChevronLeft, ChevronRight,
  Loader2, Info, Download, Eye
} from "lucide-react";
import { useRouter } from "next/navigation";
import FilterPanel from "@/components/FilterPanel";
import ExportMenu from "@/components/ExportMenu";
import StatusBadge from "@/components/StatusBadge";

const PAGE_LIMIT_KEY = "fee_invoices_page_limit";

function parseAmount(str) {
  if (!str) return 0;
  const num = parseInt(String(str).replace(/[^0-9.-]/g, ""), 10);
  return isNaN(num) ? 0 : num;
}

function formatINR(num) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "partial", label: "Partial" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
];

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [limit, setLimit] = useState(() => {
    try {
      const saved = localStorage.getItem(PAGE_LIMIT_KEY);
      const n = parseInt(saved, 10);
      return [10, 25, 50, 100].includes(n) ? n : 10;
    } catch {
      return 10;
    }
  });
  const debounceRef = useRef(null);
  const mountedRef = useRef(true);

  // Stats computed from invoices
  const stats = (() => {
    const pending = invoices.filter(
      (inv) => inv.status === "pending" || inv.status === "partial"
    ).length;
    const collected = invoices.reduce(
      (sum, inv) => sum + parseAmount(inv.paidAmount),
      0
    );
    const outstanding = invoices.reduce(
      (sum, inv) => sum + parseAmount(inv.balance || inv.amount),
      0
    );
    return { total: invoices.length, pending, collected, outstanding };
  })();

  const filterValue = (key) => {
    const entry = filters.find((f) => f.field === key);
    return entry?.value || "";
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const params = new URLSearchParams({ page, limit });
      if (search.trim()) params.set("search", search.trim());

      const statusVal = filterValue("status");
      if (statusVal) params.set("status", statusVal);

      const ayVal = filterValue("academic_year_id");
      if (ayVal) params.set("academic_year_id", ayVal);

      params.set("sort", `${sortBy}:${sortDir}`);

      const res = await fetch(`/api/admin/invoices?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      if (!mountedRef.current) return;
      const items = Array.isArray(data) ? data : data.data || [];
      setInvoices(items);
      setTotal(data.total || items.length);
      setPages(data.pages || 1);
    } catch (err) {
      console.error(err);
      if (mountedRef.current) setInvoices([]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [page, limit, search, filters, sortBy, sortDir]);

  const fetchAcademicYears = useCallback(async () => {
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/admin/academic-years", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (mountedRef.current) setAcademicYears(data.data || []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchAcademicYears();
    return () => { mountedRef.current = false; };
  }, [fetchAcademicYears]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchData, 350);
    return () => clearTimeout(debounceRef.current);
  }, [fetchData]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
    setPage(1);
  };

  const hasActiveFilters = search.trim() || filters.some((f) => f.value);

  const clearFilters = () => {
    setSearch("");
    setFilters([]);
    setPage(1);
  };

  const handleSelectOne = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selected.size === invoices.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(invoices.map((inv) => inv._id)));
    }
  };

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
    try { localStorage.setItem(PAGE_LIMIT_KEY, String(newLimit)); } catch {}
  };

  const handleExportCsv = () => {
    const rows = invoices.filter((inv) => selected.has(inv._id));
    if (rows.length === 0) return;
    const headers = ["Invoice #", "Student Name", "Amount", "Paid", "Balance", "Due Date", "Status", "Academic Year"];
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        [
          r.invoiceId,
          `"${r.studentName || ""}"`,
          parseAmount(r.amount),
          parseAmount(r.paidAmount),
          parseAmount(r.balance || r.amount) - parseAmount(r.paidAmount),
          r.dueDate || "",
          (r.status || "").toLowerCase(),
          r.academicYear || "",
        ].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoices-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    const rows = invoices.filter((inv) => selected.has(inv._id));
    if (rows.length === 0) return;
    const headers = ["Invoice #", "Student Name", "Amount", "Paid", "Balance", "Due Date", "Status", "Academic Year"];
    let html = "<table><thead><tr>" + headers.map((h) => `<th>${h}</th>`).join("") + "</tr></thead><tbody>";
    rows.forEach((r) => {
      html += "<tr>" +
        `<td>${r.invoiceId}</td>` +
        `<td>${(r.studentName || "").replace(/</g, "&lt;")}</td>` +
        `<td>${parseAmount(r.amount)}</td>` +
        `<td>${parseAmount(r.paidAmount)}</td>` +
        `<td>${parseAmount(r.balance || r.amount) - parseAmount(r.paidAmount)}</td>` +
        `<td>${r.dueDate || ""}</td>` +
        `<td>${(r.status || "").toLowerCase()}</td>` +
        `<td>${r.academicYear || ""}</td>` +
        "</tr>";
    });
    html += "</tbody></table>";
    const blob = new Blob([`<html>${html}</html>`], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoices-${new Date().toISOString().split("T")[0]}.xls`;
    a.click();
    URL.revokeObjectURL(url);
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
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-0.5">
          <div className="w-1 h-5 bg-[#FF9933] rounded-full"></div>
          <h1 className="text-xl font-black text-stone-900 tracking-tight">Fee Invoices</h1>
        </div>
        <p className="text-[13px] font-medium text-stone-500 ml-3">
          <span className="text-[#FF9933] font-black">{total}</span> invoices total
        </p>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 px-4 py-3 bg-blue-50 border border-blue-100 rounded-2xl text-[13px] text-blue-700 font-medium">
        <Info size={18} className="text-blue-500 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
        <div>
          <p><strong className="text-blue-800">Invoices are automatically generated</strong> on the 1st of each month for all active students based on the fee structures defined for their class and academic year.</p>
          <p className="mt-1">Changes to fee structures — including updates to amounts or newly added structures — will only apply to invoices generated in the <strong className="text-blue-800">next cycle</strong>. Already-generated invoices are not affected retroactively.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4">
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Total Invoices</p>
          <p className="text-2xl font-bold text-stone-800 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4">
          <p className="text-[10px] font-black text-amber-500 uppercase tracking-wider">Pending</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4">
          <p className="text-[10px] font-black text-green-500 uppercase tracking-wider">Collected</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{formatINR(stats.collected)}</p>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4">
          <p className="text-[10px] font-black text-red-400 uppercase tracking-wider">Outstanding</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{formatINR(stats.outstanding)}</p>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden flex flex-col">

        {/* Toolbar */}
        <div className="px-3 py-2 border-b border-stone-100 flex items-center justify-between gap-2 bg-stone-50/30 min-h-[52px]">
          {/* Selection info */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {selected.size > 0 && (
              <>
                <span className="text-xs font-bold text-stone-500">{selected.size} selected</span>
                <div className="w-px h-4 bg-stone-200 mx-0.5" />
                <ExportMenu onCsv={handleExportCsv} onExcel={handleExportExcel} />
              </>
            )}
          </div>

          {/* Search + Filters */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative w-full sm:w-48">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={14} className="text-stone-400" />
              </div>
              <input
                type="text"
                placeholder="Search…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-4 py-1.5 bg-white border border-stone-200 rounded-lg text-[13px] font-medium text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] transition-all shadow-sm"
              />
            </div>

            {/* FilterPanel */}
            <FilterPanel
              namespace="fee-invoices"
              fields={[
                { key: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
                { key: "academic_year_id", label: "Academic Year", type: "select", options: academicYears },
              ]}
              onApply={(results) => {
                setFilters(results.filter((r) => r.value && r.value !== ""));
                setPage(1);
              }}
            />

            {/* Clear */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="p-1.5 bg-white border border-stone-200 hover:bg-stone-50 rounded-lg text-stone-400 transition-colors shadow-sm flex items-center justify-center"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-orange-400">
              <Loader2 className="animate-spin" size={48} />
            </div>
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-stone-500">
              <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mb-3">
                <X size={20} className="text-stone-400" />
              </div>
              <p className="font-black text-[15px] text-stone-700">No Invoices Found</p>
              <p className="text-[13px] text-stone-400 mt-1">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/50">
                  <th className="py-3 pl-4 pr-2 font-black text-[12px] text-stone-800 whitespace-nowrap w-12">
                    <input
                      type="checkbox"
                      checked={selected.size === invoices.length && invoices.length > 0}
                      onChange={handleSelectAll}
                      className="w-3.5 h-3.5 rounded border-stone-300 text-[#FF9933] focus:ring-[#FF9933]"
                    />
                  </th>
                  <th className="py-3 px-3 font-black text-[12px] text-stone-800 whitespace-nowrap">
                    <button onClick={() => handleSort("invoiceId")} className="flex items-center gap-1 cursor-pointer hover:text-stone-900">
                      Invoice # <SortIcon field="invoiceId" />
                    </button>
                  </th>
                  <th className="py-3 px-3 font-black text-[12px] text-stone-800 whitespace-nowrap">
                    <button onClick={() => handleSort("studentName")} className="flex items-center gap-1 cursor-pointer hover:text-stone-900">
                      Student <SortIcon field="studentName" />
                    </button>
                  </th>
                  <th className="py-3 px-3 font-black text-[12px] text-stone-800 whitespace-nowrap text-right hidden sm:table-cell">
                    <button onClick={() => handleSort("amount")} className="flex items-center gap-1 cursor-pointer hover:text-stone-900 ml-auto">
                      Amount <SortIcon field="amount" />
                    </button>
                  </th>
                  <th className="py-3 px-3 font-black text-[12px] text-stone-800 whitespace-nowrap text-right hidden md:table-cell">
                    <button onClick={() => handleSort("paidAmount")} className="flex items-center gap-1 cursor-pointer hover:text-stone-900 ml-auto">
                      Paid <SortIcon field="paidAmount" />
                    </button>
                  </th>
                  <th className="py-3 px-3 font-black text-[12px] text-stone-800 whitespace-nowrap text-right">
                    Balance
                  </th>
                  <th className="py-3 px-3 font-black text-[12px] text-stone-800 whitespace-nowrap hidden sm:table-cell">
                    <button onClick={() => handleSort("dueDate")} className="flex items-center gap-1 cursor-pointer hover:text-stone-900">
                      Due Date <SortIcon field="dueDate" />
                    </button>
                  </th>
                  <th className="py-3 px-3 font-black text-[12px] text-stone-800 whitespace-nowrap">
                    <button onClick={() => handleSort("status")} className="flex items-center gap-1 cursor-pointer hover:text-stone-900">
                      Status <SortIcon field="status" />
                    </button>
                  </th>
                  <th className="py-3 px-3 font-black text-[12px] text-stone-800 whitespace-nowrap hidden lg:table-cell">
                    Academic Year
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 bg-white">
                {invoices.map((inv) => {
                  const amt = parseAmount(inv.amount);
                  const paid = parseAmount(inv.paidAmount);
                  const bal = parseAmount(inv.balance || inv.amount) - paid;
                  const statusKey = (inv.status || "pending").toLowerCase();
                  return (
                    <tr
                      key={inv._id}
                      className="hover:bg-stone-50/50 transition-colors cursor-pointer group"
                      onClick={() => router.push(`/dashboard/invoices/${inv._id}`)}
                    >
                      <td className="py-3 pl-4 pr-2 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.has(inv._id)}
                          onChange={() => handleSelectOne(inv._id)}
                          className="w-3.5 h-3.5 rounded border-stone-300 text-[#FF9933] focus:ring-[#FF9933]"
                        />
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-mono font-bold text-[12px] text-stone-800">{inv.invoiceId || "—"}</span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="text-sm font-bold text-stone-800">{inv.studentName || "—"}</div>
                        <div className="text-xs text-stone-400 font-mono">—</div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-right hidden sm:table-cell">
                        <span className="text-sm text-stone-600">{formatINR(amt)}</span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-right hidden md:table-cell">
                        <span className="text-sm text-stone-600">{formatINR(paid)}</span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-right">
                        <span className={`text-sm font-bold ${bal > 0 ? "text-red-500" : "text-green-600"}`}>
                          {formatINR(bal)}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap hidden sm:table-cell">
                        <span className="text-sm text-stone-500">{formatDate(inv.dueDate)}</span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <StatusBadge status={statusKey} />
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap hidden lg:table-cell">
                        <span className="text-sm text-stone-500">{inv.academicYear || "—"}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        {!loading && invoices.length > 0 && (
          <div className="px-4 py-3 border-t border-stone-100 bg-stone-50/30 flex items-center justify-between gap-3">
            <div className="text-xs font-bold text-stone-500 whitespace-nowrap">
              {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of <span className="text-stone-800 font-black">{total}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-stone-400 font-medium">Per page:</span>
                <select
                  value={limit}
                  onChange={(e) => handleLimitChange(parseInt(e.target.value, 10))}
                  className="text-xs font-bold text-stone-700 bg-white border border-stone-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20"
                >
                  {[10, 25, 50, 100].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-stone-200 bg-white text-stone-400 hover:text-[#FF9933] hover:border-[#FF9933]/30 hover:bg-[#FF9933]/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={16} strokeWidth={2.5} />
                </button>
                {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
                  let pageNum;
                  if (pages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= pages - 2) {
                    pageNum = pages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`min-w-[32px] h-8 rounded-lg text-xs font-black transition-all ${
                        page === pageNum
                          ? "bg-[#FF9933] border-[#FF9933] text-white shadow-sm shadow-[#FF9933]/20"
                          : "border border-stone-200 bg-white text-stone-600 hover:text-[#FF9933] hover:border-[#FF9933]/30 hover:bg-[#FF9933]/5"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  disabled={page === pages}
                  className="p-1.5 rounded-lg border border-stone-200 bg-white text-stone-400 hover:text-[#FF9933] hover:border-[#FF9933]/30 hover:bg-[#FF9933]/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={16} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
