"use client";

import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const API = 'http://localhost:5000/api/admin';
const LOCALE = 'en-IN';
const DATE_OPTIONS = { day: 'numeric', month: 'short', year: 'numeric' };

function formatDate(dateStr) {
  if (!dateStr) return '\u2014';
  try {
    return new Date(dateStr).toLocaleDateString(LOCALE, DATE_OPTIONS);
  } catch {
    return '\u2014';
  }
}

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

function Msg({ msg }) {
  if (!msg?.text) return null;
  const bg = msg.type === 'success'
    ? 'bg-green-50 border-green-200 text-green-700'
    : msg.type === 'error'
    ? 'bg-red-50 border-red-200 text-red-700'
    : 'bg-blue-50 border-blue-200 text-blue-700';
  const Icon = msg.type === 'success' ? CheckCircle : AlertCircle;
  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${bg} text-[13px] font-bold`}>
      <Icon size={16} /> {msg.text}
    </div>
  );
}

export default function AcademicYearsSection() {
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingYear, setEditingYear] = useState(null);
  const [form, setForm] = useState({ label: '', start_date: '', end_date: '' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [setCurrentTarget, setSetCurrentTarget] = useState(null);
  const [settingCurrent, setSettingCurrent] = useState(false);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const fetchYears = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API}/academic-years?limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load academic years');
      const d = await res.json();
      setYears(d.data || []);
    } catch (err) {
      showMsg('error', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchYears(); }, [fetchYears]);

  function openAddForm() {
    setEditingYear(null);
    setForm({ label: '', start_date: '', end_date: '' });
    setFormError('');
    setShowForm(true);
  }

  function openEditForm(year) {
    setEditingYear(year);
    setForm({
      label: year.label,
      start_date: year.start_date?.split('T')[0] || '',
      end_date: year.end_date?.split('T')[0] || ''
    });
    setFormError('');
    setShowForm(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setFormError('');
    if (!form.label.trim() || !form.start_date || !form.end_date) {
      setFormError('All fields are required');
      return;
    }
    if (new Date(form.end_date) <= new Date(form.start_date)) {
      setFormError('End date must be after start date');
      return;
    }
    setSaving(true);
    try {
      const token = getToken();
      const url = editingYear
        ? `${API}/academic-years/${editingYear._id}`
        : `${API}/academic-years`;
      const method = editingYear ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || 'Save failed');
      setShowForm(false);
      showMsg('success', editingYear ? 'Updated successfully' : 'Created successfully');
      await fetchYears();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSetCurrent(year) {
    setSettingCurrent(true);
    try {
      const token = getToken();
      const res = await fetch(`${API}/academic-years/${year._id}/set-current`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || 'Failed to set as current');
      setSetCurrentTarget(null);
      showMsg('success', `"${year.label}" is now the current academic year`);
      await fetchYears();
    } catch (err) {
      showMsg('error', err.message);
    } finally {
      setSettingCurrent(false);
    }
  }

  return (
    <div className="space-y-4">
      {msg && <Msg msg={msg} />}

      {/* Header + Add Button */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-5 bg-[#FF9933] rounded-full" />
            <h1 className="text-xl font-bold text-stone-900 tracking-tight">Academic Years</h1>
          </div>
          <p className="text-sm text-stone-500 font-medium">Manage academic year configurations</p>
        </div>
        <button
          onClick={openAddForm}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-black tracking-wide bg-[#FF9933] text-white hover:bg-[#e8841f] transition-colors shadow-lg shadow-stone-200"
        >
          <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" /> Add Year
        </button>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-3">
            <Loader2 size={24} className="animate-spin text-[#FF9933]" />
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest animate-pulse">Loading</p>
          </div>
        ) : years.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center">
              <X size={20} className="text-stone-400" />
            </div>
            <p className="text-sm font-bold text-stone-900">No academic years</p>
            <p className="text-xs text-stone-400 font-medium">Add your first academic year.</p>
          </div>
        ) : (
          <ul className="divide-y divide-stone-50">
            {years.map((year) => (
              <li key={year._id} className="flex items-center justify-between px-5 py-4 hover:bg-orange-50/30 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${year.isCurrent ? 'bg-[#FF9933]' : 'bg-stone-200'}`} />
                  <div>
                    <p className="text-sm font-bold text-stone-900">{year.label}</p>
                    <p className="text-xs text-stone-400 font-medium">
                      {formatDate(year.start_date)} &mdash; {formatDate(year.end_date)}
                    </p>
                  </div>
                  {year.isCurrent && (
                    <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-black text-[#FF9933] bg-orange-50 border border-orange-200 uppercase">Current</span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {!year.isCurrent && (
                    <button
                      onClick={() => setSetCurrentTarget(year)}
                      className="px-3 py-1.5 text-xs font-bold text-stone-600 border border-stone-200 rounded-lg hover:border-[#FF9933]/30 hover:text-[#e8841f] hover:bg-orange-50/20 transition-all"
                    >
                      Set as Current
                    </button>
                  )}
                  <button
                    onClick={() => openEditForm(year)}
                    className="p-1.5 text-stone-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-all"
                  >
                    <Pencil size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-md border border-stone-200">
            <div className="flex items-center space-x-2 mb-5">
              <div className="w-1.5 h-5 bg-[#FF9933] rounded-full" />
              <h3 className="text-base font-bold text-stone-900">
                {editingYear ? 'Edit Academic Year' : 'Add Academic Year'}
              </h3>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-bold">
                  {formError}
                </div>
              )}
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-black text-stone-400 mb-1.5">
                  Year Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.label}
                  onChange={(e) => setForm(prev => ({ ...prev, label: e.target.value }))}
                  className="form-input w-full"
                  required
                  placeholder="e.g. 2024-25"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-black text-stone-400 mb-1.5">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm(prev => ({ ...prev, start_date: e.target.value }))}
                  className="form-input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-black text-stone-400 mb-1.5">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm(prev => ({ ...prev, end_date: e.target.value }))}
                  className="form-input w-full"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-lg text-[13px] font-bold text-stone-600 border border-stone-200 hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg text-[13px] font-black tracking-wide bg-[#FF9933] text-white hover:bg-[#e8841f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Set as Current Confirmation Modal */}
      {setCurrentTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setSetCurrentTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm border border-stone-200">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-1.5 h-5 bg-[#FF9933] rounded-full" />
              <h3 className="text-base font-bold text-stone-900">Set as Current Year?</h3>
            </div>
            <p className="text-sm text-stone-500 mb-5">
              Setting <strong className="text-stone-800">{setCurrentTarget.label}</strong> as the current academic year will affect all new admissions and fee assignments.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setSetCurrentTarget(null)}
                className="px-4 py-2 rounded-lg text-[13px] font-bold text-stone-600 border border-stone-200 hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={settingCurrent}
                onClick={() => handleSetCurrent(setCurrentTarget)}
                className="px-5 py-2 rounded-lg text-[13px] font-black tracking-wide bg-[#FF9933] text-white hover:bg-[#e8841f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {settingCurrent && <Loader2 size={14} className="animate-spin" />}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
