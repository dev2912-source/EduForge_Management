"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft, Loader2, Edit, Trash2, Mail, Phone, Calendar,
  MapPin, BookOpen, CreditCard, FileText, User, GraduationCap,
  BadgeCheck, Camera, Download, Upload, X, ArrowRight,
  Search
} from "lucide-react";

const TABS = [
  { key: "overview", label: "Overview", icon: User },
  { key: "academic", label: "Academic History", icon: GraduationCap },
  { key: "archives", label: "Archives", icon: FileText },
  { key: "finances", label: "Finances", icon: CreditCard },
];

export default function StudentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const photoInputRef = useRef(null);
  const [student, setStudent] = useState(null);
  const [academicHistory, setAcademicHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [classes, setClasses] = useState([]);
  const [historySearch, setHistorySearch] = useState("");
  const [historyStatus, setHistoryStatus] = useState("");

  // ID Card modal
  const [showIdCard, setShowIdCard] = useState(false);

  // Transfer modal
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferClass, setTransferClass] = useState("");
  const [transferSection, setTransferSection] = useState("");
  const [transferYear, setTransferYear] = useState("");
  const [transferRemarks, setTransferRemarks] = useState("");
  const [transferring, setTransferring] = useState(false);

  // Documents
  const [documents, setDocuments] = useState([]);
  const [docSearch, setDocSearch] = useState("");
  const [docTypeFilter, setDocTypeFilter] = useState("");
  const [uploading, setUploading] = useState(false);
  const docInputRef = useRef(null);

  // Reset credentials
  const [showResetCreds, setShowResetCreds] = useState(false);
  const [newCreds, setNewCreds] = useState(null);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token") || "";
        const headers = { Authorization: `Bearer ${token}` };

        const [studRes, histRes, invRes, payRes, clsRes, docsRes] = await Promise.all([
          fetch(`/api/admin/students/${params.id}`, { headers }),
          fetch(`/api/admin/students/${params.id}/academic-history`, { headers }),
          fetch(`/api/admin/students/${params.id}/invoices`, { headers }),
          fetch(`/api/admin/students/${params.id}/payments`, { headers }),
          fetch("/api/admin/classes", { headers }),
          fetch(`/api/admin/students/${params.id}/documents`, { headers }),
        ]);

        if (!studRes.ok) throw new Error("Student not found");
        const studData = await studRes.json();
        setStudent(studData.data);

        const histData = await histRes.json();
        setAcademicHistory(histData.data || []);
        setFilteredHistory(histData.data || []);

        const invData = await invRes.json();
        setInvoices(invData.data || []);

        const payData = await payRes.json();
        setPayments(payData.data || []);

        const clsData = await clsRes.json();
        setClasses(Array.isArray(clsData) ? clsData : (clsData.data || []));

        const docsData = await docsRes.json();
        setDocuments(docsData.data || []);
      } catch (err) {
        console.error(err);
        router.push("/dashboard/students");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [params.id, router]);

  useEffect(() => {
    let items = academicHistory;
    if (historySearch) items = items.filter(h => (h.academicYear || '').toLowerCase().includes(historySearch.toLowerCase()) || (h.className || '').toLowerCase().includes(historySearch.toLowerCase()));
    if (historyStatus) items = items.filter(h => h.status === historyStatus);
    setFilteredHistory(items);
  }, [historySearch, historyStatus, academicHistory]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const token = localStorage.getItem("token") || "";
      await fetch(`/api/admin/students/${params.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      router.push("/dashboard/students");
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const token = localStorage.getItem("token") || "";
      const formData = new FormData();
      formData.append("photo", file);
      const res = await fetch(`/api/admin/students/${params.id}/photo`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setStudent(data.data);
      }
    } catch (err) { alert(err.message); }
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const handleTransfer = async () => {
    if (!transferClass) return;
    setTransferring(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`/api/admin/students/${params.id}/transfer`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ className: transferClass, section: transferSection, academicYear: transferYear, remarks: transferRemarks }),
      });
      if (!res.ok) throw new Error("Transfer failed");
      setShowTransfer(false);
      setTransferClass(""); setTransferSection(""); setTransferYear(""); setTransferRemarks("");
      // Refresh
      const headers = { Authorization: `Bearer ${token}` };
      const [studRes, histRes] = await Promise.all([
        fetch(`/api/admin/students/${params.id}`, { headers }),
        fetch(`/api/admin/students/${params.id}/academic-history`, { headers }),
      ]);
      const studData = await studRes.json();
      setStudent(studData.data);
      const histData = await histRes.json();
      setAcademicHistory(histData.data || []);
    } catch (err) { alert(err.message); }
    finally { setTransferring(false); }
  };

  const handleResetCredentials = async () => {
    setResetting(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`/api/admin/students/${params.id}/reset-credentials`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Reset failed");
      const data = await res.json();
      setNewCreds(data);
      setShowResetCreds(true);
    } catch (err) { alert(err.message); }
    finally { setResetting(false); }
  };

  const handleDocUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/admin/students/${params.id}/documents`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(prev => [...prev, data.data]);
      }
    } catch (err) { alert(err.message); }
    finally { setUploading(false); if (docInputRef.current) docInputRef.current.value = ""; }
  };

  const getClassSections = (className) => {
    const cls = classes.find(c => c.name === className || c.className === className);
    const secs = cls?.sections || [];
    return typeof secs === 'number' ? Array.from({ length: secs }, (_, i) => String.fromCharCode(65 + i)) : (Array.isArray(secs) ? secs : []);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-orange-400">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  if (!student) return null;

  const s = student;
  const initials = s.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  const p = s.profile || {};
  const parentDetails = p.parentDetails || {};

  const formatDate = (d) => {
    if (!d) return "—";
    const dt = new Date(d);
    return dt.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  };

  const statusBadge = (status) => {
    const colors = {
      active: "bg-green-50 text-green-600",
      inactive: "bg-red-50 text-red-600",
      paid: "bg-green-50 text-green-600",
      pending: "bg-amber-50 text-amber-600",
      partial: "bg-blue-50 text-blue-600",
      overdue: "bg-red-50 text-red-600",
      promoted: "bg-green-50 text-green-600",
      graduated: "bg-purple-50 text-purple-600",
      transferred: "bg-blue-50 text-blue-600",
    };
    const c = colors[status] || "bg-stone-50 text-stone-600";
    return (
      <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-black tracking-widest uppercase ${c}`}>
        {status}
      </span>
    );
  };

  const historyStatuses = [...new Set(academicHistory.map(h => h.status))];

  const TabButton = ({ tab }) => {
    const isActive = activeTab === tab.key;
    return (
      <button
        onClick={() => setActiveTab(tab.key)}
        className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-bold rounded-lg transition-all ${
          isActive ? "bg-[#FF9933] text-white shadow-sm" : "text-stone-600 hover:text-stone-900 hover:bg-stone-50"
        }`}
      >
        <tab.icon size={16} />
        {tab.label}
      </button>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-5">
      {/* Hidden inputs */}
      <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
      <input ref={docInputRef} type="file" accept="image/*,application/pdf" onChange={handleDocUpload} className="hidden" />

      {/* Back button */}
      <button
        onClick={() => router.push("/dashboard/students")}
        className="flex items-center gap-1.5 text-[13px] font-bold text-stone-500 hover:text-stone-900 transition-colors"
      >
        <ArrowLeft size={16} /> Back to Students
      </button>

      {/* Profile Header */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar with upload overlay */}
          <div className="relative group flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-[#FFEDD5] text-[#C2410C] text-xl font-black flex items-center justify-center overflow-hidden">
              {p.photoUrl ? (
                <img src={p.photoUrl} alt={s.name} className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <button onClick={() => photoInputRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer">
              <Camera size={16} className="text-white" />
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-black text-stone-900">{s.name}</h1>
              {statusBadge(p.status || "active")}
            </div>
            <p className="text-sm font-mono font-bold text-stone-400 mt-1">Student ID: {s.schoolId || "—"}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            <button onClick={() => setShowIdCard(true)}
              className="px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-bold text-stone-700 flex items-center gap-2 hover:bg-stone-50 transition-colors shadow-sm">
              <BadgeCheck size={14} /> ID Card
            </button>
            <button onClick={() => setShowTransfer(true)}
              className="px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-bold text-stone-700 flex items-center gap-2 hover:bg-stone-50 transition-colors shadow-sm">
              <ArrowRight size={14} /> Transfer
            </button>
            <button
              onClick={() => router.push(`/dashboard/students`)}
              className="px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-bold text-stone-700 flex items-center gap-2 hover:bg-stone-50 transition-colors shadow-sm"
            >
              <Edit size={14} /> Edit Profile
            </button>
            <button
              onClick={() => setDeleteConfirm(true)}
              className="px-3 py-2 bg-white border border-red-200 rounded-lg text-[13px] font-bold text-red-600 flex items-center gap-2 hover:bg-red-50 transition-colors shadow-sm"
            >
              <Trash2 size={14} /> Delete Student
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {TABS.map(tab => <TabButton key={tab.key} tab={tab} />)}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Personal Details (4-col grid inside) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
              <h3 className="text-sm font-black text-stone-800 uppercase tracking-widest flex items-center gap-2 mb-4">
                <User size={16} className="text-[#FF9933]" /> Personal Details
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-[11px] font-black text-stone-400 uppercase tracking-wider">Gender</p>
                  <p className="text-sm font-bold text-stone-800">{p.gender || "—"}</p>
                </div>
                <div>
                  <p className="text-[11px] font-black text-stone-400 uppercase tracking-wider">Blood Group</p>
                  <p className="text-sm font-bold text-stone-800">{p.bloodGroup || "—"}</p>
                </div>
                <div>
                  <p className="text-[11px] font-black text-stone-400 uppercase tracking-wider">Nationality</p>
                  <p className="text-sm font-bold text-stone-800">{p.nationality || "—"}</p>
                </div>
                <div>
                  <p className="text-[11px] font-black text-stone-400 uppercase tracking-wider">Religion</p>
                  <p className="text-sm font-bold text-stone-800">{p.religion || "—"}</p>
                </div>
                <div className="col-span-2 lg:col-span-4">
                  <p className="text-[11px] font-black text-stone-400 uppercase tracking-wider">Home Address</p>
                  <p className="text-sm font-bold text-stone-800">{p.address || "—"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Academic Info */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
            <h3 className="text-sm font-black text-stone-800 uppercase tracking-widest flex items-center gap-2 mb-4">
              <BookOpen size={16} className="text-[#FF9933]" /> Academic Info
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-[11px] font-black text-stone-400 uppercase tracking-wider">Class</p>
                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                  <span className="text-sm font-bold text-stone-800">{p.className || "—"}</span>
                  {p.section && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-stone-100 text-stone-500">{p.section}</span>
                  )}
                  {p.medium && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-orange-50 text-[#C2410C]">{p.medium}</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-black text-stone-400 uppercase tracking-wider">Academic Year</p>
                <p className="text-sm font-bold text-stone-800">{p.academicYear || "—"}</p>
              </div>
              <div>
                <p className="text-[11px] font-black text-stone-400 uppercase tracking-wider">Joined On</p>
                <p className="text-sm font-bold text-stone-800">{formatDate(p.admissionDate)}</p>
              </div>
            </div>
          </div>

          {/* Parent / Guardian Info */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
            <h3 className="text-sm font-black text-stone-800 uppercase tracking-widest flex items-center gap-2 mb-4">
              <User size={16} className="text-[#FF9933]" /> Parent / Guardian Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] font-black text-stone-400 uppercase tracking-wider">Father's Name</p>
                <p className="text-sm font-bold text-stone-800">{parentDetails.fatherName || "—"}</p>
              </div>
              <div>
                <p className="text-[11px] font-black text-stone-400 uppercase tracking-wider">Mother's Name</p>
                <p className="text-sm font-bold text-stone-800">{parentDetails.motherName || "—"}</p>
              </div>
              <div>
                <p className="text-[11px] font-black text-stone-400 uppercase tracking-wider">Father's Phone</p>
                <p className="text-sm font-bold text-stone-800">{parentDetails.fatherPhone || "—"}</p>
              </div>
              <div>
                <p className="text-[11px] font-black text-stone-400 uppercase tracking-wider">Guardian Name</p>
                <p className="text-sm font-bold text-stone-800">{parentDetails.guardianName || "—"}</p>
              </div>
              <div>
                <p className="text-[11px] font-black text-stone-400 uppercase tracking-wider">Guardian Phone</p>
                <p className="text-sm font-bold text-stone-800">{parentDetails.guardianPhone || "—"}</p>
              </div>
              <div>
                <p className="text-[11px] font-black text-stone-400 uppercase tracking-wider">Relation</p>
                <p className="text-sm font-bold text-stone-800">{parentDetails.relation || "—"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[11px] font-black text-stone-400 uppercase tracking-wider">Annual Income</p>
                <p className="text-sm font-bold text-stone-800">
                  {parentDetails.annualIncome ? `₹${Number(parentDetails.annualIncome).toLocaleString("en-IN")}` : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
            <h3 className="text-sm font-black text-stone-800 uppercase tracking-widest flex items-center gap-2 mb-4">
              <Mail size={16} className="text-[#FF9933]" /> Contact
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail size={14} className="text-stone-400" />
                <span className="text-sm font-bold text-stone-800">{s.email || "—"}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={14} className="text-stone-400" />
                <span className="text-sm font-bold text-stone-800">{p.phone || "—"}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar size={14} className="text-stone-400" />
                <span className="text-sm font-bold text-stone-800">{formatDate(p.dateOfBirth)}</span>
              </div>
            </div>
          </div>

          {/* Account Portal */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
            <h3 className="text-sm font-black text-stone-800 uppercase tracking-widest flex items-center gap-2 mb-4">
              <BadgeCheck size={16} className="text-[#FF9933]" /> Account Portal
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-[11px] font-black text-stone-400 uppercase tracking-wider">Student ID</p>
                <p className="text-sm font-mono font-bold text-stone-800">{s.schoolId || "—"}</p>
              </div>
              <div>
                <p className="text-[11px] font-black text-stone-400 uppercase tracking-wider">Last Login</p>
                <p className="text-sm font-bold text-stone-800">{formatDate(s.updatedAt)}</p>
              </div>
              <button onClick={handleResetCredentials} disabled={resetting}
                className="mt-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-[13px] font-bold flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50">
                {resetting && <Loader2 size={14} className="animate-spin" />}
                Reset Credentials
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "academic" && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          {/* History toolbar */}
          <div className="p-4 border-b border-stone-200 bg-stone-50/30 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input type="text" placeholder="Search history…" value={historySearch} onChange={e => setHistorySearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-medium text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] transition-all shadow-sm" />
            </div>
            <select value={historyStatus} onChange={e => setHistoryStatus(e.target.value)}
              className="px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-bold text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] shadow-sm">
              <option value="">All Status</option>
              {historyStatuses.map(st => <option key={st} value={st}>{st.charAt(0).toUpperCase() + st.slice(1)}</option>)}
            </select>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="p-8 text-center">
              <p className="font-bold text-stone-400">No History Found</p>
              <p className="text-sm text-stone-400 mt-1">Fresh record for this student.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/50">
                  <th className="py-4 px-5 font-black text-[12px] text-stone-800">Session</th>
                  <th className="py-4 px-3 font-black text-[12px] text-stone-800">Placement</th>
                  <th className="py-4 px-3 font-black text-[12px] text-stone-800">Outcome</th>
                  <th className="py-4 px-3 font-black text-[12px] text-stone-800">Date & Time</th>
                  <th className="py-4 px-3 font-black text-[12px] text-stone-800">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredHistory.map((h, idx) => (
                  <tr key={idx} className="hover:bg-stone-50/50">
                    <td className="py-4 px-5 font-bold text-[13px] text-stone-800">{h.academicYear}</td>
                    <td className="py-4 px-3">
                      <span className="font-bold text-[13px] text-stone-800">{h.className}</span>
                      {h.section && <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-black bg-stone-100 text-stone-500">{h.section}</span>}
                    </td>
                    <td className="py-4 px-3">{statusBadge(h.status)}</td>
                    <td className="py-4 px-3 font-bold text-[12px] text-stone-500">{formatDate(h.createdAt)}</td>
                    <td className="py-4 px-3 text-[13px] text-stone-600 italic">{h.remarks || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "archives" && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          {/* Documents toolbar */}
          <div className="p-4 border-b border-stone-200 bg-stone-50/30 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input type="text" placeholder="Search documents…" value={docSearch} onChange={e => setDocSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-medium text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] transition-all shadow-sm" />
            </div>
            <select value={docTypeFilter} onChange={e => setDocTypeFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-bold text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] shadow-sm">
              <option value="">All Types</option>
              {[...new Set(documents.map(d => d.fileType || ''))].filter(Boolean).map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
            </select>
            <button onClick={() => docInputRef.current?.click()} disabled={uploading}
              className="ml-auto px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-[13px] font-bold flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50">
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {uploading ? "Uploading…" : "Upload New"}
            </button>
          </div>

          {documents.length === 0 ? (
            <div className="p-8 text-center">
              <p className="font-bold text-stone-400">No documents archived</p>
              <p className="text-sm text-stone-400 mt-1">Organize records here.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/50">
                  <th className="py-4 px-5 font-black text-[12px] text-stone-800">Document Name</th>
                  <th className="py-4 px-3 font-black text-[12px] text-stone-800">Type</th>
                  <th className="py-4 px-3 font-black text-[12px] text-stone-800">Uploaded On</th>
                  <th className="py-4 px-3 font-black text-[12px] text-stone-800 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {documents.map((doc, idx) => (
                  <tr key={idx} className="hover:bg-stone-50/50">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2.5">
                        <FileText size={16} className="text-stone-400" />
                        <span className="font-bold text-[13px] text-stone-800">{doc.fileName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-3">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-stone-100 text-stone-500 uppercase">{(doc.fileType || doc.fileName?.split('.').pop() || '—').toUpperCase()}</span>
                    </td>
                    <td className="py-4 px-3 font-bold text-[12px] text-stone-500">{formatDate(doc.createdAt)}</td>
                    <td className="py-4 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1.5 rounded-md text-stone-400 hover:text-orange-500 hover:bg-orange-50 transition-colors">
                          <Download size={14} />
                        </button>
                        <button className="p-1.5 rounded-md text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors">
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
      )}

      {activeTab === "finances" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Invoices */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-stone-200">
              <h3 className="text-sm font-black text-stone-800 flex items-center gap-2">
                <FileText size={16} className="text-[#FF9933]" /> Invoices
              </h3>
            </div>
            {invoices.length === 0 ? (
              <div className="p-6 text-center text-stone-400 text-sm font-medium">No invoices</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/50">
                    <th className="py-3 px-4 font-black text-[11px] text-stone-800">Invoice #</th>
                    <th className="py-3 px-3 font-black text-[11px] text-stone-800">Amount</th>
                    <th className="py-3 px-3 font-black text-[11px] text-stone-800">Due Date</th>
                    <th className="py-3 px-3 font-black text-[11px] text-stone-800">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {invoices.map((inv, idx) => (
                    <tr key={idx} className="hover:bg-stone-50/50">
                      <td className="py-3 px-4 font-mono font-bold text-[12px] text-stone-800">{inv.invoiceId}</td>
                      <td className="py-3 px-3 font-black text-[13px] text-stone-800">{inv.amount}</td>
                      <td className="py-3 px-3 font-bold text-[12px] text-stone-500">{inv.dueDate}</td>
                      <td className="py-3 px-3">{statusBadge(inv.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Payments */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-stone-200">
              <h3 className="text-sm font-black text-stone-800 flex items-center gap-2">
                <CreditCard size={16} className="text-[#FF9933]" /> Payments
              </h3>
            </div>
            {payments.length === 0 ? (
              <div className="p-6 text-center text-stone-400 text-sm font-medium">No payments recorded</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/50">
                    <th className="py-3 px-4 font-black text-[11px] text-stone-800">Receipt #</th>
                    <th className="py-3 px-3 font-black text-[11px] text-stone-800">Amount</th>
                    <th className="py-3 px-3 font-black text-[11px] text-stone-800">Method</th>
                    <th className="py-3 px-3 font-black text-[11px] text-stone-800">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {payments.map((pay, idx) => (
                    <tr key={idx} className="hover:bg-stone-50/50">
                      <td className="py-3 px-4 font-mono font-bold text-[12px] text-stone-800">{pay.receiptId}</td>
                      <td className="py-3 px-3 font-black text-[13px] text-stone-800">{pay.amount}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-stone-100 text-stone-500">{pay.method}</span>
                      </td>
                      <td className="py-3 px-3 font-bold text-[12px] text-stone-500">{pay.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ID Card Modal */}
      {showIdCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setShowIdCard(false)}>
          <div className="bg-white rounded-xl shadow-xl border border-stone-200 w-full max-w-lg m-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-stone-200">
              <h2 className="text-lg font-black text-stone-900">Student ID Card</h2>
              <button onClick={() => setShowIdCard(false)} className="p-1 rounded-md text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              <div className="border-2 border-stone-200 rounded-xl p-6 text-center space-y-3 max-w-sm mx-auto">
                <div className="w-20 h-20 rounded-full bg-[#FFEDD5] text-[#C2410C] text-2xl font-black flex items-center justify-center mx-auto">{initials}</div>
                <h3 className="text-xl font-black text-stone-900">{s.name}</h3>
                <p className="text-sm font-mono font-bold text-stone-400">{s.schoolId || "—"}</p>
                <div className="text-left text-sm space-y-1.5 mt-4">
                  <p><span className="font-black text-stone-500">Class:</span> <span className="font-bold">{p.className || "—"}{p.section ? ` · ${p.section}` : ""}</span></p>
                  <p><span className="font-black text-stone-500">Gender:</span> <span className="font-bold">{p.gender || "—"}</span></p>
                  <p><span className="font-black text-stone-500">Blood Group:</span> <span className="font-bold">{p.bloodGroup || "—"}</span></p>
                  <p><span className="font-black text-stone-500">DOB:</span> <span className="font-bold">{formatDate(p.dateOfBirth)}</span></p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-stone-200">
              <button onClick={() => setShowIdCard(false)} className="px-4 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-bold text-stone-700 hover:bg-stone-50 transition-colors shadow-sm">Close</button>
              <button onClick={() => window.print()} className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-[13px] font-bold flex items-center gap-2 transition-colors shadow-sm">
                <Download size={14} /> Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setShowTransfer(false)}>
          <div className="bg-white rounded-xl shadow-xl border border-stone-200 w-full max-w-lg m-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-stone-200">
              <h2 className="text-lg font-black text-stone-900">Transfer Class</h2>
              <button onClick={() => setShowTransfer(false)} className="p-1 rounded-md text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[12px] font-black text-stone-700 mb-1">New Class <span className="text-red-500">*</span></label>
                <select value={transferClass} onChange={e => { setTransferClass(e.target.value); setTransferSection(""); }}
                  className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] transition-all shadow-sm">
                  <option value="">Select Class</option>
                  {classes.map(c => <option key={c._id || c.name} value={c.name || c.className}>{c.name || c.className}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-black text-stone-700 mb-1">New Section</label>
                <select value={transferSection} onChange={e => setTransferSection(e.target.value)} disabled={!transferClass}
                  className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] transition-all shadow-sm disabled:opacity-50">
                  <option value="">Select Section</option>
                  {getClassSections(transferClass).map(s => <option key={s} value={s}>Section {s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-black text-stone-700 mb-1">Academic Year</label>
                <input type="text" value={transferYear} onChange={e => setTransferYear(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] transition-all shadow-sm" placeholder="e.g. 2026-27" />
              </div>
              <div>
                <label className="block text-[12px] font-black text-stone-700 mb-1">Remarks</label>
                <textarea value={transferRemarks} onChange={e => setTransferRemarks(e.target.value)} rows={3}
                  className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] transition-all shadow-sm" placeholder="Reason for transfer…" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-stone-200">
              <button onClick={() => setShowTransfer(false)} className="px-4 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-bold text-stone-700 hover:bg-stone-50 transition-colors shadow-sm">Cancel</button>
              <button onClick={handleTransfer} disabled={!transferClass || transferring}
                className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-[13px] font-bold flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50">
                {transferring && <Loader2 size={14} className="animate-spin" />}
                Confirm Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Credentials Modal */}
      {showResetCreds && newCreds && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => { setShowResetCreds(false); setNewCreds(null); }}>
          <div className="bg-white rounded-xl shadow-xl border border-stone-200 w-full max-w-md m-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-stone-200">
              <h2 className="text-lg font-black text-stone-900">Credentials Reset</h2>
              <button onClick={() => { setShowResetCreds(false); setNewCreds(null); }} className="p-1 rounded-md text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm font-medium text-stone-600">New login credentials for <span className="font-black text-stone-800">{s.name}</span>:</p>
              <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 space-y-2">
                <div>
                  <p className="text-[11px] font-black text-stone-400 uppercase tracking-wider">School ID</p>
                  <p className="text-sm font-mono font-bold text-stone-900">{newCreds.schoolId || s.schoolId}</p>
                </div>
                <div>
                  <p className="text-[11px] font-black text-stone-400 uppercase tracking-wider">New Password</p>
                  <p className="text-sm font-mono font-bold text-stone-900">{newCreds.password}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-stone-200">
              <button onClick={() => { setShowResetCreds(false); setNewCreds(null); }} className="px-4 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-bold text-stone-700 hover:bg-stone-50 transition-colors shadow-sm">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-stone-200 w-full max-w-md m-4 p-5">
            <h3 className="text-lg font-black text-stone-900 mb-2">Delete Student</h3>
            <p className="text-sm font-medium text-stone-600 mb-5">
              Permanently delete <span className="font-black text-stone-800">{s.name}</span>? This will remove all their records and cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setDeleteConfirm(false)} className="px-4 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-bold text-stone-700 hover:bg-stone-50 transition-colors shadow-sm">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[13px] font-bold flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50">
                {deleting && <Loader2 size={14} className="animate-spin" />} Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}