"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  User, Camera, Save, Lock, ChevronDown, ChevronUp,
  Loader2, CheckCircle, AlertCircle
} from "lucide-react";

export default function StaffSettingsProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState({
    name: "", email: "", schoolId: "", department: "", designation: "",
    employmentType: "", dateOfJoining: null,
    phone: "", gender: "", dateOfBirth: null, bloodGroup: "",
    address: "", nationality: "", religion: "", photoUrl: ""
  });
  const [editing, setEditing] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [passwordExpanded, setPasswordExpanded] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordMsg, setPasswordMsg] = useState({ type: "", text: "" });
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/staff/profile", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to load profile");
        const data = await res.json();
        if (data.success) {
          setProfile(data.data);
          setEditing({
            name: data.data.name || "",
            phone: data.data.phone || "",
            gender: data.data.gender || "",
            dateOfBirth: data.data.dateOfBirth || "",
            bloodGroup: data.data.bloodGroup || "",
            address: data.data.address || "",
            nationality: data.data.nationality || "",
            religion: data.data.religion || ""
          });
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    })();
  }, []);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 4000);
  };

  const handleSave = async () => {
    if (!editing.name.trim()) { showMsg("error", "Name is required"); return; }
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/staff/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(editing)
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to save");
      setProfile(prev => ({ ...prev, ...data.data }));
      showMsg("success", "Profile saved successfully!");
    } catch (err) {
      showMsg("error", err.message);
    }
    setSaving(false);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { showMsg("error", "Only image files are allowed"); return; }
    if (file.size > 2 * 1024 * 1024) { showMsg("error", "File must be under 2MB"); return; }
    setUploading(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("photo", file);
      const res = await fetch("/api/staff/profile/photo", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Upload failed");
      setProfile(prev => ({ ...prev, photoUrl: data.data.photoUrl }));
      showMsg("success", "Photo uploaded successfully!");
    } catch (err) {
      showMsg("error", err.message);
    }
    setUploading(false);
  };

  const handleChangePassword = async () => {
    setPasswordMsg({ type: "", text: "" });
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordMsg({ type: "error", text: "All fields are required" });
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordMsg({ type: "error", text: "New password must be at least 8 characters" });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMsg({ type: "error", text: "Passwords do not match" });
      return;
    }
    setPasswordSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/student/profile/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });
      if (res.ok) {
        setPasswordMsg({ type: "success", text: "Password changed successfully!" });
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        const err = await res.json().catch(() => ({}));
        setPasswordMsg({ type: "error", text: err.message || "Failed to change password" });
      }
    } catch {
      setPasswordMsg({ type: "error", text: "Network error" });
    }
    setPasswordSaving(false);
  };

  const MsgBanner = ({ state }) => {
    if (!state.text) return null;
    const bgColor = state.type === "success"
      ? "bg-green-50 border-green-200 text-green-700"
      : "bg-red-50 border-red-200 text-red-700";
    const Icon = state.type === "success" ? CheckCircle : AlertCircle;
    return (
      <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${state.type === "success" ? "border-green-200" : "border-red-200"} text-[13px] font-bold ${bgColor}`}>
        <Icon size={16} /> {state.text}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
        <div className="flex items-center justify-center py-12 text-sm text-stone-400">
          <Loader2 size={16} className="animate-spin mr-2" /> Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-stone-900 tracking-tight">Settings</h1>
        <p className="text-[13px] font-bold text-stone-500 mt-1">Manage your profile and account settings</p>
      </div>

      {msg.text && <MsgBanner state={msg} />}

      {/* ===== Profile Photo ===== */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-stone-100 border-2 border-stone-200 overflow-hidden flex items-center justify-center">
            {profile.photoUrl ? (
              <img src={profile.photoUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={36} className="text-stone-400" />
            )}
          </div>
          {uploading && (
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
              <Loader2 size={20} className="animate-spin text-white" />
            </div>
          )}
        </div>
        <div className="text-center sm:text-left">
          <p className="text-sm font-bold text-stone-800">{profile.name}</p>
          <p className="text-xs text-stone-500">{profile.email}</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="mt-3 px-4 py-2 rounded-lg text-xs font-bold bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 transition-colors flex items-center gap-1.5 mx-auto sm:mx-0"
          >
            <Camera size={14} /> {profile.photoUrl ? "Change Photo" : "Upload Photo"}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
        </div>
      </div>

      {/* ===== Personal Information ===== */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-stone-100">
          <h2 className="text-base font-bold text-stone-900">Personal Information</h2>
        </div>
        <div className="divide-y divide-stone-100">
          {[
            { key: "name", label: "Full Name", type: "text" },
            { key: "email", label: "Email", type: "readonly" },
            { key: "phone", label: "Phone", type: "text" },
            { key: "gender", label: "Gender", type: "select", options: ["", "Male", "Female", "Other"] },
            { key: "dateOfBirth", label: "Date of Birth", type: "date" },
            { key: "bloodGroup", label: "Blood Group", type: "select", options: ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] },
            { key: "address", label: "Address", type: "text" },
            { key: "nationality", label: "Nationality", type: "text" },
            { key: "religion", label: "Religion", type: "text" },
          ].map((field, idx) => (
            <div key={field.key} className="flex flex-col sm:flex-row sm:items-center p-4 sm:p-5 gap-2 sm:gap-0">
              <div className="w-44 text-[11px] font-black tracking-widest text-stone-400 uppercase flex-shrink-0">{field.label}</div>
              <div className="flex-1">
                {field.type === "readonly" ? (
                  <span className="text-[13px] font-bold text-stone-500">{profile[field.key] || "\u2014"}</span>
                ) : field.type === "select" ? (
                  <select
                    value={editing[field.key] || ""}
                    onChange={(e) => setEditing(prev => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full max-w-md px-3 py-2 rounded-lg border border-stone-200 text-[13px] font-bold text-stone-800 focus:outline-none focus:border-[#FF9933] focus:ring-2 focus:ring-orange-500/20 bg-white"
                  >
                    {field.options.map(o => (
                      <option key={o} value={o}>{o || "Select " + field.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    value={editing[field.key] || ""}
                    onChange={(e) => setEditing(prev => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full max-w-md px-3 py-2 rounded-lg border border-stone-200 text-[13px] font-bold text-stone-800 focus:outline-none focus:border-[#FF9933] focus:ring-2 focus:ring-orange-500/20"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="p-5 border-t border-stone-100">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-lg text-[13px] font-black tracking-wide bg-[#FF9933] text-white hover:bg-[#e8841f] transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Profile
          </button>
        </div>
      </div>

      {/* ===== Employment Details (read-only) ===== */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-stone-100">
          <h2 className="text-base font-bold text-stone-900">Employment Details</h2>
        </div>
        <div className="divide-y divide-stone-100">
          {[
            { key: "schoolId", label: "Staff ID" },
            { key: "department", label: "Department" },
            { key: "designation", label: "Designation" },
            { key: "employmentType", label: "Employment Type" },
            { key: "dateOfJoining", label: "Date of Joining", format: (v) => v ? new Date(v).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "\u2014" },
          ].map((field) => (
            <div key={field.key} className="flex flex-col sm:flex-row sm:items-center p-4 sm:p-5 gap-2 sm:gap-0">
              <div className="w-44 text-[11px] font-black tracking-widest text-stone-400 uppercase flex-shrink-0">{field.label}</div>
              <div className="flex-1">
                <span className="text-[13px] font-bold text-stone-800">
                  {field.format ? field.format(profile[field.key]) : (profile[field.key] || "\u2014")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== Change Password ===== */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div
          className="p-5 flex items-center justify-between cursor-pointer hover:bg-stone-50/50"
          onClick={() => setPasswordExpanded(!passwordExpanded)}
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center">
              <Lock size={18} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">Change Password</h2>
              <p className="text-[12px] font-bold text-stone-500">Update your account password</p>
            </div>
          </div>
          {passwordExpanded ? <ChevronUp size={18} className="text-stone-400" /> : <ChevronDown size={18} className="text-stone-400" />}
        </div>

        {passwordExpanded && (
          <div className="px-5 pb-5 pt-2">
            {passwordMsg.text && <MsgBanner state={passwordMsg} />}
            <div className="border-t border-stone-100 pt-5 space-y-5">
              {[
                { key: "currentPassword", label: "Current Password", placeholder: "Enter current password" },
                { key: "newPassword", label: "New Password", placeholder: "Minimum 8 characters" },
                { key: "confirmPassword", label: "Confirm New Password", placeholder: "Re-enter new password" },
              ].map((field) => (
                <div key={field.key} className="flex flex-col gap-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-stone-400">{field.label}</label>
                  <input
                    type="password"
                    placeholder={field.placeholder}
                    value={passwordForm[field.key]}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full sm:w-2/3 px-4 py-2.5 rounded-xl border border-stone-200 text-sm font-bold text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#FF9933] focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              ))}
              <button
                onClick={handleChangePassword}
                disabled={passwordSaving}
                className="px-6 py-2.5 rounded-lg text-[13px] font-black tracking-wide bg-[#FCDDBB] text-stone-600 hover:bg-[#FBCE9A] transition-colors disabled:opacity-50"
              >
                {passwordSaving ? <Loader2 size={16} className="animate-spin inline mr-2" /> : null}
                UPDATE PASSWORD
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
