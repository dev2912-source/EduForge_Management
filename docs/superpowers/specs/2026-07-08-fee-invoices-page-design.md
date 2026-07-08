# Fee Invoices Page — Staff View

## Goal
Rewrite `/dashboard/invoices` to match the exact UI and functionality of `demo.kedarkul.com/staff/fees/invoices`.

## Backend Changes

### 1. GET /api/admin/academic-years
- Returns distinct `academicYear` values from the Invoice collection as `[{id, label}]` sorted descending.

### 2. GET /api/admin/invoices – add `academic_year_id` filter
- Accept `academic_year_id` query param; filter Invoice documents where `academicYear` matches the value.

## Frontend: `/dashboard/invoices/page.jsx`

Rewrite the existing staff-facing page with:

### Layout
- **Header**: Orange accent bar + "Fee Invoices" title + "X invoices total" subtitle
- **Info banner**: Blue alert about auto-generation
- **4 stat cards**: Total Invoices, Pending (pending + partial), Collected (sum paid_amount INR), Outstanding (sum balance INR)
  - Computed client-side from fetched data, formatted with `Intl.NumberFormat('en-IN', {currency:'INR', maximumFractionDigits:0})`

### Toolbar
- **Selection indicator**: "N selected" + ExportMenu — visible only when rows are selected
- **SearchInput**: 350ms debounce, sends `search` param
- **FilterPanel**: Status (Pending/Partial/Paid/Overdue) + Academic Year (dropdown populated from GET /api/admin/academic-years)
- **Clear button**: Appears when any filter or search is active

### DataTable
- Columns: Invoice#, Student (name + enrollment code), Amount, Paid, Balance, Due Date, Status, Academic Year
  - Balance colored: red if > 0, green if 0
  - Status uses StatusBadge component (lowercase: pending/partial/paid/overdue)
  - Responsive visibility on Paid (md+), Due Date (sm+), Academic Year (lg+)
- Row selection: checkbox per row + select-all in header
- Row click → navigates to invoice detail (`/dashboard/invoices/[id]`)
- Sortable columns (toggle asc/desc)
- Pagination footer: "X–Y of Z", per-page dropdown (10/25/50/100 stored in localStorage key `fee_invoices_page_limit`), prev/next buttons + page numbers
- Empty state: "No Invoices Found" with description "Try adjusting your search or filters."

### Export
- CSV export: comma-separated, header row, selected rows only, `text/csv` blob download
- XLS export: tab-separated, `application/vnd.ms-excel` blob download
- Triggered from ExportMenu in selection toolbar

### States
- **Loading**: centered spinner
- **Empty**: centered icon + title + description
- **Error**: inline error with retry button
- **Normal**: DataTable with pagination

## Data Mapping (existing backend → view)

| Backend field     | View field          | Transformation            |
|-------------------|---------------------|---------------------------|
| `invoiceId`       | Invoice #           | direct                    |
| `studentName`     | Student name        | direct                    |
| `student.schoolId`| Student code        | fallback to `—`          |
| `amount`          | Amount (INR)        | parse numeric, format INR |
| `paidAmount`      | Paid (INR)          | parse numeric, format INR |
| `balance`         | Balance (INR)       | parse numeric, format INR |
| `dueDate`         | Due Date            | format `en-IN` short      |
| `status`          | Status              | lowercase + StatusBadge   |
| `academicYear`    | Academic Year       | direct                    |

## Files Modified
- `backend/routes/adminRoutes.js` — add academic-years endpoint + invoice filter
- `frontend/src/app/dashboard/invoices/page.jsx` — complete rewrite
