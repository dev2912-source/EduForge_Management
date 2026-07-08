"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2, ChevronLeft, ArrowLeft, Mail, Phone, Calendar, MapPin, Briefcase, Building, Clock, User, BadgeCheck } from 'lucide-react';

export default function StaffDetailPage() {
    const router = useRouter();
    const params = useParams();
    const [staff, setStaff] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`http://localhost:5000/api/admin/staff/${params.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Staff not found');
                const data = await res.json();
                if (!data.success) throw new Error(data.message || 'Staff not found');
                setStaff(data.data);
            } catch (err) {
                setError(err.message);
            }
            setLoading(false);
        })();
    }, [params.id]);

    if (loading) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
                <div className="flex items-center justify-center py-12 text-sm text-stone-400">
                    <Loader2 size={16} className="animate-spin mr-2" /> Loading...
                </div>
            </div>
        );
    }

    if (error || !staff) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
                <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-8 text-center">
                    <p className="text-sm font-semibold text-stone-500 mb-3">{error || 'Staff not found'}</p>
                    <button onClick={() => router.push('/dashboard/staff')} className="px-4 py-2 rounded-lg text-sm font-semibold bg-stone-900 text-white hover:opacity-90 transition-all">
                        Back to Staff Directory
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.push('/dashboard/staff')} className="p-1.5 rounded-lg hover:bg-stone-100 transition-colors text-stone-500">
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-base font-bold text-stone-900">{staff.firstName} {staff.lastName}</h1>
                        <p className="text-[10px] font-bold text-stone-400 font-mono tracking-wide">{staff.staffCode}</p>
                    </div>
                </div>
                <a
                    href={`/dashboard/staff/${staff.id}/edit`}
                    className="px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg bg-stone-900 text-white hover:bg-stone-800 transition-all shadow-sm"
                >
                    Edit Profile
                </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left: Photo + Status */}
                <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 flex flex-col items-center text-center">
                    <div className="w-24 h-24 rounded-full bg-stone-100 flex items-center justify-center mb-3 overflow-hidden">
                        {staff.profilePhotoUrl ? (
                            <img src={staff.profilePhotoUrl} className="w-full h-full object-cover" />
                        ) : (
                            <User size={36} className="text-stone-400" />
                        )}
                    </div>
                    <h2 className="text-sm font-black text-stone-800">{staff.firstName} {staff.lastName}</h2>
                    <p className="text-[10px] font-bold text-stone-400 font-mono tracking-wide mb-2">{staff.staffCode}</p>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        staff.isActive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'
                    }`}>
                        {staff.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                </div>

                {/* Right: Details */}
                <div className="md:col-span-2 space-y-4">
                    {/* Personal Info */}
                    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-3">
                        <h3 className="text-xs font-black text-stone-800 uppercase tracking-widest flex items-center gap-2 pb-2 border-b border-stone-100">
                            <User size={14} className="text-orange-500" /> Personal Information
                        </h3>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            {staff.email && (
                                <div className="flex items-center gap-2">
                                    <Mail size={12} className="text-stone-400 flex-shrink-0" />
                                    <span className="font-bold text-stone-600">{staff.email}</span>
                                </div>
                            )}
                            {staff.phone && (
                                <div className="flex items-center gap-2">
                                    <Phone size={12} className="text-stone-400 flex-shrink-0" />
                                    <span className="font-bold text-stone-600">{staff.phone}</span>
                                </div>
                            )}
                            {staff.gender && (
                                <div className="flex items-center gap-2">
                                    <User size={12} className="text-stone-400 flex-shrink-0" />
                                    <span className="font-bold text-stone-600">{staff.gender}</span>
                                </div>
                            )}
                            {staff.dateOfBirth && (
                                <div className="flex items-center gap-2">
                                    <Calendar size={12} className="text-stone-400 flex-shrink-0" />
                                    <span className="font-bold text-stone-600">{new Date(staff.dateOfBirth).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                </div>
                            )}
                            {staff.address && (
                                <div className="flex items-center gap-2 col-span-2">
                                    <MapPin size={12} className="text-stone-400 flex-shrink-0" />
                                    <span className="font-bold text-stone-600">{staff.address}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Professional Info */}
                    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-3">
                        <h3 className="text-xs font-black text-stone-800 uppercase tracking-widest flex items-center gap-2 pb-2 border-b border-stone-100">
                            <Briefcase size={14} className="text-orange-500" /> Professional Information
                        </h3>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            {staff.department && (
                                <div className="flex items-center gap-2">
                                    <Building size={12} className="text-stone-400 flex-shrink-0" />
                                    <span className="font-bold text-stone-600">{staff.department}</span>
                                </div>
                            )}
                            {staff.designation && (
                                <div className="flex items-center gap-2">
                                    <BadgeCheck size={12} className="text-stone-400 flex-shrink-0" />
                                    <span className="font-bold text-stone-600">{staff.designation}</span>
                                </div>
                            )}
                            {staff.employmentType && (
                                <div className="flex items-center gap-2">
                                    <Clock size={12} className="text-stone-400 flex-shrink-0" />
                                    <span className="font-bold text-stone-600 capitalize">{staff.employmentType}</span>
                                </div>
                            )}
                            {staff.dateOfJoining && (
                                <div className="flex items-center gap-2">
                                    <Calendar size={12} className="text-stone-400 flex-shrink-0" />
                                    <span className="font-bold text-stone-600">Joined {new Date(staff.dateOfJoining).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
