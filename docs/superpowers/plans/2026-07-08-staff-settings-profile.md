# Staff Settings / Profile Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a staff settings/profile page at `/dashboard/settings/profile` matching the demo.

**Architecture:** Enhance existing staff profile backend endpoints and create a new dedicated frontend page with profile photo, personal info, employment details, and change password sections.

**Tech Stack:** Next.js 16 App Router, Express.js, MongoDB/Mongoose, Multer (file upload)

---

### Task 1: Backend — Enhance GET /api/staff/profile

**Files:**
- Modify: `backend/routes/staffRoutes.js:669-679`

**Interfaces:**
- Consumes: none
- Produces: `GET /api/staff/profile` returns `{ success: true, data: { name, email, schoolId, department, designation, employmentType, dateOfJoining, phone, gender, dateOfBirth, bloodGroup, address, nationality, religion, photoUrl } }`

- [ ] **Step 1: Remove `staffOnly` middleware and enhance response mapping**

Replace the existing GET profile endpoint:

```
Route: 'GET /profile'
Old: protect, staffOnly
New: protect
```

Map the User document to a clean response object that includes both top-level fields (`name`, `email`, `schoolId`, `department`, `designation`, `employmentType`, `dateOfJoining`) and nested `profile.*` fields (`phone`, `gender`, `dateOfBirth`, `bloodGroup`, `address`, `nationality`, `religion`, `photoUrl`).

Edit `backend/routes/staffRoutes.js` lines 669-679:

Replace:
```js
// GET /api/staff/profile - Get own profile
router.get('/profile', protect, staffOnly, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});
```

With:
```js
// GET /api/staff/profile - Get own profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password').lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    const p = user.profile || {};
    res.json({
      success: true,
      data: {
        name: user.name || '',
        email: user.email || '',
        schoolId: user.schoolId || '',
        department: user.department || '',
        designation: user.designation || '',
        employmentType: user.employmentType || '',
        dateOfJoining: user.dateOfJoining || null,
        phone: p.phone || '',
        gender: p.gender || '',
        dateOfBirth: p.dateOfBirth || null,
        bloodGroup: p.bloodGroup || '',
        address: p.address || '',
        nationality: p.nationality || '',
        religion: p.religion || '',
        photoUrl: p.photoUrl || ''
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});
```

- [ ] **Step 2: Verify the endpoint compiles**

Run: `cd backend && node -e "require('./routes/staffRoutes')" 2>&1 || echo "OK"`
Expected: No errors (or "OK")

---

### Task 2: Backend — Enhance PUT /api/staff/profile

**Files:**
- Modify: `backend/routes/staffRoutes.js:818-834`

**Interfaces:**
- Consumes: none
- Produces: `PUT /api/staff/profile` accepts `{ name, phone, gender, dateOfBirth, bloodGroup, address, nationality, religion }` and updates the user

- [ ] **Step 1: Remove `staffOnly` middleware and add all editable fields**

Replace:
```js
// PUT /api/staff/profile - Update own profile
router.put('/profile', protect, staffOnly, async (req, res) => {
  try {
    const { phone, address, gender, dateOfBirth } = req.body;
    const updateData = {};
    if (phone) updateData['profile.phone'] = phone;
    if (address) updateData['profile.address'] = address;
    if (gender) updateData['profile.gender'] = gender;
    if (dateOfBirth) updateData['profile.dateOfBirth'] = dateOfBirth;

    const user = await User.findByIdAndUpdate(req.user._id, updateData, { new: true });
    res.json({ success: true, data: user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});
```

With:
```js
// PUT /api/staff/profile - Update own profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, gender, dateOfBirth, bloodGroup, address, nationality, religion } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData['profile.phone'] = phone;
    if (gender) updateData['profile.gender'] = gender;
    if (dateOfBirth) updateData['profile.dateOfBirth'] = dateOfBirth;
    if (bloodGroup) updateData['profile.bloodGroup'] = bloodGroup;
    if (address) updateData['profile.address'] = address;
    if (nationality) updateData['profile.nationality'] = nationality;
    if (religion) updateData['profile.religion'] = religion;

    const user = await User.findByIdAndUpdate(req.user._id, updateData, { new: true }).select('-password').lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    const p = user.profile || {};
    res.json({
      success: true,
      data: {
        name: user.name || '',
        email: user.email || '',
        schoolId: user.schoolId || '',
        department: user.department || '',
        designation: user.designation || '',
        employmentType: user.employmentType || '',
        dateOfJoining: user.dateOfJoining || null,
        phone: p.phone || '',
        gender: p.gender || '',
        dateOfBirth: p.dateOfBirth || null,
        bloodGroup: p.bloodGroup || '',
        address: p.address || '',
        nationality: p.nationality || '',
        religion: p.religion || '',
        photoUrl: p.photoUrl || ''
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});
```

- [ ] **Step 2: Verify compilation**

Run: `cd backend && node -e "require('./routes/staffRoutes')" 2>&1 || echo "OK"`
Expected: No errors (or "OK")

---

### Task 3: Backend — Add photo upload endpoint

**Files:**
- Modify: `backend/routes/staffRoutes.js` (add new route before PUT /profile)
- Use: `backend/uploads/staff-profiles/` directory
- Dependency: `multer` (check if installed, install if not)

**Interfaces:**
- Consumes: multipart form with `photo` field (image/*, max 2MB)
- Produces: `POST /api/staff/profile/photo` returns `{ success: true, data: { photoUrl: '/uploads/staff-profiles/filename.jpg' } }`

- [ ] **Step 1: Check if multer is installed**

Run: `cd backend && node -e "require('multer')" 2>&1`
If fails, install: `cd backend && npm install multer`

- [ ] **Step 2: Add multer config and upload endpoint**

Add these lines BEFORE the `// GET /api/staff/profile` line (around line 669):

```js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const staffProfileUploadDir = path.join(__dirname, '..', 'uploads', 'staff-profiles');
if (!fs.existsSync(staffProfileUploadDir)) {
  fs.mkdirSync(staffProfileUploadDir, { recursive: true });
}

const staffPhotoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, staffProfileUploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `staff-${req.user._id}-${Date.now()}${ext}`);
  }
});

const uploadStaffPhoto = multer({
  storage: staffPhotoStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'), false);
  }
});

// POST /api/staff/profile/photo - Upload profile photo
router.post('/profile/photo', protect, uploadStaffPhoto.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const photoUrl = `/uploads/staff-profiles/${req.file.filename}`;
    await User.findByIdAndUpdate(req.user._id, { 'profile.photoUrl': photoUrl });
    res.json({ success: true, data: { photoUrl } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Upload failed' });
  }
});
```

- [ ] **Step 3: Verify compilation**

Run: `cd backend && node -e "require('./routes/staffRoutes')" 2>&1 || echo "OK"`
Expected: No errors (or "OK")

---

### Task 4: Frontend — Create settings/profile page

**Files:**
- Create: `frontend/src/app/dashboard/settings/profile/page.jsx`

**Interfaces:**
- Consumes: `GET /api/staff/profile`, `PUT /api/staff/profile`, `POST /api/staff/profile/photo`, `PUT /api/student/profile/password`
- Produces: Staff settings page at `/dashboard/settings/profile`

- [ ] **Step 1: Create the page directory and file**

Create directory `frontend/src/app/dashboard/settings/profile/` and file `page.jsx`:

```jsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  User, Camera, Save, Lock, ChevronDown, ChevronUp,
  Loader2, CheckCircle, AlertCircle, X
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
    const colors = state.type === "success"
      ? "bg-green-50 border-green-200 text-green-700"
      : "bg-red-50 border-red-200 text-red-700";
    const Icon = state.type === "success" ? CheckCircle : AlertCircle;
    return (
      <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${colors} text-[13px] font-bold`}>
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
                  <span className="text-[13px] font-bold text-stone-500">{profile[field.key] || "—"}</span>
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
        <div className="p-5 border-t border-stone-100 flex items-center gap-3">
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
            { key: "dateOfJoining", label: "Date of Joining", format: (v) => v ? new Date(v).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—" },
          ].map((field) => (
            <div key={field.key} className="flex flex-col sm:flex-row sm:items-center p-4 sm:p-5 gap-2 sm:gap-0">
              <div className="w-44 text-[11px] font-black tracking-widest text-stone-400 uppercase flex-shrink-0">{field.label}</div>
              <div className="flex-1">
                <span className="text-[13px] font-bold text-stone-800">
                  {field.format ? field.format(profile[field.key]) : (profile[field.key] || "—")}
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
```

- [ ] **Step 2: Verify page loads without errors**

Run the frontend dev server and navigate to `/dashboard/settings/profile`. Check the browser console for errors.

---

### Task 5: Frontend — Update sidebar link for staff role

**Files:**
- Modify: `frontend/src/app/dashboard/layout.jsx`

- [ ] **Step 1: Change staff sidebar "Settings" link**

In the staff nav section (around line 168), change:
```js
{ name: "Settings", href: "/dashboard/settings", icon: Settings },
```
To:
```js
{ name: "Settings", href: "/dashboard/settings/profile", icon: Settings },
```

---

### Task 6: Restart and verify

- [ ] **Step 1: Restart backend**

Kill existing backend node process and restart:
```bash
cd backend && node server.js
```

- [ ] **Step 2: Verify all endpoints**

Test the three profile endpoints:
1. `GET /api/staff/profile` — should return all fields
2. `PUT /api/staff/profile` — should update and return new values
3. `POST /api/staff/profile/photo` — should upload and return photoUrl

- [ ] **Step 3: Test the full page flow**

1. Navigate to `/dashboard/settings/profile`
2. Profile form should be pre-populated
3. Edit a field and click "Save" — should show success
4. Upload a photo — should show new avatar
5. Change password — should show success
