# Student Promotions Page — Design Spec

## Overview
Replicate the demo.kedarkul.com/admin/students/promotions page in the existing Next.js dashboard at `/dashboard/promotions`. The page allows admins to Transfer, Graduate, or Skip students in bulk with per-student action control.

## Route
`/dashboard/promotions` (already exists, rewrite `frontend/src/app/dashboard/promotions/page.jsx`)

## Layout: 2-Column Grid (`grid-cols-1 lg:grid-cols-12 gap-6`)
- **Left column** (`lg:col-span-4`): 3 stacked panels (Source, Destination, Summary)
- **Right column** (`lg:col-span-8`): Student table with pagination

---

## Left Column — Panels

### Panel 1: Source Class
- Step badge orange circle `1` → label "SOURCE CLASS"
- **From Class** select — populates from `/api/admin/classes`
- **From Section** select — shown only when selected class has >1 section; clears when class changes
- **"Find Students"** button — calls `GET /api/admin/students?className=X&section=Y&status=active&limit=500`; disabled when no class or loading; text: `"Searching…"` / `"Find Students"`
- Loading spinner while fetching

### Panel 2: Transfer Destination
- Step badge orange circle `2` → label "TRANSFER DESTINATION"
- Shows student count chip: `"{count} students"`
- **To Academic Year** — text input (e.g. `"2026-27"`)
- **To Class** — select from classes (filtered to exclude current)
- **To Section** — select, shown only when target class has >1 section
- **Remarks** — text input, placeholder `"e.g. Promoted to 11th"`, default `"Promoted to next grade"`

### Panel 3: Summary
- Step badge `bg-stone-800` circle → label "SUMMARY"
- Three stat rows:
  | Action | Style | Count |
  |--------|-------|-------|
  | **Transfer** | `bg-blue-50 rounded-lg` | blue count |
  | **Graduate** | `bg-green-50 rounded-lg` | green count |
  | **Skip** | `bg-stone-50 rounded-lg` | stone count |
- **"Execute Actions"** button — `bg-stone-900 w-full`; disabled when no valid actions or processing
- **Footnote:** `"Creates permanent academic history records"`

---

## Right Column — Student Table

### Toolbar (above table)
- **3 bulk buttons** (shown when students loaded):
  - `"All Transfer"` — `bg-blue-50 text-blue-600`
  - `"All Graduate"` — `bg-green-50 text-green-600`
  - `"Skip All"` — `bg-stone-100 text-stone-500`
- **Search input** — placeholder `"Search students…"`, filters by name or ID

### Table Columns
| # | Header | Content |
|---|--------|---------|
| 1 | Student | Color dot (blue/green/stone by action) + name |
| 2 | ID | `schoolId` in `font-mono` |
| 3 | Section | section name or `"—"` |
| 4 | Actions | **Transfer** / **Graduate** / **Skip** per-row buttons |

- Row highlight: `bg-blue-50/40` when action=transfer, `bg-green-50/40` when action=graduate
- Per-row action buttons use active/inactive style matching the action color

### Pagination
- Display: `"{start}–{end} of {total}"`
- Page size: 10/25/50/100
- Page nav: prev + number buttons + next

---

## Data Flow & State

### State Variables
- `sourceClass`, `sourceSection` — source selection
- `targetClass`, `targetSection`, `targetYear`, `remarks` — target selection
- `students` — array of student objects loaded from API
- `actions` — map `{ [studentId]: "transfer" | "graduate" | "skip" }` — defaults to `"transfer"` on load
- `searchQuery`, `page`, `perPage` — table UI state

### Computed Values
- `filteredStudents` — students filtered by search
- `transferCount` / `graduateCount` / `skipCount` — counts per action
- `canExecute` — `(transferCount > 0 && targetClass) || graduateCount > 0`

### Key Methods
- `findStudents()` — fetch from API, reset actions to all `"transfer"`, reset page
- `setAllActions(action)` — set every student to the given action
- `setStudentAction(id, action)` — set single student's action
- `execute()` — split students by action:
  - **Transfer**: `POST /api/admin/promotions` with `{ studentIds, fromClass, toClass, toSection, newAcademicYear, remarks }`
  - **Graduate**: `POST /api/admin/students/bulk-graduate` with `{ studentIds, academicYear, remarks }`
  - **Skip**: no-op
  - Show success/error message, reset on success

---

## Backend Changes Needed

### New Endpoint: POST /api/admin/students/bulk-graduate
```
Body: { studentIds: string[], academicYear: string, remarks?: string }
```
- Creates AcademicHistory record for each student with status `"graduated"`
- Updates student status to `"graduated"`

### Enhancement: POST /api/admin/promotions
- Accept optional `toSection` field
- Create AcademicHistory with status `"promoted"` and `remarks`

---

## Error Handling
- API errors shown as inline messages (success green / error red banner)
- Button disabled states during loading/processing
- Invalid selections prevented (no execute if Transfer chosen but no target class)

---

## Testing
- Select source class + section → Find Students → verify students load
- Per-row action buttons change state correctly
- Bulk buttons set all rows at once
- Execute with mix of Transfer/Graduate/Skip → verify API calls and state reset
- Edge cases: empty class, all skipped, no target class selected
