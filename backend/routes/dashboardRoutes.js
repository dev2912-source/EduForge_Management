const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');

// GET /api/dashboard/admin
router.get('/admin', async (req, res) => {
    try {
        const studentCount = await User.countDocuments({ role: 'student' });
        const staffCount = await User.countDocuments({ role: 'staff' });
        
        const recentPayments = await Payment.find().sort({ createdAt: -1 }).limit(5);
        const pendingInvoices = await Invoice.find({ status: 'Pending' }).sort({ createdAt: -1 }).limit(5);

        // Calculate totals (mocked as 0 to match HTML precisely for now)
        // In a real production app, amounts should be stored as Numbers and aggregated.
        const stats = {
            students: studentCount,
            staff: staffCount,
            collected: "₹0",
            outstanding: "₹0"
        };

        res.json({
            stats,
            recentPayments,
            pendingInvoices
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching dashboard data' });
    }
});

const { protect } = require('../middleware/authMiddleware');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const SalarySlip = require('../models/SalarySlip');

// GET /api/dashboard/staff
router.get('/staff', protect, async (req, res) => {
    try {
        if (req.user.role !== 'staff') return res.status(403).json({ message: 'Not authorized' });

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
        res.status(500).json({ message: 'Error fetching dashboard data' });
    }
});

// GET /api/dashboard/student
router.get('/student', protect, async (req, res) => {
    try {
        if (req.user.role !== 'student') return res.status(403).json({ message: 'Not authorized' });

        const pendingLeaves = await LeaveRequest.countDocuments({
            student: req.user._id,
            status: 'pending'
        });

        const today = new Date();
        today.setUTCHours(0,0,0,0);
        const attendance = await Attendance.findOne({
            student: req.user._id,
            date: { $gte: today }
        });

        const pendingInvoices = await Invoice.find({ 
            $or: [{ student: req.user._id }, { studentName: req.user.name }],
            status: 'Pending'
        }).sort({ createdAt: -1 }).limit(5);

        res.json({
            todayClock: attendance ? (attendance.status === 'present' ? 'Present' : 'Absent') : 'Not In',
            pendingLeaves,
            pendingInvoices
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching dashboard data' });
    }
});

module.exports = router;
