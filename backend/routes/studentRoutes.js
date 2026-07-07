const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { protect } = require('../middleware/authMiddleware');

const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Timetable = require('../models/Timetable');
const AcademicHistory = require('../models/AcademicHistory');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const LeaveRequest = require('../models/LeaveRequest');

// @route   GET /api/student/profile
// @desc    Get student profile data
// @access  Private
router.get('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
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
// @desc    Get attendance records for the student
// @access  Private
router.get('/attendance', protect, async (req, res) => {
    try {
        const records = await Attendance.find({ student: req.user._id }).sort({ date: -1 });
        res.json(records);
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
        res.json(history);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/student/fees
// @desc    Get invoices for the student
// @access  Private
router.get('/fees', protect, async (req, res) => {
    try {
        // Fallback to searching by student name if student ID isn't linked yet
        const invoices = await Invoice.find({ 
            $or: [{ student: req.user._id }, { studentName: req.user.name }] 
        }).sort({ createdAt: -1 });
        res.json(invoices);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/student/payments
// @desc    Get payment receipts for the student
// @access  Private
router.get('/payments', protect, async (req, res) => {
    try {
        const payments = await Payment.find({ 
            $or: [{ student: req.user._id }, { studentName: req.user.name }] 
        }).sort({ createdAt: -1 });
        res.json(payments);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/student/leave
// @desc    Get leave requests for the student
// @access  Private
router.get('/leave', protect, async (req, res) => {
    try {
        const leaves = await LeaveRequest.find({ student: req.user._id }).sort({ createdAt: -1 });
        res.json(leaves);
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
        const leave = new LeaveRequest({
            student: req.user._id,
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

// PUT /api/student/profile/update - Update own profile
router.put('/profile/update', protect, async (req, res) => {
  try {
    const { phone, address, gender, dateOfBirth, parentDetails } = req.body;
    const updateData = {};
    if (phone) updateData['profile.phone'] = phone;
    if (address) updateData['profile.address'] = address;
    if (gender) updateData['profile.gender'] = gender;
    if (dateOfBirth) updateData['profile.dateOfBirth'] = dateOfBirth;
    if (parentDetails) updateData['profile.parentDetails'] = parentDetails;

    const user = await User.findByIdAndUpdate(req.user._id, updateData, { new: true });
    res.json({ success: true, data: user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
