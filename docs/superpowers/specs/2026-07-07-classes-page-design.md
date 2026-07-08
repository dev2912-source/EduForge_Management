# Classes & Class Detail Pages — Design Spec

## Overview
Rewrite the existing `/dashboard/classes` page to match the demo.kedarkul.com/admin/classes experience, and build a new class detail page at `/dashboard/classes/[id]`. No backend schema changes needed — the Class model already has `name`, `medium`, `sections`, and `createdAt`.

## Routes
- **List:** `/dashboard/classes` — rewrite `frontend/src/app/dashboard/classes/page.jsx` (~353 lines → ~600 lines)
- **Detail:** `/dashboard/classes/[id]` — new `frontend/src/app/dashboard/classes/[id]/page.jsx`

---

## Classes List Page (`/dashboard/classes`)

### Layout
- **Header card**: orange accent bar + "Classes & Sections" title + total count in orange + "Add Class" button (black bg)
- **Search + Filter bar**: debounced search (350ms) + filter panel expandable on click
- **Table**: sortable columns, row click navigates to detail, hover shows edit/delete actions
- **Pagination bar**: with per-page selector (10/25/50/100 saved to localStorage key `classesPerPage`)

### Search & Filters
- **Search input**: debounced 350ms, searches by class name via `?search=` query
- **Filter button**: toggles a filter panel below the search bar
- **Filter panel** (collapsible, shown/hidden):
  - **Sections**: "Has Sections" / "No Sections" pills with chip display
  - **Students**: "Has Students" / "No Students" pills with chip display
- Active filter chips shown in search bar area when filters active
- **Clear all** link when filters active

### Table Columns
| # | Header | Sortable | Content |
|---|--------|----------|---------|
| 1 | **Class** | Yes (alpha) | Class name in bold |
| 2 | **Medium** | Yes (alpha) | Badge: bg-emerald/cyan/green/teal by medium value, `text-[10px] font-black uppercase tracking-widest` |
| 3 | **Sections** | Yes (numeric) | Number (1-4) |
| 4 | **Students** | Yes (numeric) | Dynamic count from API |
| 5 | **Created At** | Yes (date) | Formatted date |

- Sort state: `{ key: string, dir: 'asc' | 'desc' }` — clicking same column toggles direction
- Sorting is **client-side** (full data loaded from API, then sorted/filtered client-side since class count is small)
- **Row click** → `router.push('/dashboard/classes/' + cls._id)` — entire row clickable except action buttons
- **Action buttons** (on hover, opacity transition 0→1):
  - Edit icon (pencil) — opens edit modal
  - Delete icon (trash) — opens delete confirmation modal

### Add/Edit Modal
- Same modal component, reused for add and edit
- Title: "Add Class" or "Edit Class"
- Fields:
  - **Name** — text input, required
  - **Medium** — select, options: ENGLISH, HINDI, MARATHI, GUJARATI (dynamic — could expand in future, hardcoded for now)
  - **Sections** — number input (1-4), required
- Submit button:
  - Add: `POST /api/admin/classes` with body `{ name, medium, sections }`
  - Edit: `PUT /api/admin/classes/:id` with same body
- On success: close modal, refetch list, show success toast
- On error: show error message in modal (red inline text)
- Loading state on submit button with spinner

### Delete Confirmation Modal
- Title: "Delete Class"
- Message: `"Are you sure you want to delete {className}? This action cannot be undone."`
- Two buttons: "Cancel" (stone-200 bg) and "Delete" (red bg)
- On confirm: `DELETE /api/admin/classes/:id` → close modal, refetch list
- On error: show error message in modal

### Empty State
- When no classes exist: centered illustration/icon + "No classes yet" + "Add your first class to get started" + "Add Class" CTA button

### Error State
- When API fails: centered error icon + "Failed to load classes" + "Try Again" button

### Pagination
- Per-page: 10 / 25 / 50 / 100, stored in localStorage `classesPerPage` key
- Display: `"{start}–{end} of {total}"`
- Page nav: prev + page number buttons (max 5 visible, with ellipsis) + next
- Current page: orange bg (#F9932B) white text
- Disabled prev/next at boundaries (opacity-30 cursor-not-allowed)

### Medium Badge Colors
| Medium | Classes |
|--------|---------|
| ENGLISH | `bg-emerald-50 text-emerald-700` |
| MARATHI | `bg-teal-50 text-teal-700` |
| HINDI | `bg-green-50 text-green-700` |
| GUJARATI | `bg-cyan-50 text-cyan-700` |
| Unknown | `bg-stone-100 text-stone-600` |

---

## Class Detail Page (`/dashboard/classes/[id]`)

### Layout (Stacked, max-w-4xl mx-auto)
1. **Header** — back button + class name + medium badge + edit/delete buttons
2. **Stats Cards** — 2-column grid (sections count, students count)
3. **Sections Section** — list of sections (A, B, C...) with add/edit/delete
4. **Subjects Section** — multi-select modal to assign subjects (future: timetable link)

### Header
- **Back button** ← "Classes" — `router.push('/dashboard/classes')`
- **Class name** (large text-xl font-bold) + medium badge next to it
- **Action buttons**: Edit (pencil icon, opens same modal as list page) and Delete (trash icon, opens delete confirmation)
- Orange accent bar below header

### Stats Cards (2-column grid)
| Card | Icon | Value | Description |
|------|------|-------|-------------|
| **Sections** | `Layers` icon | `{sections}` | Total sections (A, B, C...) |
| **Students** | `Users` icon | `{studentsCount}` | Total enrolled students |

### Sections Management
- Each section is derived from the class `sections` number (1 = A, 2 = B, 3 = C, 4 = D)
- **List of section cards**: each card shows:
  - Section letter badge (e.g. "A") in a colored circle/box
  - Student count for that section (queried from API)
  - "View Students" link → `/dashboard/students?class={className}&section={sectionLetter}`
- **No separate section model** — sections are virtual (derived from number)
- **Add/Edit** → handled by editing the class's `sections` field (reuses edit modal)

### Subjects Assignment
- **"Manage Subjects" button** — opens a multi-select modal
- **Modal**: search + multi-select from all subjects (future: Subject model / hardcoded list for now)
- For MVP: show a placeholder message: "Subject management coming soon"
- **"Open Timetable"** button → navigates to `/dashboard/timetable?class={classId}` (placeholder route for now)

### Sections Student Count
- Helper: `GET /api/admin/students?className={name}&section={letter}&limit=1` in parallel per section to get counts (or single call with all sections)
- For MVP: derive from a single API call to count students per section, or use the studentsCount from class list

---

## Data Flow & State

### List Page State
- `classes` — full array from API
- `search`, `debouncedSearch` — search input
- `filters` — `{ sections: null | 'has' | 'none', students: null | 'has' | 'none' }`
- `sort` — `{ key: 'name' | 'medium' | 'sections' | 'studentsCount' | 'createdAt', dir: 'asc' | 'desc' }`
- `page`, `perPage` — pagination (perPage persisted to localStorage)
- `showFilterPanel` — toggle filter UI
- `showModal`, `editingClass`, `formData`, `submitting` — add/edit modal
- `showDeleteModal`, `deletingClass`, `deleting` — delete confirmation

### Detail Page State
- `classData` — single class object fetched by ID
- `studentsCount` — total students in this class (from API or embedded in class data)
- `sectionCounts` — `{ A: number, B: number, ... }` — student counts per section
- `showEditModal`, `showDeleteModal` — reuse same modals

### Computed Values (List)
- `filteredClasses` — apply search + filters + sort to raw classes array
- `totalPages` — `Math.ceil(filteredClasses.length / perPage)`
- `paginatedClasses` — slice of filteredClasses for current page

### Key Methods
- `fetchClasses()` — `GET /api/admin/classes?search=...` 
- `handleSearch(value)` — update search state, trigger debounce, reset page to 1
- `toggleFilter(type, value)` — toggle sections/students filter
- `clearFilters()` — reset all filters
- `handleSort(key)` — toggle sort direction
- `openAddModal()` / `openEditModal(cls)` / `openDeleteModal(cls)`
- `handleSubmit()` — create or update class
- `handleDeleteConfirm()` — delete class
- `setPerPage(val)` — update perPage, persist to localStorage, reset page

---

## Backend Changes

### Minimal — no new schemas needed
- Class model already has: `name`, `medium`, `sections`, `timestamps`
- Backend already has: `GET/POST/PUT/DELETE /api/admin/classes`
- **GET /api/admin/classes/:id** — need to verify this endpoint exists; if not, add it
- Student count per class/section: use existing `GET /api/admin/students?className=X&section=Y&limit=1` pattern

### Potential enhancements (future)
- Subject model and CRUD endpoints
- Class-subject association endpoint

---

## Error Handling
- **List page**: error state with retry button
- **Detail page**: loading skeleton while fetching, "Class not found" for invalid IDs
- **Modals**: inline error messages for API failures
- **Delete**: confirmation modal before deletion (no browser `confirm()`)
- **Loading states**: spinner on buttons during API calls, skeleton for initial load

---

## Component Architecture
- **List page** (`page.jsx`): self-contained with inline modals (same as promotions page pattern)
- **Detail page** (`[id]/page.jsx`): self-contained with inline modals
- Modal styling: full-screen overlay with backdrop blur, white card rounded-2xl, max-w-lg, click-outside-to-close
- Shared helper: `getMediumBadgeClass(medium)` utility, `formatDate(date)` utility
