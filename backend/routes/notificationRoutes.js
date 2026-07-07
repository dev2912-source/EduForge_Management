const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/authMiddleware');

// GET /api/notifications - list notifications for current user
router.get('/', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ notifications });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

// GET /api/notifications/unread-count
router.get('/unread-count', protect, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
    res.json({ count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching unread count' });
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', protect, async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true }
    );
    res.json({ message: 'Marked as read' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error marking notification as read' });
  }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );
    res.json({ message: 'All marked as read' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error marking all as read' });
  }
});

module.exports = router;
