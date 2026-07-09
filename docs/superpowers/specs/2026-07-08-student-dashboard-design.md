# Student Dashboard Enhancement

## Overview
Enhance the student dashboard page at `/dashboard` with richer data, new sections, and a polished layout using all available student API endpoints.

## URL
`/dashboard` — existing Next.js App Router page at `frontend/src/app/dashboard/page.jsx` rendering `StudentDashboard` component.

## Layout
- Full-width content with padding `p-5`
- Single-column layout with 2-column sub-sections on larger screens
- Consistent with existing dashboard styling (white cards, orange accent, `#F97316` / `#22C55E` / `#EF4444` color palette)

## Sections (top to bottom)

### 1. Header
- Greeting: "Good morning/afternoon/evening, [firstName]!"
- Date: formatted "Wednesday, 8 July 2026"
- Class/Section badge + Language badge
- (Already exists — keep as-is)

### 2. Stats Cards Row (4 cards)
| Card | Value | Color |
|------|-------|-------|
| Attendance | Percentage + days present count | Green `#22C55E` |
| Outstanding Fees | Total due amount | Red `#EF4444` |
| Pending Leaves | Count | Orange `#F97316` |
| Today's Status | Clock status (Present/Absent/Not In) | Blue `#3B82F6` |

(Adds 4th card for today's clock status from `GET /api/dashboard/student`)

### 3. Today's Timetable
- Horizontal scroll with subject cards (already exists — keep as-is)

### 4. Two-Column Section (grid-cols-1 lg:grid-cols-2)
**Left: Recent Payments** (new)
- Last 5 payment receipts from `GET /api/student/payments`
- Each row: date, amount, method, status badge
- "View All" link to `/dashboard/payments`

**Right: Quick Actions** (new)
- Grid of action cards: Apply for Leave, View Timetable, Pay Fees, Check Attendance
- Each card: icon + label, links to respective pages

### 5. Two-Column Section (grid-cols-1 lg:grid-cols-2)
**Left: Leave Requests**
- Existing leave requests list — keep as-is

**Right: Fee Invoices (new)**
- Pending invoices from `GET /api/student/fees`
- Each row: invoice number, amount, due date, status badge
- "View All" link to `/dashboard/fees`

## Backend Changes

### Enhanced `GET /api/dashboard/student`
Return richer aggregated data:

```json
{
  "profile": { ... user object ... },
  "todayClock": "Present" | "Absent" | "Not In",
  "attendanceStats": {
    "totalDays": 0,
    "presentDays": 0,
    "absentDays": 0,
    "percentage": 0
  },
  "feeSummary": {
    "totalDue": 0,
    "pendingCount": 0,
    "dueDate": ""
  },
  "pendingLeaves": 0,
  "todaysClasses": [ ... timetable entries for today ... ],
  "recentPayments": [ ... last 5 payments ... ],
  "recentLeaves": [ ... last 3 leave requests ... ],
  "pendingInvoices": [ ... pending fee invoices ... ]
}
```

### Attendance aggregation
Query attendance records for current month to compute stats. Reuse logic from staff dashboard pattern.

### Fee aggregation
Query invoices for the student, sum pending amounts.

## Data Flow
1. Page loads → `GET /api/dashboard/student` → populate all sections
2. (Reduces current 5+ API calls to 1 backend call)

## Files Changed
### Modified
- `backend/routes/dashboardRoutes.js` — enhance `GET /api/dashboard/student` endpoint with aggregated data
- `frontend/src/components/dashboard/StudentDashboard.jsx` — rewrite to use enhanced endpoint with new sections

### Removed
- (none — individual student API endpoints remain for dedicated pages)

## Error Handling
- Loading state: "Loading dashboard..." spinner
- Error state: "Could not load dashboard data" with retry button
- Partial data: If backend endpoint fails, individual sections gracefully degrade
