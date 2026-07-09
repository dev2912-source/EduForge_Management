'use client';
import { useState, useEffect, useMemo } from 'react';

const PAGE_LIMIT_KEY = 'student_academic_history_page_limit';

function statusBadgeClass(s) {
  return {
    promoted: 'bg-green-50 text-green-700 border-green-100',
    graduated: 'bg-blue-50 text-blue-700 border-blue-100',
    detained: 'bg-red-50 text-red-600 border-red-100',
    withdrawn: 'bg-stone-50 text-stone-500 border-stone-200'
  }[(s || '').toLowerCase()] || 'bg-stone-50 text-stone-500 border-stone-200';
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AcademicHistoryPage() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(() => {
    if (typeof window !== 'undefined') {
      return Number(localStorage.getItem(PAGE_LIMIT_KEY)) || 10;
    }
    return 10;
  });

  const totalPages = Math.max(1, Math.ceil(records.length / limit));
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * limit;
    return records.slice(start, start + limit);
  }, [records, page, limit]);

  const columns = [
    { key: 'academicYearName', label: 'Academic Year', sm: false },
    { key: 'className', label: 'Class', sm: false },
    { key: 'sectionName', label: 'Section', sm: true },
    { key: 'status', label: 'Status', sm: false },
    { key: 'remarks', label: 'Remarks', md: true },
    { key: 'created_at', label: 'Recorded On', sm: true },
  ];

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch('/api/student/history', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to load');
        const json = await res.json();
        setRecords(json.data || []);
      } catch (err) {
        console.error('Error loading academic history:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
    localStorage.setItem(PAGE_LIMIT_KEY, String(newLimit));
  };

  const pages = useMemo(() => {
    const arr = [];
    for (let i = 1; i <= totalPages; i++) arr.push(i);
    return arr;
  }, [totalPages]);

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="bg-white p-3 rounded-2xl border border-stone-200 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-5 bg-[#F97316] rounded-full" />
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">Academic History</h1>
        </div>
        <p className="text-sm text-stone-500 font-medium ml-3.5 mt-0.5">Your year-by-year academic record</p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="bg-white border-b border-stone-200">
                {columns.map(col => (
                  <th
                    key={col.key}
                    className={`text-left py-3 px-4 text-sm font-bold text-stone-700 ${
                      col.sm ? 'hidden sm:table-cell' : ''
                    } ${col.md ? 'hidden md:table-cell' : ''}`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="py-8 text-center text-stone-400">Loading...</td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="py-10 text-center">
                    <p className="text-sm font-bold text-stone-700">No Academic History</p>
                    <p className="text-sm text-stone-400 mt-1">Your history will appear here once you complete an academic year.</p>
                  </td>
                </tr>
              ) : paginatedRows.map((row, idx) => (
                <tr key={row.id || idx} className="hover:bg-stone-50/50 transition-colors">
                  <td className="py-2.5 px-4">
                    <span className="text-sm font-bold text-stone-900">{row.academicYearName || '—'}</span>
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="text-sm text-stone-700 font-medium">{row.className || '—'}</span>
                  </td>
                  <td className="hidden sm:table-cell py-2.5 px-4">
                    <span className="text-sm text-stone-600">{row.sectionName || '—'}</span>
                  </td>
                  <td className="py-2.5 px-4">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md border ${statusBadgeClass(row.status)}`}>
                      {row.status || '—'}
                    </span>
                  </td>
                  <td className="hidden md:table-cell py-2.5 px-4">
                    <span className="text-xs text-stone-500 italic">{row.remarks || '—'}</span>
                  </td>
                  <td className="hidden sm:table-cell py-2.5 px-4">
                    <span className="text-sm text-stone-500">{formatDate(row.created_at)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-3 border-t border-stone-100 bg-stone-50/30 flex items-center justify-between gap-3 flex-shrink-0">
          <span className="text-xs font-bold text-stone-500 whitespace-nowrap">
            {records.length === 0 ? '0' : `${(page - 1) * limit + 1}–${Math.min(page * limit, records.length)}`} of <span className="text-stone-800 font-black">{records.length}</span>
          </span>
          <div className="flex items-center gap-3">
            {/* Limit Selector */}
            <div className="relative">
              <select
                value={limit}
                onChange={e => handleLimitChange(Number(e.target.value))}
                className="appearance-none w-20 text-left rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-800 focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316] outline-none cursor-pointer"
              >
                {[5, 10, 15, 20, 25].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            {/* Page Navigation */}
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
    </div>
  );
}
