const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Timetable = require('../models/Timetable');

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
