"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, CheckCircle } from "lucide-react";

const STATUS_BTNS = [
  { value: "present", label: "P", className: "bg-green-100 text-green-700", activeClass: "bg-green-500 text-white" },
  { value: "absent", label: "A", className: "bg-red-100 text-red-600", activeClass: "bg-red-500 text-white" },
  { value: "late", label: "L", className: "bg-amber-100 text-amber-700", activeClass: "bg-amber-500 text-white" },
  { value: "leave", label: "Lv", className: "bg-blue-100 text-blue-600", activeClass: "bg-blue-500 text-white" },
];

export default function MarkAttendancePage() {
  const today = new Date().toISOString().split("T")[0];

  const [classAssignments, setClassAssignments] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedDate, setSelectedDate] = useState(today);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);

  const sections = classAssignments.filter(a => a.class_id === selectedClass);

  const handleClassChange = (val) => {
    setSelectedClass(val);
    setSelectedSection("");
  };

  const canLoad = selectedClass && selectedSection && selectedDate;
  const markedCount = students.filter(s => !!s.status).length;

  const fetchAssignments = useCallback(async () => {
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/staff/attendance/permissions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const d = await res.json();
        setClassAssignments(d.data?.class_assignments || []);
      }
    } catch {
    } finally {
      setLoadingAssignments(false);
    }
  }, []);

  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

  const loadStudents = async () => {
    if (!canLoad) return;
    setLoading(true);
    setLoadedOnce(true);
    try {
      const token = localStorage.getItem("token") || "";
      const params = new URLSearchParams({ class_id: selectedClass, section_id: selectedSection, date: selectedDate });
      const res = await fetch(`/api/staff/attendance?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load students");
      const d = await res.json();
      const data = d.data || {};
      setIsSubmitted(data.is_submitted || false);
      setStudents((data.students || []).map(s => ({
        id: s.id,
        name: s.name,
        student_code: s.student_code,
        approved_leave: s.approved_leave || false,
        status: s.record?.status || (s.approved_leave ? "leave" : "absent"),
        remark: s.record?.remark || "",
        record_id: s.record?.id || null,
        submitted: !!s.record?.submitted_at,
      })));
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const setAllStatus = (status) => {
    setStudents(prev => prev.map(s => s.submitted ? s : { ...s, status }));
  };

  const setStudentStatus = (id, status) => {
    setStudents(prev => prev.map(s => s.id === id && !s.submitted ? { ...s, status } : s));
  };

  const setStudentRemark = (id, remark) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, remark } : s));
  };

  const saveDraft = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token") || "";
      const records = students.filter(s => s.status).map(s => ({
        student_id: s.id,
        status: s.status,
        remark: s.remark || null,
      }));
      const res = await fetch("/api/staff/attendance/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ date: selectedDate, records }),
      });
      if (!res.ok) throw new Error("Failed to save");
      await loadStudents();
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const submitAttendance = async () => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token") || "";
      const records = students.map(s => ({
        student_id: s.id,
        status: s.status || "absent",
        remark: s.remark || null,
      }));
      await fetch("/api/staff/attendance/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ date: selectedDate, records }),
      });
      await fetch("/api/staff/attendance/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ class_id: selectedClass, section_id: selectedSection, date: selectedDate }),
      });
      setIsSubmitted(true);
      await loadStudents();
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-5 bg-orange-500 rounded-full" />
            <h1 className="text-xl font-bold text-stone-900 tracking-tight">Mark Attendance</h1>
          </div>
          <p className="text-sm text-stone-500 font-medium">Select class and date to mark attendance</p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-[12px] font-black text-stone-700 mb-1">Class</label>
            <select value={selectedClass} onChange={e => handleClassChange(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm">
              <option value="">Select Class</option>
              {selectedClass && !classAssignments.find(a => a.class_id === selectedClass) && (
                <option value={selectedClass}>Class {selectedClass}</option>
              )}
              {[...new Set(classAssignments.map(a => a.class_id))].map(cid => {
                const ca = classAssignments.find(a => a.class_id === cid);
                return <option key={cid} value={cid}>Class {ca?.class_name || cid}</option>;
              })}
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-black text-stone-700 mb-1">Section</label>
            <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)}
              disabled={!selectedClass}
              className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm disabled:opacity-50">
              <option value="">Select Section</option>
              {sections.map(s => (
                <option key={s.section_id} value={s.section_id}>Section {s.section_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-black text-stone-700 mb-1">Date</label>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} max={today}
              className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm" />
          </div>
          <div className="flex items-end">
            <button onClick={loadStudents} disabled={!canLoad || loading}
              className="w-full bg-stone-900 hover:bg-stone-800 text-white py-2 rounded-lg text-sm font-bold transition-colors shadow-sm disabled:opacity-50">
              {loading ? "Loading…" : "Load Students"}
            </button>
          </div>
        </div>
      </div>

      {students.length > 0 && !isSubmitted && (
        <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 mr-1">Mark all as:</span>
          {STATUS_BTNS.map(btn => (
            <button key={btn.value} onClick={() => setAllStatus(btn.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${btn.className}`}>
              {btn.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-16 flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-orange-400" size={36} />
          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest animate-pulse">Synchronizing</p>
        </div>
      ) : students.length > 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          {isSubmitted && (
            <div className="bg-green-50 border-b border-green-100 px-5 py-3 flex items-center gap-2">
              <CheckCircle size={16} className="text-green-600" />
              <span className="text-sm font-bold text-green-700">Attendance submitted and locked for this date.</span>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px]">
              <thead>
                <tr className="bg-stone-50/50 border-b border-stone-100">
                  <th className="text-left py-3 px-4 text-[10px] font-black text-stone-400 uppercase tracking-wider">#</th>
                  <th className="text-left py-3 px-4 text-[10px] font-black text-stone-400 uppercase tracking-wider">Student</th>
                  <th className="py-3 px-4 text-center text-[10px] font-black text-stone-400 uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 text-left text-[10px] font-black text-stone-400 uppercase tracking-wider hidden sm:table-cell">Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {students.map((s, idx) => (
                  <tr key={s.id} className="group hover:bg-stone-50/50">
                    <td className="py-2 px-4 text-xs font-bold text-stone-400">{idx + 1}</td>
                    <td className="py-2 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-stone-800">{s.name}</p>
                          <div className="flex items-center gap-1.5">
                            <p className="text-[10px] font-mono font-bold text-stone-400">{s.student_code}</p>
                            {s.approved_leave && (
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600">Leave</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {STATUS_BTNS.map(btn => (
                          <button key={btn.value}
                            onClick={() => setStudentStatus(s.id, btn.value)}
                            disabled={s.submitted}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                              s.status === btn.value ? btn.activeClass : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                            }`}>
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="py-2 px-4 hidden sm:table-cell">
                      <input type="text" value={s.remark} onChange={e => setStudentRemark(s.id, e.target.value)}
                        disabled={s.submitted}
                        className="w-full px-2 py-1 text-xs border border-transparent focus:border-orange-500/30 rounded bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:opacity-40"
                        placeholder="optional remark" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!isSubmitted && (
            <div className="px-5 py-4 border-t border-stone-100 flex items-center justify-between gap-3">
              <p className="text-xs font-bold text-stone-500">
                <span className="text-orange-500 font-black">{markedCount}</span> / {students.length} marked
              </p>
              <div className="flex gap-2">
                <button onClick={saveDraft} disabled={saving}
                  className="px-5 py-2 text-sm font-bold rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-50 transition-all">
                  {saving ? "Saving…" : "Save Draft"}
                </button>
                <button onClick={submitAttendance} disabled={submitting || markedCount < students.length}
                  className="bg-stone-900 hover:bg-stone-800 text-white py-2 px-6 rounded-lg text-sm font-bold transition-colors shadow-sm disabled:opacity-50">
                  {submitting ? "Submitting…" : "Submit & Lock"}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : loadedOnce && !loading && (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center shadow-sm">
          <div className="flex flex-col items-center gap-2">
            <p className="font-bold text-stone-700">No Students Found</p>
            <p className="text-sm font-medium text-stone-400">No active students in this class/section.</p>
          </div>
        </div>
      )}
    </div>
  );
}
