"use client";

import { useState, useEffect, useCallback } from 'react';
import { BookText, Plus, Pencil, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const API = 'http://localhost:5000/api/admin';

function getToken() { return localStorage.getItem('token'); }

function Msg({ msg }) {
  if (!msg) return null;
  const bg = msg.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700';
  const Icon = msg.type === 'success' ? CheckCircle : AlertCircle;
  return <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${bg} text-[13px] font-bold`}><Icon size={16} />{msg.text}</div>;
}

export default function SectionSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', code: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleting, setDeleting] = useState(null);

  const showMsg = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3000); };

  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/subjects?limit=200`, { headers: { Authorization: `Bearer ${getToken()}` } });
      const d = await res.json();
      if (d.success) setSubjects(d.data || []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSubjects(); }, [fetchSubjects]);

  function openAdd() { setEditing(null); setForm({ name: '', code: '' }); setFormError(''); setShowForm(true); }
  function openEdit(s) { setEditing(s); setForm({ name: s.name, code: s.code || '' }); setFormError(''); setShowForm(true); }

  async function handleSave(e) {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim()) { setFormError('Subject name is required'); return; }
    setSaving(true);
    try {
      const url = editing ? `${API}/subjects/${editing._id}` : `${API}/subjects`;
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(form)
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message);
      setShowForm(false);
      showMsg('success', editing ? 'Updated' : 'Created');
      await fetchSubjects();
    } catch (err) { setFormError(err.message); } finally { setSaving(false); }
  }

  async function handleDelete(id, name) {
    setDeleting(id);
    try {
      const res = await fetch(`${API}/subjects/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
      if (!res.ok) throw new Error('Delete failed');
      showMsg('success', `"${name}" deleted`);
      await fetchSubjects();
    } catch (err) { showMsg('error', err.message); } finally { setDeleting(null); }
  }

  return (
    <div className="space-y-4">
      {msg && <Msg msg={msg} />}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-5 flex items-center justify-between gap-3 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center"><BookText size={16} /></div>
            <div><h2 className="text-base font-bold text-stone-900">Subjects</h2><p className="text-[12px] font-bold text-stone-500">Manage academic subjects used in timetable</p></div>
          </div>
          <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-black bg-[#FF9933] text-white hover:bg-[#e8841f] transition-colors"><Plus size={14} /> Add</button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm font-bold text-stone-400 animate-pulse">Loading...</div>
        ) : subjects.length === 0 ? (
          <div className="p-8 text-center text-sm font-bold text-stone-400">No subjects yet. Add your first subject.</div>
        ) : (
          <div className="divide-y divide-stone-50">
            {subjects.map(s => (
              <div key={s._id} className="flex items-center justify-between px-5 py-3.5 hover:bg-stone-50/30 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-stone-800">{s.name}</span>
                  {s.code && <span className="text-[11px] font-bold text-stone-400 font-mono">({s.code})</span>}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(s)} className="p-1.5 text-stone-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 transition-colors"><Pencil size={13} /></button>
                  <button onClick={() => handleDelete(s._id, s.name)} disabled={deleting === s._id} className="p-1.5 text-stone-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50">
                    {deleting === s._id ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-md border border-stone-200">
            <div className="flex items-center space-x-2 mb-5">
              <div className="w-1.5 h-5 bg-[#FF9933] rounded-full" />
              <h3 className="text-base font-bold text-stone-900">{editing ? 'Edit Subject' : 'Add Subject'}</h3>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              {formError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-bold">{formError}</div>}
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-black text-stone-400 mb-1.5">Subject Name <span className="text-red-500">*</span></label>
                <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="form-input w-full" required placeholder="e.g. Mathematics" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-black text-stone-400 mb-1.5">Subject Code</label>
                <input type="text" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} className="form-input w-full" placeholder="e.g. MATH101" />
              </div>
              <div className="flex justify-end space-x-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-[13px] font-bold text-stone-600 border border-stone-200 hover:bg-stone-50 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="px-5 py-2 rounded-lg text-[13px] font-black tracking-wide bg-[#FF9933] text-white hover:bg-[#e8841f] transition-colors disabled:opacity-50 flex items-center gap-2">
                  {saving && <Loader2 size={14} className="animate-spin" />}{saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
