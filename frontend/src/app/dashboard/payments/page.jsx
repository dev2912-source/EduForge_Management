"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search, Filter, X, ChevronDown, ChevronLeft, ChevronRight,
  Loader2, Download, Upload, Plus, Pencil, Trash2, Eye
} from "lucide-react";
import FilterPanel from "@/components/FilterPanel";
import ExportMenu from "@/components/ExportMenu";

const PAGE_LIMIT_KEY = "fee_payments_page_limit";

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

function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getMethodStyle(method) {
  if (!method) return "bg-stone-50 text-stone-500";
  const m = method.toLowerCase();
  if (m === "cash") return "bg-green-50 text-green-600";
  if (m === "bank transfer") return "bg-blue-50 text-blue-600";
  if (m === "cheque") return "bg-amber-50 text-amber-600";
  if (m === "online") return "bg-purple-50 text-purple-600";
  if (m === "upi") return "bg-indigo-50 text-indigo-600";
  if (m === "card") return "bg-rose-50 text-rose-600";
  return "bg-stone-50 text-stone-500";
}

const METHOD_OPTIONS = [
  { value: "Cash", label: "Cash" },
  { value: "Bank Transfer", label: "Bank Transfer" },
  { value: "Cheque", label: "Cheque" },
  { value: "Online", label: "Online" },
];

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
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
  const [editModal, setEditModal] = useState(null);
  const [recordModal, setRecordModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [recordForm, setRecordForm] = useState({ studentName: "", invoiceId: "", amount: "", method: "Cash", date: "" });
  const [recordSaving, setRecordSaving] = useState(false);
  const [recordError, setRecordError] = useState("");
  const debounceRef = useRef(null);
  const mountedRef = useRef(true);

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

      const methodVal = filterValue("payment_method");
      if (methodVal) params.set("method", methodVal);

      params.set("sort", `${sortBy}:${sortDir}`);

      const res = await fetch(`/api/admin/payments?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      if (!mountedRef.current) return;
      const items = Array.isArray(data) ? data : data.data || [];
      setPayments(items);
      setTotal(data.total || items.length);
      setPages(data.pages || 1);
    } catch (err) {
      console.error(err);
      if (mountedRef.current) setPayments([]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [page, limit, search, filters, sortBy, sortDir]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

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
    if (selected.size === payments.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(payments.map((p) => p._id)));
    }
  };

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
    try { localStorage.setItem(PAGE_LIMIT_KEY, String(newLimit)); } catch {}
  };

  const handleExportCsv = () => {
    const rows = payments.filter((p) => selected.has(p._id));
    if (rows.length === 0) return;
    const headers = ["Receipt #", "Student Name", "Amount", "Method", "Payment Date", "Invoice #"];
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        [
          r.receiptId,
          `"${r.studentName || ""}"`,
          parseAmount(r.amount),
          r.method || "",
          r.date || r.createdAt || "",
          r.invoiceId || "",
        ].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    const rows = payments.filter((p) => selected.has(p._id));
    if (rows.length === 0) return;
    const headers = ["Receipt #", "Student Name", "Amount", "Method", "Payment Date", "Invoice #"];
    let html = "<table><thead><tr>" + headers.map((h) => `<th>${h}</th>`).join("") + "</tr></thead><tbody>";
    rows.forEach((r) => {
      html += "<tr>" +
        `<td>${r.receiptId}</td>` +
        `<td>${(r.studentName || "").replace(/</g, "&lt;")}</td>` +
        `<td>${parseAmount(r.amount)}</td>` +
        `<td>${r.method || ""}</td>` +
        `<td>${r.date || r.createdAt || ""}</td>` +
        `<td>${r.invoiceId || ""}</td>` +
        "</tr>";
    });
    html += "</tbody></table>";
    const blob = new Blob([`<html>${html}</html>`], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments-${new Date().toISOString().split("T")[0]}.xls`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openEditModal = (payment) => {
    setEditModal({
      ...payment,
      _formAmount: parseAmount(payment.amount),
      _formMethod: payment.method || "Cash",
      _formDate: payment.date ? new Date(payment.date).toISOString().split("T")[0] : "",
    });
  };

  const handleEditSave = async () => {
    if (!editModal) return;
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`/api/admin/payments/${editModal._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          amount: `₹${editModal._formAmount.toLocaleString("en-IN")}`,
          method: editModal._formMethod,
          date: editModal._formDate,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      setEditModal(null);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const openRecordModal = () => {
    setRecordForm({ studentName: "", invoiceId: "", amount: "", method: "Cash", date: new Date().toISOString().split("T")[0] });
    setRecordError("");
    setRecordModal(true);
  };

  const handleRecordSave = async () => {
    setRecordSaving(true);
    setRecordError("");
    try {
      const token = localStorage.getItem("token") || "";
      const amount = parseInt(recordForm.amount, 10);
      if (!amount || amount <= 0) { setRecordError("Amount must be greater than 0"); setRecordSaving(false); return; }
      if (!recordForm.studentName.trim()) { setRecordError("Student name is required"); setRecordSaving(false); return; }

      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          studentName: recordForm.studentName,
          invoiceId: recordForm.invoiceId,
          amount: `₹${amount.toLocaleString("en-IN")}`,
          method: recordForm.method,
          date: recordForm.date,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to record payment");
      }
      setRecordModal(false);
      fetchData();
    } catch (err) {
      setRecordError(err.message);
    } finally {
      setRecordSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    setDeleteLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const { mode, ids } = deleteModal;

      if (mode === "single") {
        await fetch(`/api/admin/payments/${ids[0]}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await fetch("/api/admin/payments/bulk-delete", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ ids }),
        });
      }
      setDeleteModal(null);
      setSelected(new Set());
      fetchData();
    } catch (err) {
      alert("Delete failed");
    } finally {
      setDeleteLoading(false);
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-4">

      {/* Header */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-1 h-5 bg-[#FF9933] rounded-full"></div>
            <h1 className="text-xl font-black text-stone-900 tracking-tight">Fee Payments</h1>
          </div>
          <p className="text-[13px] font-medium text-stone-500 ml-3">
            <span className="text-[#FF9933] font-black">{total}</span> payments recorded
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 hover:border-stone-300 transition-all shadow-sm">
            <Upload size={16} strokeWidth={2} /> Import
          </button>
          <button
            onClick={openRecordModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 text-sm font-bold transition-all shadow-sm flex-shrink-0"
          >
            <Plus size={16} strokeWidth={3} /> Record Payment
          </button>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col">

        {/* Toolbar */}
        <div className="px-3 py-2 border-b border-stone-100 flex items-center justify-between gap-2 bg-stone-50/30 min-h-[52px]">
          {/* Selection info */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {selected.size > 0 && (
              <>
                <span className="text-xs font-bold text-stone-500">{selected.size} selected</span>
                <div className="w-px h-4 bg-stone-200 mx-0.5" />
                <ExportMenu onCsv={handleExportCsv} onExcel={handleExportExcel} />
                <button
                  onClick={() => setDeleteModal({ mode: "bulk", ids: Array.from(selected) })}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all"
                  title="Delete selected"
                >
                  <Trash2 size={14} strokeWidth={2} />
                </button>
              </>
            )}
          </div>

          {/* Search + Filters */}
          <div className="flex items-center gap-2">
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

            <FilterPanel
              namespace="fee-payments"
              fields={[
                { key: "payment_method", label: "Payment Method", type: "select", options: METHOD_OPTIONS },
              ]}
              onApply={(results) => {
                setFilters(results.filter((r) => r.value && r.value !== ""));
                setPage(1);
              }}
            />

            {hasActiveFilters && (
              <button onClick={clearFilters}
                className="p-1.5 bg-white border border-stone-200 hover:bg-stone-50 rounded-lg text-stone-400 transition-colors shadow-sm flex items-center justify-center">
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
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-stone-500">
              <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mb-3">
                <X size={20} className="text-stone-400" />
              </div>
              <p className="font-black text-[15px] text-stone-700">No Payments Recorded</p>
              <p className="text-[13px] text-stone-400 mt-1">Use the Record Payment button to add a payment.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/50">
                  <th className="py-3 pl-4 pr-2 font-black text-[12px] text-stone-800 whitespace-nowrap w-12">
                    <input type="checkbox"
                      checked={selected.size === payments.length && payments.length > 0}
                      onChange={handleSelectAll}
                      className="w-3.5 h-3.5 rounded border-stone-300 text-[#FF9933] focus:ring-[#FF9933]" />
                  </th>
                  <th className="py-3 px-3 font-black text-[12px] text-stone-800 whitespace-nowrap">
                    <button onClick={() => handleSort("receiptId")} className="flex items-center gap-1 cursor-pointer hover:text-stone-900">
                      Receipt # <SortIcon field="receiptId" />
                    </button>
                  </th>
                  <th className="py-3 px-3 font-black text-[12px] text-stone-800 whitespace-nowrap">
                    <button onClick={() => handleSort("studentName")} className="flex items-center gap-1 cursor-pointer hover:text-stone-900">
                      Student Name <SortIcon field="studentName" />
                    </button>
                  </th>
                  <th className="py-3 px-3 font-black text-[12px] text-stone-800 whitespace-nowrap hidden sm:table-cell">Enrollment ID</th>
                  <th className="py-3 px-3 font-black text-[12px] text-stone-800 whitespace-nowrap text-right">
                    <button onClick={() => handleSort("amount")} className="flex items-center gap-1 cursor-pointer hover:text-stone-900 ml-auto">
                      Amount <SortIcon field="amount" />
                    </button>
                  </th>
                  <th className="py-3 px-3 font-black text-[12px] text-stone-800 whitespace-nowrap hidden sm:table-cell">
                    <button onClick={() => handleSort("method")} className="flex items-center gap-1 cursor-pointer hover:text-stone-900">
                      Method <SortIcon field="method" />
                    </button>
                  </th>
                  <th className="py-3 px-3 font-black text-[12px] text-stone-800 whitespace-nowrap">
                    <button onClick={() => handleSort("date")} className="flex items-center gap-1 cursor-pointer hover:text-stone-900">
                      Payment Date <SortIcon field="date" />
                    </button>
                  </th>
                  <th className="py-3 px-3 font-black text-[12px] text-stone-800 whitespace-nowrap hidden sm:table-cell">Invoice</th>
                  <th className="py-3 px-3 font-black text-[12px] text-stone-800 whitespace-nowrap hidden lg:table-cell">Tags</th>
                  <th className="py-3 px-3 font-black text-[12px] text-stone-800 whitespace-nowrap text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50 bg-white">
                {payments.map((p) => {
                  const amt = parseAmount(p.amount);
                  const methodKey = (p.method || "").toLowerCase();
                  return (
                    <tr key={p._id} className="hover:bg-stone-50/50 transition-colors group">
                      <td className="py-3 pl-4 pr-2 whitespace-nowrap">
                        <input type="checkbox"
                          checked={selected.has(p._id)}
                          onChange={() => handleSelectOne(p._id)}
                          className="w-3.5 h-3.5 rounded border-stone-300 text-[#FF9933] focus:ring-[#FF9933]" />
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-mono font-bold text-[12px] text-stone-800">{p.receiptId || "—"}</span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="text-sm font-bold text-stone-800">{p.studentName || "—"}</span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap hidden sm:table-cell">
                        <span className="text-xs font-mono font-bold text-stone-400">—</span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-right">
                        <span className="text-sm font-bold text-green-600">{formatINR(amt)}</span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap hidden sm:table-cell">
                        <span className={`text-xs font-bold capitalize px-2 py-0.5 rounded-full ${getMethodStyle(p.method)}`}>
                          {(p.method || "—").replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="text-sm text-stone-500">{formatDateTime(p.date || p.createdAt)}</span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap hidden sm:table-cell">
                        {p.invoiceId ? (
                          <span className="text-xs font-mono font-bold text-stone-400">{p.invoiceId}</span>
                        ) : (
                          <span className="text-stone-300">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap hidden lg:table-cell">
                        <span className="text-stone-300">—</span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all"
                            title="Edit Payment"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteModal({ mode: "single", ids: [p._id] })}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        {!loading && payments.length > 0 && (
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
                  if (pages <= 5) pageNum = i + 1;
                  else if (page <= 3) pageNum = i + 1;
                  else if (page >= pages - 2) pageNum = pages - 4 + i;
                  else pageNum = page - 2 + i;
                  return (
                    <button key={pageNum} onClick={() => setPage(pageNum)}
                      className={`min-w-[32px] h-8 rounded-lg text-xs font-black transition-all ${
                        page === pageNum
                          ? "bg-[#FF9933] border-[#FF9933] text-white shadow-sm shadow-[#FF9933]/20"
                          : "border border-stone-200 bg-white text-stone-600 hover:text-[#FF9933] hover:border-[#FF9933]/30 hover:bg-[#FF9933]/5"
                      }`}>
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

      {/* Edit Payment Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setEditModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-md border border-stone-200">
            <div className="flex items-center space-x-2 mb-5">
              <div className="w-1.5 h-5 bg-[#FF9933] rounded-full"></div>
              <h3 className="text-base font-bold text-stone-900">Edit Payment</h3>
              <span className="ml-auto text-xs font-mono text-stone-400">{editModal.receiptId}</span>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-wider font-black text-stone-400">Amount Paid <span className="text-red-500">*</span></label>
                <input type="number" value={editModal._formAmount}
                  onChange={(e) => setEditModal({ ...editModal, _formAmount: parseInt(e.target.value) || 0 })}
                  className="w-full mt-1 px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933]" min="0" required />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider font-black text-stone-400">Payment Method <span className="text-red-500">*</span></label>
                <select value={editModal._formMethod}
                  onChange={(e) => setEditModal({ ...editModal, _formMethod: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933]">
                  {METHOD_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider font-black text-stone-400">Payment Date <span className="text-red-500">*</span></label>
                <input type="date" value={editModal._formDate}
                  onChange={(e) => setEditModal({ ...editModal, _formDate: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933]" required />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-stone-100">
              <button onClick={() => setEditModal(null)}
                className="px-4 py-2 bg-white border border-stone-200 hover:bg-stone-50 rounded-lg text-sm font-bold text-stone-700 transition-colors">
                Cancel
              </button>
              <button onClick={handleEditSave}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-sm font-bold transition-colors">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {recordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setRecordModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-md border border-stone-200">
            <div className="flex items-center space-x-2 mb-5">
              <div className="w-1.5 h-5 bg-[#FF9933] rounded-full"></div>
              <h3 className="text-base font-bold text-stone-900">Record Payment</h3>
            </div>
            {recordError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-4">{recordError}</div>
            )}
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-wider font-black text-stone-400">Student Name <span className="text-red-500">*</span></label>
                <input type="text" value={recordForm.studentName}
                  onChange={(e) => setRecordForm({ ...recordForm, studentName: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933]" placeholder="e.g. John Doe" required />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider font-black text-stone-400">Invoice ID</label>
                <input type="text" value={recordForm.invoiceId}
                  onChange={(e) => setRecordForm({ ...recordForm, invoiceId: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933]" placeholder="Optional" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider font-black text-stone-400">Amount <span className="text-red-500">*</span></label>
                <input type="number" value={recordForm.amount}
                  onChange={(e) => setRecordForm({ ...recordForm, amount: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933]" min="1" required />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider font-black text-stone-400">Payment Method <span className="text-red-500">*</span></label>
                <select value={recordForm.method}
                  onChange={(e) => setRecordForm({ ...recordForm, method: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933]">
                  {METHOD_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider font-black text-stone-400">Payment Date <span className="text-red-500">*</span></label>
                <input type="date" value={recordForm.date}
                  onChange={(e) => setRecordForm({ ...recordForm, date: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933]" required />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-stone-100">
              <button onClick={() => setRecordModal(false)}
                className="px-4 py-2 bg-white border border-stone-200 hover:bg-stone-50 rounded-lg text-sm font-bold text-stone-700 transition-colors">
                Cancel
              </button>
              <button onClick={handleRecordSave} disabled={recordSaving}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50">
                {recordSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setDeleteModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm border border-stone-200">
            <h3 className="text-base font-bold text-stone-900 mb-2">Delete Payment{deleteModal.ids.length > 1 ? "s" : ""}</h3>
            <p className="text-sm text-stone-600 mb-6">
              {deleteModal.ids.length === 1
                ? "Delete this payment? The invoice balance will be recalculated. This cannot be undone."
                : `Permanently delete ${deleteModal.ids.length} payments? Invoice balances will be recalculated. This cannot be undone.`}
            </p>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setDeleteModal(null)}
                className="px-4 py-2 bg-white border border-stone-200 hover:bg-stone-50 rounded-lg text-sm font-bold text-stone-700 transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50">
                {deleteLoading ? "Deleting…" : deleteModal.ids.length > 1 ? "Delete All" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
