# Admin Student Directory + Detail Page

## Scope
Match demo.kedarkul.com/admin/students exactly:
1. Student list page (directory) with full interactive features
2. Student detail page (click row) with tabs

## Student List Page (`/dashboard/students`)

### Header
- "Student Directory" title + "X students enrolled" count
- "Import" button (CSV upload)
- "Admit Student" button → 3-step modal

### Toolbar Filters
- Search (debounced 350ms, searches name/ID)
- Class dropdown (dynamic from API)
- Section dropdown (depends on selected class)
- Status dropdown (All/Active/Inactive/Graduated)
- Gender dropdown (All/Male/Female/Other)
- "Filters" toggle button → shows filter panel with all above
- Active filter chips (show active filters, X to clear each)
- Export button → CSV/Excel

### Table
- Sortable columns (click header to sort asc/desc, arrow indicator)
- Columns: Full Name, Enrollment ID, Gender, DOB/Age, Class+Section+Medium, Status, Created At, Updated At
- Responsive: Gender hidden on sm, DOB hidden on md, Created/Updated hidden on lg
- Class cell: name + section badge + medium badge
- Click row → navigate to `/dashboard/students/[id]`
- Checkbox column: Select All (header), per-row select, "X selected" counter, bulk delete button

### Pagination
- Per-page selector: 10/25/50/100 (saved in localStorage)
- Prev/Next buttons + page number
- Range display: "1–10 of 91"

### Add/Edit Modal (3-step wizard)
- **Step 1 — Personal Details**: Name*, Email, Phone, DOB, Gender, Blood Group, Address
- **Step 2 — Academic Details**: Class*, Section, Admission Date, Status (active/inactive)
- **Step 3 — Parent Details**: Father Name, Father Phone, Mother Name, Mother Phone
- Step progress indicator, Back/Continue buttons, validation per step
- On save: refresh list, show success toast

### Delete
- Single delete: confirmation modal
- Bulk delete: confirmation with count
- Soft delete (moves to trash)

### Export
- CSV: ID, Name, Gender, Class, Section, Status, Phone, Email
- Excel: same fields, tab-separated .xls

## Student Detail Page (`/dashboard/students/[id]`)

### Header
- Back button → `/dashboard/students`
- Avatar (initials) + full name + status badge + school ID
- Action buttons: Edit Profile → opens edit modal, Delete Student

### Tab 1 — Overview
- **Academic Info card**: Class, Section, Medium, Academic Year, Admission Date
- **Personal Details**: Gender, Blood Group, DOB, Address
- **Parent Info**: Father name/phone, Mother name/phone
- **Contact**: Email, Phone
- **Account Portal**: School ID, Last Login

### Tab 2 — Academic History
- Table: Session (academic year), Placement (class + section), Outcome (badge), Date, Remarks
- Search + filter by outcome

### Tab 3 — Finances
- **Invoices**: Invoice#, Amount, Due Date, Status (badge)
- **Payments**: Receipt#, Amount, Method, Date

## Backend API

### `GET /api/admin/students`
- Added params: `section`, `gender`, `sort_by`, `sort_dir`
- Returns `{ data, total, pages, page }`

### `GET /api/admin/students/:id`
- Returns full student document with profile

### `GET /api/admin/students/:id/academic-history`
- Returns academic history for that student

### `GET /api/admin/students/:id/invoices`
- Returns invoices for that student

### `GET /api/admin/students/:id/payments`
- Returns payments for that student

### `POST /api/admin/students/bulk-delete`
- Body: `{ ids: [...] }`
- Soft deletes all specified students

### `GET /api/admin/students/export?format=csv|xls`
- Returns exported file

## Files to Create/Modify

### Modify
- `backend/routes/adminRoutes.js` — Add new endpoints
- `frontend/src/app/dashboard/students/page.jsx` — Rewrite with all features

### Create
- `frontend/src/app/dashboard/students/[id]/page.jsx` — Student detail page
- `frontend/src/components/students/StudentDetailTabs.jsx` — Tab content components
