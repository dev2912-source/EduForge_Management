"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  CheckCircle2, 
  Clock,
  XCircle,
  Search,
  Filter,
  Plus,
  Loader2,
  X
} from "lucide-react";

export default function AdmissionsPage() {
  const [stats, setStats] = useState([
    { label: "Total Applications", value: "—", icon: Users, color: "text-blue-600 bg-blue-50 border-blue-100" },
    { label: "Approved", value: "—", icon: CheckCircle2, color: "text-green-600 bg-green-50 border-green-100" },
    { label: "Pending Review", value: "—", icon: Clock, color: "text-amber-600 bg-amber-50 border-amber-100" },
    { label: "Rejected", value: "—", icon: XCircle, color: "text-red-600 bg-red-50 border-red-100" },
  ]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [classes, setClasses] = useState([]);
  const limit = 10;

  // Form state
  const [form, setForm] = useState({
    name: "", email: "", phone: "", dateOfBirth: "", gender: "",
    bloodGroup: "", className: "", section: ""
  });

  const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/admin/admissions/stats`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStats([
            { label: "Total Applications", value: data.total ?? "—", icon: Users, color: "text-blue-600 bg-blue-50 border-blue-100" },
            { label: "Approved", value: data.approved ?? "—", icon: CheckCircle2, color: "text-green-600 bg-green-50 border-green-100" },
            { label: "Pending Review", value: data.pending ?? "—", icon: Clock, color: "text-amber-600 bg-amber-50 border-amber-100" },
            { label: "Rejected", value: data.rejected ?? "—", icon: XCircle, color: "text-red-600 bg-red-50 border-red-100" },
          ]);
          return;
        }
      } catch (_) {}
      // Fallback: count students by status
      try {
        const res = await fetch(`/api/admin/students?page=1&limit=10000`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const students = Array.isArray(data) ? data : (data.data || []);
          const total = students.length;
          const approved = students.filter(s => s.profile?.status === "active").length;
          const rejected = students.filter(s => s.profile?.status === "inactive" || s.profile?.status === "rejected").length;
          const pending = total - approved - rejected;
          setStats([
            { label: "Total Applications", value: total, icon: Users, color: "text-blue-600 bg-blue-50 border-blue-100" },
            { label: "Approved", value: approved, icon: CheckCircle2, color: "text-green-600 bg-green-50 border-green-100" },
            { label: "Pending Review", value: pending, icon: Clock, color: "text-amber-600 bg-amber-50 border-amber-100" },
            { label: "Rejected", value: rejected, icon: XCircle, color: "text-red-600 bg-red-50 border-red-100" },
          ]);
        }
      } catch (_) {}
    };
    if (token) fetchStats();
  }, [token]);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await fetch(`/api/admin/classes`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const list = data.data || data || [];
          setClasses(list);
        }
      } catch (_) {}
    };
    if (token) fetchClasses();
  }, [token]);

  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({ page, limit, ...(search && { search }) });
        const res = await fetch(`/api/admin/students?${queryParams}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        const resolvedData = Array.isArray(data) ? data : (data.data || []);
        setApplications(resolvedData);
        setTotalPages(data.pages || 1);
        setTotalRecords(data.total || resolvedData.length);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchApplications, 300);
    return () => clearTimeout(timer);
  }, [page, search, token]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          role: "student",
          profile: {
            dateOfBirth: form.dateOfBirth,
            gender: form.gender,
            bloodGroup: form.bloodGroup,
            className: form.className,
            section: form.section
          }
        })
      });
      if (!res.ok) throw new Error("Failed to create student");
      setShowModal(false);
      setForm({ name: "", email: "", phone: "", dateOfBirth: "", gender: "", bloodGroup: "", className: "", section: "" });
      setPage(1);
      // Refresh list
      const fetchApps = async () => {
        const queryParams = new URLSearchParams({ page: 1, limit, ...(search && { search }) });
        const r = await fetch(`/api/admin/students?${queryParams}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (r.ok) {
          const d = await r.json();
          setApplications(Array.isArray(d) ? d : (d.data || []));
          setTotalPages(d.pages || 1);
          setTotalRecords(d.total || 0);
        }
      };
      fetchApps();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "approved" || s === "active") {
      return "bg-green-50 text-green-700 border-green-200";
    }
    if (s === "rejected" || s === "inactive") {
      return "bg-red-50 text-red-700 border-red-200";
    }
    return "bg-amber-50 text-amber-700 border-amber-200";
  };

  const getStatusLabel = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "active") return "Approved";
    if (s === "inactive") return "Rejected";
    if (s === "rejected") return "Rejected";
    if (s === "pending") return "Pending";
    return status || "Pending";
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-text-main tracking-tight">Admissions Pipeline</h1>
          <p className="text-sm font-medium text-text-secondary mt-1">Manage new student applications and enrollments.</p>
        </div>
        
        <button
          onClick={() => setShowModal(true)}
          className="bg-orange hover:bg-orange-hover text-white font-bold py-2.5 px-5 rounded-xl text-sm shadow-md shadow-orange/20 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          New Application
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-4 sm:p-5 rounded-2xl border border-card-border shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border flex-shrink-0 ${stat.color}`}>
              <stat.icon size={24} strokeWidth={2} />
            </div>
            <div>
              <p className="text-[11px] sm:text-xs font-bold text-text-muted uppercase tracking-wider mb-0.5">{stat.label}</p>
              <h3 className="text-2xl font-black text-text-main">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Applications List */}
      <div className="bg-white rounded-2xl border border-card-border shadow-sm overflow-hidden flex flex-col">
        
        {/* Table Toolbar */}
        <div className="p-4 border-b border-card-border flex flex-col sm:flex-row gap-4 justify-between items-center bg-stone-50/50">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or ID..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 bg-white border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange/20 focus:border-orange transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none bg-white border border-card-border hover:border-orange text-text-main font-bold py-2 px-4 rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2">
              <Filter size={16} /> Filter
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="animate-spin" size={48} style={{ color: 'var(--orange)' }} />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64 text-red-500 font-bold">
              {error}
            </div>
          ) : applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-stone-500">
              <p className="font-bold">No applications found.</p>
              <p className="text-sm">Try adjusting your search.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-bg-main text-xs font-bold text-text-muted uppercase tracking-wider">
                  <th className="p-4 border-b border-card-border">School ID</th>
                  <th className="p-4 border-b border-card-border">Student Name</th>
                  <th className="p-4 border-b border-card-border">Class</th>
                  <th className="p-4 border-b border-card-border">Status</th>
                  <th className="p-4 border-b border-card-border">Date of Admission</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-card-border">
                {applications.map((app, idx) => (
                  <tr key={idx} className="hover:bg-orange-light/20 transition-colors">
                    <td className="p-4 font-bold text-text-secondary">{app.schoolId || app.profile?.rollNumber || "—"}</td>
                    <td className="p-4">
                      <div className="font-bold text-text-main">{app.name}</div>
                    </td>
                    <td className="p-4 font-semibold text-text-secondary">
                      {app.profile?.className || app.className || "—"}
                      {app.profile?.section && <span className="ml-1 text-text-muted">({app.profile.section})</span>}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadge(app.profile?.status || app.status)}`}>
                        {getStatusLabel(app.profile?.status || app.status)}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-text-muted">{formatDate(app.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination */}
        {!loading && applications.length > 0 && (
          <div className="p-4 border-t border-card-border flex items-center justify-between text-sm text-text-muted font-medium bg-stone-50/50">
            <div>Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, totalRecords)} of {totalRecords} entries</div>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-card-border rounded-lg bg-white hover:border-orange hover:text-orange disabled:opacity-50"
              >Prev</button>
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                let p = page;
                if (page === 1) p = i + 1;
                else if (page === totalPages) p = totalPages - Math.min(4, totalPages - 1) + i;
                else p = page - 1 + i;
                if (p > totalPages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-1 border rounded-lg font-bold ${
                      page === p
                        ? 'border-orange bg-orange text-white'
                        : 'border-card-border bg-white hover:border-orange hover:text-orange'
                    }`}
                  >{p}</button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border border-card-border rounded-lg bg-white hover:border-orange hover:text-orange disabled:opacity-50"
              >Next</button>
            </div>
          </div>
        )}
      </div>

      {/* New Application Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-card-border">
              <h2 className="text-lg font-black text-text-main">New Application</h2>
              <button onClick={() => setShowModal(false)} className="text-text-muted hover:text-text-main transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Student Name</label>
                  <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border border-card-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange/20 focus:border-orange" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full border border-card-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange/20 focus:border-orange" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Phone</label>
                  <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full border border-card-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange/20 focus:border-orange" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Date of Birth</label>
                  <input type="date" value={form.dateOfBirth} onChange={e => setForm({...form, dateOfBirth: e.target.value})} className="w-full border border-card-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange/20 focus:border-orange" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Gender</label>
                  <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})} className="w-full border border-card-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange/20 focus:border-orange">
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Blood Group</label>
                  <input value={form.bloodGroup} onChange={e => setForm({...form, bloodGroup: e.target.value})} className="w-full border border-card-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange/20 focus:border-orange" placeholder="e.g. A+" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Class</label>
                  <select required value={form.className} onChange={e => setForm({...form, className: e.target.value})} className="w-full border border-card-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange/20 focus:border-orange">
                    <option value="">Select Class</option>
                    {classes.map(c => (
                      <option key={c._id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Section</label>
                  <input value={form.section} onChange={e => setForm({...form, section: e.target.value})} className="w-full border border-card-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange/20 focus:border-orange" placeholder="e.g. A" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-card-border rounded-xl text-sm font-bold text-text-muted hover:bg-stone-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-orange hover:bg-orange-hover text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-50">
                  {submitting && <Loader2 className="animate-spin" size={16} />}
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
