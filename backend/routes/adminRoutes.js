const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Timetable = require('../models/Timetable');
const User = require('../models/User');
const ClassModel = require('../models/Class');
const FeeStructure = require('../models/FeeStructure');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const LeaveRequest = require('../models/LeaveRequest');
const Attendance = require('../models/Attendance');

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
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { rollNumber: { $regex: search, $options: 'i' } }
            ];
        }

        const total = await User.countDocuments(userQuery);
        const staffMembers = await User.find(userQuery)
            .select('firstName lastName email rollNumber role profile')
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
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { name: { $regex: search, $options: 'i' } },
                { rollNumber: { $regex: search, $options: 'i' } },
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
                    { firstName: { $regex: search, $options: 'i' } },
                    { lastName: { $regex: search, $options: 'i' } },
                    { rollNumber: { $regex: search, $options: 'i' } }
                ]
            }).select('_id');
            const userIds = matchingUsers.map(u => u._id);
            query = { staff: { $in: userIds } };
        }

        const total = await SalarySlip.countDocuments(query);
        const salarySlips = await SalarySlip.find(query)
            .populate('staff', 'firstName lastName email rollNumber role profile name schoolId')
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
                    { firstName: { $regex: search, $options: 'i' } },
                    { lastName: { $regex: search, $options: 'i' } },
                    { rollNumber: { $regex: search, $options: 'i' } } // assuming ID is stored here
                ]
            }).select('_id');
            const userIds = matchingUsers.map(u => u._id);
            query = { student: { $in: userIds } };
        }

        const total = await LeaveRequest.countDocuments(query);
        const leaveRequests = await LeaveRequest.find(query)
            .populate('student', 'firstName lastName role email rollNumber')
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

// @route   GET /api/admin/students
// @desc    Get all students with search and pagination
// @access  Private (Admin & Staff)
router.get('/students', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'staff') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;

        const { search, status, className } = req.query;

        let query = { role: 'student' };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { schoolId: { $regex: search, $options: 'i' } },
                { 'profile.rollNumber': { $regex: search, $options: 'i' } }
            ];
        }

        if (status) query['profile.status'] = status;
        if (className) query['profile.className'] = className;

        const total = await User.countDocuments(query);
        const students = await User.find(query)
            .sort({ createdAt: -1 })
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

module.exports = router;
