const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const SalarySlip = require('../models/SalarySlip');
const Timetable = require('../models/Timetable');
const ClassModel = require('../models/Class');
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
    cb(null, `staff-${Date.now()}${ext}`);
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

// Middleware to ensure user is staff
const staffOnly = (req, res, next) => {
    if (req.user.role !== 'staff') {
        return res.status(403).json({ message: 'Not authorized as staff' });
    }
    next();
};

// @route   GET /api/staff/dashboard
// @desc    Get dashboard stats for logged in staff
// @access  Private (Staff)
router.get('/dashboard', protect, staffOnly, async (req, res) => {
    try {
        const today = new Date();
        today.setUTCHours(0,0,0,0);
        
        const attendance = await Attendance.findOne({
            student: req.user._id,
            date: { $gte: today }
        });

        const pendingLeaves = await LeaveRequest.countDocuments({
            student: req.user._id,
            status: 'pending'
        });

        const latestSalary = await SalarySlip.findOne({ staff: req.user._id })
            .sort({ createdAt: -1 });

        res.json({
            todayClock: attendance ? (attendance.status === 'present' ? 'Clocked In' : 'Absent') : 'Not In',
            pendingLeaves,
            latestSalary
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/staff/clock
// @desc    Get staff own clock history
// @access  Private (Staff)
router.get('/clock', protect, staffOnly, async (req, res) => {
    try {
        const records = await Attendance.find({ student: req.user._id }).sort({ date: -1 });
        res.json(records);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/staff/clock
// @desc    Staff clocks in
// @access  Private (Staff)
router.post('/clock', protect, staffOnly, async (req, res) => {
    try {
        const today = new Date();
        today.setUTCHours(0,0,0,0);
        
        let record = await Attendance.findOne({
            student: req.user._id,
            date: { $gte: today }
        });

        if (record) {
            return res.status(400).json({ message: 'Already clocked in today' });
        }

        record = new Attendance({
            student: req.user._id,
            date: new Date(),
            status: 'present',
            remarks: req.body.remarks || ''
        });

        await record.save();
        res.status(201).json(record);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/staff/salary
// @desc    Get logged-in staff member's own salary slips with pagination, search, filters, sort
// @access  Private (Staff)
router.get('/salary', protect, async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;
        const { month, year, payment_status, sort_by, sort_dir, all } = req.query;
        let query = {};
        if (all !== 'true') query.staff = req.user._id;

        if (month) {
            const monthStr = new Date(2024, parseInt(month) - 1).toLocaleString('en-US', { month: 'long' });
            if (year) {
                query.month = `${monthStr} ${year}`;
            } else {
                query.month = { $regex: `^${monthStr}`, $options: 'i' };
            }
        } else if (year) {
            query.month = { $regex: String(year), $options: 'i' };
        }

        if (payment_status) {
            const s = payment_status.charAt(0).toUpperCase() + payment_status.slice(1).toLowerCase();
            query.status = s;
        }

        let sortObj = { slipMonth: -1 };
        if (sort_by) {
            const dir = sort_dir === 'asc' ? 1 : -1;
            if (sort_by === 'slip_month') sortObj = { slipMonth: dir };
            else if (sort_by === 'gross_salary') sortObj = { gross: dir };
            else if (sort_by === 'deductions') sortObj = { deductions: dir };
            else if (sort_by === 'net_salary') sortObj = { net: dir };
            else if (sort_by === 'payment_status') sortObj = { status: dir };
            else sortObj = { [sort_by]: dir };
        }

        const total = await SalarySlip.countDocuments(query);

        let salarySlips;
        if (all === 'true') {
            salarySlips = await SalarySlip.find(query)
                .populate('staff', 'name firstName lastName email schoolId department designation profile')
                .sort(sortObj)
                .lean();
        } else {
            salarySlips = await SalarySlip.find(query)
                .populate('staff', 'name firstName lastName email schoolId department designation profile')
                .sort(sortObj)
                .skip(startIndex)
                .limit(limit)
                .lean();
        }

        const data = salarySlips.map(s => ({
            id: s._id,
            _id: s._id,
            slip_month: s.slipMonth || s.month,
            month: s.month,
            gross_salary: s.gross,
            deductions: s.deductions,
            net_salary: s.net,
            payment_status: s.status?.toLowerCase() || 'pending',
            basic: s.basic || 0,
            hra: s.hra || 0,
            da: s.da || 0,
            ta: s.ta || 0,
            other_allowances: s.otherAllowances || 0,
            pf_deduction: s.pfDeduction || 0,
            tax_deduction: s.taxDeduction || 0,
            other_deductions: s.otherDeductions || 0,
            payment_date: s.paymentDate || null,
            pdf_path: s.pdfPath || '',
            created_at: s.createdAt
        }));

        res.json({
            success: true,
            count: data.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/staff/salary/:id
// @desc    Get a single salary slip by ID
// @access  Private
router.get('/salary/:id', protect, async (req, res) => {
    try {
        const slip = await SalarySlip.findById(req.params.id)
            .populate('staff', 'name firstName lastName email schoolId department designation profile')
            .lean();
        if (!slip) return res.status(404).json({ message: 'Salary slip not found' });

        const staff = slip.staff || {};
        res.json({
            success: true,
            data: {
                id: slip._id,
                _id: slip._id,
                staff_name: staff.name || '',
                staff_code: staff.schoolId || '',
                department: staff.department || '',
                slip_month: slip.slipMonth || slip.month,
                month: slip.month,
                gross_salary: slip.gross,
                deductions: slip.deductions,
                net_salary: slip.net,
                payment_status: slip.status?.toLowerCase() || 'pending',
                basic: slip.basic || 0,
                hra: slip.hra || 0,
                da: slip.da || 0,
                ta: slip.ta || 0,
                other_allowances: slip.otherAllowances || 0,
                pf_deduction: slip.pfDeduction || 0,
                tax_deduction: slip.taxDeduction || 0,
                other_deductions: slip.otherDeductions || 0,
                payment_date: slip.paymentDate || null,
                pdf_path: slip.pdfPath || '',
                created_at: slip.createdAt
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/staff/salary/:id/pdf
// @desc    Get own salary slip PDF URL
// @access  Private (Staff)
router.get('/salary/:id/pdf', protect, async (req, res) => {
    try {
        const slip = await SalarySlip.findOne({ _id: req.params.id, staff: req.user._id }).lean();
        if (!slip) return res.status(404).json({ message: 'Salary slip not found' });

        if (slip.pdfPath) {
            return res.json({ success: true, data: { url: slip.pdfPath } });
        }

        const pdfPath = `/pdf/salary/${slip._id}.pdf`;
        await SalarySlip.findByIdAndUpdate(slip._id, { pdfPath });
        res.json({ success: true, data: { url: pdfPath } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PATCH /api/staff/salary/:id/mark-paid
// @desc    Mark own salary slip as paid
// @access  Private (Staff)
router.patch('/salary/:id/mark-paid', protect, async (req, res) => {
    try {
        const slip = await SalarySlip.findOne({ _id: req.params.id, staff: req.user._id });
        if (!slip) return res.status(404).json({ message: 'Salary slip not found' });

        slip.status = 'Paid';
        slip.paymentDate = req.body.payment_date ? new Date(req.body.payment_date) : new Date();
        await slip.save();

        res.json({ success: true, data: { id: slip._id, status: 'Paid', payment_date: slip.paymentDate } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/staff/salary/generate
// @desc    Generate a salary slip for the current user
// @access  Private
router.post('/salary/generate', protect, async (req, res) => {
    try {
        const now = new Date();
        const monthLabel = now.toLocaleString('en-US', { month: 'long' }) + ' ' + now.getFullYear();
        const slipDate = new Date(now.getFullYear(), now.getMonth(), 1);

        const existing = await SalarySlip.findOne({ staff: req.user._id, month: monthLabel });
        if (existing) return res.status(400).json({ message: 'Salary slip already exists for this month' });

        const gross = Math.floor(Math.random() * 40000) + 30000;
        const basic = Math.round(gross * 0.5);
        const hra = Math.round(gross * 0.2);
        const da = Math.round(gross * 0.15);
        const ta = Math.round(gross * 0.08);
        const otherAllowances = gross - basic - hra - da - ta;
        const pfDeduction = Math.round(gross * 0.12);
        const taxDeduction = Math.round(gross * 0.05);
        const otherDeductions = Math.floor(Math.random() * 500);
        const deductions = pfDeduction + taxDeduction + otherDeductions;
        const net = gross - deductions;

        const slip = await SalarySlip.create({
            staff: req.user._id,
            month: monthLabel,
            slipMonth: slipDate,
            gross, deductions, net,
            basic, hra, da, ta, otherAllowances,
            pfDeduction, taxDeduction, otherDeductions,
            status: 'Pending'
        });

        res.status(201).json({ success: true, data: slip });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/staff/leave
// @desc    Get staff own leave requests
// @access  Private (Staff)
router.get('/leave', protect, staffOnly, async (req, res) => {
    try {
        const leaves = await LeaveRequest.find({ student: req.user._id }).sort({ createdAt: -1 });
        res.json(leaves);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/staff/leave
// @desc    Staff applies for leave
// @access  Private (Staff)
router.post('/leave', protect, staffOnly, async (req, res) => {
    try {
        const { fromDate, toDate, reason } = req.body;
        const leave = new LeaveRequest({
            student: req.user._id, // Using 'student' field for the user ref (can be staff)
            fromDate,
            toDate,
            reason,
            status: 'pending'
        });
        await leave.save();
        res.status(201).json(leave);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/staff/leave-approvals
// @desc    Get all leave requests with pagination, search, and filters
// @access  Private (Staff)
router.get('/leave-approvals', protect, staffOnly, async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;
        const { search, status, requester_type, date_from, date_to, sort_by, sort_dir, all } = req.query;
        let query = {};

        if (status) {
            query.status = status.toLowerCase();
        }

        if (requester_type) {
            const userQuery = { role: requester_type.toLowerCase() };
            if (requester_type === 'staff') userQuery.role = { $in: ['staff', 'teacher'] };
            const matchingUsers = await User.find(userQuery).select('_id').lean();
            const userIds = matchingUsers.map(u => u._id);
            query.student = { $in: userIds };
        }

        if (search) {
            const matchingUsers = await User.find({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { schoolId: { $regex: search, $options: 'i' } },
                    { 'profile.rollNumber': { $regex: search, $options: 'i' } }
                ]
            }).select('_id').lean();
            const userIds = matchingUsers.map(u => u._id);
            const searchQuery = { student: { $in: userIds } };
            query = query.student
                ? { $and: [query, searchQuery] }
                : searchQuery;
        }

        if (date_from || date_to) {
            const dateQuery = {};
            if (date_from) {
                const d = new Date(date_from);
                d.setUTCHours(0, 0, 0, 0);
                dateQuery.$gte = d;
            }
            if (date_to) {
                const d = new Date(date_to);
                d.setUTCHours(23, 59, 59, 999);
                dateQuery.$lte = d;
            }
            query.fromDate = dateQuery;
        }

        let sortObj = { createdAt: -1 };
        if (sort_by) {
            const allowed = ['createdAt', 'fromDate', 'toDate', 'status'];
            if (allowed.includes(sort_by)) {
                sortObj = { [sort_by]: sort_dir === 'asc' ? 1 : -1 };
            }
        }

        const total = await LeaveRequest.countDocuments(query);

        let leaves;
        if (all === 'true') {
            leaves = await LeaveRequest.find(query)
                .populate('student', 'name role email schoolId profile')
                .sort(sortObj)
                .lean();
        } else {
            leaves = await LeaveRequest.find(query)
                .populate('student', 'name role email schoolId profile')
                .sort(sortObj)
                .skip(startIndex)
                .limit(limit)
                .lean();
        }

        res.json({
            success: true,
            count: leaves.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: leaves
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/staff/leave-approvals/:id/status
// @desc    Staff approves/rejects a leave request
// @access  Private (Staff)
router.put('/leave-approvals/:id/status', protect, staffOnly, async (req, res) => {
    try {
        const { status } = req.body;
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const leave = await LeaveRequest.findById(req.params.id);
        if (!leave) return res.status(404).json({ message: 'Leave not found' });

        leave.status = status;
        await leave.save();

        const populated = await LeaveRequest.findById(leave._id)
            .populate('student', 'name role email schoolId profile')
            .lean();

        res.json({ success: true, data: populated });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/staff/leave-approvals/bulk-action
// @desc    Bulk approve or reject leave requests
// @access  Private (Staff)
router.post('/leave-approvals/bulk-action', protect, staffOnly, async (req, res) => {
    try {
        const { ids, action } = req.body;
        if (!['approved', 'rejected'].includes(action)) {
            return res.status(400).json({ message: 'Invalid action' });
        }
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'No IDs provided' });
        }

        const result = await LeaveRequest.updateMany(
            { _id: { $in: ids } },
            { $set: { status: action } }
        );

        res.json({ success: true, modifiedCount: result.modifiedCount });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/staff/attendance/mark
// @desc    Staff marks attendance for students
// @access  Private (Staff)
router.post('/attendance/mark', protect, staffOnly, async (req, res) => {
    try {
        const { date, records } = req.body; // records is array of { student_id, status, remark }
        
        const dateObj = new Date(date);
        dateObj.setUTCHours(0,0,0,0);

        for (const rec of records) {
            const updateFields = {
                status: rec.status,
                date: new Date(date),
            };
            if (rec.remark !== undefined && rec.remark !== null) {
                updateFields.remark = rec.remark || '';
            }
            await Attendance.findOneAndUpdate(
                { student: rec.student_id, date: { $gte: dateObj, $lt: new Date(dateObj.getTime() + 86400000) } },
                { $set: updateFields },
                { upsert: true, new: true }
            );
        }

        res.json({ success: true, message: 'Attendance marked' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/staff/attendance/permissions
// @desc    Get class assignments for the staff member (derived from timetable)
// @access  Private (Staff)
router.get('/attendance/permissions', protect, staffOnly, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const lastName = user.lastName || user.name?.split(' ').slice(-1)[0] || '';
    const teacherRegex = lastName ? new RegExp(lastName, 'i') : null;

    const timetableEntries = await Timetable.find(
      teacherRegex ? { teacher: teacherRegex } : {}
    ).lean();

    const classMap = {};
    for (const entry of timetableEntries) {
      const key = `${entry.className}|${entry.section}`;
      if (!classMap[key]) {
        const cls = await ClassModel.findOne({ name: entry.className }).lean();
        classMap[key] = {
          class_id: cls?._id?.toString() || entry.className,
          section_id: entry.section,
          class_name: entry.className,
          section_name: entry.section
        };
      }
    }

    const assignments = Object.values(classMap);
    res.json({ success: true, data: { class_assignments: assignments } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/staff/attendance
// @desc    Get students with attendance for a class/section/date
// @access  Private (Staff)
router.get('/attendance', protect, staffOnly, async (req, res) => {
  try {
    const { class_id, section_id, date } = req.query;
    if (!class_id || !date) {
      return res.status(400).json({ message: 'Class and date are required' });
    }

    const cls = await ClassModel.findById(class_id).lean();
    const className = cls?.name || class_id;
    const section = section_id || 'A';

    const dateObj = new Date(date);
    dateObj.setUTCHours(0, 0, 0, 0);
    const nextDay = new Date(dateObj.getTime() + 86400000);

    const students = await User.find({
      role: 'student',
      'profile.className': className,
      'profile.section': section,
      isDeleted: { $ne: true }
    }).select('name firstName lastName schoolId profile.status').lean();

    if (students.length === 0) {
      return res.json({ success: true, data: { is_submitted: false, students: [] } });
    }

    const attendanceRecords = await Attendance.find({
      student: { $in: students.map(s => s._id) },
      date: { $gte: dateObj, $lt: nextDay }
    }).lean();

    const recordMap = {};
    let anySubmitted = false;
    for (const r of attendanceRecords) {
      recordMap[r.student.toString()] = r;
      if (r.submitted) anySubmitted = true;
    }

    const result = students.map(s => {
      const rec = recordMap[s._id.toString()];
      return {
        id: s._id,
        name: s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim(),
        student_code: s.schoolId || '',
        approved_leave: false,
        record: rec ? {
          id: rec._id,
          status: rec.status.toLowerCase(),
          remark: rec.remark === '—' ? '' : rec.remark,
          submitted_at: rec.submittedAt || null
        } : null
      };
    });

    res.json({
      success: true,
      data: {
        is_submitted: anySubmitted,
        students: result
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/staff/attendance/submit
// @desc    Submit/lock attendance for a class/section/date
// @access  Private (Staff)
router.post('/attendance/submit', protect, staffOnly, async (req, res) => {
  try {
    const { class_id, section_id, date } = req.body;
    if (!class_id || !date) {
      return res.status(400).json({ message: 'Class and date are required' });
    }

    const cls = await ClassModel.findById(class_id).lean();
    const className = cls?.name || class_id;
    const section = section_id || 'A';

    const dateObj = new Date(date);
    dateObj.setUTCHours(0, 0, 0, 0);
    const nextDay = new Date(dateObj.getTime() + 86400000);

    await Attendance.updateMany(
      {
        date: { $gte: dateObj, $lt: nextDay },
        student: {
          $in: await User.find({
            role: 'student',
            'profile.className': className,
            'profile.section': section
          }).select('_id').then(users => users.map(u => u._id))
        }
      },
      {
        $set: { submitted: true, submittedAt: new Date() }
      }
    );

    res.json({ success: true, message: 'Attendance submitted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

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

// GET /api/staff/attendance/summary - Monthly attendance summary
router.get('/attendance/summary', protect, staffOnly, async (req, res) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month) || now.getMonth();
    const year = parseInt(req.query.year) || now.getFullYear();
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const records = await Attendance.find({
      student: req.user._id,
      date: { $gte: start, $lte: end }
    });

    let present = 0, absent = 0, late = 0, onLeave = 0;
    records.forEach(r => {
      const s = r.status.toLowerCase();
      if (s === 'present') present++;
      else if (s === 'absent') absent++;
      else if (s === 'late') late++;
      else if (s === 'leave') onLeave++;
    });

    res.json({
      success: true,
      data: {
        summary: {
          present, absent, late, on_leave: onLeave,
          total_worked_minutes: 0
        }
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET /api/staff/timetable/today - Get today's scheduled classes
router.get('/timetable/today', protect, staffOnly, async (req, res) => {
  try {
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const today = dayNames[new Date().getDay()];

    const user = await User.findById(req.user._id);
    const lastName = user.lastName || user.name?.split(' ').slice(-1)[0] || '';
    const teacherRegex = lastName ? new RegExp(lastName, 'i') : null;

    const classes = await Timetable.find({
      dayOfWeek: today,
      ...(teacherRegex ? { teacher: teacherRegex } : {})
    }).sort({ period: 1 });

    res.json({ success: true, data: { periods: [], entries: classes.map(c => ({
      id: c._id,
      period_id: c.period,
      subject: { id: c._id, name: c.subject },
      class: { name: c.className },
      section: { name: c.section },
      time_range: c.timeRange,
      color: c.colorCode
    })) } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET /api/staff/timetable/my-class - Get full weekly timetable for logged-in staff
router.get('/timetable/my-class', protect, staffOnly, async (req, res) => {
  try {
    const dayMap = { 'MON': 0, 'TUE': 1, 'WED': 2, 'THU': 3, 'FRI': 4, 'SAT': 5, 'SUN': 6 };
    const reverseDay = { 0: 'MON', 1: 'TUE', 2: 'WED', 3: 'THU', 4: 'FRI', 5: 'SAT', 6: 'SUN' };

    const user = await User.findById(req.user._id);
    const lastName = user.lastName || user.name?.split(' ').slice(-1)[0] || '';
    const teacherRegex = lastName ? new RegExp(lastName, 'i') : null;

    const entries = await Timetable.find({
      ...(teacherRegex ? { teacher: teacherRegex } : {})
    }).sort({ period: 1, dayOfWeek: 1 });

    const allPeriods = await Timetable.distinct('period');
    allPeriods.sort((a, b) => a - b);

    const sampleEntries = await Timetable.find().limit(100).lean();
    const periodTimeMap = {};
    sampleEntries.forEach(e => {
      if (e.timeRange && !periodTimeMap[e.period]) {
        periodTimeMap[e.period] = e.timeRange;
      }
    });

    const periods = allPeriods.map(k => {
      const tr = periodTimeMap[k] || '';
      let start = '', end = '';
      if (tr) {
        const parts = tr.split(' - ');
        if (parts.length === 2) {
          start = convertTo24h(parts[0].trim());
          end = convertTo24h(parts[1].trim());
        }
      }
      return { id: k, name: `Period ${k}`, start_time: start, end_time: end, is_break: false };
    });

    const formattedEntries = entries.map(e => ({
      period_id: e.period,
      day_of_week: dayMap[e.dayOfWeek] !== undefined ? dayMap[e.dayOfWeek] : 0,
      subject: { id: e._id.toString(), name: e.subject },
      staff: { name: e.teacher },
      class: { name: e.className },
      section: { name: e.section },
      color: e.colorCode
    }));

    const days = [0, 1, 2, 3, 4, 5];

    res.json({ success: true, data: { periods, entries: formattedEntries, days } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

function convertTo24h(timeStr) {
  const t = timeStr.trim().toUpperCase();
  const match = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (!match) return t;
  let h = parseInt(match[1]);
  const m = match[2];
  const ampm = match[3];
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${m}`;
}

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

module.exports = router;
