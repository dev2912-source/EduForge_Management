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
// @desc    Get staff attendance for a specific date
// @access  Private (Admin)
router.get('/staff-clock', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized as an admin' });
        }

        const dateString = req.query.date || new Date().toISOString().split('T')[0];
        const dateObj = new Date(dateString);
        
        // Setup start and end of the day for querying
        const startOfDay = new Date(dateObj);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(dateObj);
        endOfDay.setUTCHours(23, 59, 59, 999);

        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;
        const search = req.query.search || '';

        // Find all staff users matching the search query
        const userQuery = { role: 'staff' };
        if (search) {
            userQuery.$or = [
                { name: { $regex: search, $options: 'i' } },
                { schoolId: { $regex: search, $options: 'i' } },
                { 'profile.rollNumber': { $regex: search, $options: 'i' } }
            ];
        }

        const total = await User.countDocuments(userQuery);
        const staffMembers = await User.find(userQuery)
            .select('name email schoolId role profile')
            .skip(startIndex)
            .limit(limit)
            .lean();

        // For each staff member, fetch their attendance for the day
        const staffIds = staffMembers.map(s => s._id);
        const attendanceRecords = await Attendance.find({
            student: { $in: staffIds },
            date: { $gte: startOfDay, $lte: endOfDay }
        }).lean();

        // Merge them
        const combinedData = staffMembers.map(staff => {
            const record = attendanceRecords.find(a => a.student.toString() === staff._id.toString());
            return {
                staff,
                attendance: record || null
            };
        });

        res.json({
            success: true,
            count: combinedData.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: combinedData,
            date: dateString
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/admin/staff
// @desc    Get all staff members with pagination and search
// @access  Private (Admin)
router.get('/staff', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized as an admin' });
        }

        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;

        const { search } = req.query;
        let query = { role: 'staff' };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { schoolId: { $regex: search, $options: 'i' } }
            ];
        }

        const total = await User.countDocuments(query);
        const staff = await User.find(query)
            .sort({ createdAt: -1 })
            .skip(startIndex)
            .limit(limit)
            .lean();
        
        res.json({
            success: true,
            count: staff.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: staff
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

const SalarySlip = require('../models/SalarySlip');

// @route   GET /api/admin/salary
// @desc    Get all salary slips with pagination and search
// @access  Private (Admin)
router.get('/salary', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized as an admin' });
        }

        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;

        const { search } = req.query;
        let query = {};

        // Find users matching search first since we can't regex populate in mongoose
        if (search) {
            const matchingUsers = await User.find({
                role: 'staff',
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { schoolId: { $regex: search, $options: 'i' } }
                ]
            }).select('_id');
            const userIds = matchingUsers.map(u => u._id);
            query = { staff: { $in: userIds } };
        }

        const total = await SalarySlip.countDocuments(query);
        const salarySlips = await SalarySlip.find(query)
            .populate('staff', 'name email schoolId role profile')
            .sort({ createdAt: -1 })
            .skip(startIndex)
            .limit(limit)
            .lean();
        
        res.json({
            success: true,
            count: salarySlips.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: salarySlips
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
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

        const { search } = req.query;
        let query = {};

        // Find users matching search first since we can't easily regex populate in mongoose
        if (search) {
            const matchingUsers = await User.find({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { schoolId: { $regex: search, $options: 'i' } },
                    { 'profile.rollNumber': { $regex: search, $options: 'i' } }
                ]
            }).select('_id');
            const userIds = matchingUsers.map(u => u._id);
            query = { student: { $in: userIds } };
        }

        const total = await LeaveRequest.countDocuments(query);
        const leaveRequests = await LeaveRequest.find(query)
            .populate('student', 'name role email schoolId')
            .sort({ createdAt: -1 })
            .skip(startIndex)
            .limit(limit)
            .lean();
        
        res.json({
            success: true,
            count: leaveRequests.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: leaveRequests
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

        const { search } = req.query;
        let query = {};
        
        if (search) {
            query.$or = [
                { receiptId: { $regex: search, $options: 'i' } },
                { invoiceId: { $regex: search, $options: 'i' } },
                { studentName: { $regex: search, $options: 'i' } }
            ];
        }

        const total = await Payment.countDocuments(query);
        const payments = await Payment.find(query)
            .sort({ createdAt: -1 })
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

        const { search } = req.query;
        let query = {};
        
        if (search) {
            query.$or = [
                { invoiceId: { $regex: search, $options: 'i' } },
                { studentName: { $regex: search, $options: 'i' } }
            ];
        }

        const total = await Invoice.countDocuments(query);
        const invoices = await Invoice.find(query)
            .sort({ createdAt: -1 })
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

        const { search, status, className, section, gender, sort_by, sort_dir } = req.query;

        let query = { role: 'student' };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { schoolId: { $regex: search, $options: 'i' } },
                { 'profile.rollNumber': { $regex: search, $options: 'i' } }
            ];
        }

        if (status && status !== 'All') {
          const statusArr = status.split(',').map(s => s.trim().toLowerCase());
          query['profile.status'] = { $in: statusArr };
        }
        if (className) query['profile.className'] = className;
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

    const { name, email, password, ...profileFields } = req.body;
    const count = await User.countDocuments({ role: 'staff' });
    const schoolId = `STF-2026-${(count + 1).toString().padStart(4, '0')}`;

    const staff = await User.create({
      name, email: email || `staff${count + 1}@edufordge.com`,
      password: password || 'Test@123',
      role: 'staff',
      schoolId,
      profile: profileFields
    });

    res.status(201).json({ success: true, data: staff });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// PUT /api/admin/staff/:id - Update staff
router.put('/staff/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

    const { name, email, ...profileFields } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (Object.keys(profileFields).length > 0) updateData.profile = profileFields;

    const staff = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!staff) return res.status(404).json({ message: 'Staff not found' });

    res.json({ success: true, data: staff });
  } catch (err) {
    console.error(err);
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

    let query = { isDeleted: true };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { schoolId: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await User.countDocuments(query);
    const items = await User.find(query)
      .select('name schoolId role profile.className profile.rollNumber isDeleted deletedAt')
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

module.exports = router;
