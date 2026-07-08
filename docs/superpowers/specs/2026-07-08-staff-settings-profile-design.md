# Staff Settings / Profile Page

## Overview
A dedicated staff profile and settings page at `/dashboard/settings/profile` matching the functionality of `https://demo.kedarkul.com/staff/settings/profile`.

## URL
`/dashboard/settings/profile` — new Next.js App Router page file at `frontend/src/app/dashboard/settings/profile/page.jsx`

## Layout
- Max width content area (similar to other dashboard pages: `max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8`)
- Header section: "Settings" title with subtitle "Manage your profile and account settings"
- Three card sections stacked vertically

## Sections

### 1. Profile Photo
- Circular avatar (120px) showing current photo or initials fallback
- Upload button below avatar
- File input accepts image/*, client-side preview
- Upload sends to `POST /api/staff/profile/photo` (multipart/form-data)

### 2. Personal Information
Card with fields:
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Name | text input | Yes | |
| Email | text (read-only) | - | Grayed out, shows current email |
| Phone | text input | No | |
| Gender | select | No | Male / Female / Other |
| Date of Birth | date input | No | |
| Blood Group | select | No | A+ / A- / B+ / B- / AB+ / AB- / O+ / O- |
| Address | text input | No | |
| Nationality | text input | No | |
| Religion | text input | No | |

Save button at bottom of card.

### 3. Employment Details (read-only)
Card showing:
- Staff ID (schoolId)
- Department
- Designation
- Employment Type
- Date of Joining

No edit capability — displayed as plain text with labels.

### 4. Change Password
Expandable/collapsible card with:
- Current Password (password input)
- New Password (password input, min 8 chars)
- Confirm New Password (password input)
- "Update Password" button

Toast-style success/error messages.

## Backend Changes

### Enhanced `GET /api/staff/profile`
Return all user fields plus profile sub-document:
```json
{
  "success": true,
  "data": {
    "name": "",
    "email": "",
    "schoolId": "",
    "department": "",
    "designation": "",
    "employmentType": "",
    "dateOfJoining": "",
    "phone": "",
    "gender": "",
    "dateOfBirth": "",
    "bloodGroup": "",
    "address": "",
    "nationality": "",
    "religion": "",
    "photoUrl": ""
  }
}
```

### Enhanced `PUT /api/staff/profile`
Accept all editable fields (name, phone, gender, dateOfBirth, bloodGroup, address, nationality, religion).

### New `POST /api/staff/profile/photo`
- Accept multipart upload of image file
- Validate file type (image/*) and size (max 2MB)
- Save to `/uploads/staff-profiles/` directory
- Update user's `profile.photoUrl` with the path
- Return `{ success: true, data: { photoUrl: "/uploads/staff-profiles/filename.jpg" } }`

### Remove `staffOnly` middleware from profile routes
Staff profile routes should be accessible by any authenticated user (admin viewing own profile too).

## Data Flow
1. Page loads → fetch `GET /api/staff/profile` → populate form fields
2. User edits fields → clicks "Save" → `PUT /api/staff/profile` with changed fields
3. User uploads photo → `POST /api/staff/profile/photo` → update avatar display
4. User expands password section → fills form → "Update Password" → calls existing password change endpoint
5. Success/error messages shown via inline banner

## Error Handling
- Network errors: "Network error. Could not save profile."
- Validation errors: Show server message directly
- Photo upload: Validate file type and size client-side before upload

## Files Changed
### New
- `frontend/src/app/dashboard/settings/profile/page.jsx` — main page component
- `backend/uploads/staff-profiles/` — directory for uploaded photos

### Modified
- `backend/routes/staffRoutes.js` — enhance GET and PUT profile endpoints, add POST photo endpoint
- `frontend/src/app/dashboard/layout.jsx` — add sidebar link to `/dashboard/settings/profile` (or keep using `/dashboard/settings`)
