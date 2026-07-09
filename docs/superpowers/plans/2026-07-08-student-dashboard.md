# Student Dashboard Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance the student dashboard with richer aggregated data, new sections (recent payments, quick actions, fee invoices), and a polished layout.

**Architecture:** Enhance the existing `GET /api/dashboard/student` backend endpoint to aggregate profile, attendance stats, fee summary, today's timetable, recent payments, and recent leaves into a single response. Rewrite the `StudentDashboard.jsx` component to consume the enhanced endpoint and display new sections.

**Tech Stack:** Next.js 16 App Router, Express.js, MongoDB/Mongoose

---

### Task 1: Backend — Enhance GET /api/dashboard/student

**Files:**
- Modify: `backend/routes/dashboardRoutes.js:200-231`

**Interfaces:**
- Consumes: `User`, `Attendance`, `Timetable`, `Invoice`, `Payment`, `LeaveRequest`, `SalarySlip` models (already imported or needed)
- Produces: `GET /api/dashboard/student` returns:
```json
{
  "profile": { "name", "email", "schoolId", "profile": { "className", "section", "rollNumber", "photoUrl", "medium" } },
  "todayClock": "Present" | "Absent" | "Not In",
  "attendanceStats": { "totalDays": 0, "presentDays": 0, "absentDays": 0, "percentage": 0 },
  "feeSummary": { "totalDue": 0, "pendingCount": 0 },
  "todaysClasses": [{ "subject", "teacher", "timeRange", "colorCode", "dayOfWeek" }],
  "pendingLeaves": 0,
  "recentPayments": [{ "_id", "receiptId", "amount", "method", "date", "status" }],
  "recentLeaves": [{ "_id", "fromDate", "toDate", "reason", "status" }],
  "pendingInvoices": [{ "_id", "invoiceId", "amount", "balance", "dueDate", "status" }]
}
```

- [ ] **Step 1: Read the existing student dashboard endpoint**

Read `backend/routes/dashboardRoutes.js` lines 200-231 to understand the current code.

- [ ] **Step 2: Add missing model imports at the top of the student endpoint section**

Add `Timetable`, `Payment`, `LeaveRequest` model imports after line 119 (`const SalarySlip = ...`):

```js
const Timetable = require('../models/Timetable');
const Payment = require('../models/Payment');
```

(Invoice and Attendance are already imported via earlier imports at line 3-6. LeaveRequest and SalarySlip already imported at lines 118-120.)

- [ ] **Step 3: Rewrite the `GET /api/dashboard/student` endpoint**

Replace lines 200-231 with:

```js
// GET /api/dashboard/student
router.get('/student', protect, async (req, res) => {
    try {
        if (req.user.role !== 'student') return res.status(403).json({ message: 'Not authorized' });

        const user = await User.findById(req.user._id).select('-password');
        const today = new Date();
        today.setUTCHours(0,0,0,0);

        // Today's attendance
        const attendance = await Attendance.findOne({
            student: req.user._id,
            date: { $gte: today }
        });

        // Monthly attendance stats
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
        const monthRecords = await Attendance.find({
            student: req.user._id,
            date: { $gte: monthStart, $lte: monthEnd }
        });
        const totalDays = monthRecords.filter(r => !['Weekend', 'Holiday', 'Not marked'].includes(r.status)).length;
        const presentDays = monthRecords.filter(r => r.status === 'Present').length;
        const absentDays = monthRecords.filter(r => r.status === 'Absent').length;
        const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

        // Today's timetable
        const className = user.profile?.className || 'Class 1';
        const section = user.profile?.section || 'A';
        const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        const currentDayStr = dayNames[today.getDay()];
        const todaysClasses = await Timetable.find({ className, section, dayOfWeek: currentDayStr }).sort({ period: 1 });

        // Fee summary
        const invoices = await Invoice.find({
            $or: [{ student: req.user._id }, { studentName: user.name }]
        });
        let totalDue = 0;
        let pendingCount = 0;
        invoices.forEach(inv => {
            const bal = parseInt((inv.balance || inv.amount).replace(/[₹,]/g, '')) || 0;
            if (inv.status === 'Pending' || inv.status === 'Partial') {
                totalDue += bal;
                pendingCount++;
            }
        });

        // Pending leaves count
        const pendingLeaves = await LeaveRequest.countDocuments({
            student: req.user._id,
            status: 'pending'
        });

        // Recent payments
        const recentPayments = await Payment.find({
            $or: [{ student: req.user._id }, { studentName: user.name }]
        }).sort({ createdAt: -1 }).limit(5);

        // Recent leaves
        const recentLeaves = await LeaveRequest.find({ student: req.user._id })
            .sort({ createdAt: -1 }).limit(3);

        // Pending invoices (for the invoices section)
        const pendingInvoices = await Invoice.find({
            $or: [{ student: req.user._id }, { studentName: user.name }],
            status: { $in: ['Pending', 'Partial'] }
        }).sort({ createdAt: -1 }).limit(5);

        res.json({
            profile: user,
            todayClock: attendance ? (['Present', 'Late'].includes(attendance.status) ? 'Present' : attendance.status) : 'Not In',
            attendanceStats: {
                totalDays,
                presentDays,
                absentDays,
                percentage: attendancePercentage
            },
            feeSummary: { totalDue, pendingCount },
            todaysClasses,
            pendingLeaves,
            recentPayments: recentPayments.map(p => ({
                _id: p._id,
                receiptId: p.receiptId,
                amount: p.amount,
                method: p.method,
                date: p.date || p.createdAt,
                status: 'Paid'
            })),
            recentLeaves: recentLeaves.map(l => ({
                _id: l._id,
                fromDate: l.fromDate || l.start_date,
                toDate: l.toDate || l.end_date,
                reason: l.reason,
                status: l.status
            })),
            pendingInvoices: pendingInvoices.map(inv => ({
                _id: inv._id,
                invoiceId: inv.invoiceId,
                amount: inv.amount,
                balance: inv.balance || inv.amount,
                dueDate: inv.dueDate,
                status: inv.status
            }))
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching dashboard data' });
    }
});
```

- [ ] **Step 4: Verify no syntax errors**

Run: `node -c backend/routes/dashboardRoutes.js`
Expected: No output (no syntax errors)

- [ ] **Step 5: Commit backend changes**

```bash
git add backend/routes/dashboardRoutes.js
git commit -m "feat: enhance student dashboard endpoint with aggregated data"
```

---

### Task 2: Frontend — Rewrite StudentDashboard.jsx

**Files:**
- Modify: `frontend/src/components/dashboard/StudentDashboard.jsx`

**Interfaces:**
- Consumes: `GET /api/dashboard/student` (enhanced endpoint from Task 1)
- Produces: Complete student dashboard with header, 4 stats cards, timetable, recent payments, quick actions, leave requests, fee invoices

- [ ] **Step 1: Read the current StudentDashboard.jsx**

Read `frontend/src/components/dashboard/StudentDashboard.jsx` to understand existing structure.

- [ ] **Step 2: Rewrite StudentDashboard.jsx**

Replace the entire file with:

```jsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Clock, ArrowRight, FileText, CreditCard, CalendarDays, BookOpen } from 'lucide-react';

export default function StudentDashboard() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return router.push('/login');

        const res = await fetch('/api/dashboard/student', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Failed to load dashboard');

        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-stone-400">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-stone-400 font-semibold mb-3">Could not load dashboard data</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm font-bold text-[#F97316] border border-[#F97316] px-4 py-2 rounded-lg hover:bg-orange-50 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { profile, todayClock, attendanceStats, feeSummary, todaysClasses, pendingLeaves, recentPayments, recentLeaves, pendingInvoices } = data;
  const p = profile?.profile || {};
  const name = profile?.name || 'Student';
  const firstName = name.split(' ')[0];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dateStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="h-full flex flex-col gap-4 p-5 overflow-hidden bg-white">

      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-stone-900">{greeting}, {firstName}!</h1>
          <p className="text-sm text-stone-500 mt-0.5">{dateStr}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-stone-700 bg-stone-100 px-2.5 py-1 rounded-lg">{p.className || '-'}</span>
          <span className="text-sm text-stone-500">{p.section || '-'}</span>
          <span className="text-xs text-[#22C55E] font-black tracking-widest uppercase">{p.medium || 'ENGLISH'}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-[3px] h-4 bg-[#22C55E] rounded-full inline-block"></span>
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Attendance</span>
          </div>
          <p className="text-3xl font-black text-[#22C55E] leading-none">{attendanceStats.percentage}%</p>
          <p className="text-xs text-stone-400 mt-1.5">{attendanceStats.presentDays} of {attendanceStats.totalDays} days</p>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-[3px] h-4 bg-[#EF4444] rounded-full inline-block"></span>
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Outstanding Fees</span>
          </div>
          <p className="text-3xl font-black text-[#EF4444] leading-none">₹{feeSummary.totalDue.toLocaleString('en-IN')}</p>
          <p className="text-xs text-stone-400 mt-1.5">{feeSummary.pendingCount} pending</p>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-[3px] h-4 bg-[#F97316] rounded-full inline-block"></span>
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Leave</span>
          </div>
          <p className="text-3xl font-black text-stone-900 leading-none">{pendingLeaves}</p>
          <p className="text-xs text-stone-400 mt-1.5">pending requests</p>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-[3px] h-4 bg-[#3B82F6] rounded-full inline-block"></span>
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Today</span>
          </div>
          <p className="text-3xl font-black text-[#3B82F6] leading-none">{todayClock}</p>
          <p className="text-xs text-stone-400 mt-1.5">clock status</p>
        </div>
      </div>

      {/* Today's Classes */}
      <div className="bg-white border border-stone-200 rounded-xl shadow-sm flex-shrink-0 overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between border-b border-stone-100">
          <div className="flex items-center gap-2">
            <span className="w-[3px] h-4 bg-[#F97316] rounded-full"></span>
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Today's Classes</span>
          </div>
          <Link href="/dashboard/timetable" className="text-[#F97316] text-[10px] font-black uppercase tracking-widest hover:underline">
            Full Timetable
          </Link>
        </div>
        <div className="px-4 py-3 overflow-x-auto">
          <div className="flex gap-2.5" style={{ minWidth: 'max-content' }}>
            {todaysClasses.length > 0 ? todaysClasses.map((cls, idx) => (
              <div
                key={idx}
                className="flex-shrink-0 w-[130px] rounded-xl p-3 text-white flex flex-col justify-between"
                style={{ backgroundColor: cls.colorCode, height: '82px' }}
              >
                <p className="text-[10px] font-semibold opacity-80">{cls.timeRange?.split(' - ')[0]}</p>
                <div>
                  <p className="text-[12px] font-black leading-tight truncate">{cls.subject}</p>
                  <p className="text-[10px] opacity-70 mt-0.5 truncate">{cls.teacher}</p>
                </div>
              </div>
            )) : <div className="text-sm text-stone-400">No classes scheduled for today.</div>}
          </div>
        </div>
      </div>

      {/* Two-Column Section: Recent Payments + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-shrink-0">
        {/* Recent Payments */}
        <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between border-b border-stone-100">
            <div className="flex items-center gap-2">
              <CreditCard size={14} className="text-stone-400" />
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Recent Payments</span>
            </div>
            <Link href="/dashboard/payments" className="text-[#F97316] text-[10px] font-black uppercase tracking-widest hover:underline">
              View All
            </Link>
          </div>
          <div>
            {recentPayments.length > 0 ? recentPayments.slice(0, 3).map((p, idx) => (
              <div key={idx} className="px-4 py-2.5 flex items-center justify-between border-b border-stone-50 last:border-b-0">
                <div>
                  <p className="text-sm font-semibold text-stone-800">{p.amount}</p>
                  <p className="text-[11px] text-stone-400">{p.method} &middot; {new Date(p.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                </div>
                <span className="text-[10px] font-black text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full uppercase tracking-wide">
                  {p.status}
                </span>
              </div>
            )) : (
              <div className="p-4 text-sm text-stone-400 text-center">No recent payments.</div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <ArrowRight size={14} className="text-stone-400" />
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Quick Actions</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 p-3">
            <Link href="/dashboard/leave" className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-stone-200 hover:border-[#F97316] hover:bg-orange-50 transition-all">
              <CalendarDays size={20} className="text-[#F97316]" />
              <span className="text-[11px] font-bold text-stone-700">Apply Leave</span>
            </Link>
            <Link href="/dashboard/timetable" className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-stone-200 hover:border-[#F97316] hover:bg-orange-50 transition-all">
              <BookOpen size={20} className="text-[#3B82F6]" />
              <span className="text-[11px] font-bold text-stone-700">Timetable</span>
            </Link>
            <Link href="/dashboard/fees" className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-stone-200 hover:border-[#F97316] hover:bg-orange-50 transition-all">
              <FileText size={20} className="text-[#EF4444]" />
              <span className="text-[11px] font-bold text-stone-700">Pay Fees</span>
            </Link>
            <Link href="/dashboard/attendance" className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-stone-200 hover:border-[#F97316] hover:bg-orange-50 transition-all">
              <Clock size={20} className="text-[#22C55E]" />
              <span className="text-[11px] font-bold text-stone-700">Attendance</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Two-Column Section: Leave Requests + Fee Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
        {/* Leave Requests */}
        <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-0">
          <div className="px-4 py-3 flex items-center justify-between border-b border-stone-100 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-[3px] h-4 bg-[#F97316] rounded-full"></span>
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Leave Requests</span>
            </div>
            <Link href="/dashboard/leave" className="text-[#F97316] text-[10px] font-black uppercase tracking-widest hover:underline">
              View All
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto">
            {recentLeaves.map((leave, idx) => (
              <div key={idx} className="px-4 py-3 flex items-center justify-between border-b border-stone-50">
                <div>
                  <p className="text-sm font-bold text-stone-900">
                    {new Date(leave.fromDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – {new Date(leave.toDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </p>
                  <p className="text-xs text-stone-500 mt-0.5">{leave.reason}</p>
                </div>
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wide border ${
                  leave.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                  leave.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                  'bg-yellow-50 text-yellow-700 border-yellow-200'
                }`}>
                  {leave.status}
                </span>
              </div>
            ))}
            {recentLeaves.length === 0 && <div className="p-4 text-sm text-stone-400">No recent leave requests.</div>}
          </div>
          <div className="px-4 py-3 border-t border-stone-100 flex-shrink-0">
            <Link href="/dashboard/leave" className="inline-block text-xs font-semibold text-stone-700 border border-stone-300 bg-white px-3 py-1.5 rounded-lg hover:border-[#F97316] hover:text-[#F97316] transition-colors">
              + Apply for leave
            </Link>
          </div>
        </div>

        {/* Fee Invoices */}
        <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-0">
          <div className="px-4 py-3 flex items-center justify-between border-b border-stone-100 flex-shrink-0">
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-stone-400" />
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Pending Invoices</span>
            </div>
            <Link href="/dashboard/fees" className="text-[#F97316] text-[10px] font-black uppercase tracking-widest hover:underline">
              View All
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto">
            {pendingInvoices.length > 0 ? pendingInvoices.slice(0, 3).map((inv, idx) => (
              <div key={idx} className="px-4 py-3 flex items-center justify-between border-b border-stone-50">
                <div>
                  <p className="text-sm font-bold text-stone-900">{inv.invoiceId}</p>
                  <p className="text-xs text-stone-500 mt-0.5">Due: {new Date(inv.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#EF4444]">{inv.balance}</p>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide ${
                    inv.status === 'Paid' ? 'bg-green-50 text-green-700' :
                    inv.status === 'Partial' ? 'bg-blue-50 text-blue-700' :
                    'bg-yellow-50 text-yellow-700'
                  }`}>
                    {inv.status}
                  </span>
                </div>
              </div>
            )) : (
              <div className="p-4 text-sm text-stone-400 text-center">No pending invoices.</div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
```

- [ ] **Step 3: Verify no build errors**

Run: `npx next build --no-lint 2>&1 | findstr /i "error"` (from frontend directory) or simply check the component renders.

- [ ] **Step 4: Commit frontend changes**

```bash
git add frontend/src/components/dashboard/StudentDashboard.jsx
git commit -m "feat: rewrite student dashboard with enhanced data and new sections"
```

---

## Self-Review

### Spec Coverage
- Header with greeting/date/class badge → covered (Task 2, section 1)
- 4 stats cards (attendance, fees, leaves, today clock) → covered
- Today's timetable horizontal scroll → covered
- Recent Payments section → covered
- Quick Actions section → covered
- Leave Requests section → covered
- Fee Invoices section → covered
- Enhanced backend endpoint with aggregated data → covered (Task 1)
- Single API call from frontend → covered
- Loading/error states → covered

### Placeholder Scan
- No "TBD", "TODO", or "implement later" found
- All code blocks contain complete code
- All file paths are exact
- All commands are exact

### Type Consistency
- `GET /api/dashboard/student` response shape defined in Task 1 matches consumption in Task 2
- Field names: `attendanceStats.percentage`, `feeSummary.totalDue`, `pendingLeaves`, `todaysClasses`, `recentPayments`, `recentLeaves`, `pendingInvoices` all consistent across tasks
- `todayClock` as string matches both backend mapping and frontend display
