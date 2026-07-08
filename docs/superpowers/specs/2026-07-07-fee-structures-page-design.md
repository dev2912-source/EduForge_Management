# Fee Structures Page — Design Spec

## Overview
Rewrite the existing `/dashboard/finance/structures` page to match the polished UI pattern used in the other admin pages (students, classes, promotions). No backend schema changes needed — the FeeStructure model already has className, academicYear, category, amount, frequency, dueDay.

## Route
`/dashboard/finance/structures` — rewrite `frontend/src/app/dashboard/finance/structures/page.jsx` (~428 lines → ~550 lines)

---

## Layout

### Header Card
- Orange accent bar + "Fee Structures" title + total count in orange
- Two buttons: **Import** (stone border, Upload icon) and **Add Structure** (black bg, Plus icon)

### Search & Filter Bar
- **Search input**: debounced 350ms, searches className and category via `?search=` query
- **Filter button**: toggles a filter panel; shows orange indicator dot when active
- **Filter panel** (collapsible):
  - **Category** — pills for each unique category in the data (dynamically derived)
  - **Academic Year** — pills for each unique year
  - Active filter chips displayed below search bar with X to remove
  - "Clear all" link when any filter active

### Table Columns
| # | Column | Sortable | Format |
|---|--------|----------|--------|
| 1 | Checkbox | No | Square checkbox |
| 2 | Class | Yes | Class name (bold) |
| 3 | Academic Year | Yes | Text |
| 4 | Category | Yes | Text with `font-semibold` |
| 5 | Amount | Yes | INR currency via `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })` |
| 6 | Frequency | Yes | Badge: Monthly → `bg-blue-50 text-blue-700`, Quarterly → `bg-purple-50 text-purple-700`, Annually → `bg-green-50 text-green-700`, One-Time → `bg-orange-50 text-orange-700`, Bi-Annually → `bg-stone-50 text-stone-700` |
| 7 | Due Day | Yes | Number |
| 8 | Created At | Yes | Formatted date (medium) |
| 9 | Updated At | Yes | Formatted date or "—" if same as created |

- Sort state: `{ key: string, dir: 'asc' | 'desc' }` — client-side sorting
- **Actions on hover**: Edit (pencil) and Delete (trash) icons with opacity-0→1 transition
- **Row click** → opens edit modal

### Pagination
- Server-side pagination via `GET /api/admin/fee-structures?page=X&limit=Y&search=Z`
- Per-page: 10 / 25 / 50 / 100, stored in localStorage key `feeStructuresPerPage` (default 10)
- Display: `"{start}–{end} of {total}"`
- Page nav: prev + page number buttons (max 5) + next
- Current page: orange bg (`#F9932B`) white text
- Disabled prev/next at boundaries

### Add/Edit Modal
- Title: "Add Fee Structure" / "Edit Fee Structure"
- Fields:
  - **Class Name** — select, populated from `GET /api/admin/classes?limit=1000`
  - **Academic Year** — text input (e.g. "2026-27")
  - **Category** — text input
  - **Amount** — number input (min 0)
  - **Frequency** — select: Monthly, Quarterly, Annually, Bi-Annually, One-Time
  - **Due Day** — number input (1-31)
- Error handling: inline red error message on API failure
- Submit: POST for create, PUT for update
- Loading state on submit button with spinner

### Delete Confirmation Modal
- Title: "Delete Fee Structure"
- Icon: Trash in red circle
- Message: `"Are you sure you want to delete this fee structure? This action cannot be undone."`
- Two buttons: "Cancel" (stone-200) and "Delete" (red-500)
- Error handling: inline red error on failure

### Import Modal
- Same pattern as students import:
  - File input accepting `.csv`, `.xlsx`, `.xls`
  - Upload button calling `POST /api/admin/fee-structures/import`
  - Processing state with spinner
  - Success/error message with count of imported records
- File size limit: 10MB (same as other imports)

### States
- **Loading**: Centered spinner with "Loading fee structures..."
- **Empty**: `"No fee structures yet"` + `"Add your first fee structure to get started"` + "Add Structure" CTA
- **Empty search**: `"No fee structures match your search"` + "Try different search terms or clear filters"
- **Error**: AlertCircle icon + error message + "Try Again" button

---

## Data Flow & State

### State Variables
- `structures` — array from API
- `total` — total count from API
- `search`, `debouncedSearch` — search with 350ms debounce
- `filters` — `{ category: string | null, academicYear: string | null }`
- `sort` — `{ key: string, dir: 'asc' | 'desc' }`
- `page`, `perPage` — pagination (perPage persisted to localStorage)
- `showFilterPanel` — toggle filter UI
- `showModal`, `editingItem`, `formData`, `submitting`, `formError` — add/edit modal
- `showDeleteModal`, `deletingId`, `deleting`, `deleteError` — delete confirmation
- `showImportModal`, `importFile`, `importing`, `importResult` — import modal

### Key Methods
- `fetchStructures()` — GET with search, page, limit params
- `fetchClasses()` — fetch class list for modal select (cached in state)
- `handleSort(key)` — toggle sort direction
- `toggleFilter(type, value)` — toggle category/year filter
- `clearFilters()` — reset all filters
- `openAddModal()` / `openEditModal(item)` / `openDeleteModal(id)`
- `handleSubmit()` — create or update structure
- `handleDeleteConfirm()` — delete structure
- `handleImport()` — upload file to import endpoint
- `handlePerPageChange(val)` — update perPage, persist to localStorage, reset page

---

## Backend Changes

### New: POST /api/admin/fee-structures/import
- Accepts multipart file upload (CSV/Excel) via multer
- Parses file, validates rows, inserts fee structures
- Returns `{ success, count, errors }`
- Route added to adminRoutes.js

### Existing endpoints (no changes needed)
- `GET /api/admin/fee-structures?page=X&limit=Y&search=Z` — already returns `{ success, data, total, page, pages }`
- `POST /api/admin/fee-structures` — create
- `PUT /api/admin/fee-structures/:id` — update
- `DELETE /api/admin/fee-structures/:id` — delete

---

## Error Handling
- API errors shown as inline messages in modals
- Button disabled states during loading/processing
- Fetch errors show full-page error state with retry
- Import errors show specific row failures

---

## Component Architecture
- Single-page component (~550 lines), self-contained with inline modals
- Shared helpers: `formatCurrency(amount)`, `formatDate(date)`, `getFrequencyBadge(freq)`
