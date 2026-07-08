"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2, ChevronLeft, X, ArrowLeft } from 'lucide-react';

export default function EditStaffPage() {
    const router = useRouter();
    const params = useParams();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [departments, setDepartments] = useState([]);
    const [photoPreview, setPhotoPreview] = useState('');
    const [photo, setPhoto] = useState(null);

    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: '',
        phone: '',
        email: '',
        address: '',
        department: '',
        designation: '',
        employmentType: 'full-time',
        dateOfJoining: '',
        isActive: true,
    });

    useEffect(() => {
        (async () => {
            try {
                const token = localStorage.getItem('token');
                const [deptRes, staffRes] = await Promise.all([
                    fetch('http://localhost:5000/api/admin/departments', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    fetch(`http://localhost:5000/api/admin/staff/${params.id}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                ]);

                if (deptRes.ok) {
                    const deptData = await deptRes.json();
                    if (deptData.success) setDepartments(deptData.data || []);
                }

                if (!staffRes.ok) throw new Error('Staff not found');
                const staffData = await staffRes.json();
                if (!staffData.success) throw new Error(staffData.message || 'Staff not found');

                const s = staffData.data;
                setForm({
                    firstName: s.firstName || '',
                    lastName: s.lastName || '',
                    dateOfBirth: s.dateOfBirth ? s.dateOfBirth.split('T')[0] : '',
                    gender: s.gender || '',
                    phone: s.phone || '',
                    email: s.email || '',
                    address: s.address || '',
                    department: s.department || '',
                    designation: s.designation || '',
                    employmentType: s.employmentType || 'full-time',
                    dateOfJoining: s.dateOfJoining ? s.dateOfJoining.split('T')[0] : '',
                    isActive: s.isActive !== false,
                });
                if (s.profilePhotoUrl) setPhotoPreview(s.profilePhotoUrl);
            } catch (err) {
                setError(err.message);
            }
            setLoading(false);
        })();
    }, [params.id]);

    const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const handlePhoto = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhoto(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const removePhoto = () => {
        setPhoto(null);
        setPhotoPreview('');
    };

    const validate = () => {
        if (!form.firstName.trim() || !form.lastName.trim()) {
            setError('First and last name are required.');
            return false;
        }
        if (!form.phone.trim()) {
            setError('Phone number is required.');
            return false;
        }
        return true;
    };

    const handleContinue = () => {
        setError('');
        if (step === 1 && !validate()) return;
        setStep(s => Math.min(s + 1, 2));
    };

    const handleBack = () => setStep(s => Math.max(s - 1, 1));

    const handleCancel = () => router.push('/dashboard/staff');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) { setStep(1); return; }
        setError('');
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/admin/staff/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(form)
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || 'Failed to save');

            if (photo) {
                const fd = new FormData();
                fd.append('photo', photo);
                await fetch(`http://localhost:5000/api/admin/staff/${params.id}/photo`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: fd
                }).catch(() => {});
            }

            router.push('/dashboard/staff');
        } catch (err) {
            setError(err.message);
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
                <div className="flex items-center justify-center py-12 text-sm text-stone-400">
                    <Loader2 size={16} className="animate-spin mr-2" /> Loading staff data...
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-4">
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={handleCancel} className="p-1.5 rounded-lg hover:bg-stone-100 transition-colors text-stone-500">
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-base font-bold text-stone-900">Edit Staff Profile</h1>
                        <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Step {step} of 2</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    {[1, 2].map(s => (
                        <div key={s} className={`w-6 h-1 rounded-full transition-all duration-300 ${s <= step ? 'bg-orange-500' : 'bg-stone-200'}`} />
                    ))}
                </div>
            </div>

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs text-red-700 font-bold">{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {step === 1 && (
                    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 space-y-5">
                        <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                            <div className="w-1.5 h-4 rounded-full bg-orange-500" />
                            <h2 className="text-sm font-black text-stone-800 uppercase tracking-widest">Personal Details</h2>
                        </div>

                        <div className="flex items-center gap-4">
                            <label className="relative w-16 h-16 rounded-xl flex-shrink-0 cursor-pointer group" title="Upload photo">
                                {photoPreview ? (
                                    <img src={photoPreview} className="w-16 h-16 rounded-xl object-cover border-2 border-stone-100 shadow-sm" />
                                ) : (
                                    <div className="w-16 h-16 rounded-xl border-2 border-dashed border-stone-300 flex items-center justify-center bg-stone-50 group-hover:border-orange-400 transition-colors">
                                        <svg className="w-6 h-6 text-stone-400 group-hover:text-orange-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                )}
                                {photoPreview && (
                                    <div className="absolute inset-0 rounded-xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                )}
                                <input type="file" className="hidden" accept="image/*" onChange={handlePhoto} />
                            </label>
                            <div>
                                <p className="text-xs font-black text-stone-700">Profile Photo</p>
                                <p className="text-[10px] font-bold text-stone-400 mt-0.5">Optional · JPG, PNG · max 10MB</p>
                                {photoPreview && (
                                    <button type="button" onClick={removePhoto} className="text-[10px] font-bold text-red-400 hover:text-red-500 mt-1">Remove</button>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                            <div>
                                <label className="form-label text-[10px] uppercase tracking-wider font-black text-stone-400">First Name *</label>
                                <input type="text" value={form.firstName} onChange={e => update('firstName', e.target.value)} className="form-input" placeholder="Jane" required />
                            </div>
                            <div>
                                <label className="form-label text-[10px] uppercase tracking-wider font-black text-stone-400">Last Name *</label>
                                <input type="text" value={form.lastName} onChange={e => update('lastName', e.target.value)} className="form-input" placeholder="Smith" required />
                            </div>
                            <div>
                                <label className="form-label text-[10px] uppercase tracking-wider font-black text-stone-400">Date of Birth</label>
                                <input type="date" value={form.dateOfBirth} onChange={e => update('dateOfBirth', e.target.value)} className="form-input" />
                            </div>
                            <div>
                                <label className="form-label text-[10px] uppercase tracking-wider font-black text-stone-400">Gender</label>
                                <select value={form.gender} onChange={e => update('gender', e.target.value)} className="form-select">
                                    <option value="">Select gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="form-label text-[10px] uppercase tracking-wider font-black text-stone-400">Phone *</label>
                                <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} className="form-input" placeholder="+91 98765 43210" required />
                            </div>
                            <div>
                                <label className="form-label text-[10px] uppercase tracking-wider font-black text-stone-400">Email</label>
                                <input type="email" value={form.email} onChange={e => update('email', e.target.value)} className="form-input" placeholder="staff@school.edu" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="form-label text-[10px] uppercase tracking-wider font-black text-stone-400">Address</label>
                                <textarea value={form.address} onChange={e => update('address', e.target.value)} className="form-input resize-none" rows="2" placeholder="Street, City, State..." />
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 space-y-5">
                        <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                            <div className="w-1.5 h-4 rounded-full bg-orange-500" />
                            <h2 className="text-sm font-black text-stone-800 uppercase tracking-widest">Professional Details</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                            <div>
                                <label className="form-label text-[10px] uppercase tracking-wider font-black text-stone-400">Department</label>
                                <select value={form.department} onChange={e => update('department', e.target.value)} className="form-select">
                                    <option value="">Select department</option>
                                    {departments.map(d => (
                                        <option key={d.id} value={d.name}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="form-label text-[10px] uppercase tracking-wider font-black text-stone-400">Designation</label>
                                <input type="text" value={form.designation} onChange={e => update('designation', e.target.value)} className="form-input" placeholder="e.g. Senior Teacher" />
                            </div>
                            <div>
                                <label className="form-label text-[10px] uppercase tracking-wider font-black text-stone-400">Employment Type</label>
                                <select value={form.employmentType} onChange={e => update('employmentType', e.target.value)} className="form-select">
                                    <option value="full-time">Full-time</option>
                                    <option value="part-time">Part-time</option>
                                    <option value="contract">Contract</option>
                                </select>
                            </div>
                            <div>
                                <label className="form-label text-[10px] uppercase tracking-wider font-black text-stone-400">Joining Date</label>
                                <input type="date" value={form.dateOfJoining} onChange={e => update('dateOfJoining', e.target.value)} className="form-input" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="form-label text-[10px] uppercase tracking-wider font-black text-stone-400">Status</label>
                                <div className="flex gap-2">
                                    {['active', 'inactive'].map(s => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => update('isActive', s === 'active')}
                                            className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all border ${
                                                (s === 'active' && form.isActive) || (s === 'inactive' && !form.isActive)
                                                    ? 'bg-orange-500 border-orange-500 text-white'
                                                    : 'bg-white border-stone-200 text-stone-400 hover:border-stone-300'
                                            }`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-xl border border-stone-200 shadow-sm flex items-center justify-between gap-3 px-6 py-4">
                    <button type="button" onClick={handleCancel} className="px-4 py-2.5 text-xs font-black uppercase tracking-widest border border-stone-200 rounded-xl bg-stone-50 text-stone-400 hover:border-red-200 hover:bg-red-50 hover:text-red-500 transition-all">
                        Cancel
                    </button>
                    <div className="flex items-center gap-3">
                        {step > 1 && (
                            <button type="button" onClick={handleBack} className="px-5 py-2.5 text-xs font-black text-stone-400 uppercase tracking-widest border border-stone-200 rounded-xl bg-stone-50 hover:text-stone-600 hover:border-stone-300 transition-all">
                                Back
                            </button>
                        )}
                        {step < 2 ? (
                            <button type="button" onClick={handleContinue} className="px-8 py-2.5 text-xs uppercase tracking-widest font-black text-white rounded-xl transition-all shadow-lg shadow-orange-500/20 bg-orange-500 hover:bg-orange-600">
                                Continue
                            </button>
                        ) : (
                            <button type="submit" disabled={saving} className="px-10 py-2.5 text-xs uppercase tracking-widest font-black text-white rounded-xl transition-all shadow-lg shadow-stone-900/20 bg-stone-900 hover:bg-stone-800 disabled:opacity-50">
                                {saving ? 'Processing...' : 'Update'}
                            </button>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
}
