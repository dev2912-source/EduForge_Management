'use client';
import { 
  User, 
  FileText, 
  Copy, 
  ShieldCheck, 
  BookOpen, 
  Users, 
  Lock, 
  ChevronDown,
  Eye,
  EyeOff
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isPasswordExpanded, setIsPasswordExpanded] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/student/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return setPasswordMsg({ type: 'error', text: 'New passwords do not match' });
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/student/profile/password`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordMsg({ type: 'success', text: 'Password updated successfully' });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setPasswordMsg({ type: 'error', text: data.message || 'Error updating password' });
      }
    } catch (err) {
      setPasswordMsg({ type: 'error', text: 'Server error' });
    }
  };

  if (loading) {
    return <div className="h-full flex items-center justify-center bg-[#FAFAFA]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F97316]"></div></div>;
  }

  const p = profile?.profile || {};

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 overflow-y-auto bg-[#FAFAFA]">
      <div className="flex flex-col lg:flex-row gap-4 items-start w-full max-w-6xl mx-auto">
        
        {/* Settings Navigation Sidebar */}
        <nav className="w-full lg:w-52 flex-shrink-0 bg-white rounded-2xl border border-stone-200 shadow-sm p-2 space-y-0.5">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold transition-all text-left ${
              activeTab === 'profile' 
                ? 'bg-[#F97316] text-white shadow-sm' 
                : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800'
            }`}
          >
            <User className="w-4 h-4 flex-shrink-0" strokeWidth={2.5} />
            My Profile
          </button>
          <button 
            onClick={() => setActiveTab('documents')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold transition-all text-left ${
              activeTab === 'documents' 
                ? 'bg-[#F97316] text-white shadow-sm' 
                : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800'
            }`}
          >
            <FileText className="w-4 h-4 flex-shrink-0" strokeWidth={2.5} />
            Documents
          </button>
        </nav>

        {/* Content Area */}
        <div className="flex-1 min-w-0 w-full">
          <div className="max-w-3xl space-y-4">
            
            {activeTab === 'profile' && (
              <>
                {/* Header */}
                <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-5 bg-[#F97316] rounded-full"></div>
                    <h1 className="text-xl font-bold text-stone-900 tracking-tight">
                      My Profile
                    </h1>
                  </div>
                  <p className="text-sm text-stone-500 font-medium ml-3.5 mt-0.5">
                    Manage your details and account password
                  </p>
                </div>

                {/* Main Profile Card */}
                <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
                  <div className="flex flex-col sm:flex-row items-start gap-5">
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black text-white flex-shrink-0 shadow-sm bg-gradient-to-br from-[#F97316] to-[#ea580c]">
                      SB
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <h2 className="text-xl font-black text-stone-900 tracking-tight leading-tight">
                        {profile?.name || 'Loading...'}
                      </h2>
                      <p className="text-xs font-mono font-bold mt-0.5 text-[#ea580c]">
                        {profile?.schoolId || '---'}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-2.5">
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-stone-100 text-stone-600">
                          <BookOpen className="w-3 h-3" />
                          {p.className || '-'} – {p.section || '-'}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-teal-50 text-teal-700">
                          English
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">
                          <ShieldCheck className="w-3 h-3" />
                          {p.academicYear || '-'}
                        </span>
                        <span className="bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
                          {p.status || 'active'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="mt-5 pt-5 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="group">
                      <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">
                        Phone
                      </p>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-stone-800">
                          {p.phone || '-'}
                        </p>
                        <button className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-stone-100 text-stone-400 hover:text-stone-600">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="group">
                      <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">
                        Email
                      </p>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-stone-800 truncate">
                          {profile?.email || '-'}
                        </p>
                        <button className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-stone-100 text-stone-400 hover:text-stone-600 flex-shrink-0">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-stone-100 flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-orange-50">
                      <User className="w-4 h-4 text-[#F97316]" />
                    </div>
                    <h3 className="text-sm font-black text-stone-800">
                      Personal Information
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-stone-100">
                    <div className="px-5 py-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-0.5">
                        Date of Birth
                      </p>
                      <p className="text-sm font-semibold text-stone-800">
                        {p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      </p>
                    </div>
                    <div className="px-5 py-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-0.5">
                        Gender
                      </p>
                      <p className="text-sm font-semibold text-stone-800">
                        {p.gender || '-'}
                      </p>
                    </div>
                    <div className="px-5 py-4 border-t border-stone-100">
                      <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-0.5">
                        Blood Group
                      </p>
                      <p className="text-sm font-semibold text-stone-800">
                        {p.bloodGroup || '-'}
                      </p>
                    </div>
                    <div className="px-5 py-4 border-t border-stone-100">
                      <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-0.5">
                        Admission Date
                      </p>
                      <p className="text-sm font-semibold text-stone-800">
                        {p.admissionDate ? new Date(p.admissionDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      </p>
                    </div>
                    <div className="px-5 py-4 sm:col-span-2 border-t border-stone-100">
                      <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-0.5">
                        Address
                      </p>
                      <p className="text-sm font-semibold text-stone-800">
                        {p.address || '-'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Parent / Guardian */}
                <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-stone-100 flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-stone-100">
                      <Users className="w-4 h-4 text-stone-500" />
                    </div>
                    <h3 className="text-sm font-black text-stone-800">
                      Parent / Guardian
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-stone-100">
                    <div className="px-5 py-5 space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#F97316]">
                        Father
                      </p>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-0.5">
                          Name
                        </p>
                        <p className="text-sm font-semibold text-stone-800">
                          {p.parentDetails?.fatherName || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-0.5">
                          Phone
                        </p>
                        <p className="text-sm font-semibold text-stone-800">
                          {p.parentDetails?.fatherPhone || '-'}
                        </p>
                      </div>
                    </div>
                    <div className="px-5 py-5 space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#F97316]">
                        Mother
                      </p>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-0.5">
                          Name
                        </p>
                        <p className="text-sm font-semibold text-stone-800">
                          {p.parentDetails?.motherName || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-0.5">
                          Phone
                        </p>
                        <p className="text-sm font-semibold text-stone-800">
                          {p.parentDetails?.motherPhone || '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Change Password */}
                <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                  <button 
                    onClick={() => setIsPasswordExpanded(!isPasswordExpanded)}
                    className="w-full px-5 py-4 flex items-center justify-between hover:bg-stone-50/80 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-stone-100">
                        <Lock className="w-4 h-4 text-stone-500" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-black text-stone-800">
                          Change Password
                        </p>
                        <p className="text-[10px] font-bold text-stone-400 mt-0.5">
                          Update your account password
                        </p>
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform ${isPasswordExpanded ? 'rotate-180' : ''}`} strokeWidth={2.5} />
                  </button>
                  
                  {isPasswordExpanded && (
                    <form onSubmit={handlePasswordSubmit} className="px-5 pb-5 pt-2 border-t border-stone-100">
                      {passwordMsg.text && (
                        <div className={`p-3 rounded-lg mb-4 text-xs font-bold ${passwordMsg.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                          {passwordMsg.text}
                        </div>
                      )}
                      <div className="flex flex-col gap-4 mt-2">
                        {/* Current Password */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-stone-700 uppercase tracking-wide">
                            Current Password
                          </label>
                          <div className="relative">
                            <input 
                              type={showPassword.current ? "text" : "password"} 
                              value={passwordForm.currentPassword}
                              onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                              required
                              className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]"
                              placeholder="Enter current password"
                            />
                            <button 
                              type="button"
                              onClick={() => setShowPassword({...showPassword, current: !showPassword.current})}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                            >
                              {showPassword.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        
                        {/* New Password */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-stone-700 uppercase tracking-wide">
                            New Password
                          </label>
                          <div className="relative">
                            <input 
                              type={showPassword.new ? "text" : "password"} 
                              value={passwordForm.newPassword}
                              onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                              required
                              className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]"
                              placeholder="Enter new password"
                            />
                            <button 
                              type="button"
                              onClick={() => setShowPassword({...showPassword, new: !showPassword.new})}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                            >
                              {showPassword.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Confirm New Password */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-stone-700 uppercase tracking-wide">
                            Confirm New Password
                          </label>
                          <div className="relative">
                            <input 
                              type={showPassword.confirm ? "text" : "password"} 
                              value={passwordForm.confirmPassword}
                              onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                              required
                              className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]"
                              placeholder="Confirm new password"
                            />
                            <button 
                              type="button"
                              onClick={() => setShowPassword({...showPassword, confirm: !showPassword.confirm})}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                            >
                              {showPassword.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end mt-2">
                          <button type="submit" className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white text-sm font-bold rounded-lg transition-colors shadow-sm">
                            Update Password
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              </>
            )}

            {activeTab === 'documents' && (
              <>
                {/* Header */}
                <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-5 bg-[#F97316] rounded-full"></div>
                    <h1 className="text-xl font-bold text-stone-900 tracking-tight">
                      Documents
                    </h1>
                  </div>
                  <p className="text-sm text-stone-500 font-medium ml-3.5 mt-0.5">
                    Files and documents shared with the school
                  </p>
                </div>

                {/* Empty State */}
                <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-12 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center mb-4">
                    <FileText className="w-6 h-6 text-[#F97316]" />
                  </div>
                  <h3 className="text-sm font-black text-stone-800 mb-1">
                    No documents on file
                  </h3>
                  <p className="text-xs text-stone-500">
                    Documents uploaded by the school on your behalf will appear here.
                  </p>
                </div>
              </>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
