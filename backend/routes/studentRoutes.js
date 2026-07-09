const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/authMiddleware');

const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Timetable = require('../models/Timetable');
const AcademicYear = require('../models/AcademicYear');
const AcademicHistory = require('../models/AcademicHistory');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const LeaveRequest = require('../models/LeaveRequest');

const studentPhotoDir = path.join(__dirname, '..', 'uploads', 'student-profiles');
if (!fs.existsSync(studentPhotoDir)) {
  fs.mkdirSync(studentPhotoDir, { recursive: true });
}

const studentPhotoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, studentPhotoDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `student-${Date.now()}${ext}`);
  }
});

const uploadStudentPhoto = multer({
  storage: studentPhotoStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'), false);
  }
});

// @route   GET /api/student/profile
// @desc    Get student profile data
// @access  Private
router.get('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ success: true, data: user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/student/profile/password
// @desc    Update password
// @access  Private
router.put('/profile/password', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const { currentPassword, newPassword } = req.body;

        if (user && (await user.matchPassword(currentPassword))) {
            user.password = newPassword;
            await user.save();
            res.json({ message: 'Password updated successfully' });
        } else {
            res.status(401).json({ message: 'Invalid current password' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/student/attendance
// @desc    Get attendance report for the student
// @access  Private
router.get('/attendance', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const records = await Attendance.find({ student: req.user._id }).sort({ date: -1 });
        const academicYears = await AcademicYear.find().sort({ start_date: -1 });

        const holidays = records
            .filter(r => r.status === 'Holiday')
            .map(r => ({
                date: r.date.toISOString().split('T')[0],
                name: r.remark && r.remark !== '—' ? r.remark : 'Holiday'
            }))
            .filter((r, i, a) => a.findIndex(x => x.date === r.date) === i);

        const workingDays = [0, 1, 2, 3, 4];

        res.json({
            records: records.map(r => ({
                date: r.date.toISOString().split('T')[0],
                status: r.status,
                remark: r.remark && r.remark !== '—' ? r.remark : ''
            })),
            academic_years: academicYears.map(y => ({
                id: y._id,
                label: y.label,
                start_date: y.start_date.toISOString().split('T')[0],
                end_date: y.end_date.toISOString().split('T')[0],
                is_current: y.isCurrent
            })),
            working_days: workingDays,
            holidays
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/student/timetable
// @desc    Get timetable for the student's class and section
// @access  Private
router.get('/timetable', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const className = user.profile?.className || 'Class 1';
        const section = user.profile?.section || 'A';
        
        const schedule = await Timetable.find({ className, section }).sort({ period: 1 });
        res.json(schedule);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/student/history
// @desc    Get academic history records
// @access  Private
router.get('/history', protect, async (req, res) => {
    try {
        const history = await AcademicHistory.find({ student: req.user._id }).sort({ academicYear: -1 });
        const data = history.map(h => ({
            id: h._id,
            academicYearName: h.academicYear,
            className: h.className,
            sectionName: h.section,
            status: h.status,
            remarks: h.remarks || '',
            created_at: h.createdAt || h.recordedOn
        }));
        res.json({ success: true, data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/student/fees
// @desc    Get invoices for the student with search, filter, pagination, sorting
// @access  Private
router.get('/fees', protect, async (req, res) => {
    try {
        const query = { $or: [{ student: req.user._id }, { studentName: req.user.name }] };
        const { page = 1, limit = 10, status, search, sort_by, sort_dir } = req.query;

        if (status) {
            query.status = { $regex: new RegExp(`^${status}$`, 'i') };
        }
        if (search) {
            query.$or = [
                { invoiceId: { $regex: search, $options: 'i' } },
                { studentName: { $regex: search, $options: 'i' } }
            ];
            if (req.user._id) query.$or.push({ student: req.user._id });
        }

        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;

        const sortFieldMap = {
            invoice_number: 'invoiceId',
            total_amount: 'amount',
            paid_amount: 'paidAmount',
            balance: 'balance',
            due_date: 'dueDate',
            status: 'status',
            created_at: 'createdAt'
        };
        const sortField = sortFieldMap[sort_by] || 'dueDate';
        const sortDir = sort_dir === 'asc' ? 1 : -1;

        const total = await Invoice.countDocuments(query);
        const invoices = await Invoice.find(query)
            .sort({ [sortField]: sortDir })
            .skip(skip)
            .limit(limitNum);

        const parseAmount = (str) => parseInt((str || '0').replace(/[₹,]/g, '')) || 0;

        const data = invoices.map(inv => ({
            id: inv._id,
            invoice_number: inv.invoiceId,
            total_amount: parseAmount(inv.amount),
            paid_amount: parseAmount(inv.paidAmount),
            balance: parseAmount(inv.balance || inv.amount) - parseAmount(inv.paidAmount || '0'),
            due_date: inv.dueDate,
            status: (inv.status || 'pending').toLowerCase(),
            student_name: inv.studentName
        }));

        res.json({ success: true, data: { data, total, page: pageNum, limit: limitNum } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/student/invoices/:id/pdf
// @desc    Get invoice preview HTML
// @access  Private
router.get('/invoices/:id/pdf', protect, async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id).populate('student', 'name profile');
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        const parseAmount = (str) => parseInt((str || '0').replace(/[₹,]/g, '')) || 0;
        const total = parseAmount(invoice.amount);
        const paid = parseAmount(invoice.paidAmount);
        const balance = parseAmount(invoice.balance || invoice.amount) - paid;

        const badgeClass = {
            paid: 'badge-paid', pending: 'badge-pending',
            partial: 'badge-partial', overdue: 'badge-overdue'
        }[(invoice.status || '').toLowerCase()] || 'badge-pending';

        const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
body{font-family:sans-serif;margin:0;padding:24px;color:#1c1917;background:#f5f5f4}
.invoice{max-width:700px;margin:0 auto;background:#fff;border:1px solid #e7e5e4;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,.1)}
h1{font-size:18px;margin:0 0 4px}.sub{color:#a8a29e;font-size:13px;margin-bottom:24px}
table{width:100%;border-collapse:collapse;font-size:14px}
th{text-align:left;padding:10px 0;border-bottom:2px solid #e7e5e4;color:#a8a29e;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em}
td{padding:12px 0;border-bottom:1px solid #f5f5f4}
.bold{font-weight:700}.green{color:#15803d}.red{color:#dc2626}.stone{color:#78716c}
.badge{display:inline-block;padding:2px 10px;border-radius:6px;font-size:11px;font-weight:700;text-transform:uppercase;border:1px solid}
.badge-paid{background:#f0fdf4;color:#15803d;border-color:#bbf7d0}
.badge-pending{background:#fffbeb;color:#d97706;border-color:#fde68a}
.badge-partial{background:#eff6ff;color:#2563eb;border-color:#bfdbfe}
.badge-overdue{background:#fef2f2;color:#dc2626;border-color:#fecaca}
.total-row td{padding-top:16px;border:none}
.total-row .label{text-align:right;padding-right:16px;color:#a8a29e;font-weight:600}
.total-row .value{font-size:18px;font-weight:900}
.footer{margin-top:32px;padding-top:16px;border-top:1px solid #e7e5e4;text-align:center;font-size:12px;color:#a8a29e}
</style></head><body>
<div class="invoice">
<h1>Fee Invoice</h1>
<p class="sub">${invoice.invoiceId || ''}</p>
<table>
<tr><th>Description</th><th style="text-align:right">Amount (₹)</th></tr>
<tr><td class="bold">Tuition Fee</td><td style="text-align:right">${total.toLocaleString('en-IN')}</td></tr>
<tr><td>Paid Amount</td><td style="text-align:right" class="green">${paid.toLocaleString('en-IN')}</td></tr>
<tr><td>Balance Due</td><td style="text-align:right" class="${balance > 0 ? 'red' : 'green'}">${balance.toLocaleString('en-IN')}</td></tr>
<tr><td>Due Date</td><td style="text-align:right" class="stone">${invoice.dueDate || '—'}</td></tr>
<tr><td>Status</td><td style="text-align:right"><span class="badge ${badgeClass}">${invoice.status || 'Pending'}</span></td></tr>
<tr class="total-row"><td class="label">Total Amount</td><td class="value" style="text-align:right">₹${total.toLocaleString('en-IN')}</td></tr>
</table>
<div class="footer">${invoice.studentName || ''} &bull; Generated by EduForge</div>
</div></body></html>`;

        res.json({ success: true, data: { html } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/student/payments
// @desc    Get payment receipts for the student (paginated, searchable, sortable)
// @access  Private
router.get('/payments', protect, async (req, res) => {
    try {
        const pageNum = Math.max(1, parseInt(req.query.page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
        const skip = (pageNum - 1) * limitNum;
        const search = (req.query.search || '').trim();
        const method = (req.query.method || '').trim();
        const sort_by = req.query.sort_by || 'date';
        const sort_dir = req.query.sort_dir === 'asc' ? 1 : -1;

        const query = {
            $or: [{ student: req.user._id }, { studentName: req.user.name }]
        };

        if (search) {
            query.$or = [
                { receiptId: { $regex: search, $options: 'i' } },
                { invoiceId: { $regex: search, $options: 'i' } },
                { studentName: { $regex: search, $options: 'i' } }
            ];
        }

        if (method) {
            query.method = { $regex: `^${method}$`, $options: 'i' };
        }

        const sortFieldMap = {
            receiptId: 'receiptId',
            invoiceId: 'invoiceId',
            amount: 'amount',
            method: 'method',
            date: 'date',
            createdAt: 'createdAt'
        };
        const sortField = sortFieldMap[sort_by] || 'date';
        const sortObj = {};
        sortObj[sortField] = sort_dir;

        const total = await Payment.countDocuments(query);
        const payments = await Payment.find(query)
            .sort(sortObj)
            .skip(skip)
            .limit(limitNum);

        const parseAmount = (str) => parseInt((str || '0').replace(/[₹,]/g, '')) || 0;

        const data = payments.map(p => ({
            id: p._id,
            receipt_id: p.receiptId,
            invoice_id: p.invoiceId || null,
            amount: parseAmount(p.amount),
            amount_label: p.amount,
            method: p.method,
            date: p.date,
            created_at: p.createdAt,
            student_name: p.studentName
        }));

        res.json({ success: true, data: { data, total, page: pageNum, limit: limitNum } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/student/payments/:id/receipt
// @desc    Get payment receipt preview HTML
// @access  Private
router.get('/payments/:id/receipt', protect, async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) return res.status(404).json({ message: 'Receipt not found' });

        const parseAmount = (str) => parseInt((str || '0').replace(/[₹,]/g, '')) || 0;
        const amt = parseAmount(payment.amount);

        const methodColors = {
            cash: '#15803d', 'bank transfer': '#2563eb',
            cheque: '#d97706', online: '#7c3aed',
            upi: '#4f46e5', card: '#e11d48'
        };
        const color = methodColors[(payment.method || '').toLowerCase()] || '#78716c';

        const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
body{font-family:sans-serif;margin:0;padding:24px;color:#1c1917;background:#f5f5f4}
.receipt{max-width:500px;margin:0 auto;background:#fff;border:1px solid #e7e5e4;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,.1)}
h1{font-size:18px;margin:0 0 4px}.sub{color:#a8a29e;font-size:13px;margin-bottom:20px}
.row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f5f5f4;font-size:14px}
.row:last-of-type{border-bottom:none}.label{color:#a8a29e;font-weight:600}.value{font-weight:700}
.badge{display:inline-block;padding:3px 12px;border-radius:20px;font-size:12px;font-weight:700;color:#fff;background:${color}}
.amt{font-size:22px;font-weight:900;color:#15803d;margin:12px 0 0}
.footer{margin-top:24px;padding-top:16px;border-top:1px solid #e7e5e4;text-align:center;font-size:12px;color:#a8a29e}
</style></head><body>
<div class="receipt">
<h1>Payment Receipt</h1>
<p class="sub">${payment.receiptId || ''}</p>
<div class="row"><span class="label">Student</span><span class="value">${payment.studentName || ''}</span></div>
<div class="row"><span class="label">Invoice</span><span class="value">${payment.invoiceId || '—'}</span></div>
<div class="row"><span class="label">Date</span><span class="value">${payment.date || '—'}</span></div>
<div class="row"><span class="label">Method</span><span class="badge">${payment.method || ''}</span></div>
<div class="amt">₹${amt.toLocaleString('en-IN')}</div>
<div class="footer">Generated by EduForge</div>
</div></body></html>`;

        res.json({ success: true, data: { html } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error loading receipt' });
    }
});

// @route   GET /api/student/leave
// @desc    Get leave requests for the student (paginated, sortable)
// @access  Private
router.get('/leave', protect, async (req, res) => {
    try {
        const pageNum = Math.max(1, parseInt(req.query.page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (pageNum - 1) * limitNum;
        const statusFilter = (req.query.status || '').trim();
        const sort_by = req.query.sort_by || 'createdAt';
        const sort_dir = req.query.sort_dir === 'asc' ? 1 : -1;

        const query = { student: req.user._id };
        if (statusFilter && ['pending', 'approved', 'rejected', 'cancelled'].includes(statusFilter)) {
            query.status = statusFilter;
        }

        const sortFieldMap = {
            fromDate: 'fromDate',
            toDate: 'toDate',
            status: 'status',
            createdAt: 'createdAt'
        };
        const sortField = sortFieldMap[sort_by] || 'createdAt';
        const sortObj = {};
        sortObj[sortField] = sort_dir;

        const total = await LeaveRequest.countDocuments(query);
        const leaves = await LeaveRequest.find(query)
            .sort(sortObj)
            .skip(skip)
            .limit(limitNum);

        const data = leaves.map(l => ({
            id: l._id,
            from_date: l.fromDate,
            to_date: l.toDate,
            reason: l.reason,
            status: l.status,
            created_at: l.createdAt
        }));

        res.json({ success: true, data: { data, total, page: pageNum, limit: limitNum } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/student/leave
// @desc    Submit a new leave request
// @access  Private
router.post('/leave', protect, async (req, res) => {
    try {
        const { fromDate, toDate, reason } = req.body;
        if (!fromDate || !toDate || !reason) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        const leave = new LeaveRequest({
            student: req.user._id,
            fromDate,
            toDate,
            reason,
            status: 'pending'
        });
        await leave.save();
        res.status(201).json({ success: true, data: leave });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PATCH /api/student/leave/:id/cancel
// @desc    Cancel a pending leave request
// @access  Private
router.patch('/leave/:id/cancel', protect, async (req, res) => {
    try {
        const leave = await LeaveRequest.findOne({ _id: req.params.id, student: req.user._id });
        if (!leave) return res.status(404).json({ message: 'Leave request not found' });
        if (leave.status !== 'pending') return res.status(400).json({ message: 'Only pending requests can be cancelled' });

        leave.status = 'cancelled';
        await leave.save();
        res.json({ success: true, message: 'Leave request cancelled' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/student/leave/balance
// @desc    Get leave balance stats
// @access  Private
router.get('/leave/balance', protect, async (req, res) => {
    try {
        const totalLeaves = 12;
        const leaves = await LeaveRequest.find({
            student: req.user._id,
            status: { $in: ['approved', 'pending'] }
        });
        const usedPending = leaves.filter(l => l.status === 'pending').length;
        const usedApproved = leaves.filter(l => l.status === 'approved').length;

        res.json({
            success: true,
            data: {
                total: totalLeaves,
                used: usedApproved + usedPending,
                approved: usedApproved,
                pending: usedPending,
                remaining: Math.max(0, totalLeaves - usedApproved - usedPending)
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// POST /api/student/profile/photo - Upload profile photo
router.post('/profile/photo', protect, uploadStudentPhoto.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const photoUrl = `/uploads/student-profiles/${req.file.filename}`;
    await User.findByIdAndUpdate(req.user._id, { 'profile.photoUrl': photoUrl });
    res.json({ success: true, data: { photoUrl } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Upload failed' });
  }
});

// PUT /api/student/profile/update - Update own profile
router.put('/profile/update', protect, async (req, res) => {
  try {
    const { phone, address, gender, dateOfBirth, bloodGroup, nationality, religion, parentDetails } = req.body;
    const updateData = {};
    if (phone !== undefined) updateData['profile.phone'] = phone;
    if (address !== undefined) updateData['profile.address'] = address;
    if (gender !== undefined) updateData['profile.gender'] = gender;
    if (dateOfBirth !== undefined) updateData['profile.dateOfBirth'] = dateOfBirth;
    if (bloodGroup !== undefined) updateData['profile.bloodGroup'] = bloodGroup;
    if (nationality !== undefined) updateData['profile.nationality'] = nationality;
    if (religion !== undefined) updateData['profile.religion'] = religion;
    if (parentDetails !== undefined) updateData['profile.parentDetails'] = parentDetails;

    const user = await User.findByIdAndUpdate(req.user._id, updateData, { returnDocument: 'after' });
    res.json({ success: true, data: user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
