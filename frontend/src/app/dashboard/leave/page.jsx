'use client';
import { useState, useEffect } from 'react';

const STATUS_STYLES = {
  approved: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  cancelled: 'bg-stone-50 text-stone-500 border-stone-200'
};

export default function MyLeavePage() {
  const [leaves, setLeaves] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState({ total: 12, used: 0, approved: 0, pending: 0, remaining: 12 });
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ fromDate: '', toDate: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null);

  const limit = 10;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const fetchLeaves = async (p, s) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ page: p, limit });
      if (s) params.set('status', s);

      const [leaveRes, balanceRes] = await Promise.all([
        fetch(`/api/student/leave?${params}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/student/leave/balance', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (leaveRes.ok) {
        const json = await leaveRes.json();
        const d = json.data || {};
        setLeaves(d.data || []);
        setTotal(d.total || 0);
      }

      if (balanceRes.ok) {
        const json = await balanceRes.json();
        setBalance(json.data || balance);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves(page, statusFilter);
  }, [page, statusFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fromDate || !form.toDate || !form.reason) {
      setMsg({ type: 'error', text: 'All fields are required' });
      return;
    }
    if (new Date(form.fromDate) > new Date(form.toDate)) {
      setMsg({ type: 'error', text: 'From date cannot be after To date' });
      return;
    }
    setSubmitting(true);
    setMsg(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/student/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setMsg({ type: 'success', text: 'Leave request submitted!' });
        setForm({ fromDate: '', toDate: '', reason: '' });
        fetchLeaves(page, statusFilter);
      } else {
        const json = await res.json();
        setMsg({ type: 'error', text: json.message || 'Failed to submit' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Server error' });
    } finally {
      setSubmitting(false);
    }
  };

  const cancelLeave = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/student/leave/${id}/cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setMsg({ type: 'success', text: 'Leave request cancelled' });
        fetchLeaves(page, statusFilter);
      } else {
        const json = await res.json();
        setMsg({ type: 'error', text: json.message || 'Failed to cancel' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Server error' });
    }
  };

  const fmtDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const fmtRange = (from, to) => {
    const f = new Date(from);
    const t = new Date(to);
    const opts = { day: 'numeric', month: 'short', year: 'numeric' };
    return `${f.toLocaleDateString('en-IN', opts)} – ${t.toLocaleDateString('en-IN', opts)}`;
  };

  const countDays = (from, to) => {
    if (!from || !to) return 0;
    return Math.max(1, Math.ceil((new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24)) + 1);
  };

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-2xl border border-stone-200 shadow-sm">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-5 bg-[#F97316] rounded-full" />
            <h1 className="text-xl font-bold text-stone-900 tracking-tight">My Leave</h1>
          </div>
          <p className="text-sm text-stone-500 font-medium ml-3.5">Apply and track your leave requests</p>
        </div>
      </div>

      {/* Leave Balance Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: balance.total, color: 'bg-stone-50 text-stone-700 border-stone-200' },
          { label: 'Used', value: balance.used, color: 'bg-blue-50 text-blue-700 border-blue-200' },
          { label: 'Approved', value: balance.approved, color: 'bg-green-50 text-green-700 border-green-200' },
          { label: 'Pending', value: balance.pending, color: 'bg-amber-50 text-amber-700 border-amber-200' },
          { label: 'Remaining', value: balance.remaining, color: balance.remaining > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200' },
        ].map((c, i) => (
          <div key={i} className={`rounded-2xl border ${c.color} p-3 sm:p-4 shadow-sm`}>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{c.label}</p>
            <p className="text-2xl sm:text-3xl font-black mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      {msg && (
        <div className={`px-4 py-2.5 rounded-xl text-sm font-bold border ${
          msg.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {msg.text}
          <button className="float-right text-current opacity-50 hover:opacity-100" onClick={() => setMsg(null)}>✕</button>
        </div>
      )}

      {/* Apply Form */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5">
          <h2 className="text-[11px] font-black text-stone-500 uppercase tracking-widest mb-4">Apply for Leave</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-stone-600 mb-1.5 block">From Date</label>
                <input
                  type="date"
                  value={form.fromDate}
                  onChange={e => setForm({ ...form, fromDate: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316] outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-stone-600 mb-1.5 block">To Date</label>
                <input
                  type="date"
                  value={form.toDate}
                  onChange={e => setForm({ ...form, toDate: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316] outline-none transition-all"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-stone-600 mb-1.5 block">Reason</label>
              <textarea
                value={form.reason}
                onChange={e => setForm({ ...form, reason: e.target.value })}
                rows={3}
                placeholder="Reason for leave…"
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm resize-y focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316] outline-none transition-all"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
              >
                {submitting ? 'Submitting…' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Request History */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-[11px] font-black text-stone-500 uppercase tracking-widest">Request History</h2>
            {!loading && <span className="text-xs font-medium text-stone-400">({total})</span>}
          </div>
          <div className="flex items-center gap-1.5">
            {['', 'pending', 'approved', 'rejected', 'cancelled'].map(s => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
                  statusFilter === s
                    ? 'bg-[#F97316]/10 text-[#F97316] border-[#F97316]/20'
                    : 'text-stone-500 border-transparent hover:bg-stone-50 hover:border-stone-200'
                }`}
              >
                {s || 'All'}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="divide-y divide-stone-50">
          {loading ? (
            <div className="py-10 text-center text-stone-400 text-sm">Loading...</div>
          ) : leaves.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm font-bold text-stone-700">No Leave Requests</p>
              <p className="text-sm text-stone-400 mt-1">Apply for leave using the form above.</p>
            </div>
          ) : leaves.map((l) => (
            <div key={l.id} className="px-4 py-3.5 flex items-center justify-between hover:bg-stone-50/50 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-stone-900">{fmtRange(l.from_date, l.to_date)}</span>
                  <span className="text-[10px] text-stone-400 font-mono">{countDays(l.from_date, l.to_date)}d</span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5 truncate">{l.reason}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-full border ${STATUS_STYLES[l.status] || 'bg-stone-50 text-stone-500 border-stone-200'}`}>
                  {l.status}
                </span>
                {l.status === 'pending' && (
                  <button
                    onClick={() => cancelLeave(l.id)}
                    className="p-1 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Cancel request"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="px-4 py-3 border-t border-stone-100 bg-stone-50/30 flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500">
              {total === 0 ? '0' : `${(page - 1) * limit + 1}–${Math.min(page * limit, total)}`} of {total}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-stone-200 bg-white text-stone-400 hover:text-[#F97316] hover:border-[#F97316]/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-xs font-bold text-stone-600 px-2">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-stone-200 bg-white text-stone-400 hover:text-[#F97316] hover:border-[#F97316]/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
