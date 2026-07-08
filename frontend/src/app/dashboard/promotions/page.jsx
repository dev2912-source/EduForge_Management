"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { ChevronDown, Loader2, Search, Users, X } from "lucide-react";

export default function PromotionsPage() {
  const [token, setToken] = useState("");

  useEffect(() => {
    setToken(localStorage.getItem("token") || "");
  }, []);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [message, setMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Source
  const [sourceClass, setSourceClass] = useState("");
  const [sourceSection, setSourceSection] = useState("");
  const [sourceSections, setSourceSections] = useState([]);

  // Target
  const [targetClass, setTargetClass] = useState("");
  const [targetSection, setTargetSection] = useState("");
  const [targetSections, setTargetSections] = useState([]);
  const [targetYear, setTargetYear] = useState("2026-27");
  const [remarks, setRemarks] = useState("Promoted to next grade");

  // Per-student action map: { [studentId]: "transfer" | "graduate" | "skip" }
  const [actions, setActions] = useState({});

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await fetch("/api/admin/classes", { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setClasses(Array.isArray(data) ? data : (data.data || []));
        }
      } catch (_) {}
    };
    if (token) fetchClasses();
  }, [token]);

  const updateSections = (className, setter) => {
    const cls = classes.find(c => c.name === className || c.className === className);
    const secs = cls?.sections || [];
    const result = typeof secs === "number" ? Array.from({ length: secs }, (_, i) => String.fromCharCode(65 + i)) : (Array.isArray(secs) ? secs : []);
    setter(result);
  };

  const handleSourceClassChange = (val) => {
    setSourceClass(val);
    setSourceSection("");
    setTargetSection("");
    setStudents([]);
    setActions({});
    updateSections(val, setSourceSections);
  };

  const handleTargetClassChange = (val) => {
    setTargetClass(val);
    setTargetSection("");
    updateSections(val, setTargetSections);
  };

  const findStudents = useCallback(async () => {
    if (!sourceClass) return;
    setLoading(true);
    setMessage(null);
    try {
      const params = new URLSearchParams({ className: sourceClass, status: "active", limit: "500" });
      if (sourceSection) params.set("section", sourceSection);
      const res = await fetch(`/api/admin/students?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to fetch students");
      const data = await res.json();
      const list = data.data || [];
      setStudents(list);
      const defaultActions = {};
      list.forEach(s => { defaultActions[s._id] = "transfer"; });
      setActions(defaultActions);
      setPage(1);
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  }, [sourceClass, sourceSection, token]);

  const setAllActions = (action) => {
    const updated = {};
    students.forEach(s => { updated[s._id] = action; });
    setActions(updated);
  };

  const setStudentAction = (id, action) => {
    setActions(prev => ({ ...prev, [id]: action }));
  };

  const filteredStudents = useMemo(() => {
    if (!searchQuery) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(s => s.name.toLowerCase().includes(q) || (s.schoolId || "").toLowerCase().includes(q));
  }, [students, searchQuery]);

  const totalPages = Math.ceil(filteredStudents.length / perPage);
  const paginatedStudents = filteredStudents.slice((page - 1) * perPage, page * perPage);

  const transferCount = useMemo(() => students.filter(s => actions[s._id] === "transfer").length, [students, actions]);
  const graduateCount = useMemo(() => students.filter(s => actions[s._id] === "graduate").length, [students, actions]);
  const skipCount = useMemo(() => students.filter(s => actions[s._id] === "skip").length, [students, actions]);
  const canExecute = (transferCount > 0 && targetClass) || graduateCount > 0;

  const getActionColor = (id) => {
    const a = actions[id];
    if (a === "transfer") return "bg-blue-500";
    if (a === "graduate") return "bg-green-500";
    return "bg-stone-300";
  };

  const getRowClass = (id) => {
    const a = actions[id];
    if (a === "transfer") return "bg-blue-50/40";
    if (a === "graduate") return "bg-green-50/40";
    return "";
  };

  const execute = async () => {
    setShowConfirm(true);
  };

  const confirmExecute = async () => {
    setShowConfirm(false);
    setSubmitting(true);
    setMessage(null);
    try {
      const transferIds = students.filter(s => actions[s._id] === "transfer").map(s => s._id);
      const graduateIds = students.filter(s => actions[s._id] === "graduate").map(s => s._id);
      const promises = [];

      if (transferIds.length > 0) {
        promises.push(
          fetch("/api/admin/promotions", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ studentIds: transferIds, fromClass: sourceClass, toClass: targetClass, toSection: targetSection, newAcademicYear: targetYear, remarks }),
          })
        );
      }

      if (graduateIds.length > 0) {
        promises.push(
          fetch("/api/admin/students/bulk-graduate", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ studentIds: graduateIds, academicYear: targetYear, remarks: "Graduated" }),
          })
        );
      }

      const results = await Promise.all(promises);
      const allOk = results.every(r => r.ok);
      if (allOk) {
        const total = transferIds.length + graduateIds.length;
        setMessage({ type: "success", text: `${total} student(s) processed successfully! ${transferIds.length} transferred, ${graduateIds.length} graduated, ${skipCount} skipped.` });
        setStudents([]);
        setActions({});
        setSourceClass("");
        setSourceSection("");
        setSourceSections([]);
        setTargetClass("");
        setTargetSection("");
        setTargetSections([]);
        setSearchQuery("");
      } else {
        const err = await results.find(r => !r.ok)?.json().catch(() => ({}));
        throw new Error(err?.message || "Execution failed");
      }
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const availableToClasses = classes.filter(c => (c.name || c.className) !== sourceClass);

  const ActionBtn = ({ id, action, label, activeClass, activeBg }) => {
    const current = actions[id];
    const isActive = current === action;
    return (
      <button
        onClick={() => setStudentAction(id, action)}
        className={`px-2.5 py-1 rounded-md text-[11px] font-black tracking-wider transition-all ${
          isActive ? `${activeBg} ${activeClass} shadow-sm` : "bg-stone-50 text-stone-400 hover:bg-stone-100"
        }`}
      >
        {label}
      </button>
    );
  };

  if (!token) return null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-5">
      {/* Header */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1 h-5 bg-[#FF9933] rounded-full"></div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">Student Promotions</h1>
        </div>
        <p className="text-[13px] font-medium text-stone-500">Transfer students to next class or mark them as graduated</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`px-4 py-3 rounded-xl border text-sm font-bold flex items-center justify-between ${
          message.type === "success" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="p-0.5 hover:opacity-70"><X size={14} /></button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ===== LEFT COLUMN ===== */}
        <div className="lg:col-span-4 space-y-4">

          {/* Panel 1: Source Class */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-[#FF9933] text-white text-[11px] font-black flex items-center justify-center">1</div>
              <span className="text-[11px] font-black text-stone-500 uppercase tracking-widest">Source Class</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-stone-500 uppercase tracking-widest">From Class</label>
              <select value={sourceClass} onChange={e => handleSourceClassChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-bold text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] appearance-none">
                <option value="">Select Class</option>
                {classes.map(c => <option key={c._id || c.name} value={c.name || c.className}>{c.name || c.className}</option>)}
              </select>
            </div>

            {sourceSections.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-stone-500 uppercase tracking-widest">From Section</label>
                <select value={sourceSection} onChange={e => setSourceSection(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-bold text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] appearance-none">
                  <option value="">All Sections</option>
                  {sourceSections.map(s => <option key={s} value={s}>Section {s}</option>)}
                </select>
              </div>
            )}

            <button onClick={findStudents} disabled={!sourceClass || loading}
              className="w-full px-4 py-2.5 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white rounded-lg text-[13px] font-bold flex items-center justify-center gap-2 transition-colors shadow-sm disabled:cursor-not-allowed">
              {loading ? <><Loader2 size={14} className="animate-spin" /> Searching…</> : "Find Students"}
            </button>
          </div>

          {/* Panel 2: Transfer Destination */}
          {students.length > 0 && (
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-[#FF9933] text-white text-[11px] font-black flex items-center justify-center">2</div>
                <span className="text-[11px] font-black text-stone-500 uppercase tracking-widest">Transfer Destination</span>
                <span className="ml-auto px-2 py-0.5 rounded-full bg-[#FF9933] text-white text-[10px] font-black">{students.length} students</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-stone-500 uppercase tracking-widest">To Academic Year</label>
                <input type="text" value={targetYear} onChange={e => setTargetYear(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-bold text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933]" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-stone-500 uppercase tracking-widest">To Class</label>
                <select value={targetClass} onChange={e => handleTargetClassChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-bold text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] appearance-none">
                  <option value="">Select Target Class</option>
                  {availableToClasses.map(c => <option key={c._id || c.name} value={c.name || c.className}>{c.name || c.className}</option>)}
                </select>
              </div>

              {targetSections.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-stone-500 uppercase tracking-widest">To Section</label>
                  <select value={targetSection} onChange={e => setTargetSection(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-bold text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] appearance-none">
                    <option value="">Select Section</option>
                    {targetSections.map(s => <option key={s} value={s}>Section {s}</option>)}
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-stone-500 uppercase tracking-widest">Remarks</label>
                <input type="text" value={remarks} onChange={e => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-bold text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933]" placeholder="e.g. Promoted to 11th" />
              </div>
            </div>
          )}

          {/* Panel 3: Summary */}
          {students.length > 0 && (
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-stone-800 text-white text-[11px] font-black flex items-center justify-center">3</div>
                <span className="text-[11px] font-black text-stone-500 uppercase tracking-widest">Summary</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between px-3 py-2.5 bg-blue-50 rounded-lg">
                  <span className="text-[13px] font-bold text-blue-700">Transfer</span>
                  <span className="text-[15px] font-black text-blue-700">{transferCount}</span>
                </div>
                <div className="flex items-center justify-between px-3 py-2.5 bg-green-50 rounded-lg">
                  <span className="text-[13px] font-bold text-green-700">Graduate</span>
                  <span className="text-[15px] font-black text-green-700">{graduateCount}</span>
                </div>
                <div className="flex items-center justify-between px-3 py-2.5 bg-stone-50 rounded-lg">
                  <span className="text-[13px] font-bold text-stone-500">Skip</span>
                  <span className="text-[15px] font-black text-stone-500">{skipCount}</span>
                </div>
              </div>

              <button onClick={execute} disabled={!canExecute || submitting}
                className="w-full px-4 py-3 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white rounded-lg text-[13px] font-bold flex items-center justify-center gap-2 transition-colors shadow-sm disabled:cursor-not-allowed">
                {submitting ? <><Loader2 size={14} className="animate-spin" /> Processing…</> : "Execute Actions"}
              </button>

              <p className="text-[9px] font-bold text-stone-400 text-center uppercase tracking-widest">Creates permanent academic history records</p>
            </div>
          )}
        </div>

        {/* ===== RIGHT COLUMN ===== */}
        <div className="lg:col-span-8">
          {!sourceClass || students.length === 0 ? (
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-10 flex flex-col items-center justify-center min-h-[400px]">
              <Users size={48} className="text-stone-300 mb-4" strokeWidth={1.5} />
              <h3 className="text-lg font-bold text-stone-600 mb-1">
                {loading ? "Loading…" : !sourceClass ? "No Class Selected" : "No Students Loaded"}
              </h3>
              <p className="text-sm text-stone-500 font-medium">
                {loading ? "Fetching students…" : !sourceClass ? "Select a source class and click Find Students." : "This class has no active students to promote."}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
              {/* Toolbar */}
              <div className="p-4 border-b border-stone-200 bg-stone-50/30 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <button onClick={() => setAllActions("transfer")}
                    className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[12px] font-bold hover:bg-blue-100 transition-colors">All Transfer</button>
                  <button onClick={() => setAllActions("graduate")}
                    className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-[12px] font-bold hover:bg-green-100 transition-colors">All Graduate</button>
                  <button onClick={() => setAllActions("skip")}
                    className="px-3 py-1.5 bg-stone-100 text-stone-500 rounded-lg text-[12px] font-bold hover:bg-stone-200 transition-colors">Skip All</button>
                </div>
                <div className="relative w-full sm:w-56 ml-auto">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input type="text" placeholder="Search students…" value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
                    className="w-full pl-9 pr-4 py-1.5 bg-white border border-stone-200 rounded-lg text-[13px] font-medium text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] transition-all shadow-sm" />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50/50">
                      <th className="py-3.5 px-4 font-black text-[11px] text-stone-800 uppercase tracking-wider">Student</th>
                      <th className="py-3.5 px-3 font-black text-[11px] text-stone-800 uppercase tracking-wider">ID</th>
                      <th className="py-3.5 px-3 font-black text-[11px] text-stone-800 uppercase tracking-wider">Section</th>
                      <th className="py-3.5 px-3 font-black text-[11px] text-stone-800 uppercase tracking-wider text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {paginatedStudents.map(s => (
                      <tr key={s._id} className={`hover:bg-stone-50/50 transition-colors ${getRowClass(s._id)}`}>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${getActionColor(s._id)}`}></span>
                            <span className="font-bold text-[13px] text-stone-800">{s.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono font-bold text-[12px] text-stone-400">{s.schoolId || "—"}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-[12px] text-stone-600">{s.profile?.section || "—"}</span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <ActionBtn id={s._id} action="transfer" label="Transfer" activeClass="text-blue-600" activeBg="bg-blue-50" />
                            <ActionBtn id={s._id} action="graduate" label="Graduate" activeClass="text-green-600" activeBg="bg-green-50" />
                            <ActionBtn id={s._id} action="skip" label="Skip" activeClass="text-stone-500" activeBg="bg-stone-100" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredStudents.length > 0 && (
                <div className="p-4 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white">
                  <div className="text-[12px] font-bold text-stone-500">
                    {((page - 1) * perPage) + 1}–{Math.min(page * perPage, filteredStudents.length)} of <span className="font-black text-stone-900">{filteredStudents.length}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-bold text-stone-500">Rows:</span>
                      <select value={perPage} onChange={e => { setPerPage(parseInt(e.target.value)); setPage(1); }}
                        className="appearance-none px-3 py-1.5 pr-8 bg-white border border-stone-200 rounded-lg text-[12px] font-bold text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20 focus:border-[#FF9933] cursor-pointer">
                        {[10, 25, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:bg-stone-50 border border-transparent disabled:opacity-50 transition-colors">
                        <ChevronDown size={16} className="rotate-90" />
                      </button>
                      <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#FF9933] text-white font-black text-[13px] shadow-sm">{page}</button>
                      <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-600 hover:bg-stone-50 border border-stone-200 shadow-sm disabled:opacity-50 transition-colors">
                        <ChevronDown size={16} className="-rotate-90" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setShowConfirm(false)}>
          <div className="bg-white rounded-xl shadow-xl border border-stone-200 w-full max-w-md m-4 p-5" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-black text-stone-900 mb-3">Execute Promotion Actions</h3>
            <div className="space-y-2 mb-5">
              {transferCount > 0 && (
                <p className="text-sm font-medium text-stone-700">
                  Transfer <span className="font-black text-stone-900">{transferCount}</span> student(s) to <span className="font-black text-stone-900">{targetClass}</span>
                </p>
              )}
              {graduateCount > 0 && (
                <p className="text-sm font-medium text-stone-700">
                  Mark <span className="font-black text-stone-900">{graduateCount}</span> student(s) as Graduated
                </p>
              )}
              {skipCount > 0 && (
                <p className="text-sm font-medium text-stone-500">
                  Skip <span className="font-black">{skipCount}</span> student(s) — no action
                </p>
              )}
            </div>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setShowConfirm(false)}
                className="px-4 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-bold text-stone-700 hover:bg-stone-50 transition-colors shadow-sm">Cancel</button>
              <button onClick={confirmExecute}
                className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-[13px] font-bold transition-colors shadow-sm">Execute</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
