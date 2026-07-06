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

module.exports = router;
