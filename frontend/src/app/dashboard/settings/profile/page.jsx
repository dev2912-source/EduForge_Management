'use client';
import { useState, useEffect, useRef } from 'react';

export default function ProfileSettingsPage() {
  const fileRef = useRef(null);
  const [role, setRole] = useState('student');
  const [profile, setProfile] = useState({});
  const [edit, setEdit] = useState({});
  const [parentEdit, setParentEdit] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState({ current: '', newPw: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);

  const api = (endpoint, opts = {}) => {
    const token = localStorage.getItem('token');
    return fetch(`/api/${role}${endpoint}`, {
      ...opts,
      headers: { ...opts.headers, Authorization: `Bearer ${token}` }
    });
  };

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    setRole(u.role || 'student');
  }, []);

  useEffect(() => {
    if (!role) return;
    (async () => {
      try {
        const res = await api('/profile');
        if (!res.ok) throw new Error('Failed to load');
        const json = await res.json();
        const u = json.data || json;
        const pr = u.profile || u;
        setProfile(u);
        setEdit({
          phone: pr.phone || '',
          gender: pr.gender || '',
          dateOfBirth: pr.dateOfBirth || '',
          bloodGroup: pr.bloodGroup || '',
          address: pr.address || '',
          nationality: pr.nationality || '',
          religion: pr.religion || ''
        });
        setParentEdit({
          fatherName: pr.parentDetails?.fatherName || '',
          fatherPhone: pr.parentDetails?.fatherPhone || '',
          motherName: pr.parentDetails?.motherName || '',
          motherPhone: pr.parentDetails?.motherPhone || '',
          guardianName: pr.parentDetails?.guardianName || '',
          guardianPhone: pr.parentDetails?.guardianPhone || '',
          annualIncome: pr.parentDetails?.annualIncome || ''
        });
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    })();
  }, [role]);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = role === 'student' ? {
        ...edit,
        parentDetails: {
          fatherName: parentEdit.fatherName,
          fatherPhone: parentEdit.fatherPhone,
          motherName: parentEdit.motherName,
          motherPhone: parentEdit.motherPhone,
          guardianName: parentEdit.guardianName,
          guardianPhone: parentEdit.guardianPhone,
          annualIncome: parentEdit.annualIncome ? Number(parentEdit.annualIncome) : undefined
        }
      } : edit;

      const res = await api('/profile/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to save');
      showMsg('success', 'Profile saved successfully!');
    } catch (err) {
      showMsg('error', err.message);
    }
    setSaving(false);
  };

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showMsg('error', 'Only image files allowed'); return; }
    if (file.size > 2 * 1024 * 1024) { showMsg('error', 'File must be under 2MB'); return; }
    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const fd = new FormData();
      fd.append('photo', file);
      const res = await fetch(`/api/${role}/profile/photo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Upload failed');
      setProfile(prev => ({ ...prev, profile: { ...prev.profile, photoUrl: json.data?.photoUrl } }));
      showMsg('success', 'Photo uploaded!');
    } catch (err) {
      showMsg('error', err.message);
    }
    setUploading(false);
  };

  const handleChangePassword = async () => {
    setPwMsg(null);
    if (!pw.current || !pw.newPw || !pw.confirm) { setPwMsg({ type: 'error', text: 'All fields required' }); return; }
    if (pw.newPw.length < 8) { setPwMsg({ type: 'error', text: 'Min 8 characters' }); return; }
    if (pw.newPw !== pw.confirm) { setPwMsg({ type: 'error', text: 'Passwords do not match' }); return; }
    setPwSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/${role}/profile/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.newPw })
      });
      if (res.ok) {
        setPwMsg({ type: 'success', text: 'Password changed!' });
        setPw({ current: '', newPw: '', confirm: '' });
      } else {
        const err = await res.json().catch(() => ({}));
        setPwMsg({ type: 'error', text: err.message || 'Failed' });
      }
    } catch {
      setPwMsg({ type: 'error', text: 'Network error' });
    }
    setPwSaving(false);
  };

  const Msg = ({ s }) => s?.text ? (
    <div className={`px-4 py-2.5 rounded-xl text-sm font-bold border ${
      s.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
    }`}>
      {s.text}
    </div>
  ) : null;

  if (loading) return (
    <div className="flex items-center justify-center py-16 text-sm text-stone-400">Loading...</div>
  );

  const p = profile.profile || profile;
  const isStudent = role === 'student';

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
        <div className="flex items-center space-x-2">
          <span className="w-1.5 h-5 bg-[#F97316] rounded-full" />
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">Profile Settings</h1>
        </div>
        <p className="text-sm text-stone-500 font-medium ml-3.5 mt-0.5">Manage your personal information and account</p>
      </div>

      {msg && <Msg s={msg} />}

      {/* Profile Photo */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 flex items-center gap-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-stone-100 border-2 border-stone-200 overflow-hidden flex items-center justify-center">
            {p.photoUrl ? (
              <img src={p.photoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-8 h-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            )}
          </div>
          {uploading && (
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
              <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-bold text-stone-800">{profile.name}</p>
          <p className="text-xs text-stone-500">{profile.email}</p>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="mt-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 transition-colors"
          >
            {p.photoUrl ? 'Change Photo' : 'Upload Photo'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-100">
          <h2 className="text-sm font-bold text-stone-900">Personal Information</h2>
        </div>
        <div className="divide-y divide-stone-50">
          {[
            { key: 'name', label: 'Full Name', ro: true },
            { key: 'email', label: 'Email', ro: true },
            { key: 'phone', label: 'Phone' },
            { key: 'gender', label: 'Gender', type: 'select', opts: ['', 'Male', 'Female', 'Other'] },
            { key: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
            { key: 'bloodGroup', label: 'Blood Group', type: 'select', opts: ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
            { key: 'address', label: 'Address' },
            { key: 'nationality', label: 'Nationality' },
            { key: 'religion', label: 'Religion' },
          ].map(f => {
            const val = f.ro ? (f.key === 'name' ? profile.name : profile.email) : edit[f.key];
            return (
              <div key={f.key} className="flex flex-col sm:flex-row sm:items-center p-4 gap-1.5 sm:gap-0">
                <div className="w-40 text-[10px] font-black uppercase tracking-widest text-stone-400 flex-shrink-0">{f.label}</div>
                <div className="flex-1">
                  {f.ro ? (
                    <span className="text-sm font-medium text-stone-600">{val || '—'}</span>
                  ) : f.type === 'select' ? (
                    <select
                      value={val || ''}
                      onChange={e => setEdit({ ...edit, [f.key]: e.target.value })}
                      className="w-full max-w-sm px-3 py-2 rounded-lg border border-stone-200 text-sm focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316] outline-none bg-white"
                    >
                      {f.opts.map(o => <option key={o} value={o}>{o || `Select ${f.label}`}</option>)}
                    </select>
                  ) : (
                    <input
                      type={f.type || 'text'}
                      value={val || ''}
                      onChange={e => setEdit({ ...edit, [f.key]: e.target.value })}
                      className="w-full max-w-sm px-3 py-2 rounded-lg border border-stone-200 text-sm focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316] outline-none"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Student / Staff Details */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-100">
          <h2 className="text-sm font-bold text-stone-900">{isStudent ? 'Student Details' : 'Employment Details'}</h2>
        </div>
        <div className="divide-y divide-stone-50">
          {(isStudent ? [
            { label: 'Student ID', val: profile.schoolId },
            { label: 'Class', val: p.className },
            { label: 'Section', val: p.section },
            { label: 'Roll Number', val: p.rollNumber },
            { label: 'Academic Year', val: p.academicYear },
            { label: 'Medium', val: p.medium },
            { label: 'Admission Date', val: p.admissionDate ? new Date(p.admissionDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
          ] : [
            { label: 'Staff ID', val: profile.schoolId },
            { label: 'Department', val: profile.department || p.department },
            { label: 'Designation', val: profile.designation || p.designation },
            { label: 'Employment Type', val: profile.employmentType || p.employmentType },
            { label: 'Date of Joining', val: (profile.dateOfJoining || p.dateOfJoining) ? new Date(profile.dateOfJoining || p.dateOfJoining).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
          ]).map(f => (
            <div key={f.label} className="flex flex-col sm:flex-row sm:items-center p-4 gap-1.5 sm:gap-0">
              <div className="w-40 text-[10px] font-black uppercase tracking-widest text-stone-400 flex-shrink-0">{f.label}</div>
              <div className="flex-1">
                <span className="text-sm font-bold text-stone-800">{f.val || '—'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Parent Details (student only) */}
      {isStudent && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-stone-100">
            <h2 className="text-sm font-bold text-stone-900">Parent / Guardian Details</h2>
          </div>
          <div className="divide-y divide-stone-50">
            {[
              { key: 'fatherName', label: 'Father Name' },
              { key: 'fatherPhone', label: 'Father Phone' },
              { key: 'motherName', label: 'Mother Name' },
              { key: 'motherPhone', label: 'Mother Phone' },
              { key: 'guardianName', label: 'Guardian Name' },
              { key: 'guardianPhone', label: 'Guardian Phone' },
              { key: 'annualIncome', label: 'Annual Income (₹)' },
            ].map(f => (
              <div key={f.key} className="flex flex-col sm:flex-row sm:items-center p-4 gap-1.5 sm:gap-0">
                <div className="w-40 text-[10px] font-black uppercase tracking-widest text-stone-400 flex-shrink-0">{f.label}</div>
                <div className="flex-1">
                  <input
                    type={f.key === 'annualIncome' ? 'number' : 'text'}
                    value={parentEdit[f.key] || ''}
                    onChange={e => setParentEdit({ ...parentEdit, [f.key]: e.target.value })}
                    className="w-full max-w-sm px-3 py-2 rounded-lg border border-stone-200 text-sm focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316] outline-none"
                    placeholder={f.key === 'annualIncome' ? 'Annual family income' : ''}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 rounded-xl text-sm font-bold bg-stone-900 hover:bg-stone-800 text-white transition-colors disabled:opacity-50 shadow-sm"
        >
          {saving ? 'Saving…' : 'Save Profile'}
        </button>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <button
          onClick={() => setPwOpen(!pwOpen)}
          className="w-full p-4 flex items-center justify-between hover:bg-stone-50/50 transition-colors"
        >
          <div className="text-left">
            <h2 className="text-sm font-bold text-stone-900">Change Password</h2>
            <p className="text-xs text-stone-500 mt-0.5">Update your account password</p>
          </div>
          <svg className={`w-4 h-4 text-stone-400 transition-transform ${pwOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {pwOpen && (
          <div className="px-4 pb-4 pt-2 border-t border-stone-100 space-y-4">
            {pwMsg && <Msg s={pwMsg} />}
            {[
              { key: 'current', label: 'Current Password' },
              { key: 'newPw', label: 'New Password', ph: 'Min 8 characters' },
              { key: 'confirm', label: 'Confirm New Password' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1 block">{f.label}</label>
                <input
                  type="password"
                  value={pw[f.key]}
                  onChange={e => setPw({ ...pw, [f.key]: e.target.value })}
                  placeholder={f.ph || ''}
                  className="w-full sm:w-2/3 px-3 py-2 rounded-lg border border-stone-200 text-sm focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316] outline-none"
                />
              </div>
            ))}
            <button
              onClick={handleChangePassword}
              disabled={pwSaving}
              className="px-5 py-2 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors disabled:opacity-50"
            >
              {pwSaving ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
