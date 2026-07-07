const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const ClassModel = require('../models/Class');

// GET /api/dashboard/admin?period=month&month=7&year=2026
router.get('/admin', async (req, res) => {
    try {
        const { period, month, year } = req.query;
        const now = new Date();
        const targetMonth = parseInt(month) || (now.getMonth() + 1);
        const targetYear = parseInt(year) || now.getFullYear();

        // Build date range filter
        let dateFilter = {};
        if (period === 'month') {
            const start = new Date(targetYear, targetMonth - 1, 1);
            const end = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);
            dateFilter = { createdAt: { $gte: start, $lte: end } };
        } else if (period === 'year') {
            const start = new Date(targetYear, 0, 1);
            const end = new Date(targetYear, 11, 31, 23, 59, 59, 999);
            dateFilter = { createdAt: { $gte: start, $lte: end } };
        }

        const studentCount = await User.countDocuments({ role: 'student' });
        const staffCount = await User.countDocuments({ role: 'staff' });

        const recentPayments = await Payment.find(dateFilter).sort({ createdAt: -1 }).limit(5);
        const pendingInvoices = await Invoice.find({ status: 'Pending' }).sort({ createdAt: -1 }).limit(5);

        const allPayments = await Payment.find(dateFilter);
        const collected = allPayments.reduce((sum, p) => {
            const num = parseInt(p.amount.replace(/[₹,]/g, '')) || 0;
            return sum + num;
        }, 0);

        const allPendingInvoices = await Invoice.find({ status: 'Pending' });
        const outstanding = allPendingInvoices.reduce((sum, inv) => {
            const num = parseInt(inv.amount.replace(/[₹,]/g, '')) || 0;
            return sum + num;
        }, 0);

        // Payment method breakdown for donut chart
        const allPaymentsFull = await Payment.find(dateFilter);
        const methodCounts = {};
        allPaymentsFull.forEach(p => {
            const method = p.method || 'Other';
            methodCounts[method] = (methodCounts[method] || 0) + 1;
        });
        const methodColorMap = {
            'Cash': '#10B981',
            'Bank Transfer': '#3B82F6',
            'Cheque': '#F59E0B',
            'Online': '#8B5CF6',
            'Other': '#EC4899'
        };
        const paymentMethodData = Object.entries(methodCounts).map(([label, value]) => ({
            label, value,
            color: methodColorMap[label] || '#8B5CF6'
        }));

        // Invoice status breakdown for stacked bar
        const allInvoices = await Invoice.find(dateFilter);
        const statusCounts = { Paid: 0, Pending: 0, Partial: 0, Overdue: 0 };
        allInvoices.forEach(inv => {
            const s = inv.status || 'Pending';
            statusCounts[s] = (statusCounts[s] || 0) + 1;
        });
        const invoiceStatusData = [
            { label: 'Paid', value: statusCounts.Paid, color: '#10B981' },
            { label: 'Pending', value: statusCounts.Pending, color: '#F59E0B' },
            { label: 'Partial', value: statusCounts.Partial, color: '#3B82F6' },
        ].filter(d => d.value > 0);

        // Class-wise data for horizontal bar chart
        const classes = await ClassModel.find({});
        const classWiseData = [];
        for (const cls of classes) {
            const count = await User.countDocuments({ role: 'student', 'profile.className': cls.name });
            classWiseData.push({
                label: cls.name,
                value: count,
                color: '#FF9F43'
            });
        }

        // Pending and overdue counts
        const pendingCount = await Invoice.countDocuments({ status: 'Pending' });
        const overdueCount = await Invoice.countDocuments({ status: 'Overdue' });

        const stats = {
            students: studentCount,
            staff: staffCount,
            collected: `₹${collected.toLocaleString('en-IN')}`,
            outstanding: `₹${outstanding.toLocaleString('en-IN')}`
        };

        res.json({
            stats,
            recentPayments,
            pendingInvoices,
            pendingCount,
            overdueCount,
            paymentMethodData,
            invoiceStatusData,
            classWiseData
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
