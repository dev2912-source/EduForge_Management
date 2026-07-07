const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const SalarySlip = require('../models/SalarySlip');

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
// @desc    Get staff own salary slips
// @access  Private (Staff)
router.get('/salary', protect, staffOnly, async (req, res) => {
    try {
        const slips = await SalarySlip.find({ staff: req.user._id }).sort({ createdAt: -1 });
        res.json(slips);
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
// @desc    Get all STUDENT leave requests (for staff to approve)
// @access  Private (Staff)
router.get('/leave-approvals', protect, staffOnly, async (req, res) => {
    try {
        // Find all student users
        const studentUsers = await User.find({ role: 'student', isDeleted: { $ne: true } }).select('_id');
        const studentIds = studentUsers.map(u => u._id);

        const leaves = await LeaveRequest.find({ student: { $in: studentIds } })
            .populate('student', 'name role email schoolId')
            .sort({ createdAt: -1 });
            
        res.json(leaves);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/staff/leave-approvals/:id/status
// @desc    Staff approves/rejects student leave
// @access  Private (Staff)
router.put('/leave-approvals/:id/status', protect, staffOnly, async (req, res) => {
    try {
        const { status } = req.body;
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const leave = await LeaveRequest.findById(req.params.id).populate('student');
        if (!leave) return res.status(404).json({ message: 'Leave not found' });
        
        if (leave.student.role !== 'student') {
            return res.status(403).json({ message: 'Staff can only approve student leaves' });
        }

        leave.status = status;
        await leave.save();
        res.json(leave);
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
        const { date, records } = req.body; // records is array of { studentId, status }
        
        const dateObj = new Date(date);
        dateObj.setUTCHours(0,0,0,0);

        // For simplicity, we just save each record (upsert based on date & studentId)
        for (const rec of records) {
            await Attendance.findOneAndUpdate(
                { student: rec.studentId, date: { $gte: dateObj, $lt: new Date(dateObj.getTime() + 86400000) } },
                { status: rec.status, date: new Date(date) },
                { upsert: true, new: true }
            );
        }

        res.json({ success: true, message: 'Attendance marked' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// PUT /api/staff/profile - Update own profile
router.put('/profile', protect, staffOnly, async (req, res) => {
  try {
    const { phone, address, gender, dateOfBirth } = req.body;
    const updateData = {};
    if (phone) updateData['profile.phone'] = phone;
    if (address) updateData['profile.address'] = address;
    if (gender) updateData['profile.gender'] = gender;
    if (dateOfBirth) updateData['profile.dateOfBirth'] = dateOfBirth;

    const user = await User.findByIdAndUpdate(req.user._id, updateData, { new: true });
    res.json({ success: true, data: user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
