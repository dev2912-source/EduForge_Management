'use client';
import { useState, useEffect, useMemo } from 'react';

const PAGE_LIMIT_KEY = 'student_fees_page_limit';

function badgeClass(s) {
  return {
    paid: 'bg-green-50 text-green-700 border-green-100',
    pending: 'bg-amber-50 text-amber-700 border-amber-100',
    partial: 'bg-blue-50 text-blue-700 border-blue-100',
    overdue: 'bg-red-50 text-red-700 border-red-100'
  }[(s || '').toLowerCase()] || 'bg-stone-50 text-stone-600 border-stone-200';
}

function fmt(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const SORT_ICON = (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m0 0L5 6m3-3l3 3m0 4H5m8 0h3m-3 4H5m8 0h3" />
  </svg>
);

const columns = [
  { key: 'invoice_number', label: 'Invoice #', sortable: true, sm: false, md: false },
  { key: 'total_amount', label: 'Amount', sortable: true, sm: true, md: false },
  { key: 'paid_amount', label: 'Paid', sortable: false, sm: false, md: true },
  { key: 'balance', label: 'Balance', sortable: false, sm: true, md: false },
  { key: 'due_date', label: 'Due Date', sortable: true, sm: true, md: false },
  { key: 'status', label: 'Status', sortable: true, sm: false, md: false },
];

export default function MyFeesPage() {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(() => {
    if (typeof window !== 'undefined') return Number(localStorage.getItem(PAGE_LIMIT_KEY)) || 10;
    return 10;
  });
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('due_date');
  const [sortDir, setSortDir] = useState('desc');
  const [showFilter, setShowFilter] = useState(false);
  const [preview, setPreview] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const fetchInvoices = async (p, l, s, ss, sb, sd) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: p, limit: l,
        sort_by: sb, sort_dir: sd
      });
      if (ss) params.set('search', ss);
      if (s) params.set('status', s);

      const res = await fetch(`/api/student/fees?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load');
      const json = await res.json();
      if (Array.isArray(json)) {
        const mapped = json.map(inv => ({
          id: inv._id,
          invoice_number: inv.invoiceId,
          total_amount: parseInt((inv.amount || '0').replace(/[₹,]/g, '')) || 0,
          paid_amount: parseInt((inv.paidAmount || '0').replace(/[₹,]/g, '')) || 0,
          balance: (parseInt((inv.balance || inv.amount || '0').replace(/[₹,]/g, '')) || 0) - (parseInt((inv.paidAmount || '0').replace(/[₹,]/g, '')) || 0),
          due_date: inv.dueDate,
          status: (inv.status || 'pending').toLowerCase()
        }));
        setInvoices(mapped);
        setTotal(mapped.length);
      } else {
        const d = json.data || {};
        setInvoices(d.data || []);
        setTotal(d.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchInvoices(page, limit, statusFilter, debouncedSearch, sortBy, sortDir);
  }, [page, limit, statusFilter, debouncedSearch, sortBy, sortDir]);

  const summary = useMemo(() => {
    let due = 0, paid = 0;
    for (const inv of invoices) {
      due += inv.balance > 0 ? inv.balance : 0;
      paid += inv.paid_amount || 0;
    }
    return { due, paid };
  }, [invoices]);

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
    localStorage.setItem(PAGE_LIMIT_KEY, String(newLimit));
  };

  const clearFilters = () => { setStatusFilter(''); setSearch(''); setDebouncedSearch(''); setPage(1); };

  const openPreview = async (inv) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/student/invoices/${inv.id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('PDF not available');
      const json = await res.json();
      setPreview({ html: json.data?.html || '', label: inv.invoice_number, filename: `Invoice-${inv.invoice_number}.pdf`, inv });
    } catch (err) {
      console.error('PDF not available');
    }
  };

  const downloadPdf = async (inv) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/student/invoices/${inv.id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('PDF not available');
      const json = await res.json();
      const html = json.data?.html || '';
      const blob = new Blob([html], { type: 'text/html' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `Invoice-${inv.invoice_number}.html`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      console.error('Download failed');
    }
  };

  const modalDownload = async () => {
    if (!preview) return;
    setDownloading(true);
    try {
      const blob = new Blob([preview.html], { type: 'text/html' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = preview.filename.replace('.pdf', '.html');
      a.click();
      URL.revokeObjectURL(a.href);
    } catch { /* ignore */ }
    setDownloading(false);
  };

  const pages = useMemo(() => {
    const arr = [];
    for (let i = 1; i <= totalPages; i++) arr.push(i);
    return arr;
  }, [totalPages]);

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-2xl border border-stone-200 shadow-sm">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-5 bg-[#F97316] rounded-full" />
            <h1 className="text-xl font-bold text-stone-900 tracking-tight">My Fees</h1>
          </div>
          <p className="text-sm text-stone-500 font-medium ml-3.5">View and download your fee invoices</p>
        </div>
        {!loading && total > 0 && (
          <div className="flex items-center gap-3 flex-wrap text-xs font-bold">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-100">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
              Due: {fmt(summary.due)}
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-100">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
              Paid: {fmt(summary.paid)}
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
              {total} Invoice{total !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="px-3 py-2 border-b border-stone-100 flex items-center gap-2">
          <div className="flex-1" />
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search invoices…"
              className="block rounded-lg border border-stone-200 bg-white pl-8 pr-3 py-1.5 text-xs w-44 sm:w-56 focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316] outline-none transition-all"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-stone-200 bg-white text-stone-600 hover:border-stone-300 transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
            </button>
            {showFilter && (
              <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl border border-stone-200 shadow-lg p-3 min-w-[180px]">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Status</p>
                {['', 'pending', 'partial', 'paid', 'overdue'].map(s => (
                  <button
                    key={s}
                    onClick={() => { setStatusFilter(s); setShowFilter(false); }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      statusFilter === s ? 'bg-[#F97316]/10 text-[#F97316]' : 'text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
                  </button>
                ))}
              </div>
            )}
          </div>
          {(statusFilter || search) && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold text-stone-400 hover:text-red-500 hover:bg-red-50 border border-stone-200 transition-all"
              title="Clear filters"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="bg-white border-b border-stone-200">
                {columns.map(col => (
                  <th
                    key={col.key}
                    className={`text-left py-3 px-4 text-sm font-bold text-stone-700 ${
                      col.sm ? 'hidden sm:table-cell' : ''
                    } ${col.md ? 'hidden md:table-cell' : ''}`}
                  >
                    {col.sortable ? (
                      <button
                        onClick={() => handleSort(col.key)}
                        className="flex items-center gap-1.5 group hover:text-stone-900 transition-colors"
                      >
                        {col.label}
                        <span className={`transition-colors ${sortBy === col.key ? 'text-[#F97316]' : 'text-stone-300 group-hover:text-stone-500'}`}>
                          {SORT_ICON}
                        </span>
                      </button>
                    ) : col.label}
                  </th>
                ))}
                <th className="text-right py-3 px-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-stone-400">Loading...</td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center">
                    <p className="text-sm font-bold text-stone-700">No Invoices Found</p>
                    <p className="text-sm text-stone-400 mt-1">Your fee invoices will appear here once generated.</p>
                  </td>
                </tr>
              ) : invoices.map((inv, idx) => (
                <tr key={inv.id || idx} className="hover:bg-stone-50/50 transition-colors cursor-pointer"
                  onClick={() => window.location.href = `/dashboard/invoices/${inv.id}`}
                >
                  <td className="py-2.5 px-4">
                    <span className="font-mono text-xs font-bold text-stone-800">{inv.invoice_number}</span>
                  </td>
                  <td className="hidden sm:table-cell py-2.5 px-4">
                    <span className="text-sm font-bold text-stone-700">{fmt(inv.total_amount)}</span>
                  </td>
                  <td className="hidden md:table-cell py-2.5 px-4">
                    <span className="text-sm font-bold text-green-700">{fmt(inv.paid_amount)}</span>
                  </td>
                  <td className="hidden sm:table-cell py-2.5 px-4">
                    <span className={`text-sm font-bold ${inv.balance > 0 ? 'text-red-600' : 'text-green-700'}`}>
                      {fmt(inv.balance)}
                    </span>
                  </td>
                  <td className="hidden sm:table-cell py-2.5 px-4">
                    <span className="text-sm text-stone-600">{fmtDate(inv.due_date)}</span>
                  </td>
                  <td className="py-2.5 px-4">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md border ${badgeClass(inv.status)}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="text-right py-2.5 px-4">
                    <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => openPreview(inv)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Preview PDF"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => downloadPdf(inv)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                        title="Download PDF"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-stone-100 bg-stone-50/30 flex items-center justify-between gap-3 flex-shrink-0">
          <span className="text-xs font-bold text-stone-500 whitespace-nowrap">
            {total === 0 ? '0' : `${(page - 1) * limit + 1}–${Math.min(page * limit, total)}`} of <span className="text-stone-800 font-black">{total}</span>
          </span>
          <div className="flex items-center gap-3">
            <select
              value={limit}
              onChange={e => handleLimitChange(Number(e.target.value))}
              className="appearance-none w-20 text-left rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-800 focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316] outline-none cursor-pointer"
            >
              {[5, 10, 15, 20, 25].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-stone-200 bg-white text-stone-400 hover:text-[#F97316] hover:border-[#F97316]/30 hover:bg-[#F97316]/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              {pages.map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`min-w-[32px] h-8 rounded-lg text-xs font-black transition-all border ${
                    p === page
                      ? 'bg-[#F97316] border-[#F97316] text-white shadow-sm shadow-[#F97316]/20'
                      : 'bg-white border-stone-200 text-stone-600 hover:border-[#F97316]/30 hover:text-[#F97316]'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-stone-200 bg-white text-stone-400 hover:text-[#F97316] hover:border-[#F97316]/30 hover:bg-[#F97316]/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Preview Modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setPreview(null)}>
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-stone-100 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-sm font-bold text-stone-900">Fee Invoice</h2>
                <p className="text-xs text-stone-500 mt-0.5">{preview.label}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={modalDownload}
                  disabled={downloading}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {downloading ? 'Downloading…' : 'Download'}
                </button>
                <button
                  onClick={() => setPreview(null)}
                  className="w-8 h-8 rounded-lg hover:bg-stone-100 text-stone-400 flex items-center justify-center"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-1 bg-stone-50 overflow-hidden">
              <iframe srcDoc={preview.html} className="w-full h-[80vh] border-0" title="Invoice Preview" />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
