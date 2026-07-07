"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Search, ChevronDown, Edit, ChevronLeft, ChevronRight,
  Loader2, X, Trash2, Download, Upload, ArrowUpDown,
  FileText
} from "lucide-react";

const INITIAL_FORM = { name: "", email: "", phone: "", dateOfBirth: "", gender: "", bloodGroup: "", className: "", section: "", fatherName: "", motherName: "", fatherPhone: "", motherPhone: "", address: "" };
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const GENDERS = ["Male", "Female", "Other"];
const STATUS_OPTS = ["Active", "Inactive", "Graduated"];
const PER_PAGE_OPTS = [10, 25, 50, 100];

export default function StudentsPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [selectedStatus, setSelectedStatus] = useState([]);
  const [selectedGenders, setSelectedGenders] = useState([]);
  const [classFilter, setClassFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [selected, setSelected] = useState(new Set());
  const [selectAllRecords, setSelectAllRecords] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [formStep, setFormStep] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);

  const hasFilters = selectedStatus.length > 0 || selectedGenders.length > 0 || classFilter || sectionFilter;

  const fetchClasses = useCallback(async () => {
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/admin/classes", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setClasses(Array.isArray(data) ? data : (data.data || []));
      }
    } catch {}
  }, []);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const params = new URLSearchParams({ page, limit: perPage, sort_by: sortBy, sort_dir: sortDir });
      if (search) params.set("search", search);
      if (selectedStatus.length > 0) params.set("status", selectedStatus.join(","));
      if (selectedGenders.length > 0) params.set("gender", selectedGenders.join(","));
      if (classFilter) params.set("className", classFilter);
      if (sectionFilter) params.set("section", sectionFilter);

      const res = await fetch(`/api/admin/students?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to fetch students");
      const data = await res.json();
      setStudents(data.data || []);
      setTotalPages(data.pages || 1);
      setTotalRecords(data.total || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search, selectedStatus, selectedGenders, classFilter, sectionFilter, sortBy, sortDir]);

  useEffect(() => {
    const saved = localStorage.getItem('students_per_page');
    if (saved) setPerPage(parseInt(saved));
  }, []);

  useEffect(() => { fetchClasses(); }, [fetchClasses]);
  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  useEffect(() => {
    if (classFilter) {
      const cls = classes.find(c => c.name === classFilter || c.className === classFilter);
      const secs = cls?.sections || [];
      setSections(typeof secs === 'number' ? Array.from({ length: secs }, (_, i) => String.fromCharCode(65 + i)) : secs);
    } else {
      setSections([]);
    }
  }, [classFilter, classes]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = () => { setShowStatusDropdown(false); setShowGenderDropdown(false); setShowExportMenu(false); };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const getClassMedium = (className) => {
    const cls = classes.find(c => c.name === className || c.className === className);
    return cls?.medium || "";
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
    setPage(1);
  };

  const SortHeader = ({ field, label, hideOn }) => (
    <th className={`py-4 px-3 font-black text-[12px] text-stone-800 whitespace-nowrap ${hideOn || ''}`}>
      <button onClick={() => handleSort(field)} className="flex items-center gap-1 cursor-pointer hover:text-stone-600">
        {label}
        <ArrowUpDown size={12} className={`text-stone-400 ${sortBy === field ? 'text-[#FF9933]' : ''}`} />
      </button>
    </th>
  );

  const toggleStatus = (val) => {
    setSelectedStatus(prev => prev.includes(val) ? prev.filter(s => s !== val) : [...prev, val]);
    setPage(1);
  };

  const toggleGender = (val) => {
    setSelectedGenders(prev => prev.includes(val) ? prev.filter(g => g !== val) : [...prev, val]);
    setPage(1);
  };

  const handleSearchChange = (e) => { setSearch(e.target.value); setPage(1); };
  const clearFilters = () => { setSelectedStatus([]); setSelectedGenders([]); setClassFilter(""); setSectionFilter(""); setPage(1); };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    setSelectAllRecords(false);
  };

  const toggleSelectAll = () => {
    if (selected.size === students.length && !selectAllRecords) {
      setSelected(new Set());
    } else {
      setSelected(new Set(students.map(s => s._id)));
    }
  };

  const openAddModal = () => {
    setEditingId(null); setFormData(INITIAL_FORM); setFormError(""); setFormStep(1); setShowModal(true);
  };

  const openEditModal = (student) => {
    setEditingId(student._id);
    setFormData({
      name: student.name || "", email: student.email || "", phone: student.profile?.phone || "",
      dateOfBirth: student.profile?.dateOfBirth ? student.profile.dateOfBirth.split("T")[0] : "",
      gender: student.profile?.gender || "", bloodGroup: student.profile?.bloodGroup || "",
      className: student.profile?.className || "", section: student.profile?.section || "",
      fatherName: student.profile?.parentDetails?.fatherName || "",
      motherName: student.profile?.parentDetails?.motherName || "",
      fatherPhone: student.profile?.parentDetails?.fatherPhone || "",
      motherPhone: student.profile?.parentDetails?.motherPhone || "",
      address: student.profile?.address || "",
    });
    setFormError(""); setFormStep(1); setShowModal(true);
  };

  const handleFormChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const validateStep = (step) => {
    if (step === 1 && !formData.name.trim()) { setFormError("Full Name is required"); return false; }
    if (step === 2 && !formData.className) { setFormError("Class is required"); return false; }
    return true;
  };

  const handleStepNext = () => {
    if (validateStep(formStep)) { setFormError(""); setFormStep(s => s + 1); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(formStep)) return;
    setSaving(true); setFormError("");
    try {
      const token = localStorage.getItem("token") || "";
      const payload = {
        name: formData.name, email: formData.email, phone: formData.phone,
        className: formData.className, section: formData.section,
        dateOfBirth: formData.dateOfBirth, gender: formData.gender, bloodGroup: formData.bloodGroup,
        address: formData.address,
        fatherName: formData.fatherName, motherName: formData.motherName,
        fatherPhone: formData.fatherPhone, motherPhone: formData.motherPhone,
      };

      const url = editingId ? `/api/admin/students/${editingId}` : "/api/admin/students";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
      if (!res.ok) { const errData = await res.json().catch(() => ({})); throw new Error(errData.message || "Failed to save student"); }

      setShowModal(false); setSelected(new Set()); fetchStudents();
    } catch (err) { setFormError(err.message); }
    finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem("token") || "";
      await fetch(`/api/admin/students/${deleteTarget._id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      setDeleteTarget(null); fetchStudents();
    } catch (err) { alert(err.message); }
    finally { setDeleting(false); }
  };

  const handleBulkDelete = async () => {
    setDeleting(true);
    try {
      const token = localStorage.getItem("token") || "";
      await fetch("/api/admin/students/bulk-delete", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ ids: [...selected] }) });
      setSelected(new Set()); setBulkDeleteConfirm(false); fetchStudents();
    } catch (err) { alert(err.message); }
    finally { setDeleting(false); }
  };

  const handleExport = async (format) => {
    setShowExportMenu(false);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`/api/admin/students/export?format=${format}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `students.${format}`; a.click();
      URL.revokeObjectURL(url);
    } catch (err) { alert(err.message); }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const token = localStorage.getItem("token") || "";
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/students/import", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Import failed");
      fetchStudents();
    } catch (err) { alert(err.message); }
    finally { setImporting(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  };

  const changePerPage = (val) => {
    setPerPage(val); setPage(1);
    localStorage.setItem('students_per_page', val);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  };

  const calculateAge = (dob) => {
    if (!dob) return "";
    const diff = Date.now() - new Date(dob).getTime();
    return `(${Math.abs(new Date(diff).getUTCFullYear() - 1970)} yrs)`;
  };

  const getSectionsForForm = () => {
    const cls = classes.find(c => c.name === formData.className || c.className === formData.className);
    const secs = cls?.sections || [];
    return typeof secs === 'number' ? Array.from({ length: secs }, (_, i) => String.fromCharCode(65 + i)) : (Array.isArray(secs) ? secs : ["A", "B"]);
  };

  const bulkItemsText = selectAllRecords ? `All ${totalRecords} selected` : `${selected.size} selected`;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-4">
      {/* Hidden file input for import */}
      <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleImport} className="hidden" />

      {/* Header */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 sm:p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-5 bg-[#FF9933] rounded-full"></div>
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">Student Directory</h1>
          </div>
          <p className="text-[13px] font-medium text-stone-500">
            <span className="text-[#FF9933] font-black">{totalRecords}</span> students enrolled
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => fileInputRef.current?.click()} disabled={importing}
            className="px-4 py-2.5 bg-white border border-stone-200 rounded-lg text-[13px] font-bold text-stone-700 flex items-center gap-2 hover:bg-stone-50 transition-colors shadow-sm disabled:opacity-50">
            {importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {importing ? "Importing..." : "Import"}
          </button>
          <button onClick={openAddModal} className="bg-stone-900 hover:bg-stone-800 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
            <Plus size={16} strokeWidth={3} /> Admit Student
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-stone-200 flex flex-col gap-3 bg-stone-50/30">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative w-full sm:w-72">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={14} className="text-stone-400" />
              </div>
              <input type="text" placeholder="Search students…" value={search} onChange={handleSearchChange}
                className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-medium text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] transition-all shadow-sm" />
            </div>

            {/* Class filter */}
            <select value={classFilter} onChange={e => { setClassFilter(e.target.value); setSectionFilter(""); setPage(1); }}
              className="px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-bold text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] shadow-sm">
              <option value="">All Classes</option>
              {classes.map(c => <option key={c._id || c.name} value={c.name || c.className}>{c.name || c.className}</option>)}
            </select>

            {/* Section filter */}
            <select value={sectionFilter} onChange={e => { setSectionFilter(e.target.value); setPage(1); }}
              disabled={!classFilter}
              className="px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-bold text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] disabled:opacity-50 shadow-sm">
              <option value="">All Sections</option>
              {sections.map(s => <option key={s} value={s}>Section {s}</option>)}
            </select>

            {/* Status multi-select dropdown */}
            <div className="relative">
              <button onClick={(e) => { e.stopPropagation(); setShowStatusDropdown(!showStatusDropdown); setShowGenderDropdown(false); }}
                className="px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-bold flex items-center gap-2 hover:bg-stone-50 transition-colors shadow-sm whitespace-nowrap">
                Status {selectedStatus.length > 0 && <span className="bg-[#FF9933] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-black">{selectedStatus.length}</span>}
                <ChevronDown size={12} />
              </button>
              {showStatusDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-stone-200 rounded-lg shadow-lg z-10 p-2 min-w-[150px]" onClick={e => e.stopPropagation()}>
                  {STATUS_OPTS.map(s => (
                    <label key={s} className="flex items-center gap-2 px-2 py-1.5 text-[13px] font-medium cursor-pointer hover:bg-stone-50 rounded whitespace-nowrap">
                      <input type="checkbox" checked={selectedStatus.includes(s)} onChange={() => toggleStatus(s)}
                        className="w-3.5 h-3.5 rounded border-stone-300 text-[#FF9933] focus:ring-[#FF9933]" />
                      {s}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Gender multi-select dropdown */}
            <div className="relative">
              <button onClick={(e) => { e.stopPropagation(); setShowGenderDropdown(!showGenderDropdown); setShowStatusDropdown(false); }}
                className="px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-bold flex items-center gap-2 hover:bg-stone-50 transition-colors shadow-sm whitespace-nowrap">
                Gender {selectedGenders.length > 0 && <span className="bg-[#FF9933] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-black">{selectedGenders.length}</span>}
                <ChevronDown size={12} />
              </button>
              {showGenderDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-stone-200 rounded-lg shadow-lg z-10 p-2 min-w-[150px]" onClick={e => e.stopPropagation()}>
                  {GENDERS.map(g => (
                    <label key={g} className="flex items-center gap-2 px-2 py-1.5 text-[13px] font-medium cursor-pointer hover:bg-stone-50 rounded whitespace-nowrap">
                      <input type="checkbox" checked={selectedGenders.includes(g)} onChange={() => toggleGender(g)}
                        className="w-3.5 h-3.5 rounded border-stone-300 text-[#FF9933] focus:ring-[#FF9933]" />
                      {g}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Export dropdown */}
            <div className="relative ml-auto">
              <button onClick={(e) => { e.stopPropagation(); setShowExportMenu(!showExportMenu); }}
                className="px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-bold text-stone-700 flex items-center gap-2 hover:bg-stone-50 transition-colors shadow-sm">
                <Download size={14} /> Export <ChevronDown size={12} />
              </button>
              {showExportMenu && (
                <div className="absolute top-full right-0 mt-1 bg-white border border-stone-200 rounded-lg shadow-lg z-10 py-1 min-w-[150px]" onClick={e => e.stopPropagation()}>
                  <button onClick={() => handleExport('csv')} className="w-full flex items-center gap-2 px-3 py-2 text-[13px] font-bold text-stone-700 hover:bg-stone-50 transition-colors">
                    <FileText size={14} /> Export CSV
                  </button>
                  <button onClick={() => handleExport('xlsx')} className="w-full flex items-center gap-2 px-3 py-2 text-[13px] font-bold text-stone-700 hover:bg-stone-50 transition-colors">
                    <FileText size={14} className="text-green-600" /> Export Excel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Filter chips */}
          {hasFilters && (
            <div className="flex flex-wrap items-center gap-1.5">
              {selectedStatus.map(s => (
                <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-[#C2410C] rounded-md text-[11px] font-bold">
                  {s} <button onClick={() => { toggleStatus(s); }}><X size={12} /></button>
                </span>
              ))}
              {selectedGenders.map(g => (
                <span key={g} className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-[#C2410C] rounded-md text-[11px] font-bold">
                  {g} <button onClick={() => { toggleGender(g); }}><X size={12} /></button>
                </span>
              ))}
              {classFilter && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-[#C2410C] rounded-md text-[11px] font-bold">
                  {classFilter} <button onClick={() => { setClassFilter(""); setSectionFilter(""); setPage(1); }}><X size={12} /></button>
                </span>
              )}
              {sectionFilter && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-[#C2410C] rounded-md text-[11px] font-bold">
                  Sec {sectionFilter} <button onClick={() => { setSectionFilter(""); setPage(1); }}><X size={12} /></button>
                </span>
              )}
              <button onClick={clearFilters} className="text-[11px] font-bold text-stone-400 hover:text-stone-600 px-1">Clear filters</button>
            </div>
          )}
        </div>

        {/* Bulk Actions Bar */}
        {selected.size > 0 && (
          <div className="px-4 py-2.5 bg-[#FF9933]/5 border-b border-[#FF9933]/20 flex items-center gap-3 flex-wrap">
            <span className="text-sm font-bold text-[#C2410C]">{bulkItemsText}</span>
            <button onClick={() => setBulkDeleteConfirm(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-[12px] font-bold hover:bg-red-100 transition-colors">
              <Trash2 size={14} /> Delete Selected
            </button>
            <button onClick={() => router.push(`/dashboard/students?selected=${[...selected].join(',')}`)} className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 text-stone-700 rounded-lg text-[12px] font-bold hover:bg-stone-200 transition-colors">
              <Edit size={14} /> Update Selected
            </button>
            <div className="relative">
              <button onClick={(e) => { e.stopPropagation(); setShowExportMenu(!showExportMenu); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 text-stone-700 rounded-lg text-[12px] font-bold hover:bg-stone-200 transition-colors">
                <Download size={14} /> Export
              </button>
              {showExportMenu && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-stone-200 rounded-lg shadow-lg z-10 py-1 min-w-[150px]" onClick={e => e.stopPropagation()}>
                  <button onClick={() => handleExport('csv')} className="w-full flex items-center gap-2 px-3 py-2 text-[13px] font-bold text-stone-700 hover:bg-stone-50 transition-colors">
                    <FileText size={14} /> Export CSV
                  </button>
                  <button onClick={() => handleExport('xlsx')} className="w-full flex items-center gap-2 px-3 py-2 text-[13px] font-bold text-stone-700 hover:bg-stone-50 transition-colors">
                    <FileText size={14} className="text-green-600" /> Export Excel
                  </button>
                </div>
              )}
            </div>
            <button onClick={() => { setSelected(new Set()); setSelectAllRecords(false); }} className="text-[12px] font-bold text-stone-400 hover:text-stone-600 ml-auto">Clear</button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-orange-400"><Loader2 className="animate-spin" size={48} /></div>
          ) : error ? (
            <div className="flex items-center justify-center h-64 text-red-500 font-bold">{error}</div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-stone-500">
              <p className="font-bold">No Students Found</p>
              <p className="text-sm">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/50">
                  <th className="py-4 pl-5 pr-2 font-black text-[12px] text-stone-800 whitespace-nowrap w-10">
                    <input type="checkbox" checked={students.length > 0 && selected.size === students.length}
                      onChange={toggleSelectAll}
                      className="w-3.5 h-3.5 rounded border-stone-300 text-[#FF9933] focus:ring-[#FF9933]" />
                  </th>
                  <SortHeader field="name" label="Full Name" />
                  <SortHeader field="schoolId" label="Enrollment ID" />
                  <SortHeader field="gender" label="Gender" hideOn="hidden sm:table-cell" />
                  <SortHeader field="dob" label="DOB / Age" hideOn="hidden md:table-cell" />
                  <th className="py-4 px-3 font-black text-[12px] text-stone-800 whitespace-nowrap">Class</th>
                  <SortHeader field="status" label="Status" />
                  <SortHeader field="createdAt" label="Created At" hideOn="hidden lg:table-cell" />
                  <SortHeader field="updatedAt" label="Updated At" hideOn="hidden lg:table-cell" />
                  <th className="py-4 px-3 font-black text-[12px] text-stone-800 whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 bg-white">
                {students.map((s) => {
                  const classMedium = getClassMedium(s.profile?.className);
                  return (
                    <tr key={s._id} className="hover:bg-stone-50/50 transition-colors group cursor-pointer" onClick={() => router.push(`/dashboard/students/${s._id}`)}>
                      <td className="py-4 pl-5 pr-2 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={selected.has(s._id)} onChange={() => toggleSelect(s._id)}
                          className="w-3.5 h-3.5 rounded border-stone-300 text-[#FF9933] focus:ring-[#FF9933]" />
                      </td>
                      <td className="py-4 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#FFEDD5] text-[#C2410C] text-xs font-black flex items-center justify-center flex-shrink-0">
                            {s.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                          </div>
                          <span className="font-black text-[13px] text-stone-800">{s.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-3 whitespace-nowrap">
                        <span className="font-bold text-[11px] text-stone-400 tracking-wider font-mono">{s.schoolId || "—"}</span>
                      </td>
                      <td className="py-4 px-3 whitespace-nowrap hidden sm:table-cell">
                        <span className="font-bold text-[12px] text-stone-700">{s.profile?.gender || "—"}</span>
                      </td>
                      <td className="py-4 px-3 whitespace-nowrap hidden md:table-cell">
                        <span className="font-bold text-[12px] text-stone-700">{formatDate(s.profile?.dateOfBirth)}</span>
                        {s.profile?.dateOfBirth && <span className="text-[11px] font-medium text-stone-400 ml-1">{calculateAge(s.profile?.dateOfBirth)}</span>}
                      </td>
                      <td className="py-4 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-[12px] text-stone-800">{s.profile?.className || "—"}</span>
                          {s.profile?.section && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-stone-100 text-stone-500">{s.profile?.section}</span>
                          )}
                          {classMedium && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-orange-50 text-[#C2410C]">{classMedium}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black tracking-widest uppercase ${
                          s.profile?.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                          {s.profile?.status || "active"}
                        </span>
                      </td>
                      <td className="py-4 px-3 whitespace-nowrap hidden lg:table-cell">
                        <span className="font-bold text-[11px] text-stone-500">{formatDate(s.createdAt)}</span>
                      </td>
                      <td className="py-4 px-3 whitespace-nowrap hidden lg:table-cell">
                        <span className="font-bold text-[11px] text-stone-500">{formatDate(s.updatedAt)}</span>
                      </td>
                      <td className="py-4 px-3 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEditModal(s)} className="p-1.5 rounded-md text-stone-400 hover:text-orange-500 hover:bg-orange-50 transition-colors" title="Edit">
                            <Edit size={14} />
                          </button>
                          <button onClick={() => setDeleteTarget(s)} className="p-1.5 rounded-md text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Delete">
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

        {/* Pagination */}
        {!loading && students.length > 0 && (
          <div className="p-4 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white">
            <div className="text-[12px] font-bold text-stone-500">
              {((page - 1) * perPage) + 1}–{Math.min(page * perPage, totalRecords)} of <span className="font-black text-stone-900">{totalRecords}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-bold text-stone-500">Rows:</span>
                <div className="relative">
                  <select value={perPage} onChange={e => changePerPage(parseInt(e.target.value))}
                    className="appearance-none px-3 py-1.5 pr-8 bg-white border border-stone-200 rounded-lg text-[12px] font-bold text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] cursor-pointer">
                    {PER_PAGE_OPTS.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:bg-stone-50 border border-transparent disabled:opacity-50 transition-colors">
                  <ChevronLeft size={16} />
                </button>
                <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#FF9933] text-white font-black text-[13px] shadow-sm">{page}</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-600 hover:bg-stone-50 border border-stone-200 shadow-sm disabled:opacity-50 transition-colors">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit 3-Step Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl border border-stone-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-stone-200">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-black text-stone-900">{editingId ? "Edit Student" : "Admit Student"}</h2>
                <div className="flex items-center gap-1.5 ml-4">
                  {[1, 2, 3].map(step => (
                    <div key={step} className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black transition-all ${
                      formStep === step ? 'bg-[#FF9933] text-white' : formStep > step ? 'bg-green-100 text-green-600' : 'bg-stone-100 text-stone-400'}`}>
                      {formStep > step ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg> : step}
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-md text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-bold">{formError}</div>
              )}

              {formStep === 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[12px] font-black text-stone-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                    <input type="text" name="name" value={formData.name} onChange={handleFormChange}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] transition-all shadow-sm" placeholder="Enter full name" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-black text-stone-700 mb-1">Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleFormChange}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] transition-all shadow-sm" placeholder="email@example.com" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-black text-stone-700 mb-1">Phone</label>
                    <input type="text" name="phone" value={formData.phone} onChange={handleFormChange}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] transition-all shadow-sm" placeholder="Phone number" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-black text-stone-700 mb-1">Date of Birth</label>
                    <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleFormChange}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] transition-all shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-black text-stone-700 mb-1">Gender</label>
                    <select name="gender" value={formData.gender} onChange={handleFormChange}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] transition-all shadow-sm">
                      <option value="">Select Gender</option>
                      {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-black text-stone-700 mb-1">Blood Group</label>
                    <select name="bloodGroup" value={formData.bloodGroup} onChange={handleFormChange}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] transition-all shadow-sm">
                      <option value="">Select Blood Group</option>
                      {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[12px] font-black text-stone-700 mb-1">Address</label>
                    <textarea name="address" value={formData.address} onChange={handleFormChange} rows={2}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] transition-all shadow-sm" />
                  </div>
                </div>
              )}

              {formStep === 2 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-black text-stone-700 mb-1">Class <span className="text-red-500">*</span></label>
                    <select name="className" value={formData.className} onChange={e => { handleFormChange(e); }}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] transition-all shadow-sm">
                      <option value="">Select Class</option>
                      {classes.map(c => <option key={c._id || c.name} value={c.name || c.className}>{c.name || c.className}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-black text-stone-700 mb-1">Section</label>
                    <select name="section" value={formData.section} onChange={handleFormChange}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] transition-all shadow-sm">
                      <option value="">Select Section</option>
                      {getSectionsForForm().map(s => <option key={s} value={s}>Section {s}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {formStep === 3 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-black text-stone-700 mb-1">Father's Name</label>
                    <input type="text" name="fatherName" value={formData.fatherName} onChange={handleFormChange}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] transition-all shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-black text-stone-700 mb-1">Father's Phone</label>
                    <input type="text" name="fatherPhone" value={formData.fatherPhone} onChange={handleFormChange}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] transition-all shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-black text-stone-700 mb-1">Mother's Name</label>
                    <input type="text" name="motherName" value={formData.motherName} onChange={handleFormChange}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] transition-all shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-black text-stone-700 mb-1">Mother's Phone</label>
                    <input type="text" name="motherPhone" value={formData.motherPhone} onChange={handleFormChange}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] transition-all shadow-sm" />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                <div>
                  {formStep > 1 && (
                    <button type="button" onClick={() => { setFormStep(s => s - 1); setFormError(""); }}
                      className="px-4 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-bold text-stone-700 hover:bg-stone-50 transition-colors shadow-sm">
                      Back
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-bold text-stone-700 hover:bg-stone-50 transition-colors shadow-sm">
                    Cancel
                  </button>
                  {formStep < 3 ? (
                    <button type="button" onClick={handleStepNext}
                      className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-[13px] font-bold transition-colors shadow-sm">
                      Continue
                    </button>
                  ) : (
                    <button type="submit" disabled={saving}
                      className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-[13px] font-bold flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50">
                      {saving && <Loader2 size={14} className="animate-spin" />}
                      {editingId ? "Update Student" : "Admit Student"}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Single Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-stone-200 w-full max-w-md m-4 p-5">
            <h3 className="text-lg font-black text-stone-900 mb-2">Remove Student</h3>
            <p className="text-sm font-medium text-stone-600 mb-5">
              Remove <span className="font-black text-stone-800">{deleteTarget.name}</span>? This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-bold text-stone-700 hover:bg-stone-50 transition-colors shadow-sm">Cancel</button>
              <button onClick={confirmDelete} disabled={deleting} className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[13px] font-bold flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50">
                {deleting && <Loader2 size={14} className="animate-spin" />} Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation */}
      {bulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-stone-200 w-full max-w-md m-4 p-5">
            <h3 className="text-lg font-black text-stone-900 mb-2">Delete Selected Students</h3>
            <p className="text-sm font-medium text-stone-600 mb-5">
              Permanently delete {selectAllRecords ? `all ${totalRecords}` : `${selected.size} selected`} student(s)? This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setBulkDeleteConfirm(false)} className="px-4 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-bold text-stone-700 hover:bg-stone-50 transition-colors shadow-sm">Cancel</button>
              <button onClick={handleBulkDelete} disabled={deleting} className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[13px] font-bold flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50">
                {deleting && <Loader2 size={14} className="animate-spin" />} Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}