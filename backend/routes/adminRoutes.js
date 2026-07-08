const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/authMiddleware');
const Timetable = require('../models/Timetable');
const User = require('../models/User');
const ClassModel = require('../models/Class');
const Document = require('../models/Document');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });
const FeeStructure = require('../models/FeeStructure');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const LeaveRequest = require('../models/LeaveRequest');
const Attendance = require('../models/Attendance');
const AcademicHistory = require('../models/AcademicHistory');

// @route   GET /api/admin/staff-clock
// @desc    Get staff attendance/clock status for a specific date
// @access  Private (Admin, Staff, Teacher)
router.get('/staff-clock', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'staff' && req.user.role !== 'teacher') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const dateString = req.query.date || new Date().toISOString().split('T')[0];
        const dateObj = new Date(dateString);
        const startOfDay = new Date(dateObj);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(dateObj);
        endOfDay.setUTCHours(23, 59, 59, 999);

        const { search, department, all } = req.query;

        const userQuery = { role: { $in: ['staff', 'teacher'] }, isDeleted: { $ne: true } };
        if (search) {
            userQuery.$or = [
                { name: { $regex: search, $options: 'i' } },
                { schoolId: { $regex: search, $options: 'i' } },
            ];
        }
        if (department) {
            userQuery.department = department;
        }

        let total, staffMembers;

        if (all === 'true') {
            staffMembers = await User.find(userQuery)
                .select('name schoolId department')
                .sort({ name: 1 })
                .lean();
            total = staffMembers.length;
        } else {
            total = await User.countDocuments(userQuery);
            const page = parseInt(req.query.page, 10) || 1;
            const limit = parseInt(req.query.limit, 10) || 10;
            const startIndex = (page - 1) * limit;

            staffMembers = await User.find(userQuery)
                .select('name schoolId department')
                .sort({ name: 1 })
                .skip(startIndex)
                .limit(limit)
                .lean();
        }

        const staffIds = staffMembers.map(s => s._id);
        const attendanceRecords = await Attendance.find({
            student: { $in: staffIds },
            date: { $gte: startOfDay, $lte: endOfDay }
        }).lean();

        const data = staffMembers.map(staff => {
            const record = attendanceRecords.find(a => a.student.toString() === staff._id.toString());
            let clock_status = 'not_in';
            let is_late = false;

            if (record) {
                const status = (record.status || '').toLowerCase();
                if (status === 'present') clock_status = 'clocked_in';
                else if (status === 'late') { clock_status = 'clocked_in'; is_late = true; }
                else if (status === 'leave') clock_status = 'not_in';
                else clock_status = 'not_in';
            }

            return {
                staff_id: staff._id,
                name: staff.name || '',
                staff_code: staff.schoolId || '',
                department: staff.department || '',
                clock_status,
                clock_in_at: record?.createdAt || null,
                clock_out_at: null,
                is_late
            };
        });

        res.json({
            success: true,
            data,
            total,
            date: dateString
        });
    } catch (err) {
        console.error('GET /staff-clock error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/admin/attendance/report
// @desc    Get student attendance report with aggregation
// @access  Private (Admin & Staff)
router.get('/attendance/report', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'staff') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { className, section, fromDate, toDate } = req.query;

        const studentQuery = { role: 'student', isDeleted: { $ne: true } };
        if (className) studentQuery['profile.className'] = className;
        if (section) studentQuery['profile.section'] = section;

        const students = await User.find(studentQuery)
            .select('name schoolId profile.rollNumber profile.className profile.section')
            .sort({ name: 1 })
            .lean();

        if (!students.length) {
            return res.json({ success: true, data: [], summary: { totalStudents: 0, averagePercentage: 0, totalPresent: 0, totalAbsent: 0 } });
        }

        const studentIds = students.map(s => s._id);

        const dateFilter = {};
        if (fromDate || toDate) {
            if (fromDate) dateFilter.$gte = new Date(fromDate);
            if (toDate) {
                const end = new Date(toDate);
                end.setUTCHours(23, 59, 59, 999);
                dateFilter.$lte = end;
            }
        }

        const matchStage = { student: { $in: studentIds } };
        if (Object.keys(dateFilter).length) matchStage.date = dateFilter;

        const records = await Attendance.find(matchStage).sort({ date: 1 }).lean();

        const reportMap = {};
        for (const rec of records) {
            const sid = rec.student.toString();
            if (!reportMap[sid]) {
                reportMap[sid] = { totalDays: 0, present: 0, absent: 0, late: 0, leave: 0 };
            }
            reportMap[sid].totalDays++;
            const s = rec.status;
            if (s === 'Present') reportMap[sid].present++;
            else if (s === 'Absent') reportMap[sid].absent++;
            else if (s === 'Late') reportMap[sid].late++;
            else if (s === 'Leave') reportMap[sid].leave++;
        }

        for (const sid of Object.keys(reportMap)) {
            const r = reportMap[sid];
            const presentCount = r.present + r.late;
            const workingDays = r.present + r.absent + r.late + r.leave;
            r.workingDays = workingDays;
            r.percentage = workingDays > 0 ? Math.round((presentCount / workingDays) * 100) : 0;
        }

        const data = students.map(student => {
            const report = reportMap[student._id.toString()] || { totalDays: 0, workingDays: 0, present: 0, absent: 0, late: 0, leave: 0, percentage: 0 };
            return {
                _id: student._id,
                name: student.name,
                schoolId: student.schoolId,
                rollNumber: student.profile?.rollNumber,
                className: student.profile?.className,
                section: student.profile?.section,
                ...report
            };
        });

        const summary = {
            totalStudents: students.length,
            totalDays: data.reduce((s, d) => s + d.totalDays, 0),
            totalWorkingDays: data.reduce((s, d) => s + d.workingDays, 0),
            totalPresent: data.reduce((s, d) => s + d.present, 0),
            totalAbsent: data.reduce((s, d) => s + d.absent, 0),
            totalLate: data.reduce((s, d) => s + d.late, 0),
            totalLeave: data.reduce((s, d) => s + d.leave, 0),
            averagePercentage: data.length > 0 ? Math.round(data.reduce((s, d) => s + d.percentage, 0) / data.length) : 0
        };

        res.json({ success: true, data, summary });
    } catch (err) {
        console.error('Attendance report error:', err);
        const detail = err.message || err.errmsg || err.stack || JSON.stringify(err);
        console.error('  Detail:', detail);
        res.status(500).json({ message: 'Server Error', detail });
    }
});

// @route   GET /api/admin/departments
// @desc    Get list of departments (merged from Department model, defaults, and staff records)
// @access  Private (Admin)
router.get('/departments', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized as an admin' });
        }

        const defaultNames = ['Science', 'Mathematics', 'English', 'Hindi', 'Social Studies', 'Computer Science', 'Physical Education', 'Arts', 'Administration'];

        const modelDepts = await Department.find().sort({ name: 1 });
        const modelNames = modelDepts.map(d => d.name);

        const staffDepts = await User.distinct('department', { role: 'staff', department: { $ne: '', $exists: true } });

        const allNames = [...new Set([...defaultNames, ...modelNames, ...staffDepts])].filter(Boolean).sort();

        const data = allNames.map(name => {
            const found = modelDepts.find(d => d.name === name);
            if (found) return { _id: found._id, name: found.name, deletable: true };
            return { name, deletable: false };
        });

        res.json({ success: true, data });
    } catch (err) {
        console.error('GET /departments error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/admin/staff
// @desc    Get all staff with search, filters, sort, pagination
router.get('/staff', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized as an admin' });
        }

        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;

        const { search, department, employmentType, status, sort_by, sort_dir } = req.query;
        let query = { role: 'staff', isDeleted: { $ne: true } };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { schoolId: { $regex: search, $options: 'i' } }
            ];
        }

        if (department) query.department = department;
        if (employmentType) query.employmentType = employmentType;
        if (status === 'active') query.isActive = true;
        if (status === 'inactive') query.isActive = false;

        let sortObj = { createdAt: -1 };
        if (sort_by) {
            const dir = sort_dir === 'asc' ? 1 : -1;
            if (sort_by === 'firstName') sortObj = { firstName: dir, lastName: dir };
            else if (sort_by === 'staffCode') sortObj = { schoolId: dir };
            else if (['department', 'designation', 'employmentType', 'isActive', 'createdAt'].includes(sort_by)) sortObj = { [sort_by]: dir };
        }

        const total = await User.countDocuments(query);
        const staff = await User.find(query)
            .sort(sortObj)
            .skip(startIndex)
            .limit(limit)
            .lean();

        // Map to match frontend expectations
        const data = staff.map(s => ({
            id: s._id,
            _id: s._id,
            firstName: s.firstName || '',
            lastName: s.lastName || '',
            name: s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim(),
            staffCode: s.schoolId,
            schoolId: s.schoolId,
            email: s.email || '',
            phone: s.profile?.phone || '',
            gender: s.profile?.gender || '',
            address: s.profile?.address || '',
            dateOfBirth: s.profile?.dateOfBirth || '',
            department: s.department || '',
            designation: s.designation || '',
            employmentType: s.employmentType || 'full-time',
            dateOfJoining: s.dateOfJoining || '',
            isActive: s.isActive !== false,
            profilePhotoUrl: s.profile?.photoUrl || '',
            role: s.role
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
        console.error('GET /staff error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/admin/staff/:id
// @desc    Get single staff by ID
router.get('/staff/:id', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized as an admin' });
        }
        const staff = await User.findOne({ _id: req.params.id, role: 'staff', isDeleted: { $ne: true } }).lean();
        if (!staff) return res.status(404).json({ message: 'Staff not found' });

        const data = {
            id: staff._id,
            _id: staff._id,
            firstName: staff.firstName || '',
            lastName: staff.lastName || '',
            name: staff.name || `${staff.firstName || ''} ${staff.lastName || ''}`.trim(),
            staffCode: staff.schoolId,
            schoolId: staff.schoolId,
            email: staff.email || '',
            phone: staff.profile?.phone || '',
            gender: staff.profile?.gender || '',
            address: staff.profile?.address || '',
            dateOfBirth: staff.profile?.dateOfBirth || '',
            department: staff.department || '',
            designation: staff.designation || '',
            employmentType: staff.employmentType || 'full-time',
            dateOfJoining: staff.dateOfJoining || '',
            isActive: staff.isActive !== false,
            profilePhotoUrl: staff.profile?.photoUrl || '',
            role: staff.role
        };

        res.json({ success: true, data });
    } catch (err) {
        console.error('GET /staff/:id error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

const SalarySlip = require('../models/SalarySlip');

// @route   GET /api/admin/salary-slips
// @desc    Get all salary slips with search, filters, sort, pagination
// @access  Private (Admin)
router.get('/salary-slips', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized as an admin' });
        }

        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;

        const { search, staff_id, month, year, payment_status, sort_by, sort_dir } = req.query;
        let query = {};

        if (search) {
            const matchingUsers = await User.find({
                role: 'staff',
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { firstName: { $regex: search, $options: 'i' } },
                    { lastName: { $regex: search, $options: 'i' } },
                    { schoolId: { $regex: search, $options: 'i' } }
                ]
            }).select('_id').lean();
            query.staff = { $in: matchingUsers.map(u => u._id) };
        }

        if (staff_id) {
            const staffFilter = { staff: staff_id };
            query = query.staff
                ? { $and: [{ staff: query.staff }, staffFilter] }
                : staffFilter;
        }

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
            const statusFilter = { status: payment_status.charAt(0).toUpperCase() + payment_status.slice(1).toLowerCase() };
            query = query.month
                ? { $and: [query, statusFilter] }
                : statusFilter;
        }

        let sortObj = { createdAt: -1 };
        if (sort_by) {
            const dir = sort_dir === 'asc' ? 1 : -1;
            if (sort_by === 'slip_month') sortObj = { slipMonth: dir };
            else if (sort_by === 'gross_salary') sortObj = { gross: dir };
            else if (sort_by === 'net_salary') sortObj = { net: dir };
            else if (sort_by === 'payment_status') sortObj = { status: dir };
            else sortObj = { [sort_by]: dir };
        }

        const [total, salarySlips] = await Promise.all([
            SalarySlip.countDocuments(query),
            SalarySlip.find(query)
                .populate('staff', 'name firstName lastName email schoolId department designation profile')
                .sort(sortObj)
                .skip(startIndex)
                .limit(limit)
                .lean()
        ]);

        const data = salarySlips.map(s => ({
            id: s._id,
            _id: s._id,
            staffId: s.staff?._id,
            staff_name: s.staff?.name || `${s.staff?.firstName || ''} ${s.staff?.lastName || ''}`.trim() || 'Unknown',
            staff_code: s.staff?.schoolId || '',
            department: s.staff?.department || '',
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
        console.error('GET /salary-slips error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/admin/salary-slips/:id
// @desc    Get single salary slip
router.get('/salary-slips/:id', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized as an admin' });
        }
        const slip = await SalarySlip.findById(req.params.id)
            .populate('staff', 'name firstName lastName email schoolId department designation profile photoUrl')
            .lean();
        if (!slip) return res.status(404).json({ message: 'Salary slip not found' });

        const data = {
            id: slip._id,
            staffId: slip.staff?._id,
            staff_name: slip.staff?.name || `${slip.staff?.firstName || ''} ${slip.staff?.lastName || ''}`.trim() || 'Unknown',
            staff_code: slip.staff?.schoolId || '',
            department: slip.staff?.department || '',
            slip_month: slip.slipMonth || slip.month,
            month: slip.month,
            gross_salary: slip.gross,
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
            total_deductions: slip.deductions,
            payment_date: slip.paymentDate || null,
            pdf_path: slip.pdfPath || '',
            created_at: slip.createdAt
        };

        res.json({ success: true, data });
    } catch (err) {
        console.error('GET /salary-slips/:id error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/admin/salary-slips/generate
// @desc    Generate salary slips for one or all staff
router.post('/salary-slips/generate', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

        const { staff_id, month, year } = req.body;
        if (!month) return res.status(400).json({ message: 'Month is required' });
        if (!year) return res.status(400).json({ message: 'Year is required' });

        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const monthName = monthNames[parseInt(month) - 1];
        if (!monthName) return res.status(400).json({ message: 'Invalid month' });

        const monthLabel = `${monthName} ${year}`;
        const slipDate = new Date(parseInt(year), parseInt(month) - 1, 1);

        let staffMembers = [];
        if (staff_id) {
            const staff = await User.findOne({ _id: staff_id, role: 'staff', isDeleted: { $ne: true } }).lean();
            if (!staff) return res.status(404).json({ message: 'Staff not found' });
            staffMembers = [staff];
        } else {
            staffMembers = await User.find({ role: 'staff', isActive: true, isDeleted: { $ne: true } }).lean();
        }

        let created = 0;
        let skipped = 0;

        for (const staff of staffMembers) {
            const existing = await SalarySlip.findOne({ staff: staff._id, month: monthLabel });
            if (existing) { skipped++; continue; }

            const gross = getRandomInt(30000, 70000);
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

            await SalarySlip.create({
                staff: staff._id,
                month: monthLabel,
                slipMonth: slipDate,
                gross, net, deductions,
                basic, hra, da, ta, otherAllowances,
                pfDeduction, taxDeduction, otherDeductions,
                status: 'Pending'
            });
            created++;
        }

        res.json({ success: true, data: { created, skipped } });
    } catch (err) {
        console.error('POST /salary-slips/generate error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Helper: getRandomInt for salary generation (inline)
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// @route   PATCH /api/admin/salary-slips/:id/mark-paid
// @desc    Mark a salary slip as paid
router.patch('/salary-slips/:id/mark-paid', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

        const slip = await SalarySlip.findById(req.params.id);
        if (!slip) return res.status(404).json({ message: 'Salary slip not found' });

        slip.status = 'Paid';
        slip.paymentDate = req.body.payment_date ? new Date(req.body.payment_date) : new Date();
        await slip.save();

        res.json({ success: true, data: { id: slip._id, status: 'Paid', payment_date: slip.paymentDate } });
    } catch (err) {
        console.error('PATCH /salary-slips/:id/mark-paid error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/admin/salary-slips/:id/pdf
// @desc    Get salary slip PDF URL
router.get('/salary-slips/:id/pdf', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

        const slip = await SalarySlip.findById(req.params.id).populate('staff', 'name schoolId department').lean();
        if (!slip) return res.status(404).json({ message: 'Salary slip not found' });

        if (slip.pdfPath) {
            return res.json({ success: true, data: { url: slip.pdfPath } });
        }

        // Generate a mock PDF path (in production, this would generate an actual PDF)
        const pdfPath = `/pdf/salary/${slip._id}.pdf`;
        await SalarySlip.findByIdAndUpdate(slip._id, { pdfPath });
        res.json({ success: true, data: { url: pdfPath } });
    } catch (err) {
        console.error('GET /salary-slips/:id/pdf error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/admin/salary-slips/:id/regenerate-pdf
// @desc    Regenerate salary slip PDF
router.post('/salary-slips/:id/regenerate-pdf', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

        const slip = await SalarySlip.findById(req.params.id);
        if (!slip) return res.status(404).json({ message: 'Salary slip not found' });

        const pdfPath = `/pdf/salary/${slip._id}.pdf`;
        slip.pdfPath = pdfPath;
        await slip.save();

        res.json({ success: true, data: { url: pdfPath } });
    } catch (err) {
        console.error('POST /salary-slips/:id/regenerate-pdf error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/admin/salary (legacy - redirects to salary-slips)
router.get('/salary', protect, async (req, res) => {
    req.query = req.query;
    res.redirect(req.originalUrl.replace('/salary', '/salary-slips'));
});

// @route   GET /api/admin/leave-requests
// @desc    Get all leave requests with search and pagination
// @access  Private (Admin)
router.get('/leave-requests', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized as an admin' });
        }

        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;

        const { search, status, type, sort } = req.query;
        let query = {};

        if (status) {
            query.status = status.toLowerCase();
        }

        if (type) {
            const userQuery = { role: type.toLowerCase() };
            if (type === 'staff') userQuery.role = { $in: ['staff', 'teacher'] };
            const matchingUsers = await User.find(userQuery).select('_id').lean();
            const userIds = matchingUsers.map(u => u._id);
            query.student = { $in: userIds };
        }

        // Find users matching search first since we can't easily regex populate in mongoose
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

        let sortObj = { createdAt: -1 };
        if (sort) {
            const [field, dir] = sort.split(':');
            const allowed = ['createdAt', 'fromDate', 'toDate', 'status'];
            if (allowed.includes(field)) {
                sortObj = { [field]: dir === 'asc' ? 1 : -1 };
            }
        }

        const [total, summary] = await Promise.all([
            LeaveRequest.countDocuments(query),
            LeaveRequest.aggregate([
                {
                    $group: {
                        _id: { $ifNull: ['$status', 'pending'] },
                        count: { $sum: 1 }
                    }
                }
            ])
        ]);

        const leaveRequests = await LeaveRequest.find(query)
            .populate('student', 'name role email schoolId')
            .sort(sortObj)
            .skip(startIndex)
            .limit(limit)
            .lean();

        const counts = { pending: 0, approved: 0, rejected: 0 };
        for (const s of summary) {
            if (counts[s._id] !== undefined) counts[s._id] = s.count;
        }
        
        res.json({
            success: true,
            count: leaveRequests.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: leaveRequests,
            summary: counts
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/admin/leave-requests/:id/status
// @desc    Update leave request status
// @access  Private (Admin)
router.put('/leave-requests/:id/status', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized as an admin' });
        }
        
        const { status } = req.body;
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const leaveRequest = await LeaveRequest.findById(req.params.id);
        if (!leaveRequest) {
            return res.status(404).json({ message: 'Leave request not found' });
        }

        leaveRequest.status = status;
        await leaveRequest.save();

        res.json({ success: true, data: leaveRequest });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/admin/payments
// @desc    Get all payments with search and pagination
// @access  Private (Admin & Staff)
router.get('/payments', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'staff') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;

        const { search, method, sort, invoice_id } = req.query;
        let query = {};

        if (invoice_id) {
            query.invoiceId = invoice_id;
        }
        
        if (search) {
            query.$or = [
                { receiptId: { $regex: search, $options: 'i' } },
                { invoiceId: { $regex: search, $options: 'i' } },
                { studentName: { $regex: search, $options: 'i' } }
            ];
        }

        if (method) {
            const methods = method.split(',').map(m => m.trim());
            query.method = { $in: methods };
        }

        let sortObj = { createdAt: -1 };
        if (sort) {
            const [field, dir] = sort.split(':');
            const allowed = ['receiptId', 'invoiceId', 'studentName', 'amount', 'method', 'date', 'createdAt'];
            if (allowed.includes(field)) {
                sortObj = { [field]: dir === 'asc' ? 1 : -1 };
            }
        }

        const total = await Payment.countDocuments(query);
        const payments = await Payment.find(query)
            .sort(sortObj)
            .skip(startIndex)
            .limit(limit)
            .lean();
        
        res.json({
            success: true,
            count: payments.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: payments
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/admin/invoices
// @desc    Get all invoices with search and pagination
// @access  Private (Admin & Staff)
router.get('/invoices', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'staff') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;

        const { search, status, sort, academic_year_id } = req.query;
        let query = {};

        if (academic_year_id) {
            query.academicYear = academic_year_id;
        }
        
        if (search) {
            query.$or = [
                { invoiceId: { $regex: search, $options: 'i' } },
                { studentName: { $regex: search, $options: 'i' } }
            ];
        }

        if (status) {
            const statuses = status.split(',').map(s => {
                const t = s.trim();
                return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
            });
            query.status = { $in: statuses };
        }

        let sortObj = { createdAt: -1 };
        if (sort) {
            const [field, dir] = sort.split(':');
            const allowed = ['invoiceId', 'studentName', 'amount', 'paidAmount', 'balance', 'dueDate', 'status', 'createdAt'];
            if (allowed.includes(field)) {
                sortObj = { [field]: dir === 'asc' ? 1 : -1 };
            }
        }

        const total = await Invoice.countDocuments(query);
        const invoices = await Invoice.find(query)
            .sort(sortObj)
            .skip(startIndex)
            .limit(limit)
            .lean();
        
        res.json({
            success: true,
            count: invoices.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: invoices
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/admin/invoices/:id
// @desc    Get a single invoice by ID
// @access  Private (Admin & Staff)
router.get('/invoices/:id', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'staff') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const invoice = await Invoice.findById(req.params.id).populate('student', 'name schoolId email').lean();
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        res.json({ success: true, data: invoice });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/admin/academic-years
// @desc    Get distinct academic years from invoices
// @access  Private (Admin & Staff)
router.get('/academic-years', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'staff') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const years = await Invoice.distinct('academicYear');
        const data = years
            .filter(Boolean)
            .sort()
            .reverse()
            .map(y => ({ id: y, label: y }));

        res.json({ success: true, data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/admin/fee-structures
// @desc    Get all fee structures with search and pagination
// @access  Private (Admin)
router.get('/fee-structures', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized as an admin' });
        }

        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;

        const { search } = req.query;
        let query = {};
        
        if (search) {
            query.$or = [
                { className: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } }
            ];
        }

        const total = await FeeStructure.countDocuments(query);
        const structures = await FeeStructure.find(query)
            .sort({ createdAt: -1 })
            .skip(startIndex)
            .limit(limit)
            .lean();
        
        res.json({
            success: true,
            count: structures.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: structures
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/admin/classes
// @desc    Get all classes with student counts
// @access  Private (Admin)
router.get('/classes', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized as an admin' });
        }

        const { search } = req.query;
        let query = {};
        
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        const classes = await ClassModel.find(query).sort({ createdAt: -1 }).lean();
        
        // Dynamically compute student count for each class
        const classesWithCounts = await Promise.all(classes.map(async (cls) => {
            const studentsCount = await User.countDocuments({ 
                role: 'student', 
                'profile.className': cls.name 
            });
            return {
                ...cls,
                studentsCount
            };
        }));

        res.json({
            success: true,
            count: classesWithCounts.length,
            data: classesWithCounts
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/admin/sections
// @desc    Get sections for a class (derive from class.sections count)
// @access  Private (Admin & Staff)
router.get('/sections', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'staff') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { class_id } = req.query;
        let sections = [];

        if (class_id) {
            const cls = await ClassModel.findById(class_id).lean();
            if (cls) {
                const count = cls.sections || 1;
                for (let i = 0; i < count; i++) {
                    const letter = String.fromCharCode(65 + i);
                    sections.push({ _id: letter, name: letter });
                }
            }
        }

        res.json({ success: true, data: sections });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/admin/classes/:id
// @desc    Get single class with student count
// @access  Private (Admin)
router.get('/classes/:id', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized as an admin' });
        }

        const cls = await ClassModel.findById(req.params.id).lean();
        if (!cls) {
            return res.status(404).json({ success: false, message: 'Class not found' });
        }
        const studentsCount = await User.countDocuments({ role: 'student', 'profile.className': cls.name });
        res.json({ success: true, data: { ...cls, studentsCount } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   GET /api/admin/students
// @desc    Get all students with search, filter, sort, pagination
// @access  Private (Admin & Staff)
router.get('/students', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'staff') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;

        const { search, status, className, class_id, section, section_id, gender, sort_by, sort_dir } = req.query;

        let query = { role: 'student' };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { schoolId: { $regex: search, $options: 'i' } },
                { 'profile.rollNumber': { $regex: search, $options: 'i' } },
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } }
            ];
        }

        if (status && status !== 'All') {
          const statusArr = status.split(',').map(s => s.trim().toLowerCase());
          query['profile.status'] = { $in: statusArr };
        }
        if (class_id) {
          const cls = await ClassModel.findById(class_id).select('name').lean();
          if (cls) query['profile.className'] = cls.name;
        } else if (className) {
          query['profile.className'] = className;
        }
        if (section_id) query['profile.section'] = section_id;
        if (section) query['profile.section'] = section;
        if (gender) {
          const genderArr = gender.split(',').map(g => g.trim());
          query['profile.gender'] = { $in: genderArr };
        }

        // Build sort object
        let sortObj = { createdAt: -1 };
        if (sort_by) {
            const sortFieldMap = {
                'name': 'name',
                'schoolId': 'schoolId',
                'gender': 'profile.gender',
                'dob': 'profile.dateOfBirth',
                'status': 'profile.status',
                'createdAt': 'createdAt',
                'updatedAt': 'updatedAt'
            };
            const field = sortFieldMap[sort_by] || 'createdAt';
            const dir = sort_dir === 'asc' ? 1 : -1;
            sortObj = { [field]: dir };
        }

        const total = await User.countDocuments(query);
        const students = await User.find(query)
            .sort(sortObj)
            .skip(startIndex)
            .limit(limit)
            .select('-password');

        res.json({
            success: true,
            count: students.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: students
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/admin/students/export
// @desc    Export students as CSV or XLS
// @access  Private (Admin)
router.get('/students/export', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

        const format = req.query.format || 'csv';
        const students = await User.find({ role: 'student' }).select('-password').lean();

        const headerRow = 'ID,Name,Gender,Class,Section,Status,Phone,Email';
        const rows = students.map(s => {
            const id = s.schoolId || '';
            const name = (s.name || '').replace(/,/g, ' ');
            const gender = s.profile?.gender || '';
            const cls = s.profile?.className || '';
            const sec = s.profile?.section || '';
            const status = s.profile?.status || 'active';
            const phone = s.profile?.phone || '';
            const email = s.email || '';
            return `${id},${name},${gender},${cls},${sec},${status},${phone},${email}`;
        });

        const csv = [headerRow, ...rows].join('\n');

        if (format === 'xls') {
            const xlsHeader = 'ID\tName\tGender\tClass\tSection\tStatus\tPhone\tEmail';
            const xlsRows = students.map(s => {
                const id = s.schoolId || '';
                const name = (s.name || '').replace(/\t/g, ' ');
                const gender = s.profile?.gender || '';
                const cls = s.profile?.className || '';
                const sec = s.profile?.section || '';
                const status = s.profile?.status || 'active';
                const phone = s.profile?.phone || '';
                const email = s.email || '';
                return `${id}\t${name}\t${gender}\t${cls}\t${sec}\t${status}\t${phone}\t${email}`;
            });
            const xls = [xlsHeader, ...xlsRows].join('\n');
            res.setHeader('Content-Type', 'application/vnd.ms-excel');
            res.setHeader('Content-Disposition', 'attachment; filename=students.xls');
            return res.send(xls);
        }

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=students.csv');
        res.send(csv);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/admin/students/:id
// @desc    Get single student detail
// @access  Private (Admin & Staff)
router.get('/students/:id', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'staff') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const student = await User.findById(req.params.id).select('-password');
        if (!student || student.role !== 'student') {
            return res.status(404).json({ message: 'Student not found' });
        }

        res.json({ success: true, data: student });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/admin/students/:id/academic-history
// @desc    Get academic history for a specific student
// @access  Private (Admin & Staff)
router.get('/students/:id/academic-history', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'staff') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const history = await AcademicHistory.find({ student: req.params.id }).sort({ academicYear: -1 });
        res.json({ success: true, data: history });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/admin/students/:id/invoices
// @desc    Get invoices for a specific student
// @access  Private (Admin & Staff)
router.get('/students/:id/invoices', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'staff') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const invoices = await Invoice.find({ student: req.params.id }).sort({ createdAt: -1 });
        res.json({ success: true, data: invoices });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/admin/students/:id/payments
// @desc    Get payments for a specific student
// @access  Private (Admin & Staff)
router.get('/students/:id/payments', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'staff') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const payments = await Payment.find({ student: req.params.id }).sort({ createdAt: -1 });
        res.json({ success: true, data: payments });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/admin/students/bulk-delete
// @desc    Soft delete multiple students
// @access  Private (Admin)
router.post('/students/bulk-delete', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'No student IDs provided' });
        }

        await User.updateMany(
            { _id: { $in: ids }, role: 'student' },
            { isDeleted: true, deletedAt: new Date() }
        );

        res.json({ success: true, message: `${ids.length} students moved to trash` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/admin/timetable
// @desc    Get timetable for a specific class and section
// @access  Private (Admin)
router.get('/timetable', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized as an admin' });
        }

        const { className, section } = req.query;
        if (!className || !section) {
            return res.status(400).json({ message: 'Class name and section are required' });
        }

        const schedule = await Timetable.find({ className, section }).sort({ period: 1 });
        res.json(schedule);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/admin/timetable
// @desc    Update or create a timetable block
// @access  Private (Admin)
router.put('/timetable', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized as an admin' });
        }

        const { className, section, dayOfWeek, period, timeRange, subject, teacher, colorCode } = req.body;

        if (!className || !section || !dayOfWeek || !period || !timeRange || !subject) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        // Upsert timetable entry
        const updatedBlock = await Timetable.findOneAndUpdate(
            { className, section, dayOfWeek, period },
            { timeRange, subject, teacher, colorCode },
            { new: true, upsert: true }
        );

        res.json(updatedBlock);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// POST /api/admin/students - Create new student
router.post('/students', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

    const { name, email, password, ...profileFields } = req.body;

    const count = await User.countDocuments({ role: 'student' });
    const schoolId = `STU-2026-${(count + 1).toString().padStart(4, '0')}`;

    const student = await User.create({
      name, email: email || `${schoolId.toLowerCase()}@school.com`,
      password: password || 'Test@123',
      role: 'student',
      schoolId,
      profile: profileFields
    });

    res.status(201).json({ success: true, data: student });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// PUT /api/admin/students/:id - Update student
router.put('/students/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

    const { name, email, ...profileFields } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (Object.keys(profileFields).length > 0) {
      updateData['profile'] = profileFields;
    }

    const student = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    res.json({ success: true, data: student });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// DELETE /api/admin/students/:id - Soft delete student
router.delete('/students/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

    const student = await User.findByIdAndUpdate(req.params.id,
      { isDeleted: true, deletedAt: new Date() }, { new: true });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    res.json({ success: true, message: 'Student moved to trash' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST /api/admin/staff - Create new staff
router.post('/staff', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

    const { firstName, lastName, email, password, phone, gender, address, dateOfBirth, department, designation, employmentType, dateOfJoining, isActive } = req.body;
    const count = await User.countDocuments({ role: 'staff' });
    const schoolId = `STF-2026-${(count + 1).toString().padStart(4, '0')}`;
    const fullName = `${firstName || ''} ${lastName || ''}`.trim() || `Staff ${count + 1}`;

    const staff = await User.create({
      name: fullName,
      firstName: firstName || '',
      lastName: lastName || '',
      email: email || `staff${count + 1}@edufordge.com`,
      password: password || 'Test@123',
      role: 'staff',
      schoolId,
      department: department || '',
      designation: designation || '',
      employmentType: employmentType || 'full-time',
      dateOfJoining: dateOfJoining || undefined,
      isActive: isActive !== false,
      profile: { phone, gender, address, dateOfBirth }
    });

    res.status(201).json({
      success: true,
      data: {
        id: staff._id,
        loginId: schoolId,
        setupLink: null,
        emailSent: !!(email),
        email
      }
    });
  } catch (err) {
    console.error('POST /staff error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// PUT /api/admin/staff/:id - Update staff
router.put('/staff/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

    const { firstName, lastName, email, phone, gender, address, dateOfBirth, department, designation, employmentType, dateOfJoining, isActive } = req.body;
    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    const newFirstName = firstName !== undefined ? firstName : undefined;
    const newLastName = lastName !== undefined ? lastName : undefined;
    if (firstName !== undefined || lastName !== undefined) {
      const existing = await User.findById(req.params.id).select('firstName lastName name').lean();
      updateData.name = `${newFirstName || existing.firstName || ''} ${newLastName || existing.lastName || ''}`.trim();
    }
    if (email !== undefined) updateData.email = email;
    if (department !== undefined) updateData.department = department;
    if (designation !== undefined) updateData.designation = designation;
    if (employmentType !== undefined) updateData.employmentType = employmentType;
    if (dateOfJoining !== undefined) updateData.dateOfJoining = dateOfJoining;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (phone !== undefined || gender !== undefined || address !== undefined || dateOfBirth !== undefined) {
      const existing = await User.findById(req.params.id).select('profile').lean();
      updateData.profile = {
        ...(existing?.profile || {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(gender !== undefined ? { gender } : {}),
        ...(address !== undefined ? { address } : {}),
        ...(dateOfBirth !== undefined ? { dateOfBirth } : {})
      };
    }

    const staff = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).lean();
    if (!staff) return res.status(404).json({ message: 'Staff not found' });

    res.json({ success: true, data: { id: staff._id } });
  } catch (err) {
    console.error('PUT /staff/:id error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// PATCH /api/admin/staff/:id - Update staff (alias)
router.patch('/staff/:id', protect, async (req, res) => {
  req.body = req.body;
  try {
    const existing = await User.findById(req.params.id).select('firstName lastName name email department designation employmentType dateOfJoining isActive profile').lean();
    if (!existing) return res.status(404).json({ message: 'Staff not found' });

    const { firstName, lastName, email, phone, gender, address, dateOfBirth, department, designation, employmentType, dateOfJoining, isActive } = req.body;
    const updateData = {};

    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (firstName !== undefined || lastName !== undefined) {
      updateData.name = `${firstName !== undefined ? firstName : existing.firstName || ''} ${lastName !== undefined ? lastName : existing.lastName || ''}`.trim();
    }
    if (email !== undefined) updateData.email = email;
    if (department !== undefined) updateData.department = department;
    if (designation !== undefined) updateData.designation = designation;
    if (employmentType !== undefined) updateData.employmentType = employmentType;
    if (dateOfJoining !== undefined) updateData.dateOfJoining = dateOfJoining;
    if (isActive !== undefined) updateData.isActive = isActive;

    updateData.profile = {
      ...(existing.profile || {}),
      ...(phone !== undefined ? { phone } : {}),
      ...(gender !== undefined ? { gender } : {}),
      ...(address !== undefined ? { address } : {}),
      ...(dateOfBirth !== undefined ? { dateOfBirth } : {})
    };

    const staff = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).lean();
    if (!staff) return res.status(404).json({ message: 'Staff not found' });

    res.json({ success: true, data: { id: staff._id } });
  } catch (err) {
    console.error('PATCH /staff/:id error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// DELETE /api/admin/staff/:id - Soft delete staff
router.delete('/staff/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

    const staff = await User.findByIdAndUpdate(req.params.id,
      { isDeleted: true, deletedAt: new Date() }, { new: true });
    if (!staff) return res.status(404).json({ message: 'Staff not found' });

    res.json({ success: true, message: 'Staff moved to trash' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST /api/admin/staff/:id/reset-password - Reset staff password
router.post('/staff/:id/reset-password', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

    const tempPassword = Math.random().toString(36).slice(-10);
    const staff = await User.findById(req.params.id);
    if (!staff) return res.status(404).json({ message: 'Staff not found' });

    staff.password = tempPassword;
    await staff.save();

    res.json({ success: true, data: { tempPassword } });
  } catch (err) {
    console.error('POST /staff/:id/reset-password error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST /api/admin/staff/:id/resend-credentials - Resend staff credentials
router.post('/staff/:id/resend-credentials', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });
    const staff = await User.findById(req.params.id).lean();
    if (!staff) return res.status(404).json({ message: 'Staff not found' });
    res.json({ success: true, message: 'Credentials resent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST /api/admin/staff/:id/photo - Upload staff photo
router.post('/staff/:id/photo', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });
    res.json({ success: true, message: 'Photo upload endpoint' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST /api/admin/classes - Create class
router.post('/classes', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

    const { name, medium, sections } = req.body;
    const newClass = await ClassModel.create({ name, medium, sections });

    res.status(201).json({ success: true, data: newClass });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Class already exists' });
    res.status(500).json({ message: 'Server Error' });
  }
});

// PUT /api/admin/classes/:id - Update class
router.put('/classes/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

    const cls = await ClassModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    res.json({ success: true, data: cls });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// DELETE /api/admin/classes/:id - Delete class
router.delete('/classes/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

    const cls = await ClassModel.findByIdAndDelete(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    res.json({ success: true, message: 'Class deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST /api/admin/fee-structures - Create fee structure
router.post('/fee-structures', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

    const fs = await FeeStructure.create(req.body);
    res.status(201).json({ success: true, data: fs });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST /api/admin/fee-structures/import - Import fee structures from CSV/Excel
router.post('/fee-structures/import', protect, upload.single('file'), async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const XLSX = require('xlsx');
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    let count = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i];
        const feeStructure = {
          className: row.className || row.class || row.Class || '',
          academicYear: row.academicYear || row.academic_year || row['Academic Year'] || '',
          category: row.category || row.Category || row.feeCategory || '',
          amount: parseFloat(row.amount || row.Amount || row.feeAmount || 0),
          frequency: row.frequency || row.Frequency || 'Monthly',
          dueDay: parseInt(row.dueDay || row.due_day || row['Due Day'] || row['Due Day of Month'] || 10, 10)
        };

        if (!feeStructure.className || !feeStructure.category || !feeStructure.amount) {
          errors.push({ row: i + 2, message: 'Missing required fields (className, category, amount)' });
          continue;
        }

        await FeeStructure.create(feeStructure);
        count++;
      } catch (rowErr) {
        errors.push({ row: i + 2, message: rowErr.message });
      }
    }

    res.json({ success: true, count, errors });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// PUT /api/admin/fee-structures/:id - Update fee structure
router.put('/fee-structures/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

    const fs = await FeeStructure.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!fs) return res.status(404).json({ message: 'Fee structure not found' });

    res.json({ success: true, data: fs });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// DELETE /api/admin/fee-structures/:id - Delete fee structure
router.delete('/fee-structures/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

    const fs = await FeeStructure.findByIdAndDelete(req.params.id);
    if (!fs) return res.status(404).json({ message: 'Fee structure not found' });

    res.json({ success: true, message: 'Fee structure deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST /api/admin/invoices/generate - Auto-generate invoices from fee structures
router.post('/invoices/generate', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

    const { academicYear, className } = req.body;

    let feeQuery = {};
    if (className) feeQuery.className = className;
    if (academicYear) feeQuery.academicYear = academicYear;

    const structures = await FeeStructure.find(feeQuery).lean();
    if (!structures.length) {
      return res.status(400).json({ success: false, message: 'No fee structures found for the given criteria' });
    }

    let studentQuery = { role: 'student', isDeleted: { $ne: true }, 'profile.status': 'active' };
    if (className) studentQuery['profile.className'] = className;
    if (academicYear) studentQuery['profile.academicYear'] = academicYear;

    const students = await User.find(studentQuery).lean();
    if (!students.length) {
      return res.status(400).json({ success: false, message: 'No active students found for the given criteria' });
    }

    const existingCount = await Invoice.countDocuments();
    let created = 0;
    const invoices = [];

    for (const student of students) {
      for (const fs of structures) {
        const existing = await Invoice.findOne({
          student: student._id,
          feeStructure: fs._id,
          academicYear: fs.academicYear
        });
        if (existing) continue;

        const idx = existingCount + created + invoices.length + 1;
        const invoiceId = `INV-2026-${(idx + 3000).toString().padStart(5, '0')}`;
        const inv = await Invoice.create({
          invoiceId,
          student: student._id,
          studentName: student.name,
          amount: `₹${fs.amount.toLocaleString('en-IN')}`,
          paidAmount: '₹0',
          balance: `₹${fs.amount.toLocaleString('en-IN')}`,
          dueDate: `${fs.dueDay} ${new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' })}`,
          status: 'Pending',
          feeStructure: fs._id,
          academicYear: fs.academicYear
        });
        invoices.push(inv);
        created++;
      }
    }

    res.status(201).json({ success: true, created, data: invoices });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST /api/admin/invoices - Create invoice
router.post('/invoices', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

    const count = await Invoice.countDocuments();
    const invoice = await Invoice.create({
      ...req.body,
      invoiceId: req.body.invoiceId || `INV-2026-${(count + 3000).toString().padStart(5, '0')}`
    });

    res.status(201).json({ success: true, data: invoice });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// PUT /api/admin/invoices/:id - Update invoice
router.put('/invoices/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

    const inv = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!inv) return res.status(404).json({ message: 'Invoice not found' });

    res.json({ success: true, data: inv });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// DELETE /api/admin/invoices/:id - Delete invoice
router.delete('/invoices/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

    const inv = await Invoice.findByIdAndDelete(req.params.id);
    if (!inv) return res.status(404).json({ message: 'Invoice not found' });

    res.json({ success: true, message: 'Invoice deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST /api/admin/payments - Record payment
router.post('/payments', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'staff') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const count = await Payment.countDocuments();
    const payment = await Payment.create({
      ...req.body,
      receiptId: req.body.receiptId || `RCP-2026-${(count + 2500).toString().padStart(5, '0')}`
    });

    if (payment.invoiceId) {
      const invoice = await Invoice.findOne({ invoiceId: payment.invoiceId });
      if (invoice) {
        const paymentNum = parseInt(payment.amount.replace(/[₹,]/g, '')) || 0;
        const invAmount = parseInt(invoice.amount.replace(/[₹,]/g, '')) || 0;
        const paidNum = parseInt(invoice.paidAmount.replace(/[₹,]/g, '')) || 0;
        const newPaid = paidNum + paymentNum;
        invoice.paidAmount = `₹${newPaid.toLocaleString('en-IN')}`;
        invoice.balance = `₹${Math.max(0, invAmount - newPaid).toLocaleString('en-IN')}`;
        if (newPaid >= invAmount) invoice.status = 'Paid';
        else if (newPaid > 0) invoice.status = 'Partial';
        await invoice.save();
      }
    }

    res.status(201).json({ success: true, data: payment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// PUT /api/admin/payments/:id - Update payment
router.put('/payments/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'staff') return res.status(403).json({ message: 'Not authorized' });

    const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    res.json({ success: true, data: payment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// DELETE /api/admin/payments/:id - Delete payment
router.delete('/payments/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    res.json({ success: true, message: 'Payment deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST /api/admin/payments/bulk-delete - Bulk delete payments
router.post('/payments/bulk-delete', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'staff') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No IDs provided' });
    }

    const result = await Payment.deleteMany({ _id: { $in: ids } });

    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST /api/admin/salary - Create salary slip
router.post('/salary', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

    const slip = await SalarySlip.create({
      staff: req.body.staffId,
      month: req.body.month,
      gross: req.body.gross,
      deductions: req.body.deductions || 0,
      net: req.body.gross - (req.body.deductions || 0),
      status: req.body.status || 'Pending'
    });

    res.status(201).json({ success: true, data: slip });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// PUT /api/admin/salary/:id - Update salary slip
router.put('/salary/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

    const slip = await SalarySlip.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!slip) return res.status(404).json({ message: 'Salary slip not found' });

    res.json({ success: true, data: slip });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// DELETE /api/admin/salary/:id - Delete salary slip
router.delete('/salary/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

    const slip = await SalarySlip.findByIdAndDelete(req.params.id);
    if (!slip) return res.status(404).json({ message: 'Salary slip not found' });

    res.json({ success: true, message: 'Salary slip deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST /api/admin/promotions - Promote students
router.post('/promotions', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

    const { studentIds, fromClass, toClass, toSection, newAcademicYear, remarks } = req.body;

    const classOrder = ['LKG','UKG','Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12'];
    const toClassIndex = classOrder.indexOf(toClass);

    const results = [];

    if (studentIds && studentIds.length > 0) {
      for (const studentId of studentIds) {
        const student = await User.findById(studentId);
        if (!student || student.role !== 'student') continue;

        await AcademicHistory.create({
          student: student._id,
          academicYear: newAcademicYear || '2025-2026',
          className: toClass,
          section: toSection || student.profile.section,
          status: 'promoted',
          remarks: remarks || `Promoted from ${fromClass}`
        });

        student.profile.className = toClass;
        if (toSection) student.profile.section = toSection;
        student.profile.academicYear = newAcademicYear || '2025-2026';
        student.profile.status = 'active';
        await student.save();

        results.push({ id: student._id, name: student.name, promoted: true });
      }
    } else if (fromClass) {
      const students = await User.find({ role: 'student', 'profile.className': fromClass });
      for (const student of students) {
        await AcademicHistory.create({
          student: student._id,
          academicYear: newAcademicYear || '2025-2026',
          className: toClass,
          section: toSection || student.profile.section,
          status: 'promoted',
          remarks: remarks || `Promoted from ${fromClass}`
        });

        student.profile.className = toClass;
        if (toSection) student.profile.section = toSection;
        student.profile.academicYear = newAcademicYear || '2025-2026';
        student.profile.status = 'active';
        await student.save();

        results.push({ id: student._id, name: student.name, promoted: true });
      }
    }

    res.json({ success: true, count: results.length, data: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET /api/admin/trash - Get soft-deleted items
router.get('/trash', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const search = req.query.search || '';
    const roleFilter = req.query.role || '';

    let query = { isDeleted: true };
    if (roleFilter && ['student', 'staff', 'admin'].includes(roleFilter)) {
      query.role = roleFilter;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { schoolId: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await User.countDocuments(query);
    const items = await User.find(query)
      .select('firstName lastName name schoolId role profile.className profile.rollNumber isDeleted deletedAt')
      .sort({ deletedAt: -1 })
      .skip(startIndex)
      .limit(limit)
      .lean();

    res.json({
      success: true,
      count: items.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: items
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// PUT /api/admin/trash/restore/:id - Restore from trash
router.put('/trash/restore/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

    const item = await User.findByIdAndUpdate(req.params.id,
      { isDeleted: false, deletedAt: null }, { new: true });
    if (!item) return res.status(404).json({ message: 'Item not found' });

    res.json({ success: true, message: 'Item restored', data: item });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// DELETE /api/admin/trash/permanent/:id - Permanently delete
router.delete('/trash/permanent/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

    const item = await User.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    res.json({ success: true, message: 'Item permanently deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST /api/admin/students/import - Import students from CSV
router.post('/students/import', protect, upload.single('file'), async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const csvText = fs.readFileSync(req.file.path, 'utf-8');
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const imported = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row = {};
      headers.forEach((h, idx) => { row[h] = values[idx] || ''; });

      const name = row['name'] || row['full name'] || row['student name'] || '';
      if (!name) continue;

      const count = await User.countDocuments({ role: 'student' });
      const schoolId = `STU-2026-${(count + imported.length + 1).toString().padStart(4, '0')}`;

      await User.create({
        name,
        email: row['email'] || `${schoolId.toLowerCase()}@school.com`,
        password: 'Test@123',
        role: 'student',
        schoolId,
        profile: {
          gender: row['gender'] || '',
          className: row['class'] || row['className'] || '',
          section: row['section'] || '',
          phone: row['phone'] || row['contact'] || '',
          status: (row['status'] || 'active').toLowerCase(),
        }
      });
      imported.push(name);
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({ success: true, count: imported.length, data: imported });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// PUT /api/admin/students/:id/transfer - Transfer student to new class
router.put('/students/:id/transfer', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

    const { className, section, academicYear, remarks } = req.body;
    if (!className) return res.status(400).json({ message: 'New class is required' });

    const student = await User.findById(req.params.id);
    if (!student || student.role !== 'student') return res.status(404).json({ message: 'Student not found' });

    const previousClassName = student.profile.className;

    // Record in academic history
    await AcademicHistory.create({
      student: student._id,
      academicYear: academicYear || '2026-27',
      className,
      section: section || student.profile.section,
      status: 'transferred',
      remarks: remarks || `Transferred from ${previousClassName}`
    });

    student.profile.className = className;
    if (section) student.profile.section = section;
    if (academicYear) student.profile.academicYear = academicYear;
    await student.save();

    res.json({ success: true, data: student });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST /api/admin/students/:id/reset-credentials - Reset student password
router.post('/students/:id/reset-credentials', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

    const student = await User.findById(req.params.id);
    if (!student || student.role !== 'student') return res.status(404).json({ message: 'Student not found' });

    const newPassword = 'Edu@' + Math.random().toString(36).slice(-6).toUpperCase();
    student.password = newPassword;
    await student.save();

    res.json({ success: true, schoolId: student.schoolId, password: newPassword });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// PUT /api/admin/students/:id/photo - Upload student photo
router.put('/students/:id/photo', protect, upload.single('photo'), async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'staff') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (!req.file) return res.status(400).json({ message: 'No photo uploaded' });

    const student = await User.findById(req.params.id);
    if (!student || student.role !== 'student') return res.status(404).json({ message: 'Student not found' });

    student.profile.photoUrl = `/uploads/${req.file.filename}`;
    await student.save();

    res.json({ success: true, data: student });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST /api/admin/students/:id/documents - Upload student document
router.post('/students/:id/documents', protect, upload.single('file'), async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'staff') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const student = await User.findById(req.params.id);
    if (!student || student.role !== 'student') return res.status(404).json({ message: 'Student not found' });

    const doc = await Document.create({
      student: student._id,
      fileName: req.file.originalname,
      filePath: `/uploads/${req.file.filename}`,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
    });

    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET /api/admin/students/:id/documents - Get student documents
router.get('/students/:id/documents', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'staff') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const docs = await Document.find({ student: req.params.id }).sort({ createdAt: -1 });
    res.json({ success: true, data: docs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST /api/admin/students/bulk-graduate - Graduate multiple students
router.post('/students/bulk-graduate', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

    const { studentIds, academicYear, remarks } = req.body;
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: 'No student IDs provided' });
    }

    const results = [];

    for (const studentId of studentIds) {
      const student = await User.findById(studentId);
      if (!student || student.role !== 'student') continue;

      await AcademicHistory.create({
        student: student._id,
        academicYear: academicYear || '2025-2026',
        className: student.profile.className,
        section: student.profile.section,
        status: 'graduated',
        remarks: remarks || 'Graduated'
      });

      student.profile.status = 'graduated';
      await student.save();
      results.push({ id: student._id, name: student.name, graduated: true });
    }

    res.json({ success: true, count: results.length, data: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// ============================================================
// Academic Years CRUD
// ============================================================

const AcademicYear = require('../models/AcademicYear');
const Department = require('../models/Department');
const Subject = require('../models/Subject');

// POST /api/admin/academic-years - Create academic year
router.post('/academic-years', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

    const { label, start_date, end_date } = req.body;
    if (!label || !start_date || !end_date) {
      return res.status(400).json({ message: 'Label, start_date, and end_date are required' });
    }

    const existing = await AcademicYear.findOne({ label });
    if (existing) return res.status(400).json({ message: 'An academic year with this label already exists' });

    const academicYear = await AcademicYear.create({ label, start_date, end_date });
    res.status(201).json({ success: true, data: academicYear });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Server Error' });
  }
});

// GET /api/admin/academic-years - List academic years
router.get('/academic-years', protect, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const total = await AcademicYear.countDocuments();
    const academicYears = await AcademicYear.find()
      .sort({ isCurrent: -1, start_date: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      count: academicYears.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: academicYears
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Server Error' });
  }
});

// GET /api/admin/academic-years/:id - Get single academic year
router.get('/academic-years/:id', protect, async (req, res) => {
  try {
    const academicYear = await AcademicYear.findById(req.params.id);
    if (!academicYear) return res.status(404).json({ message: 'Academic year not found' });

    res.json({ success: true, data: academicYear });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Server Error' });
  }
});

// PATCH /api/admin/academic-years/:id/set-current - Set as current year
router.patch('/academic-years/:id/set-current', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

    const academicYear = await AcademicYear.findById(req.params.id);
    if (!academicYear) return res.status(404).json({ message: 'Academic year not found' });

    await AcademicYear.updateMany({ _id: { $ne: academicYear._id } }, { isCurrent: false });
    academicYear.isCurrent = true;
    await academicYear.save();

    res.json({ success: true, data: academicYear });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Server Error' });
  }
});

// PATCH /api/admin/academic-years/:id - Update academic year
router.patch('/academic-years/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

    const { label, start_date, end_date } = req.body;
    const updateFields = {};
    if (label !== undefined) updateFields.label = label;
    if (start_date !== undefined) updateFields.start_date = start_date;
    if (end_date !== undefined) updateFields.end_date = end_date;

    if (label) {
      const duplicate = await AcademicYear.findOne({ label, _id: { $ne: req.params.id } });
      if (duplicate) return res.status(400).json({ message: 'An academic year with this label already exists' });
    }

    const academicYear = await AcademicYear.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );
    if (!academicYear) return res.status(404).json({ message: 'Academic year not found' });

    res.json({ success: true, data: academicYear });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Server Error' });
  }
});

// DELETE /api/admin/academic-years/:id - Delete academic year
router.delete('/academic-years/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

    const academicYear = await AcademicYear.findByIdAndDelete(req.params.id);
    if (!academicYear) return res.status(404).json({ message: 'Academic year not found' });

    res.json({ success: true, message: 'Academic year deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Server Error' });
  }
});

// ============================================================
// Department CRUD
// ============================================================

// POST /api/admin/departments - Create department
router.post('/departments', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Department name is required' });
    const existing = await Department.findOne({ name: name.trim() });
    if (existing) return res.status(400).json({ message: 'Department already exists' });
    const department = await Department.create({ name: name.trim() });
    res.status(201).json({ success: true, data: department });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Server Error' });
  }
});

// DELETE /api/admin/departments/:id - Delete department
router.delete('/departments/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });
    const department = await Department.findByIdAndDelete(req.params.id);
    if (!department) return res.status(404).json({ message: 'Department not found' });
    res.json({ success: true, message: 'Department deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Server Error' });
  }
});

// ============================================================
// Subjects CRUD
// ============================================================

// GET /api/admin/subjects - List subjects
router.get('/subjects', protect, async (req, res) => {
  try {
    const { page = 1, limit = 100 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const total = await Subject.countDocuments();
    const subjects = await Subject.find().sort({ name: 1 }).skip(skip).limit(limitNum);
    res.json({ success: true, count: subjects.length, total, page: pageNum, pages: Math.ceil(total / limitNum), data: subjects });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Server Error' });
  }
});

// POST /api/admin/subjects - Create subject
router.post('/subjects', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });
    const { name, code } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Subject name is required' });
    const existing = await Subject.findOne({ name: name.trim() });
    if (existing) return res.status(400).json({ message: 'Subject already exists' });
    const subject = await Subject.create({ name: name.trim(), code: code?.trim() || '' });
    res.status(201).json({ success: true, data: subject });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Server Error' });
  }
});

// PUT /api/admin/subjects/:id - Update subject
router.put('/subjects/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });
    const { name, code } = req.body;
    const update = {};
    if (name?.trim()) update.name = name.trim();
    if (code !== undefined) update.code = code.trim();
    if (name?.trim()) {
      const dup = await Subject.findOne({ name: name.trim(), _id: { $ne: req.params.id } });
      if (dup) return res.status(400).json({ message: 'Subject already exists' });
    }
    const subject = await Subject.findByIdAndUpdate(req.params.id, { $set: update }, { new: true, runValidators: true });
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    res.json({ success: true, data: subject });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Server Error' });
  }
});

// DELETE /api/admin/subjects/:id - Delete subject
router.delete('/subjects/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    res.json({ success: true, message: 'Subject deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Server Error' });
  }
});

module.exports = router;
