const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');

// @route   POST /api/contact
// @desc    Submit a contact form message
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, schoolName, message } = req.body;

    const newContact = await Contact.create({
      name,
      email,
      phone,
      schoolName,
      message
    });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully!',
      data: newContact
    });
  } catch (err) {
    console.error(err);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

module.exports = router;
