"use client";

import { useState, useEffect, useCallback } from 'react';
import { Building2, Plus, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const API = 'http://localhost:5000/api/admin';

function getToken() { return localStorage.getItem('token'); }

function Msg({ msg }) {
  if (!msg) return null;
  const bg = msg.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700';
  const Icon = msg.type === 'success' ? CheckCircle : AlertCircle;
  return <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${bg} text-[13px] font-bold`}><Icon size={16} />{msg.text}</div>;
}

export default function SectionDepartments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const showMsg = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3000); };

  const fetchDepts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/departments`, { headers: { Authorization: `Bearer ${getToken()}` } });
      const d = await res.json();
      if (d.success) setDepartments(d.data || []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDepts(); }, [fetchDepts]);

  async function handleAdd() {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const res = await fetch(`${API}/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ name: newName.trim() })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message);
      setNewName('');
      showMsg('success', `"${newName.trim()}" added`);
      await fetchDepts();
    } catch (err) { showMsg('error', err.message); } finally { setAdding(false); }
  }

  async function handleDelete(dept) {
    setDeleting(dept._id);
    try {
      const res = await fetch(`${API}/departments/${dept._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (!res.ok) throw new Error('Failed to delete');
      showMsg('success', `"${dept.name}" deleted`);
      await fetchDepts();
    } catch (err) { showMsg('error', err.message); } finally { setDeleting(null); }
  }

  return (
    <div className="space-y-4">
      {msg && <Msg msg={msg} />}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-5 flex items-center gap-3 border-b border-stone-100">
          <div className="w-9 h-9 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center"><Building2 size={16} /></div>
          <div><h2 className="text-base font-bold text-stone-900">Departments</h2><p className="text-[12px] font-bold text-stone-500">Manage staff departments</p></div>
        </div>

        <div className="p-4 border-b border-stone-100">
          <form onSubmit={e => { e.preventDefault(); handleAdd(); }} className="flex gap-2">
            <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="New department name" className="flex-1 px-3 py-2 rounded-lg border border-stone-200 text-[13px] font-bold text-stone-800 focus:outline-none focus:border-[#FF9933]" />
            <button type="submit" disabled={adding || !newName.trim()} className="px-4 py-2 rounded-lg text-[13px] font-black bg-[#FF9933] text-white hover:bg-[#e8841f] transition-colors disabled:opacity-50 flex items-center gap-1.5">
              {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add
            </button>
          </form>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm font-bold text-stone-400 animate-pulse">Loading...</div>
        ) : departments.length === 0 ? (
          <div className="p-8 text-center text-sm font-bold text-stone-400">No departments yet.</div>
        ) : (
          <div className="divide-y divide-stone-50">
            {departments.map(d => (
              <div key={d._id || d.name} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-stone-800">{d.name}</span>
                  {!d.deletable && <span className="text-[10px] text-stone-400 font-medium">(default)</span>}
                </div>
                {d.deletable && (
                  <button onClick={() => handleDelete(d)} disabled={deleting === d._id} className="p-1.5 text-stone-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50">
                    {deleting === d._id ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
