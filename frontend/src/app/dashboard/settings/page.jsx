"use client";

import { useState, useEffect } from 'react';
import { User, Lock, ChevronDown, ChevronUp, Building2, Palette, LayoutTemplate, Upload, RotateCcw, Save, CheckCircle, AlertCircle } from 'lucide-react';
import AcademicYearsSection from './AcademicYearsSection';
import SectionClassMediums from './SectionClassMediums';
import SectionDepartments from './SectionDepartments';
import SectionRoles from './SectionRoles';
import SectionAttendance from './SectionAttendance';
import SectionSalaryGrades from './SectionSalaryGrades';
import SectionSalaryStructures from './SectionSalaryStructures';
import SectionFeeCategories from './SectionFeeCategories';
import SectionSubjects from './SectionSubjects';
import SectionTimetablePeriods from './SectionTimetablePeriods';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('My Profile');
    const [isPasswordExpanded, setIsPasswordExpanded] = useState(false);
    const [userRole, setUserRole] = useState('student');
    const [profile, setProfile] = useState({ name: '', email: '', role: 'student', phone: '', address: '', gender: '', dob: '' });
    const [editProfile, setEditProfile] = useState({ name: '', phone: '', address: '', gender: '', dob: '' });
    const [msg, setMsg] = useState({ type: '', text: '' });
    const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });
    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

    const [schoolData, setSchoolData] = useState(() => {
        if (typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem('schoolProfile');
                if (saved) return JSON.parse(saved);
            } catch {}
        }
        return {
            name: "ASTNIQ Academy",
            tagline: "Innovating Education for Tomorrow",
            address: "456 Learning Blvd, Tech District, Bangalore - 560001",
            phone: "+91 98765 43210",
            email: "admin@astniq.com",
            established: "2024",
            website: "www.astniq.com",
            code: "ASTNIQ",
            subdomain: "portal.astniq.com"
        };
    });

    const [schoolMsg, setSchoolMsg] = useState({ type: '', text: '' });

    const [branding, setBranding] = useState(() => {
        if (typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem('schoolBranding');
                if (saved) return JSON.parse(saved);
            } catch {}
        }
        return { primaryColor: '#FF9933', logoUrl: '', logoFileName: '' };
    });
    const [brandingMsg, setBrandingMsg] = useState({ type: '', text: '' });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem("token");
                const userData = localStorage.getItem("user");
                let parsed = null;
                if (userData) {
                    parsed = JSON.parse(userData);
                    setUserRole(parsed.role || "student");
                }

                if (parsed?.role === 'admin') {
                    const p = {
                        name: parsed.name || 'Admin',
                        email: parsed.email || '',
                        role: 'admin',
                        phone: parsed.phone || '',
                        address: '',
                        gender: '',
                        dob: ''
                    };
                    setProfile(p);
                    setEditProfile({ name: p.name, phone: p.phone, address: '', gender: '', dob: '' });
                    return;
                }

                const endpoint = parsed?.role === 'staff' ? '/api/staff/profile' : '/api/student/profile';
                try {
                    const res = await fetch(endpoint, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        const raw = data.data || data;
                        const name = raw.name || (raw.firstName && raw.lastName ? `${raw.firstName} ${raw.lastName}` : raw.email);
                        const p = {
                            name,
                            email: raw.email,
                            role: raw.role || parsed?.role || 'student',
                            phone: raw.phone || raw.mobile || '',
                            address: raw.address || '',
                            gender: raw.gender || '',
                            dob: raw.dob || raw.dateOfBirth || ''
                        };
                        setProfile(p);
                        setEditProfile({ name: p.name, phone: p.phone, address: p.address, gender: p.gender, dob: p.dob });
                        if (raw.role) setUserRole(raw.role);
                        return;
                    }
                } catch {}

                if (parsed) {
                    const p = {
                        name: parsed.name || '',
                        email: parsed.email || '',
                        role: parsed.role || 'student',
                        phone: parsed.phone || '',
                        address: '',
                        gender: '',
                        dob: ''
                    };
                    setProfile(p);
                    setEditProfile({ name: p.name, phone: p.phone, address: '', gender: '', dob: '' });
                }
            } catch (e) {
                console.error(e);
            }
        };
        fetchProfile();
    }, []);

    const adminTabs = [
        "My Profile",
        "School Profile",
        "Branding",
        "Academic Years",
        "Class Mediums",
        "Departments",
        "Manage Roles",
        "Attendance & Schedule",
        "Salary Grades",
        "Salary Structures",
        "Fee Categories",
        "Subjects",
        "Timetable Periods"
    ];

    const tabs = userRole === 'admin' ? adminTabs : ["My Profile"];

    const showMsg = (type, text) => {
        setMsg({ type, text });
        setTimeout(() => setMsg({ type: '', text: '' }), 4000);
    };

    const handleSaveProfile = async () => {
        if (!editProfile.name.trim()) {
            showMsg('error', 'Name is required');
            return;
        }
        if (userRole === 'admin') {
            showMsg('info', 'Admin profile cannot be edited here');
            return;
        }
        try {
            const token = localStorage.getItem("token");
            const endpoint = userRole === 'staff' ? '/api/staff/profile' : '/api/student/profile/update';
            const res = await fetch(endpoint, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(editProfile)
            });
            if (res.ok) {
                showMsg('success', 'Profile saved successfully!');
                setProfile(prev => ({ ...prev, ...editProfile }));
            } else {
                const err = await res.json().catch(() => ({}));
                showMsg('error', err.message || 'Failed to save profile');
            }
        } catch {
            showMsg('error', 'Network error. Could not save profile.');
        }
    };

    const handleChangePassword = async () => {
        setPasswordMsg({ type: '', text: '' });
        if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            setPasswordMsg({ type: 'error', text: 'All password fields are required' });
            return;
        }
        if (passwordForm.newPassword.length < 8) {
            setPasswordMsg({ type: 'error', text: 'New password must be at least 8 characters' });
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordMsg({ type: 'error', text: 'New passwords do not match' });
            return;
        }
        try {
            const token = localStorage.getItem("token");
            const res = await fetch('/api/student/profile/password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword
                })
            });
            if (res.ok) {
                setPasswordMsg({ type: 'success', text: 'Password changed successfully!' });
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                const err = await res.json().catch(() => ({}));
                setPasswordMsg({ type: 'error', text: err.message || 'Failed to change password' });
            }
        } catch {
            setPasswordMsg({ type: 'error', text: 'Network error. Could not change password.' });
        }
    };

    const handleSaveSchool = () => {
        localStorage.setItem('schoolProfile', JSON.stringify(schoolData));
        setSchoolMsg({ type: 'success', text: 'School profile saved locally.' });
        setTimeout(() => setSchoolMsg({ type: '', text: '' }), 3000);
    };

    const handleSaveBranding = () => {
        localStorage.setItem('schoolBranding', JSON.stringify(branding));
        setBrandingMsg({ type: 'success', text: 'Branding saved locally.' });
        setTimeout(() => setBrandingMsg({ type: '', text: '' }), 3000);
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setBranding(prev => ({ ...prev, logoUrl: url, logoFileName: file.name }));
        }
    };

    const MsgBanner = ({ msgState }) => {
        if (!msgState.text) return null;
        const bg = msgState.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' :
                   msgState.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' :
                   'bg-blue-50 border-blue-200 text-blue-700';
        const Icon = msgState.type === 'success' ? CheckCircle : AlertCircle;
        return (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${bg} text-[13px] font-bold`}>
                <Icon size={16} />
                {msgState.text}
            </div>
        );
    };

    const PreviewCard = () => (
        <div className="bg-white border border-stone-200 shadow-sm p-4 rounded-xl w-full max-w-sm text-center">
            {branding.logoUrl && (
                <img src={branding.logoUrl} alt="School logo" className="h-10 mx-auto mb-3 object-contain" />
            )}
            <h3 className="text-[15px] font-black text-stone-900 uppercase tracking-wide" style={{ color: branding.primaryColor }}>{schoolData.name}</h3>
            <p className="text-[10px] font-medium text-stone-500 mt-1 mb-2 max-w-[200px] mx-auto leading-tight">{schoolData.address}</p>
            <p className="text-[9px] font-bold text-stone-400 tracking-wider">Est. {schoolData.established} | {schoolData.phone} | {schoolData.email}</p>
            <div className="h-px bg-stone-200 w-full my-2"></div>
            <p className="text-[10px] font-black text-stone-600 italic">{schoolData.tagline}</p>
        </div>
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row gap-6 lg:gap-12">

                {/* Left Sidebar Navigation */}
                <div className="w-full md:w-64 flex-shrink-0">
                    <div className="bg-white rounded-xl border border-stone-200 shadow-sm py-2 overflow-hidden flex flex-col">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`text-left px-5 py-3 text-[14px] font-bold transition-colors ${
                                    activeTab === tab
                                    ? 'bg-[#FF9933] text-white m-1 rounded-lg shadow-sm shadow-orange-500/20'
                                    : 'text-stone-600 hover:bg-stone-50'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 space-y-6">

                    {/* Header */}
                    <div>
                        <h1 className="text-2xl font-black text-stone-900 tracking-tight">{activeTab}</h1>
                        <p className="text-[13px] font-bold text-stone-500 mt-1">
                            {activeTab === 'My Profile' ? 'Manage your account details and password' :
                             activeTab === 'School Profile' ? 'Manage your school information' :
                             activeTab === 'Branding' ? 'Customize your school brand appearance' :
                             activeTab === 'Android App' ? 'Build and manage your branded Android app' :
                             'Manage system settings'}
                        </p>
                    </div>

                    {/* === MY PROFILE TAB === */}
                    {activeTab === 'My Profile' && (
                        <div className="space-y-4">
                            {msg.text && <MsgBanner msgState={msg} />}

                            {/* Account Details Card */}
                            <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                                <div className="p-5 flex items-center gap-4 border-b border-stone-100">
                                    <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center flex-shrink-0">
                                        <User size={18} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-stone-900">Account Details</h2>
                                        <p className="text-[12px] font-bold text-stone-500">Edit your personal information</p>
                                    </div>
                                </div>

                                <div className="flex flex-col">
                                    {/* Name */}
                                    <div className="flex flex-col sm:flex-row sm:items-center p-5 border-b border-stone-100 gap-2 sm:gap-0">
                                        <div className="w-48 text-[11px] font-black tracking-widest text-stone-400 uppercase">Name</div>
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                value={editProfile.name}
                                                onChange={(e) => setEditProfile(prev => ({ ...prev, name: e.target.value }))}
                                                className="w-full max-w-md px-3 py-2 rounded-lg border border-stone-200 text-[13px] font-bold text-stone-800 focus:outline-none focus:border-[#FF9933] focus:ring-2 focus:ring-orange-500/20"
                                            />
                                        </div>
                                    </div>

                                    {/* Email (read-only) */}
                                    <div className="flex flex-col sm:flex-row sm:items-center p-5 border-b border-stone-100 gap-2 sm:gap-0">
                                        <div className="w-48 text-[11px] font-black tracking-widest text-stone-400 uppercase">Email</div>
                                        <div className="flex-1 text-[13px] font-black text-stone-800">{profile.email}</div>
                                    </div>

                                    {/* Phone */}
                                    <div className="flex flex-col sm:flex-row sm:items-center p-5 border-b border-stone-100 gap-2 sm:gap-0">
                                        <div className="w-48 text-[11px] font-black tracking-widest text-stone-400 uppercase">Phone</div>
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                value={editProfile.phone}
                                                onChange={(e) => setEditProfile(prev => ({ ...prev, phone: e.target.value }))}
                                                className="w-full max-w-md px-3 py-2 rounded-lg border border-stone-200 text-[13px] font-bold text-stone-800 focus:outline-none focus:border-[#FF9933] focus:ring-2 focus:ring-orange-500/20"
                                            />
                                        </div>
                                    </div>

                                    {/* Address */}
                                    <div className="flex flex-col sm:flex-row sm:items-center p-5 border-b border-stone-100 gap-2 sm:gap-0">
                                        <div className="w-48 text-[11px] font-black tracking-widest text-stone-400 uppercase">Address</div>
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                value={editProfile.address}
                                                onChange={(e) => setEditProfile(prev => ({ ...prev, address: e.target.value }))}
                                                className="w-full max-w-md px-3 py-2 rounded-lg border border-stone-200 text-[13px] font-bold text-stone-800 focus:outline-none focus:border-[#FF9933] focus:ring-2 focus:ring-orange-500/20"
                                            />
                                        </div>
                                    </div>

                                    {/* Gender */}
                                    <div className="flex flex-col sm:flex-row sm:items-center p-5 border-b border-stone-100 gap-2 sm:gap-0">
                                        <div className="w-48 text-[11px] font-black tracking-widest text-stone-400 uppercase">Gender</div>
                                        <div className="flex-1">
                                            <select
                                                value={editProfile.gender}
                                                onChange={(e) => setEditProfile(prev => ({ ...prev, gender: e.target.value }))}
                                                className="w-full max-w-md px-3 py-2 rounded-lg border border-stone-200 text-[13px] font-bold text-stone-800 focus:outline-none focus:border-[#FF9933] focus:ring-2 focus:ring-orange-500/20"
                                            >
                                                <option value="">Select gender</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Date of Birth */}
                                    <div className="flex flex-col sm:flex-row sm:items-center p-5 gap-2 sm:gap-0">
                                        <div className="w-48 text-[11px] font-black tracking-widest text-stone-400 uppercase">Date of Birth</div>
                                        <div className="flex-1">
                                            <input
                                                type="date"
                                                value={editProfile.dob}
                                                onChange={(e) => setEditProfile(prev => ({ ...prev, dob: e.target.value }))}
                                                className="w-full max-w-md px-3 py-2 rounded-lg border border-stone-200 text-[13px] font-bold text-stone-800 focus:outline-none focus:border-[#FF9933] focus:ring-2 focus:ring-orange-500/20"
                                            />
                                        </div>
                                    </div>

                                    {/* Save Button */}
                                    <div className="p-5 border-t border-stone-100">
                                        <button
                                            onClick={handleSaveProfile}
                                            className="px-6 py-2.5 rounded-lg text-[13px] font-black tracking-wide bg-[#FF9933] text-white hover:bg-[#e8841f] transition-colors flex items-center gap-2"
                                        >
                                            <Save size={16} /> Save Profile
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Change Password Card */}
                            <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden transition-colors">
                                <div
                                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-stone-50/50"
                                    onClick={() => setIsPasswordExpanded(!isPasswordExpanded)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center flex-shrink-0">
                                            <Lock size={18} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <h2 className="text-base font-bold text-stone-900">Change Password</h2>
                                            <p className="text-[12px] font-bold text-stone-500">Update your account password</p>
                                        </div>
                                    </div>
                                    {isPasswordExpanded ? (
                                        <ChevronUp size={18} className="text-stone-400" />
                                    ) : (
                                        <ChevronDown size={18} className="text-stone-400" />
                                    )}
                                </div>

                                {isPasswordExpanded && (
                                    <div className="p-6 pt-2">
                                        {passwordMsg.text && <MsgBanner msgState={passwordMsg} />}
                                        <div className="border-t border-stone-100 pt-6 space-y-6">
                                            <div className="flex flex-col gap-2.5">
                                                <label className="text-[11px] font-black uppercase tracking-widest text-stone-400">Current Password</label>
                                                <input
                                                    type="password"
                                                    placeholder="Enter current password"
                                                    value={passwordForm.currentPassword}
                                                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                                                    className="w-full sm:w-2/3 md:w-[60%] px-4 py-2.5 rounded-xl border border-stone-200 text-sm font-bold text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#FF9933] focus:ring-2 focus:ring-orange-500/20"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2.5">
                                                <label className="text-[11px] font-black uppercase tracking-widest text-stone-400">New Password</label>
                                                <input
                                                    type="password"
                                                    placeholder="Minimum 8 characters"
                                                    value={passwordForm.newPassword}
                                                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                                                    className="w-full sm:w-2/3 md:w-[60%] px-4 py-2.5 rounded-xl border border-stone-200 text-sm font-bold text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#FF9933] focus:ring-2 focus:ring-orange-500/20"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2.5">
                                                <label className="text-[11px] font-black uppercase tracking-widest text-stone-400">Confirm New Password</label>
                                                <input
                                                    type="password"
                                                    placeholder="Re-enter new password"
                                                    value={passwordForm.confirmPassword}
                                                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                                    className="w-full sm:w-2/3 md:w-[60%] px-4 py-2.5 rounded-xl border border-stone-200 text-sm font-bold text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#FF9933] focus:ring-2 focus:ring-orange-500/20"
                                                />
                                            </div>
                                            <div className="pt-2">
                                                <button
                                                    onClick={handleChangePassword}
                                                    className="px-6 py-3 rounded-lg text-[13px] font-black tracking-wide bg-[#FCDDBB] text-stone-600 hover:bg-[#FBCE9A] transition-colors"
                                                >
                                                    UPDATE PASSWORD
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* === SCHOOL PROFILE TAB === */}
                    {activeTab === 'School Profile' && (
                        <div className="space-y-4">
                            {schoolMsg.text && <MsgBanner msgState={schoolMsg} />}

                            <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                                <div className="p-5 flex items-center gap-4 border-b border-stone-100">
                                    <div className="w-10 h-10 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center flex-shrink-0">
                                        <Building2 size={18} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-stone-900">School Details</h2>
                                        <p className="text-[12px] font-bold text-stone-500">Edit your school information below</p>
                                    </div>
                                </div>

                                <div className="flex flex-col">
                                    {[
                                        { field: 'name', label: 'School Name' },
                                        { field: 'tagline', label: 'Tagline / Motto' },
                                        { field: 'address', label: 'Full Address' },
                                        { field: 'phone', label: 'Phone' },
                                        { field: 'email', label: 'Email' },
                                        { field: 'established', label: 'Year Established' },
                                        { field: 'website', label: 'Website' },
                                        { field: 'code', label: 'Campus Login Code' },
                                        { field: 'subdomain', label: 'Subdomain' },
                                    ].map(({ field, label }, idx) => (
                                        <div
                                            key={field}
                                            className={`flex flex-col sm:flex-row sm:items-center p-5 ${idx < 8 ? 'border-b border-stone-100' : ''} gap-2 sm:gap-0`}
                                        >
                                            <div className="w-48 text-[11px] font-black tracking-widest text-stone-400 uppercase">{label}</div>
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    value={schoolData[field]}
                                                    onChange={(e) => setSchoolData(prev => ({ ...prev, [field]: e.target.value }))}
                                                    className="w-full max-w-md px-3 py-2 rounded-lg border border-stone-200 text-[13px] font-bold text-stone-800 focus:outline-none focus:border-[#FF9933] focus:ring-2 focus:ring-orange-500/20"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-5 border-t border-stone-100">
                                    <button
                                        onClick={handleSaveSchool}
                                        className="px-6 py-2.5 rounded-lg text-[13px] font-black tracking-wide bg-[#FF9933] text-white hover:bg-[#e8841f] transition-colors flex items-center gap-2"
                                    >
                                        <Save size={16} /> Save Changes
                                    </button>
                                </div>
                            </div>

                            {/* Preview Card */}
                            <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden flex flex-col">
                                <div className="p-5 flex items-center gap-4 border-b border-stone-100">
                                    <div className="w-10 h-10 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center flex-shrink-0">
                                        <LayoutTemplate size={18} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-stone-900">Preview - ID Card / PDF Header</h2>
                                        <p className="text-[11px] font-bold text-stone-500 mt-0.5 leading-snug">Live preview of how your school branding appears</p>
                                    </div>
                                </div>
                                <div className="p-5 flex-1 flex items-center justify-center bg-stone-50/50">
                                    <PreviewCard />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* === BRANDING TAB === */}
                    {activeTab === 'Branding' && (
                        <div className="space-y-4">
                            {brandingMsg.text && <MsgBanner msgState={brandingMsg} />}

                            <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                                <div className="p-5 flex items-center gap-4 border-b border-stone-100">
                                    <div className="w-10 h-10 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center flex-shrink-0">
                                        <Palette size={18} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-stone-900">Branding</h2>
                                        <p className="text-[12px] font-bold text-stone-500">Customize your school brand appearance</p>
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    {/* Logo */}
                                    <div className="flex flex-col sm:flex-row sm:items-center p-5 border-b border-stone-100 gap-4 sm:gap-0">
                                        <div className="w-48 text-[11px] font-black tracking-widest text-stone-400 uppercase">Logo</div>
                                        <div className="flex-1 flex items-center gap-4">
                                            {branding.logoUrl ? (
                                                <div className="relative">
                                                    <img src={branding.logoUrl} alt="School logo preview" className="h-12 w-auto object-contain rounded-lg border border-stone-200" />
                                                    <button
                                                        onClick={() => setBranding(prev => ({ ...prev, logoUrl: '', logoFileName: '' }))}
                                                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-bold"
                                                    >×</button>
                                                </div>
                                            ) : (
                                                <div className="w-12 h-12 rounded-lg bg-stone-100 border border-dashed border-stone-300 flex items-center justify-center text-stone-400">
                                                    <Upload size={18} />
                                                </div>
                                            )}
                                            <label className="cursor-pointer">
                                                <span className="inline-flex items-center gap-2 px-4 py-2 border border-stone-200 rounded-lg text-[12px] font-bold text-stone-600 bg-white hover:bg-stone-50 shadow-sm transition-colors">
                                                    <Upload size={14} /> {branding.logoUrl ? 'Change Logo' : 'Upload Logo'}
                                                </span>
                                                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                                            </label>
                                            {branding.logoFileName && (
                                                <span className="text-[11px] font-bold text-stone-400">{branding.logoFileName}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Primary Color */}
                                    <div className="flex flex-col sm:flex-row sm:items-center p-5 gap-4 sm:gap-0">
                                        <div className="w-48 text-[11px] font-black tracking-widest text-stone-400 uppercase">Primary Color</div>
                                        <div className="flex-1 flex items-center gap-4">
                                            <input
                                                type="color"
                                                value={branding.primaryColor}
                                                onChange={(e) => setBranding(prev => ({ ...prev, primaryColor: e.target.value }))}
                                                className="w-10 h-10 rounded-lg border border-stone-200 cursor-pointer p-0.5"
                                            />
                                            <span className="text-[13px] font-bold text-stone-600 font-mono">{branding.primaryColor}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 border-t border-stone-100 flex items-center gap-3">
                                    <button
                                        onClick={handleSaveBranding}
                                        className="px-6 py-2.5 rounded-lg text-[13px] font-black tracking-wide bg-[#FF9933] text-white hover:bg-[#e8841f] transition-colors flex items-center gap-2"
                                    >
                                        <Save size={16} /> Save Branding
                                    </button>
                                    <button
                                        onClick={() => {
                                            setBranding({ primaryColor: '#FF9933', logoUrl: '', logoFileName: '' });
                                            localStorage.removeItem('schoolBranding');
                                            setBrandingMsg({ type: 'success', text: 'Branding reset to default.' });
                                            setTimeout(() => setBrandingMsg({ type: '', text: '' }), 3000);
                                        }}
                                        className="px-4 py-2.5 rounded-lg text-[13px] font-bold text-stone-500 hover:bg-stone-100 transition-colors flex items-center gap-1"
                                    >
                                        <RotateCcw size={14} /> Reset
                                    </button>
                                </div>
                            </div>

                            {/* Brand Preview */}
                            <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden flex flex-col">
                                <div className="p-5 flex items-center gap-4 border-b border-stone-100">
                                    <div className="w-10 h-10 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center flex-shrink-0">
                                        <LayoutTemplate size={18} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-stone-900">Brand Preview</h2>
                                        <p className="text-[11px] font-bold text-stone-500 mt-0.5 leading-snug">See how your brand colors and logo appear</p>
                                    </div>
                                </div>
                                <div className="p-5 flex-1 flex items-center justify-center bg-stone-50/50">
                                    <PreviewCard />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* === ACADEMIC YEARS TAB === */}
                    {activeTab === 'Academic Years' && <AcademicYearsSection />}

                    {/* === CLASS MEDIUMS TAB === */}
                    {activeTab === 'Class Mediums' && <SectionClassMediums />}

                    {/* === DEPARTMENTS TAB === */}
                    {activeTab === 'Departments' && <SectionDepartments />}

                    {/* === MANAGE ROLES TAB === */}
                    {activeTab === 'Manage Roles' && <SectionRoles />}

                    {/* === ATTENDANCE & SCHEDULE TAB === */}
                    {activeTab === 'Attendance & Schedule' && <SectionAttendance />}

                    {/* === SALARY GRADES TAB === */}
                    {activeTab === 'Salary Grades' && <SectionSalaryGrades />}

                    {/* === SALARY STRUCTURES TAB === */}
                    {activeTab === 'Salary Structures' && <SectionSalaryStructures />}

                    {/* === FEE CATEGORIES TAB === */}
                    {activeTab === 'Fee Categories' && <SectionFeeCategories />}

                    {/* === SUBJECTS TAB === */}
                    {activeTab === 'Subjects' && <SectionSubjects />}

                    {/* === TIMETABLE PERIODS TAB === */}
                    {activeTab === 'Timetable Periods' && <SectionTimetablePeriods />}

                </div>
            </div>
        </div>
    );
}
