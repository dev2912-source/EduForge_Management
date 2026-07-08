"use client";

import { useState, useEffect, useCallback } from 'react';
import { Search, Trash2, RotateCcw, Loader2, ChevronLeft, ChevronRight, SlidersHorizontal, CheckCheck, X } from 'lucide-react';

const API = 'http://localhost:5000/api/admin';

function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('token') : null; }

const ROLE_BADGES = {
  student: 'bg-green-50 text-green-700 border-green-200',
  staff: 'bg-blue-50 text-blue-700 border-blue-200',
  admin: 'bg-red-50 text-red-700 border-red-200'
};

const ROLE_TABS = [
  { key: '', label: 'All' },
  { key: 'student', label: 'Students' },
  { key: 'staff', label: 'Staff' }
];

function formatDate(dateStr) {
  if (!dateStr) return '\u2014';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch { return '\u2014'; }
}

export default function TrashPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selected, setSelected] = useState([]);
  const [perPage, setPerPage] = useState(() => {
    if (typeof window === 'undefined') return 10;
    return parseInt(localStorage.getItem('trashPerPage')) || 10;
  });
  const [sort, setSort] = useState({ key: 'deletedAt', dir: 'desc' });

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchTrash = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page, limit: perPage,
        search: debouncedSearch,
        role: roleFilter,
      });
      const res = await fetch(`${API}/trash?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const d = await res.json();
      setItems(d.data || []);
      setTotal(d.total || 0);
      setTotalPages(d.pages || 1);
    } catch {} finally { setLoading(false); }
  }, [page, perPage, debouncedSearch, roleFilter]);

  useEffect(() => { fetchTrash(); }, [fetchTrash]);

  useEffect(() => { setSelected([]); }, [page, roleFilter, debouncedSearch]);

  function handlePerPageChange(val) {
    const n = parseInt(val);
    setPerPage(n);
    setPage(1);
    localStorage.setItem('trashPerPage', n);
  }

  function toggleSort(key) {
    setSort(prev => ({ key, dir: prev.key === key && prev.dir === 'desc' ? 'asc' : 'desc' }));
  }

  function toggleSelect(id) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function toggleSelectAll() {
    if (selected.length === items.length) setSelected([]);
    else setSelected(items.map(i => i._id));
  }

  async function handleRestore(id) {
    setActionLoading(id);
    try {
      const res = await fetch(`${API}/trash/restore/${id}`, {
        method: 'PUT', headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.ok) fetchTrash();
    } catch {} finally { setActionLoading(null); }
  }

  async function handleBulkRestore() {
    setActionLoading('bulk-restore');
    for (const id of selected) {
      await fetch(`${API}/trash/restore/${id}`, {
        method: 'PUT', headers: { Authorization: `Bearer ${getToken()}` }
      });
    }
    setSelected([]);
    fetchTrash();
    setActionLoading(null);
  }

  async function handlePermanentDelete(id) {
    setConfirmDelete(null);
    setActionLoading(id);
    try {
      const res = await fetch(`${API}/trash/permanent/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.ok) fetchTrash();
    } catch {} finally { setActionLoading(null); }
  }

  async function handleBulkDelete() {
    setActionLoading('bulk-delete');
    setConfirmDelete(null);
    for (const id of selected) {
      await fetch(`${API}/trash/permanent/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` }
      });
    }
    setSelected([]);
    fetchTrash();
    setActionLoading(null);
  }

  const stats = [
    { label: 'Total Trashed', count: total, color: 'text-stone-900' },
    { label: 'Students', count: items.filter(i => i.role === 'student').length, color: 'text-green-600' },
    { label: 'Staff', count: items.filter(i => i.role === 'staff').length, color: 'text-blue-600' }
  ];

  const sortedItems = [...items].sort((a, b) => {
    const aVal = a[sort.key] || '';
    const bVal = b[sort.key] || '';
    const cmp = String(aVal).localeCompare(String(bVal));
    return sort.dir === 'desc' ? -cmp : cmp;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-red-50 text-red-500 flex items-center justify-center"><Trash2 size={16} /></div>
          <div>
            <h1 className="text-xl font-bold text-stone-900 tracking-tight">Trash</h1>
            <p className="text-[13px] font-medium text-stone-500">{total} trashed records</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 text-center">
            <p className="text-2xl font-black text-stone-900">{s.count}</p>
            <p className="text-[11px] font-bold text-stone-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Role Filter Tabs */}
      <div className="flex gap-1.5 bg-white rounded-xl border border-stone-200 shadow-sm p-1.5">
        {ROLE_TABS.map(t => (
          <button
            key={t.key || 'all'}
            onClick={() => { setRoleFilter(t.key); setPage(1); }}
            className={`flex-1 py-2 px-4 rounded-lg text-[13px] font-bold transition-all ${
              roleFilter === t.key
                ? 'bg-[#FF9933] text-white shadow-sm'
                : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'
            }`}
          >{t.label}</button>
        ))}
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="px-4 py-3 border-b border-stone-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search trash..." className="pl-9 pr-3 py-2 rounded-lg border border-stone-200 text-[13px] font-bold text-stone-800 focus:outline-none focus:border-[#FF9933] w-[200px] sm:w-[260px]" />
            </div>
            <button onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`p-2 rounded-lg border transition-all ${showFilterPanel ? 'bg-[#FF9933]/10 border-[#FF9933]/30 text-[#FF9933]' : 'border-stone-200 text-stone-400 hover:border-stone-300'}`}>
              <SlidersHorizontal size={14} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            {selected.length > 0 && (
              <>
                <span className="text-[12px] font-bold text-stone-500">{selected.length} selected</span>
                <button onClick={handleBulkRestore} disabled={actionLoading === 'bulk-restore'}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-bold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                  {actionLoading === 'bulk-restore' ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                  Restore All
                </button>
                <button onClick={() => setConfirmDelete('bulk')}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-bold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors flex items-center gap-1.5">
                  <Trash2 size={12} /> Delete All
                </button>
              </>
            )}
            <select value={perPage} onChange={e => handlePerPageChange(e.target.value)}
              className="px-2 py-2 rounded-lg border border-stone-200 text-[12px] font-bold text-stone-600 focus:outline-none focus:border-[#FF9933]">
              {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n} / page</option>)}
            </select>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilterPanel && (
          <div className="px-4 py-3 border-b border-stone-100 bg-stone-50/30 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">Role</label>
                <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 text-[13px] font-bold text-stone-800 focus:outline-none focus:border-[#FF9933]">
                  <option value="">All Roles</option>
                  <option value="student">Student</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 size={32} className="animate-spin text-[#FF9933]" />
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mt-3 animate-pulse">Loading</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-300 mb-4"><Trash2 size={28} /></div>
            <p className="text-sm font-bold text-stone-900">Trash is Empty</p>
            <p className="text-xs text-stone-400 font-medium mt-1">Deleted records will show up here.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/50">
                    <th className="w-10 px-3 py-3">
                      <input type="checkbox" checked={selected.length === items.length && items.length > 0}
                        onChange={toggleSelectAll} className="rounded border-stone-300 accent-[#FF9933]" />
                    </th>
                    <th className="py-3 pr-3 font-black text-[12px] text-stone-600 cursor-pointer select-none"
                      onClick={() => toggleSort('name')}>
                      Name {sort.key === 'name' && <span className="ml-1">{sort.dir === 'desc' ? '\u25BC' : '\u25B2'}</span>}
                    </th>
                    <th className="py-3 px-3 font-black text-[12px] text-stone-600 cursor-pointer select-none"
                      onClick={() => toggleSort('schoolId')}>
                      School ID {sort.key === 'schoolId' && <span className="ml-1">{sort.dir === 'desc' ? '\u25BC' : '\u25B2'}</span>}
                    </th>
                    <th className="py-3 px-3 font-black text-[12px] text-stone-600 cursor-pointer select-none"
                      onClick={() => toggleSort('role')}>
                      Role {sort.key === 'role' && <span className="ml-1">{sort.dir === 'desc' ? '\u25BC' : '\u25B2'}</span>}
                    </th>
                    <th className="py-3 px-3 font-black text-[12px] text-stone-600 cursor-pointer select-none"
                      onClick={() => toggleSort('deletedAt')}>
                      Deleted At {sort.key === 'deletedAt' && <span className="ml-1">{sort.dir === 'desc' ? '\u25BC' : '\u25B2'}</span>}
                    </th>
                    <th className="py-3 pl-3 pr-4 font-black text-[12px] text-stone-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {sortedItems.map(item => (
                    <tr key={item._id} className="hover:bg-stone-50/50 transition-colors group">
                      <td className="px-3 py-3">
                        <input type="checkbox" checked={selected.includes(item._id)}
                          onChange={() => toggleSelect(item._id)} className="rounded border-stone-300 accent-[#FF9933]" />
                      </td>
                      <td className="pr-3 py-3">
                        <span className="font-bold text-[13px] text-stone-800">{item.name || (item.firstName && item.lastName ? `${item.firstName} ${item.lastName}` : '\u2014')}</span>
                        {item.profile?.className && <span className="block text-[11px] text-stone-400 font-medium">Class {item.profile.className}</span>}
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-bold text-[12px] text-stone-500 font-mono">{item.schoolId || item.profile?.rollNumber || '\u2014'}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${ROLE_BADGES[item.role] || 'bg-stone-100 text-stone-600 border-stone-200'}`}>
                          {item.role || '\u2014'}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-[12px] font-medium text-stone-500">{formatDate(item.deletedAt)}</span>
                      </td>
                      <td className="pl-3 pr-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleRestore(item._id)} disabled={actionLoading === item._id}
                            className="p-2 rounded-lg border border-stone-200 text-stone-400 hover:text-green-600 hover:border-green-300 hover:bg-green-50 transition-all disabled:opacity-50" title="Restore">
                            {actionLoading === item._id ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                          </button>
                          <button onClick={() => setConfirmDelete(item._id)}
                            className="p-2 rounded-lg border border-stone-200 text-stone-400 hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition-all" title="Delete Permanently">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-4 py-3 border-t border-stone-100 bg-stone-50/30 flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-stone-500">
                {((page - 1) * perPage) + 1}\u2013{Math.min(page * perPage, total)} of <span className="text-stone-800 font-black">{total}</span>
              </span>
              <div className="flex items-center gap-1">
                <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-stone-200 bg-white text-stone-400 hover:text-orange-500 hover:border-orange-300 hover:bg-orange-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                  let p = page;
                  if (totalPages <= 5) { p = idx + 1; }
                  else if (page <= 3) { p = idx + 1; }
                  else if (page >= totalPages - 2) { p = totalPages - 4 + idx; }
                  else { p = page - 2 + idx; }
                  if (p < 1 || p > totalPages) return null;
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className={`min-w-[32px] h-8 rounded-lg text-xs font-black transition-all border ${
                        page === p
                          ? 'bg-[#FF9933] border-[#FF9933] text-white shadow-sm'
                          : 'bg-white border-stone-200 text-stone-500 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-500'
                      }`}>{p}</button>
                  );
                })}
                <button disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-stone-200 bg-white text-stone-400 hover:text-orange-500 hover:border-orange-300 hover:bg-orange-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-black text-stone-800 mb-2">Delete Permanently?</h3>
            <p className="text-sm text-stone-500 font-medium mb-6">
              {confirmDelete === 'bulk'
                ? `${selected.length} item(s) will be permanently removed. This cannot be undone.`
                : 'This action cannot be undone. The record will be permanently removed.'}
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 border border-stone-200 rounded-xl text-sm font-bold text-stone-600 hover:bg-stone-50 transition-colors">Cancel</button>
              <button onClick={() => confirmDelete === 'bulk' ? handleBulkDelete() : handlePermanentDelete(confirmDelete)}
                disabled={actionLoading === 'bulk-delete' || actionLoading === confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-2">
                {(actionLoading === 'bulk-delete' || actionLoading === confirmDelete) && <Loader2 size={14} className="animate-spin" />}
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
