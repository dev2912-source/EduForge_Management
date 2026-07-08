"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Loader2, AlertCircle, RefreshCw, Download, FilterX, X, SlidersHorizontal, FileText, FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';

const STATUS_STYLES = {
  clocked_in: { classes: 'bg-green-100 text-green-700', label: 'Clocked In' },
  on_break: { classes: 'bg-amber-100 text-amber-700', label: 'On Break' },
  clocked_out: { classes: 'bg-stone-100 text-stone-500', label: 'Clocked Out' },
  not_in: { classes: 'bg-red-100 text-red-600', label: 'Not In' },
};

const STAT_CARDS = [
  { key: 'clocked_in', label: 'Clocked In', color: '#16a34a' },
  { key: 'on_break', label: 'On Break', color: '#d97706' },
  { key: 'clocked_out', label: 'Clocked Out', color: '#57534e' },
  { key: 'not_in', label: 'Not In', color: '#dc2626' },
];

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function formatDateDisplay(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function isToday(dateStr) {
  return dateStr === getToday();
}

function formatTime(isoStr) {
  if (!isoStr) return null;
  const d = new Date(isoStr);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function getStatusLabel(status) {
  return STATUS_STYLES[status]?.label || status || 'Not In';
}

function getStatusClasses(status) {
  return STATUS_STYLES[status]?.classes || 'bg-stone-100 text-stone-400';
}

export default function StaffClockPage() {
  const [data, setData] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [date, setDate] = useState(getToday);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [selected, setSelected] = useState(new Set());
  const [selectAllMode, setSelectAllMode] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(() => {
    if (typeof window !== 'undefined') {
      return parseInt(localStorage.getItem('staff_clock_today_page_limit')) || 10;
    }
    return 10;
  });
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filterDraft, setFilterDraft] = useState({ department: '', clock_status: '' });
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportBtnRef = useRef(null);
  const exportDropRef = useRef(null);

  const debounceRef = useRef(null);

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
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showExportMenu]);

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
    setSearch('');
    setDebouncedSearch('');
    setPage(1);
    clearSelection();
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const [clockRes, deptRes] = await Promise.all([
        fetch(`/api/admin/staff-clock?all=true&date=${date}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/departments', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      if (!clockRes.ok) throw new Error('Failed to fetch clock data');
      const clockJson = await clockRes.json();
      if (!clockJson.success) throw new Error(clockJson.message || 'Failed to fetch');
      setData(clockJson.data);
      if (deptRes.ok) {
        const deptJson = await deptRes.json();
        setDepartments(Array.isArray(deptJson) ? deptJson : (deptJson.data || []));
      }
    } catch (err) {
      setError(err.message);
      setData([]);
    }
    setLoading(false);
  }, [date]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDateChange = (e) => {
    setDate(e.target.value);
    setPage(1);
    setSelected(new Set());
    setSelectAllMode(false);
  };

  const goToday = () => {
    setDate(getToday());
    setPage(1);
    setSelected(new Set());
    setSelectAllMode(false);
  };

  const todayActive = isToday(date);

  const filteredData = useMemo(() => {
    let result = data;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.staff_code.toLowerCase().includes(q)
      );
    }
    if (departmentFilter) {
      result = result.filter(d => d.department === departmentFilter);
    }
    if (statusFilter) {
      result = result.filter(d => d.clock_status === statusFilter);
    }
    return result;
  }, [data, debouncedSearch, departmentFilter, statusFilter]);

  const sortedData = useMemo(() => {
    const arr = [...filteredData];
    arr.sort((a, b) => {
      let va = a[sortKey];
      let vb = b[sortKey];
      if (va == null) va = '';
      if (vb == null) vb = '';
      if (sortKey === 'clock_in_at' || sortKey === 'clock_out_at') {
        va = a[sortKey] ? new Date(a[sortKey]).getTime() : 0;
        vb = b[sortKey] ? new Date(b[sortKey]).getTime() : 0;
      } else {
        va = typeof va === 'string' ? va.toLowerCase() : va;
        vb = typeof vb === 'string' ? vb.toLowerCase() : vb;
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filteredData, sortKey, sortDir]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * perPage;
    return sortedData.slice(start, start + perPage);
  }, [sortedData, page, perPage]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / perPage));
  const startItem = sortedData.length === 0 ? 0 : (page - 1) * perPage + 1;
  const endItem = Math.min(page * perPage, sortedData.length);

  const stats = useMemo(() => {
    const counts = { clocked_in: 0, on_break: 0, clocked_out: 0, not_in: 0 };
    for (const d of data) {
      if (counts[d.clock_status] !== undefined) counts[d.clock_status]++;
    }
    return counts;
  }, [data]);

  const hasActiveFilters = debouncedSearch || departmentFilter || statusFilter;
  const activeFilterCount = [departmentFilter, statusFilter].filter(Boolean).length;
  const allOnPageSelected = paginatedData.length > 0 && paginatedData.every(d => selected.has(d.staff_id));
  const someOnPageSelected = !allOnPageSelected && paginatedData.some(d => selected.has(d.staff_id));

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
    clearSelection();
  };

  const toggleSelect = (id) => {
    setSelectAllMode(false);
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectAllMode(false);
    if (allOnPageSelected) {
      const ids = paginatedData.map(d => d.staff_id);
      setSelected(prev => {
        const next = new Set(prev);
        ids.forEach(id => next.delete(id));
        return next;
      });
    } else {
      const ids = paginatedData.map(d => d.staff_id);
      setSelected(prev => {
        const next = new Set(prev);
        ids.forEach(id => next.add(id));
        return next;
      });
    }
  };

  const selectAllRecords = () => {
    setSelectAllMode(true);
    setSelected(new Set(sortedData.map(d => d.staff_id)));
  };

  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setDepartmentFilter('');
    setStatusFilter('');
    setFilterDraft({ department: '', clock_status: '' });
    setPage(1);
    clearSelection();
  };

  const handlePerPageChange = (val) => {
    setPerPage(val);
    localStorage.setItem('staff_clock_today_page_limit', val.toString());
    setPage(1);
    clearSelection();
  };

  // FilterPanel
  const openFilterPanel = () => {
    setFilterDraft({ department: departmentFilter, clock_status: statusFilter });
    setShowFilterPanel(true);
  };

  const applyFilters = () => {
    setDepartmentFilter(filterDraft.department);
    setStatusFilter(filterDraft.clock_status);
    setPage(1);
    clearSelection();
    setShowFilterPanel(false);
  };

  const clearFilterDraft = () => {
    setFilterDraft({ department: '', clock_status: '' });
  };

  // Export
  const exportData = (format) => {
    const rows = selectAllMode ? sortedData : data.filter(d => selected.has(d.staff_id));
    if (rows.length === 0) return;
    const headers = ['Staff', 'Staff Code', 'Department', 'Status', 'Clock In', 'Clock Out', 'Late'];
    const sep = format === 'csv' ? ',' : '\t';
    const ext = format === 'csv' ? 'csv' : 'xls';
    const mime = format === 'csv' ? 'text/csv' : 'application/vnd.ms-excel';
    const content = [
      headers.join(sep),
      ...rows.map(r => [
        r.name || '', r.staff_code || '', r.department || '',
        getStatusLabel(r.clock_status),
        r.clock_in_at ? formatTime(r.clock_in_at) : '',
        r.clock_out_at ? formatTime(r.clock_out_at) : '',
        r.is_late ? 'Late' : ''
      ].map(v => format === 'csv' ? `"${String(v).replace(/"/g, '""')}"` : v).join(sep))
    ].join('\n');
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `staff-clock-${date}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const getSortIcon = (key) => {
    if (sortKey !== key) return null;
    return sortDir === 'asc' ? <ChevronUp size={12} className="inline-block ml-0.5" /> : <ChevronDown size={12} className="inline-block ml-0.5" />;
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
      if (start > 2) pages.push('...');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="space-y-4 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-5 bg-orange rounded-full" />
            <h1 className="text-xl font-bold text-stone-900 tracking-tight">Staff Clock</h1>
          </div>
          <p className="text-sm text-stone-500 font-medium">
            {todayActive ? 'Today — ' : ''}{formatDateDisplay(date)}
          </p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white py-2 px-5 rounded-lg text-sm font-bold transition-all shadow-sm">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {!error && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STAT_CARDS.map(card => {
            const count = stats[card.key] || 0;
            return (
              <div key={card.key} className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">{card.label}</p>
                <p className="text-2xl font-black mt-1" style={{ color: card.color }}>{count}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Card */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="px-3 py-2 border-b border-stone-100 flex items-center justify-between gap-2 flex-wrap">
          {/* Left: selection info + export */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {(selected.size > 0 || selectAllMode) && (
              <>
                <span className="text-xs font-bold text-stone-500 whitespace-nowrap">
                  {selectAllMode ? `All ${sortedData.length}` : selected.size} selected
                </span>
                <div className="w-px h-4 bg-stone-200 mx-0.5" />
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
                        top: (exportBtnRef.current?.getBoundingClientRect().bottom + 4) + 'px',
                        left: (exportBtnRef.current?.getBoundingClientRect().left) + 'px'
                      }}
                    >
                      <button
                        onClick={() => exportData('csv')}
                        className="w-full text-left px-3.5 py-2 text-xs font-bold text-stone-700 hover:bg-stone-50 transition-colors flex items-center gap-2"
                      >
                        <FileText size={14} className="text-stone-400" /> Export CSV
                      </button>
                      <button
                        onClick={() => exportData('xls')}
                        className="w-full text-left px-3.5 py-2 text-xs font-bold text-stone-700 hover:bg-green-50 transition-colors flex items-center gap-2"
                      >
                        <FileSpreadsheet size={14} className="text-green-500" /> Export Excel
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Right: date picker + today + search + filter + clear */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Date picker */}
            <div className="w-40">
              <input
                type="date"
                value={date}
                max={getToday()}
                onChange={handleDateChange}
                className="block w-full rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-800 shadow-sm transition-all focus:outline-none focus:ring-2 cursor-pointer"
                style={{ '--tw-ring-color': 'rgba(255, 153, 51, 0.2)' }}
              />
            </div>

            {/* Today button */}
            {!todayActive && (
              <button
                onClick={goToday}
                className="px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest bg-stone-100 text-stone-500 hover:bg-stone-200 transition-all"
              >
                Today
              </button>
            )}

            {/* Search */}
            <div className="relative group w-60">
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 group-focus-within:text-orange transition-colors pointer-events-none">
                <Search size={14} />
              </div>
              <input
                type="text"
                className="block rounded-lg border border-stone-200 bg-white pl-8 pr-7 py-1.5 text-sm text-stone-800 shadow-sm transition-all focus:outline-none focus:border-orange focus:ring-2 focus:ring-orange/20 w-full"
                placeholder="Search by name or staff code…"
                value={search}
                onInput={handleSearchInput}
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

            {/* Filter button */}
            <button
              onClick={openFilterPanel}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold border transition-all whitespace-nowrap ${
                activeFilterCount > 0
                  ? 'bg-orange text-white border-orange shadow-sm shadow-orange/20'
                  : 'bg-white text-stone-600 border-[#E8E0D4] hover:border-[#C8BEB4]'
              }`}
            >
              <SlidersHorizontal size={14} />
              Filters
              {activeFilterCount > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-black rounded-full bg-white/25 text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold text-stone-400 hover:text-red-500 hover:bg-red-50 border border-stone-200 transition-all"
                title="Clear filters"
              >
                <FilterX size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <AlertCircle size={40} className="text-red-300 mb-3" />
            <p className="text-sm font-semibold text-stone-600 mb-3">{error}</p>
            <button onClick={fetchData} className="px-4 py-2 rounded-lg text-sm font-semibold bg-stone-900 text-white hover:opacity-90 transition-all">
              Try Again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!error && !loading && sortedData.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <p className="text-sm font-semibold text-stone-600 mb-1">No Staff Found</p>
            <p className="text-xs text-stone-400">Try adjusting your search, date or filters.</p>
          </div>
        )}

        {/* Table */}
        {!error && (loading || sortedData.length > 0) && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[540px]">
              <thead>
                <tr className="bg-white border-b border-stone-200 text-left">
                  <th className="w-10 py-3 pl-4 pr-2">
                    <button
                      onClick={toggleSelectAll}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                        allOnPageSelected || selectAllMode
                          ? 'bg-orange border-orange'
                          : someOnPageSelected
                            ? 'border-orange-300'
                            : 'border-stone-300 hover:border-orange-300'
                      }`}
                    >
                      {(allOnPageSelected || selectAllMode) && (
                        <CheckCircle2 size={12} className="text-white" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-3">
                    <button
                      onClick={() => handleSort('name')}
                      className="text-xs font-bold text-stone-700 flex items-center gap-1 hover:text-stone-900 transition-colors"
                    >
                      Staff {getSortIcon('name')}
                    </button>
                  </th>
                  <th className="py-3 px-3 hidden sm:table-cell">
                    <button
                      onClick={() => handleSort('department')}
                      className="text-xs font-bold text-stone-700 flex items-center gap-1 hover:text-stone-900 transition-colors"
                    >
                      Department {getSortIcon('department')}
                    </button>
                  </th>
                  <th className="py-3 px-3">
                    <button
                      onClick={() => handleSort('clock_status')}
                      className="text-xs font-bold text-stone-700 flex items-center gap-1 hover:text-stone-900 transition-colors"
                    >
                      Status {getSortIcon('clock_status')}
                    </button>
                  </th>
                  <th className="py-3 px-3">
                    <button
                      onClick={() => handleSort('clock_in_at')}
                      className="text-xs font-bold text-stone-700 flex items-center gap-1 hover:text-stone-900 transition-colors"
                    >
                      Clock In {getSortIcon('clock_in_at')}
                    </button>
                  </th>
                  <th className="py-3 px-3 hidden md:table-cell">
                    <button
                      onClick={() => handleSort('clock_out_at')}
                      className="text-xs font-bold text-stone-700 flex items-center gap-1 hover:text-stone-900 transition-colors"
                    >
                      Clock Out {getSortIcon('clock_out_at')}
                    </button>
                  </th>
                  <th className="py-3 px-3 pr-4">
                    <button
                      onClick={() => handleSort('is_late')}
                      className="text-xs font-bold text-stone-700 flex items-center gap-1 hover:text-stone-900 transition-colors"
                    >
                      Late {getSortIcon('is_late')}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center">
                      <div className="flex items-center justify-center gap-2 text-sm text-stone-400">
                        <Loader2 size={16} className="animate-spin" />
                        Loading staff clock data...
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row) => (
                    <tr
                      key={row.staff_id}
                      className={`group transition-all duration-100 hover:bg-stone-50/70 ${
                        selected.has(row.staff_id) ? 'bg-orange-50/30' : ''
                      }`}
                    >
                      <td className="w-10 py-2.5 pl-4 pr-2">
                        <button
                          onClick={() => toggleSelect(row.staff_id)}
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                            selected.has(row.staff_id)
                              ? 'bg-orange border-orange'
                              : 'border-stone-300 hover:border-orange-300'
                          }`}
                        >
                          {selected.has(row.staff_id) && (
                            <CheckCircle2 size={12} className="text-white" />
                          )}
                        </button>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange flex-shrink-0" />
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-stone-800">{row.name}</span>
                            <span className="text-[10px] font-mono font-bold text-stone-400">{row.staff_code}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 hidden sm:table-cell">
                        <span className="text-xs font-bold text-stone-600">{row.department || '—'}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide ${getStatusClasses(row.clock_status)}`}>
                          {getStatusLabel(row.clock_status)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`text-xs font-bold ${row.clock_in_at ? 'text-stone-800' : 'text-stone-400'}`}>
                          {formatTime(row.clock_in_at) || '—'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 hidden md:table-cell">
                        <span className={`text-xs font-bold ${row.clock_out_at ? 'text-stone-800' : 'text-stone-400'}`}>
                          {formatTime(row.clock_out_at) || '—'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 pr-4">
                        {row.is_late ? (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Late</span>
                        ) : (
                          <span className="text-stone-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Select all records option */}
            {!loading && sortedData.length > perPage && allOnPageSelected && !selectAllMode && (
              <div className="px-4 py-2 border-t border-stone-100 bg-stone-50/30">
                <button
                  onClick={selectAllRecords}
                  className="text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors"
                >
                  Select all {sortedData.length} records
                </button>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {!error && sortedData.length > 0 && (
          <div className="px-4 py-3 border-t border-stone-100 bg-stone-50/30 flex items-center justify-between gap-3">
            <span className="text-xs font-bold text-stone-500 whitespace-nowrap">
              {startItem}–{endItem} of <span className="text-stone-800 font-black">{sortedData.length}</span>
            </span>
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={perPage}
                  onChange={(e) => handlePerPageChange(Number(e.target.value))}
                  className="appearance-none rounded-lg border-[1.5px] bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 border-[#E8E0D4] hover:border-[#C8BEB4] focus:outline-none cursor-pointer pr-6"
                >
                  {[10, 25, 50, 100].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400" />
              </div>
              <div className="flex items-center gap-1">
                <button
                  disabled={page === 1}
                  onClick={() => { setPage(p => Math.max(1, p - 1)); if (!selectAllMode) clearSelection(); }}
                  className="p-1.5 rounded-lg border border-stone-200 bg-white text-stone-400 hover:text-orange-500 hover:border-orange-300 hover:bg-orange-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                {getPageNumbers().map((p, idx) =>
                  p === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-1 text-xs text-stone-400">...</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => { setPage(p); if (!selectAllMode) clearSelection(); }}
                      className={`min-w-[32px] h-8 rounded-lg text-xs font-black transition-all border ${
                        page === p
                          ? 'bg-[#F9932B] border-[#F9932B] text-white shadow-sm shadow-orange-500/20'
                          : 'bg-white border-stone-200 text-stone-500 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-500'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
                <button
                  disabled={page === totalPages}
                  onClick={() => { setPage(p => Math.min(totalPages, p + 1)); if (!selectAllMode) clearSelection(); }}
                  className="p-1.5 rounded-lg border border-stone-200 bg-white text-stone-400 hover:text-orange-500 hover:border-orange-300 hover:bg-orange-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FilterPanel Modal */}
      {showFilterPanel && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ background: 'rgba(28,25,23,0.35)', backdropFilter: 'blur(2px)' }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) setShowFilterPanel(false); }}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl border border-stone-200 flex flex-col"
            style={{ boxShadow: '0 24px 80px rgba(28,25,23,0.2)', maxHeight: '90vh' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-light flex items-center justify-center">
                  <SlidersHorizontal size={14} className="text-orange" />
                </div>
                <span className="text-sm font-black text-stone-900">Filters</span>
              </div>
              <div className="flex items-center gap-3">
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilterDraft}
                    className="text-xs font-bold text-stone-400 hover:text-red-500 transition-colors"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={() => setShowFilterPanel(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-all"
                >
                  <X size={14} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-5 space-y-3">
                {/* Department */}
                <div className="flex items-center gap-3">
                  <label className="text-xs font-bold text-stone-500 w-20 flex-shrink-0">Department</label>
                  <div className="flex-1">
                    <select
                      value={filterDraft.department}
                      onChange={(e) => setFilterDraft(prev => ({ ...prev, department: e.target.value }))}
                      className="w-full rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 focus:outline-none focus:ring-2 cursor-pointer"
                      style={{ '--tw-ring-color': 'rgba(255, 153, 51, 0.2)' }}
                    >
                      <option value="">All Departments</option>
                      {departments.map(d => (
                        <option key={d._id || d} value={d.name || d}>{d.name || d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-3">
                  <label className="text-xs font-bold text-stone-500 w-20 flex-shrink-0">Status</label>
                  <div className="flex-1">
                    <select
                      value={filterDraft.clock_status}
                      onChange={(e) => setFilterDraft(prev => ({ ...prev, clock_status: e.target.value }))}
                      className="w-full rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 focus:outline-none focus:ring-2 cursor-pointer"
                      style={{ '--tw-ring-color': 'rgba(255, 153, 51, 0.2)' }}
                    >
                      <option value="">All Status</option>
                      <option value="clocked_in">Clocked In</option>
                      <option value="on_break">On Break</option>
                      <option value="clocked_out">Clocked Out</option>
                      <option value="not_in">Not In</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-stone-100 bg-stone-50/60 rounded-b-2xl flex items-center justify-end gap-2 flex-shrink-0">
              <button
                onClick={() => setShowFilterPanel(false)}
                className="px-4 py-2 text-sm font-bold text-stone-600 hover:bg-stone-200 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={applyFilters}
                className="bg-stone-900 hover:bg-stone-800 text-white py-2 px-5 rounded-lg text-sm font-bold transition-all shadow-sm"
              >
                Apply{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
