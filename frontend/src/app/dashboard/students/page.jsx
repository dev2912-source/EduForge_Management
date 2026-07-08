"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Search, ChevronDown, Edit, ChevronLeft, ChevronRight,
  Loader2, X, Trash2, Download, Upload, ArrowUpDown,
  FileText, SlidersHorizontal
} from "lucide-react";

const INITIAL_FORM = { name: "", email: "", phone: "", dateOfBirth: "", gender: "", bloodGroup: "", className: "", section: "", fatherName: "", motherName: "", fatherPhone: "", motherPhone: "", address: "" };
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const GENDERS = ["Male", "Female", "Other"];
const STATUS_OPTS = ["Active", "Inactive", "Graduated"];
const PER_PAGE_OPTS = [10, 25, 50, 100];
const PER_PAGE_KEY = "staff_students_page_limit";

function StatusBadge({ status }) {
  const s = (status || "active").toLowerCase();
  const map = { active: "bg-green-50 text-green-700", inactive: "bg-stone-100 text-stone-500", graduated: "bg-blue-50 text-blue-700" };
  return <span className={`px-2 py-0.5 rounded-md text-[10px] font-black tracking-widest uppercase ${map[s] || map.active}`}>{s}</span>;
}

function ExportBtn({ onCsv, onExcel }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold text-stone-700 hover:bg-stone-50 border border-stone-200 shadow-sm transition-colors">
        <Download size={14} /> Export <ChevronDown size={12} />
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 bg-white border border-stone-200 rounded-lg shadow-lg z-20 py-1 min-w-[150px]">
          <button onClick={() => { onCsv?.(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-[13px] font-bold text-stone-700 hover:bg-stone-50 transition-colors">
            <FileText size={14} /> Export CSV
          </button>
          <button onClick={() => { onExcel?.(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-[13px] font-bold text-stone-700 hover:bg-stone-50 transition-colors">
            <FileText size={14} className="text-green-600" /> Export Excel
          </button>
        </div>
      )}
    </div>
  );
}

function FilterPanel({ fields, onFieldChange, onApply }) {
  const [open, setOpen] = useState(false);
  const [vals, setVals] = useState({});
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const active = fields.filter(f => {
    const v = vals[f.key]; if (!v) return false;
    return Array.isArray(v) ? v.length > 0 : v !== "";
  }).length;

  const handleChange = (k, v) => {
    setVals(p => ({ ...p, [k]: v }));
    onFieldChange?.({ field: k, value: v });
  };

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-bold text-stone-700 hover:bg-stone-50 transition-colors shadow-sm">
        <SlidersHorizontal size={14} /> Filters
        {active > 0 && <span className="bg-orange-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-black ml-0.5">{active}</span>}
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 bg-white border border-stone-200 rounded-xl shadow-lg z-30 p-4 min-w-[220px] space-y-3" onClick={e => e.stopPropagation()}>
          {fields.map(f => {
            if (f.dependsOn && !vals[f.dependsOn]) return null;
            const val = vals[f.key];
            const isMulti = f.multiple;
            const selected = isMulti ? (Array.isArray(val) ? val : []) : (val || "");
            if (isMulti) {
              const toggle = (ov) => {
                const arr = [...(Array.isArray(vals[f.key]) ? vals[f.key] : [])];
                const idx = arr.indexOf(ov);
                if (idx >= 0) arr.splice(idx, 1); else arr.push(ov);
                handleChange(f.key, arr.length > 0 ? arr : "");
              };
              return (
                <div key={f.key} className="space-y-1">
                  <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wide">{f.label}</div>
                  <div className="space-y-0.5 max-h-32 overflow-y-auto">
                    {(f.options || []).map(o => (
                      <label key={o.value} className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-stone-50 text-[13px] font-medium">
                        <input type="checkbox" checked={selected.includes(o.value)} onChange={() => toggle(o.value)}
                          className="w-3.5 h-3.5 rounded border-stone-300 text-orange-500 focus:ring-orange-500" />
                        {o.label}
                      </label>
                    ))}
                  </div>
                </div>
              );
            }
            return (
              <div key={f.key} className="space-y-1">
                <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wide">{f.label}</div>
                <select value={selected} onChange={e => handleChange(f.key, e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500">
                  <option value="">All {f.label}s</option>
                  {(f.options || []).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            );
          })}
          <div className="flex items-center justify-between pt-2 border-t border-stone-100">
            <button onClick={() => { setVals({}); onApply?.(fields.map(f => ({ field: f.key, value: "" }))); fields.forEach(f => onFieldChange?.({ field: f.key, value: null })); setOpen(false); }}
              className="text-[12px] font-bold text-stone-400 hover:text-red-500 transition-colors">Clear</button>
            <button onClick={() => { onApply?.(fields.map(f => ({ field: f.key, value: vals[f.key] }))); setOpen(false); }}
              className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-[12px] font-bold transition-colors">Apply</button>
          </div>
        </div>
      )}
    </div>
  );
}

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
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const [selected, setSelected] = useState(new Set());
  const [selectAllRecords, setSelectAllRecords] = useState(false);
  const [filterValues, setFilterValues] = useState([]);
  const [classesLoading, setClassesLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [formStep, setFormStep] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [importing, setImporting] = useState(false);

  const getFilterVal = (key) => {
    const f = filterValues.find(v => v.field === key);
    return f?.value ?? "";
  };

  const hasActiveFilters = filterValues.some(f => {
    if (!f.value) return false;
    return Array.isArray(f.value) ? f.value.length > 0 : f.value !== "";
  });

  const filterFields = [
    { key: "class_id", label: "Class", type: "select", options: classes.map(c => ({ value: c._id, label: c.name, chip: c.medium || null })) },
    { key: "section_id", label: "Section", type: "select", dependsOn: "class_id", options: sections.map(s => ({ value: s.name, label: s.name })) },
    { key: "status", label: "Status", type: "select", multiple: true, options: STATUS_OPTS.map(s => ({ value: s.toLowerCase(), label: s })) },
    { key: "gender", label: "Gender", type: "select", multiple: true, options: GENDERS.map(g => ({ value: g.toLowerCase(), label: g })) },
  ];

  const columns = [
    { key: "name", label: "Full Name", sortable: true, sortKey: "name" },
    { key: "student_code", label: "Enrollment ID", sortable: true, sortKey: "schoolId" },
    { key: "gender", label: "Gender", sortable: true, responsive: "sm" },
    { key: "dob", label: "DOB / Age", sortable: true, sortKey: "dob", responsive: "md" },
    { key: "class", label: "Class", sortable: false },
    { key: "status", label: "Status", sortable: true, sortKey: "status" },
    { key: "created_at", label: "Created At", sortable: true, responsive: "lg" },
    { key: "updated_at", label: "Updated At", sortable: true, responsive: "lg" },
  ];

  const fetchClasses = useCallback(async () => {
    setClassesLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/admin/classes", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const d = await res.json();
        setClasses(Array.isArray(d.data) ? d.data : []);
      }
    } catch {} finally { setClassesLoading(false); }
  }, []);

  const fetchSections = useCallback(async (classId) => {
    if (!classId) { setSections([]); return; }
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`/api/admin/sections?class_id=${classId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const d = await res.json(); setSections(Array.isArray(d.data) ? d.data : []); }
    } catch { setSections([]); }
  }, []);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const params = new URLSearchParams({ page, limit: perPage, sort_by: sortBy, sort_dir: sortDir });

      const clsVal = getFilterVal("class_id");
      const secVal = getFilterVal("section_id");
      const statusVal = getFilterVal("status");
      const genderVal = getFilterVal("gender");

      if (search) params.set("search", search);
      if (clsVal) params.set("class_id", clsVal);
      if (secVal) params.set("section_id", secVal);
      if (statusVal) { const s = Array.isArray(statusVal) ? statusVal.join(",") : statusVal; if (s) params.set("status", s); }
      if (genderVal) { const g = Array.isArray(genderVal) ? genderVal.join(",") : genderVal; if (g) params.set("gender", g); }

      const res = await fetch(`/api/admin/students?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to fetch students");
      const data = await res.json();

      const list = (data.data || []).map(s => {
        const cls = classes.find(c => c.name === s.profile?.className);
        return {
          _id: s._id,
          id: s._id,
          first_name: s.firstName || s.name?.split(" ").slice(0, -1).join(" ") || "",
          last_name: s.lastName || s.name?.split(" ").slice(-1).join(" ") || "",
          name: s.name || "",
          student_code: s.schoolId || "—",
          gender: s.profile?.gender || "—",
          date_of_birth: s.profile?.dateOfBirth || null,
          class_name: s.profile?.className || "—",
          section_name: s.profile?.section || "",
          class_medium: cls?.medium || "",
          status: s.profile?.status || "active",
          phone: s.profile?.phone || "",
          email: s.email || "",
          created_at: s.createdAt,
          updated_at: s.updatedAt,
        };
      });

      setStudents(list);
      setTotalPages(data.pages || 1);
      setTotalRecords(data.total || 0);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [page, perPage, search, sortBy, sortDir, filterValues, classes]);

  useEffect(() => {
    const saved = localStorage.getItem(PER_PAGE_KEY);
    if (saved) setPerPage(parseInt(saved));
  }, []);

  useEffect(() => { fetchClasses(); }, [fetchClasses]);
  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleFilterFieldChange = ({ field, value }) => {
    if (field === "class_id") {
      if (value) fetchSections(value); else setSections([]);
    }
  };

  const handleFilterApply = (results) => {
    setFilterValues(results || []);
    setPage(1);
    setSelected(new Set());
    setSelectAllRecords(false);
  };

  const handleSort = (field) => {
    if (sortBy === field) { setSortDir(d => d === "asc" ? "desc" : "asc"); }
    else { setSortBy(field); setSortDir("asc"); }
    setPage(1);
  };

  const SortHeader = ({ col }) => {
    const hide = col.responsive ? `hidden ${col.responsive === "sm" ? "sm:table-cell" : col.responsive === "md" ? "md:table-cell" : "lg:table-cell"}` : "";
    return (
      <th className={`py-4 px-3 font-black text-[12px] text-stone-800 whitespace-nowrap ${hide}`}>
        <button onClick={() => col.sortable && handleSort(col.sortKey || col.key)}
          className={`flex items-center gap-1 cursor-pointer hover:text-stone-600 ${col.sortable ? "" : "cursor-default"}`}>
          {col.label}
          {col.sortable && <ArrowUpDown size={12} className={`text-stone-400 ${sortBy === (col.sortKey || col.key) ? "text-orange-500" : ""}`} />}
        </button>
      </th>
    );
  };

  const debounceRef = useRef(null);
  const handleSearchChange = (e) => {
    const v = e.target.value;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setSearch(v); setPage(1); }, 350);
  };

  const clearFilters = () => {
    setFilterValues([]);
    setSections([]);
    setPage(1);
  };

  const toggleSelect = (id) => {
    setSelected(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
    setSelectAllRecords(false);
  };

  const toggleSelectAll = () => {
    if (selected.size === students.length && !selectAllRecords) { setSelected(new Set()); }
    else { setSelected(new Set(students.map(s => s._id))); }
  };

  const openAddModal = () => { setEditingId(null); setFormData(INITIAL_FORM); setFormError(""); setFormStep(1); setShowModal(true); };

  const openEditModal = (student) => {
    setEditingId(student._id);
    setFormData({
      name: student.name || "", email: student.email || "", phone: student.phone || "",
      dateOfBirth: student.date_of_birth ? student.date_of_birth.split("T")[0] : "",
      gender: student.gender === "—" ? "" : student.gender,
      bloodGroup: "", className: student.class_name === "—" ? "" : student.class_name,
      section: student.section_name || "", fatherName: "", motherName: "",
      fatherPhone: "", motherPhone: "", address: "",
    });
    setFormError(""); setFormStep(1); setShowModal(true);
  };

  const handleFormChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const validateStep = (step) => {
    if (step === 1 && !formData.name.trim()) { setFormError("Full Name is required"); return false; }
    if (step === 2 && !formData.className) { setFormError("Class is required"); return false; }
    return true;
  };

  const handleStepNext = () => { if (validateStep(formStep)) { setFormError(""); setFormStep(s => s + 1); } };

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
      if (!res.ok) { const ed = await res.json().catch(() => ({})); throw new Error(ed.message || "Failed to save student"); }
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

  const exportData = (format) => {
    const items = students.filter(s => selectAllRecords || selected.has(s._id));
    const headers = ["ID", "First Name", "Last Name", "Gender", "Class", "Section", "Status", "Phone", "Email"];
    const rows = items.map(s => [s.student_code, s.first_name, s.last_name, s.gender, s.class_name, s.section_name, s.status, s.phone, s.email]);

    if (format === "csv") {
      const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "students.csv"; a.click();
      URL.revokeObjectURL(url);
    } else {
      const xls = [headers, ...rows].map(r => r.join("\t")).join("\n");
      const blob = new Blob([xls], { type: "application/vnd.ms-excel" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "students.xls"; a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const token = localStorage.getItem("token") || "";
      const fd = new FormData();
      fd.append("file", file);
      await fetch("/api/admin/students/import", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
      fetchStudents();
    } catch (err) { alert(err.message); }
    finally { setImporting(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  };

  const changePerPage = (val) => { setPerPage(val); setPage(1); localStorage.setItem(PER_PAGE_KEY, val); };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }) : "—";
  const formatDateTime = (d) => d ? new Date(d).toLocaleString("en-US", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
  const calcAge = (dob) => { if (!dob) return ""; const diff = Date.now() - new Date(dob).getTime(); return `(${Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))} yrs)`; };

  const isAllSelected = students.length > 0 && selected.size === students.length && !selectAllRecords;
  const isPartial = !isAllSelected && selected.size > 0;
  const bulkText = selectAllRecords ? `All ${totalRecords} selected` : `${selected.size} selected`;

  const getSectionsForForm = () => {
    const cls = classes.find(c => c.name === formData.className);
    const count = cls?.sections || 1;
    return Array.from({ length: count }, (_, i) => String.fromCharCode(65 + i));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-4">
      <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleImport} className="hidden" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-2xl border border-stone-200 shadow-sm">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-5 bg-orange-500 rounded-full" />
            <h1 className="text-xl font-bold text-stone-900 tracking-tight">Students</h1>
          </div>
          <p className="text-sm text-stone-500 font-medium">
            <span className="text-orange-500 font-bold">{totalRecords}</span> students enrolled
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button onClick={() => fileInputRef.current?.click()} disabled={importing}
            className="px-4 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-bold text-stone-700 flex items-center gap-2 hover:bg-stone-50 transition-colors shadow-sm disabled:opacity-50">
            {importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {importing ? "Importing..." : "Import"}
          </button>
          <button onClick={openAddModal}
            className="bg-stone-900 hover:bg-stone-800 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
            <Plus size={16} strokeWidth={3} /> Admit Student
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="px-3 py-2 border-b border-stone-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {selected.size > 0 && (
              <>
                <span className="text-xs font-bold text-stone-500 whitespace-nowrap">{bulkText}</span>
                <div className="w-px h-4 bg-stone-200 mx-0.5" />
                <ExportBtn onCsv={() => exportData("csv")} onExcel={() => exportData("xlsx")} />
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
              <input type="text" placeholder="Search students…" onChange={handleSearchChange}
                className="w-52 pl-8 pr-3 py-1.5 bg-white border border-stone-200 rounded-lg text-[13px] font-medium placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all" />
            </div>
            <FilterPanel fields={filterFields} onFieldChange={handleFilterFieldChange} onApply={handleFilterApply} />
            {hasActiveFilters && (
              <button onClick={clearFilters}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold text-stone-400 hover:text-red-500 hover:bg-red-50 border border-stone-200 transition-all"
                title="Clear filters">
                <X size={14} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-orange-400"><Loader2 className="animate-spin" size={48} /></div>
          ) : error ? (
            <div className="flex items-center justify-center h-64 text-red-500 font-bold">{error}</div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-stone-500">
              <p className="font-bold text-stone-700">No Students Found</p>
              <p className="text-sm font-medium text-stone-400">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[560px]">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/50">
                  <th className="py-4 pl-5 pr-2 font-black text-[12px] text-stone-800 whitespace-nowrap w-10">
                    <input type="checkbox" checked={isAllSelected || (students.length > 0 && selected.size === students.length)}
                      onChange={toggleSelectAll}
                      className="w-3.5 h-3.5 rounded border-stone-300 text-orange-500 focus:ring-orange-500" />
                  </th>
                  {columns.map(col => <SortHeader key={col.key} col={col} />)}
                  <th className="py-4 px-3 font-black text-[12px] text-stone-800 whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 bg-white">
                {students.map(s => (
                  <tr key={s._id} className="hover:bg-stone-50/50 transition-colors group cursor-pointer" onClick={() => router.push(`/dashboard/students/${s._id}`)}>
                    <td className="py-4 pl-5 pr-2 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.has(s._id)} onChange={() => toggleSelect(s._id)}
                        className="w-3.5 h-3.5 rounded border-stone-300 text-orange-500 focus:ring-orange-500" />
                    </td>
                    <td className="py-4 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 text-xs font-black flex items-center justify-center flex-shrink-0">
                          {(s.first_name?.[0] || "") + (s.last_name?.[0] || "") || s.name?.[0] || "?"}
                        </div>
                        <span className="text-sm font-semibold text-stone-700 group-hover:text-stone-800 leading-tight">
                          {s.first_name} {s.last_name}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-3 whitespace-nowrap">
                      <span className="text-xs font-mono font-bold text-stone-400">{s.student_code}</span>
                    </td>
                    <td className="py-4 px-3 whitespace-nowrap hidden sm:table-cell">
                      <span className="text-xs font-semibold text-stone-500 capitalize">{s.gender}</span>
                    </td>
                    <td className="py-4 px-3 whitespace-nowrap hidden md:table-cell">
                      {s.date_of_birth ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-stone-600">{formatDate(s.date_of_birth)}</span>
                          <span className="text-[11px] text-stone-400 font-medium">{calcAge(s.date_of_birth)}</span>
                        </div>
                      ) : <span className="text-xs text-stone-400">—</span>}
                    </td>
                    <td className="py-4 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-semibold text-stone-600">{s.class_name}</span>
                        {s.section_name && (
                          <span className="text-[10px] font-black text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded uppercase tracking-wide">{s.section_name}</span>
                        )}
                        {s.class_medium && (
                          <span className="text-[10px] font-black text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded uppercase tracking-wide">{s.class_medium}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-3 whitespace-nowrap">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="py-4 px-3 whitespace-nowrap hidden lg:table-cell">
                      <span className="text-xs text-stone-400 font-medium">{formatDateTime(s.created_at)}</span>
                    </td>
                    <td className="py-4 px-3 whitespace-nowrap hidden lg:table-cell">
                      <span className="text-xs text-stone-400 font-medium">{formatDateTime(s.updated_at)}</span>
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
                ))}
              </tbody>
            </table>
          )}
        </div>

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
                    className="appearance-none px-3 py-1.5 pr-8 bg-white border border-stone-200 rounded-lg text-[12px] font-bold text-stone-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer">
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
                <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-orange-500 text-white font-black text-[13px] shadow-sm cursor-default">{page}</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-600 hover:bg-stone-50 border border-stone-200 shadow-sm disabled:opacity-50 transition-colors">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl border border-stone-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-stone-200">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-black text-stone-900">{editingId ? "Edit Student" : "Admit Student"}</h2>
                <div className="flex items-center gap-1.5 ml-4">
                  {[1, 2, 3].map(step => (
                    <div key={step} className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black transition-all ${
                      formStep === step ? 'bg-orange-500 text-white' : formStep > step ? 'bg-green-100 text-green-600' : 'bg-stone-100 text-stone-400'}`}>
                      {formStep > step ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg> : step}
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-md text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formError && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-bold">{formError}</div>}
              {formStep === 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[12px] font-black text-stone-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                    <input type="text" name="name" value={formData.name} onChange={handleFormChange}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm" placeholder="Enter full name" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-black text-stone-700 mb-1">Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleFormChange}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm" placeholder="email@example.com" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-black text-stone-700 mb-1">Phone</label>
                    <input type="text" name="phone" value={formData.phone} onChange={handleFormChange}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm" placeholder="Phone number" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-black text-stone-700 mb-1">Date of Birth</label>
                    <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleFormChange}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-black text-stone-700 mb-1">Gender</label>
                    <select name="gender" value={formData.gender} onChange={handleFormChange}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm">
                      <option value="">Select Gender</option>
                      {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-black text-stone-700 mb-1">Blood Group</label>
                    <select name="bloodGroup" value={formData.bloodGroup} onChange={handleFormChange}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm">
                      <option value="">Select Blood Group</option>
                      {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[12px] font-black text-stone-700 mb-1">Address</label>
                    <textarea name="address" value={formData.address} onChange={handleFormChange} rows={2}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm" />
                  </div>
                </div>
              )}
              {formStep === 2 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-black text-stone-700 mb-1">Class <span className="text-red-500">*</span></label>
                    <select name="className" value={formData.className} onChange={handleFormChange}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm">
                      <option value="">Select Class</option>
                      {classes.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-black text-stone-700 mb-1">Section</label>
                    <select name="section" value={formData.section} onChange={handleFormChange}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm">
                      <option value="">Select Section</option>
                      {getSectionsForForm().map(s => <option key={s} value={s}>Section {s}</option>)}
                    </select>
                  </div>
                </div>
              )}
              {formStep === 3 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="block text-[12px] font-black text-stone-700 mb-1">Father's Name</label>
                    <input type="text" name="fatherName" value={formData.fatherName} onChange={handleFormChange}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm" /></div>
                  <div><label className="block text-[12px] font-black text-stone-700 mb-1">Father's Phone</label>
                    <input type="text" name="fatherPhone" value={formData.fatherPhone} onChange={handleFormChange}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm" /></div>
                  <div><label className="block text-[12px] font-black text-stone-700 mb-1">Mother's Name</label>
                    <input type="text" name="motherName" value={formData.motherName} onChange={handleFormChange}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm" /></div>
                  <div><label className="block text-[12px] font-black text-stone-700 mb-1">Mother's Phone</label>
                    <input type="text" name="motherPhone" value={formData.motherPhone} onChange={handleFormChange}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm" /></div>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                <div>{formStep > 1 && (
                  <button type="button" onClick={() => { setFormStep(s => s - 1); setFormError(""); }}
                    className="px-4 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-bold text-stone-700 hover:bg-stone-50 transition-colors shadow-sm">Back</button>
                )}</div>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-bold text-stone-700 hover:bg-stone-50 transition-colors shadow-sm">Cancel</button>
                  {formStep < 3 ? (
                    <button type="button" onClick={handleStepNext}
                      className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-[13px] font-bold transition-colors shadow-sm">Continue</button>
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

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-stone-200 w-full max-w-md m-4 p-5">
            <h3 className="text-lg font-black text-stone-900 mb-2">Remove Student</h3>
            <p className="text-sm font-medium text-stone-600 mb-5">Remove <span className="font-black text-stone-800">{deleteTarget.first_name} {deleteTarget.last_name}</span>? This cannot be undone.</p>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-bold text-stone-700 hover:bg-stone-50 transition-colors shadow-sm">Cancel</button>
              <button onClick={confirmDelete} disabled={deleting} className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[13px] font-bold flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50">
                {deleting && <Loader2 size={14} className="animate-spin" />} Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {bulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-stone-200 w-full max-w-md m-4 p-5">
            <h3 className="text-lg font-black text-stone-900 mb-2">Delete Selected Students</h3>
            <p className="text-sm font-medium text-stone-600 mb-5">Permanently delete {selectAllRecords ? `all ${totalRecords}` : `${selected.size} selected`} student(s)? This cannot be undone.</p>
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
