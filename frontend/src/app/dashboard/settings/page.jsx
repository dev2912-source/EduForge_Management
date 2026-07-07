"use client";

import { useState, useEffect } from 'react';
import { User, Lock, ChevronDown, ChevronUp, Building2, Palette, Smartphone, LayoutTemplate, Upload, RotateCcw } from 'lucide-react';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('My Profile');
    const [isPasswordExpanded, setIsPasswordExpanded] = useState(false);
    const [userRole, setUserRole] = useState('student');
    const [profile, setProfile] = useState({ name: 'Loading...', email: 'Loading...', role: 'student' });
    
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch('/api/student/profile', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setProfile({ name: data.name || data.firstName + ' ' + data.lastName, email: data.email, role: data.role });
                    setUserRole(data.role);
                } else {
                    const userData = localStorage.getItem("user");
                    if (userData) {
                        const parsed = JSON.parse(userData);
                        setUserRole(parsed.role || "student");
                        setProfile({ name: parsed.name, email: parsed.email, role: parsed.role });
                    }
                }
            } catch (e) {
                console.error(e);
            }
        };
        fetchProfile();
    }, []);

    // Dummy / Brand Data for School Profile
    const [schoolData, setSchoolData] = useState({
        name: "ASTNIQ Academy",
        tagline: "Innovating Education for Tomorrow",
        address: "456 Learning Blvd, Tech District, Bangalore - 560001",
        phone: "+91 98765 43210",
        email: "admin@astniq.com",
        established: "2024",
        website: "www.astniq.com",
        code: "ASTNIQ",
        subdomain: "portal.astniq.com"
    });

    const adminTabs = [
        "My Profile",
        "School Profile",
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
                            {activeTab === 'My Profile' ? 'Manage your account details and password' : 'Manage system settings'}
                        </p>
                    </div>

                    {activeTab === 'My Profile' && (
                        <div className="space-y-4">
                            
                            {/* Account Details Card */}
                            <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                                <div className="p-5 flex items-center gap-4 border-b border-stone-100">
                                    <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center flex-shrink-0">
                                        <User size={18} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-stone-900">Account Details</h2>
                                        <p className="text-[12px] font-bold text-stone-500">Hover a field and click the pencil to edit</p>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col">
                                    {/* Profile Photo */}
                                    <div className="flex flex-col sm:flex-row sm:items-center p-5 border-b border-stone-100 group transition-colors hover:bg-stone-50/50 cursor-pointer gap-4 sm:gap-0">
                                        <div className="w-48 text-[11px] font-black tracking-widest text-stone-400 uppercase">
                                            Profile Photo
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-[#FF9933] rounded-lg text-white font-black flex items-center justify-center text-lg shadow-sm">
                                                DA
                                            </div>
                                            <span className="text-[13px] font-bold text-stone-500">
                                                Click photo to change • JPG, PNG, WebP
                                            </span>
                                        </div>
                                    </div>

                                    {/* Name */}
                                    <div className="flex flex-col sm:flex-row sm:items-center p-5 border-b border-stone-100 group transition-colors hover:bg-stone-50/50 cursor-pointer gap-2 sm:gap-0">
                                        <div className="w-48 text-[11px] font-black tracking-widest text-stone-400 uppercase">
                                            Name
                                        </div>
                                        <div className="flex-1 text-[13px] font-black text-stone-800">
                                            {profile.name}
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div className="flex flex-col sm:flex-row sm:items-center p-5 border-b border-stone-100 group transition-colors hover:bg-stone-50/50 cursor-pointer gap-2 sm:gap-0">
                                        <div className="w-48 text-[11px] font-black tracking-widest text-stone-400 uppercase">
                                            Email
                                        </div>
                                        <div className="flex-1 text-[13px] font-black text-stone-800">
                                            {profile.email}
                                        </div>
                                    </div>

                                    {/* Phone */}
                                    <div className="flex flex-col sm:flex-row sm:items-center p-5 group transition-colors hover:bg-stone-50/50 cursor-pointer gap-2 sm:gap-0">
                                        <div className="w-48 text-[11px] font-black tracking-widest text-stone-400 uppercase">
                                            Phone
                                        </div>
                                        <div className="flex-1 text-[13px] font-bold italic text-stone-400">
                                            Not set
                                        </div>
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
                                            <p className="text-[12px] font-bold text-stone-500">Update your admin account password</p>
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
                                        <div className="border-t border-stone-100 pt-6 space-y-6">
                                            <div className="flex flex-col gap-2.5">
                                                <label className="text-[11px] font-black uppercase tracking-widest text-stone-400">Current Password</label>
                                                <input 
                                                    type="password" 
                                                    placeholder="Enter current password" 
                                                    className="w-full sm:w-2/3 md:w-[60%] px-4 py-2.5 rounded-xl border border-stone-200 text-sm font-bold text-stone-800 placeholder-stone-400 focus:outline-none focus:border-orange focus:ring-2 focus:ring-orange/20"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2.5">
                                                <label className="text-[11px] font-black uppercase tracking-widest text-stone-400">New Password</label>
                                                <input 
                                                    type="password" 
                                                    placeholder="Minimum 8 characters" 
                                                    className="w-full sm:w-2/3 md:w-[60%] px-4 py-2.5 rounded-xl border border-stone-200 text-sm font-bold text-stone-800 placeholder-stone-400 focus:outline-none focus:border-orange focus:ring-2 focus:ring-orange/20"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2.5">
                                                <label className="text-[11px] font-black uppercase tracking-widest text-stone-400">Confirm New Password</label>
                                                <input 
                                                    type="password" 
                                                    placeholder="Re-enter new password" 
                                                    className="w-full sm:w-2/3 md:w-[60%] px-4 py-2.5 rounded-xl border border-stone-200 text-sm font-bold text-stone-800 placeholder-stone-400 focus:outline-none focus:border-orange focus:ring-2 focus:ring-orange/20"
                                                />
                                            </div>
                                            <div className="pt-2">
                                                <button className="px-6 py-3 rounded-lg text-[13px] font-black tracking-wide bg-[#FCDDBB] text-stone-600 hover:bg-[#FBCE9A] transition-colors">
                                                    UPDATE PASSWORD
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>
                    )}

                    {activeTab === 'School Profile' && (
                        <div className="space-y-4">
                            
                            {/* School Details Card */}
                            <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                                <div className="p-5 flex items-center gap-4 border-b border-stone-100">
                                    <div className="w-10 h-10 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center flex-shrink-0">
                                        <Building2 size={18} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-stone-900">School Details</h2>
                                        <p className="text-[12px] font-bold text-stone-500">Click the pencil icon next to any field to edit it</p>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col">
                                    <div className="flex flex-col sm:flex-row sm:items-center p-5 border-b border-stone-100 group transition-colors hover:bg-stone-50/50 cursor-pointer gap-2 sm:gap-0">
                                        <div className="w-48 text-[11px] font-black tracking-widest text-stone-400 uppercase">School Name</div>
                                        <div className="flex-1 text-[13px] font-black text-stone-800">{schoolData.name}</div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center p-5 border-b border-stone-100 group transition-colors hover:bg-stone-50/50 cursor-pointer gap-2 sm:gap-0">
                                        <div className="w-48 text-[11px] font-black tracking-widest text-stone-400 uppercase">Tagline / Motto</div>
                                        <div className="flex-1 text-[13px] font-bold text-stone-600">{schoolData.tagline}</div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center p-5 border-b border-stone-100 group transition-colors hover:bg-stone-50/50 cursor-pointer gap-2 sm:gap-0">
                                        <div className="w-48 text-[11px] font-black tracking-widest text-stone-400 uppercase">Full Address</div>
                                        <div className="flex-1 text-[13px] font-bold text-stone-600">{schoolData.address}</div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center p-5 border-b border-stone-100 group transition-colors hover:bg-stone-50/50 cursor-pointer gap-2 sm:gap-0">
                                        <div className="w-48 text-[11px] font-black tracking-widest text-stone-400 uppercase">Phone</div>
                                        <div className="flex-1 text-[13px] font-bold text-stone-600">{schoolData.phone}</div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center p-5 border-b border-stone-100 group transition-colors hover:bg-stone-50/50 cursor-pointer gap-2 sm:gap-0">
                                        <div className="w-48 text-[11px] font-black tracking-widest text-stone-400 uppercase">Email</div>
                                        <div className="flex-1 text-[13px] font-bold text-stone-600">{schoolData.email}</div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center p-5 border-b border-stone-100 group transition-colors hover:bg-stone-50/50 cursor-pointer gap-2 sm:gap-0">
                                        <div className="w-48 text-[11px] font-black tracking-widest text-stone-400 uppercase">Year Established</div>
                                        <div className="flex-1 text-[13px] font-bold text-stone-600">{schoolData.established}</div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center p-5 border-b border-stone-100 group transition-colors hover:bg-stone-50/50 cursor-pointer gap-2 sm:gap-0">
                                        <div className="w-48 text-[11px] font-black tracking-widest text-stone-400 uppercase">Website</div>
                                        <div className="flex-1 text-[13px] font-bold text-stone-600">{schoolData.website}</div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center p-5 group transition-colors hover:bg-stone-50/50 cursor-pointer gap-2 sm:gap-0">
                                        <div className="w-48 text-[11px] font-black tracking-widest text-stone-400 uppercase">Campus Login Code</div>
                                        <div className="flex-1 text-[13px] font-bold text-stone-600">{schoolData.code}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Branding Card */}
                            <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                                <div className="p-5 flex items-center gap-4 border-b border-stone-100">
                                    <div className="w-10 h-10 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center flex-shrink-0">
                                        <Palette size={18} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-stone-900">Branding</h2>
                                        <p className="text-[12px] font-bold text-stone-500">Subdomain, logo and brand color shown to your school's users</p>
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex flex-col sm:flex-row sm:items-center p-5 border-b border-stone-100 group transition-colors hover:bg-stone-50/50 cursor-pointer gap-2 sm:gap-0">
                                        <div className="w-48 text-[11px] font-black tracking-widest text-stone-400 uppercase">Subdomain</div>
                                        <div className="flex-1 text-[13px] font-bold text-stone-800">{schoolData.subdomain}</div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center p-5 border-b border-stone-100 group transition-colors hover:bg-stone-50/50 cursor-pointer gap-4 sm:gap-0">
                                        <div className="w-48 text-[11px] font-black tracking-widest text-stone-400 uppercase">Logo</div>
                                        <div className="flex-1">
                                            <button className="flex items-center gap-2 px-4 py-2 border border-stone-200 rounded-lg text-[12px] font-bold text-stone-600 bg-white hover:bg-stone-50 shadow-sm transition-colors">
                                                <Upload size={14} /> Upload Logo
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center p-5 group transition-colors hover:bg-stone-50/50 cursor-pointer gap-4 sm:gap-0">
                                        <div className="w-48 text-[11px] font-black tracking-widest text-stone-400 uppercase">Primary Color</div>
                                        <div className="flex-1 flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-full bg-[#FF9933] shadow-inner border border-black/10"></div>
                                            <div className="flex items-center gap-2">
                                                <button className="px-3 py-1.5 rounded-md text-[11px] font-black uppercase tracking-widest bg-stone-900 text-white hover:bg-stone-800 transition-colors">Save</button>
                                                <button className="px-3 py-1.5 rounded-md text-[11px] font-black uppercase tracking-widest text-stone-500 hover:bg-stone-100 transition-colors flex items-center gap-1"><RotateCcw size={12} /> Reset</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Branded App & Preview Cards Layout */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                
                                {/* Branded App */}
                                <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden flex flex-col">
                                    <div className="p-5 flex items-center gap-4 border-b border-stone-100">
                                        <div className="w-10 h-10 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center flex-shrink-0">
                                            <Smartphone size={18} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <h2 className="text-base font-bold text-stone-900">Branded App</h2>
                                            <p className="text-[11px] font-bold text-stone-500 mt-0.5 leading-snug">Build an Android app with your school's name, icon and package - students never see "{schoolData.name}"</p>
                                        </div>
                                    </div>
                                    <div className="p-5 flex-1 flex flex-col justify-center gap-3 bg-red-50/50">
                                        <p className="text-[13px] font-bold text-red-700">Build failed (run 27700354988). Check the GitHub Actions log for details.</p>
                                        <div>
                                            <button className="px-4 py-2 rounded-lg text-[12px] font-bold bg-white border border-red-200 text-red-600 hover:bg-red-50 transition-colors shadow-sm">Try again</button>
                                        </div>
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
                                        </div>
                                    </div>
                                    <div className="p-5 flex-1 flex items-center justify-center bg-stone-50/50">
                                        <div className="bg-white border border-stone-200 shadow-sm p-4 rounded-xl w-full max-w-sm text-center">
                                            <h3 className="text-[15px] font-black text-stone-900 uppercase tracking-wide text-[#FF9933]">{schoolData.name}</h3>
                                            <p className="text-[10px] font-medium text-stone-500 mt-1 mb-2 max-w-[200px] mx-auto leading-tight">{schoolData.address}</p>
                                            <p className="text-[9px] font-bold text-stone-400 tracking-wider">Est. {schoolData.established} | {schoolData.phone} | {schoolData.email}</p>
                                            <div className="h-px bg-stone-200 w-full my-2"></div>
                                            <p className="text-[10px] font-black text-stone-600 italic">{schoolData.tagline}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
