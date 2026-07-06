const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');

const router = express.Router();

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', {
        expiresIn: '30d',
    });
};

router.post('/login', async (req, res) => {
    const { identifier, password } = req.body;
    try {
        const user = await User.findOne({ 
            $or: [{ email: identifier }, { schoolId: identifier }] 
        });
        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                schoolId: user.schoolId,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

router.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const user = await User.create({
            name, email, password, role
        });
        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;

// Seed demo users (call this once via GET /api/auth/seed)
router.get('/seed', async (req, res) => {
    try {
        await User.deleteMany({});
        await Payment.deleteMany({});
        await Invoice.deleteMany({});
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('Test@123', salt);

        const demoUsers = [
            {
                name: 'Admin User',
                email: 'demo@edufordge.com',
                password: hashedPassword,
                role: 'admin'
            }
        ];
        
        for (let i = 1; i <= 20; i++) {
            demoUsers.push({ name: `Staff ${i}`, schoolId: `STF-2026-${i.toString().padStart(4, '0')}`, password: hashedPassword, role: 'staff' });
        }
        
        for (let i = 1; i <= 500; i++) {
            demoUsers.push({ name: `Student ${i}`, schoolId: `STU-2026-${i.toString().padStart(4, '0')}`, password: hashedPassword, role: 'student' });
        }

        const payments = [
            { name: "Karishma Mukherjee", id: "RCP-2026-02502", amount: "₹4,000", method: "cash" },
            { name: "Simran Seth", id: "RCP-2026-02501", amount: "₹5,000", method: "bank transfer" },
            { name: "Mahesh Joshi", id: "RCP-2026-02435", amount: "₹5,250", method: "cheque" },
            { name: "Priya Khanna", id: "RCP-2026-02433", amount: "₹5,250", method: "bank transfer" },
            { name: "Girish Chaudhary", id: "RCP-2026-02434", amount: "₹5,250", method: "online" }
        ].map(p => ({ receiptId: p.id, studentName: p.name, amount: p.amount, method: p.method }));

        const invoices = [
            { name: "Prachi Ghosh", id: "INV-2026-02977", due: "Due 10 Feb", amount: "₹4,000", status: "Pending" },
            { name: "Anjali Bhatia", id: "INV-2026-02976", due: "Due 10 Feb", amount: "₹4,000", status: "Pending" },
            { name: "Harsh Deshpande", id: "INV-2026-02951", due: "Due 10 Feb", amount: "₹4,000", status: "Pending" },
            { name: "Ramesh Mehra", id: "INV-2026-02950", due: "Due 10 Feb", amount: "₹4,000", status: "Pending" },
            { name: "Meera Sinha", id: "INV-2026-02952", due: "Due 10 Feb", amount: "₹4,000", status: "Pending" }
        ].map(i => ({ invoiceId: i.id, studentName: i.name, amount: i.amount, dueDate: i.due, status: i.status }));

        await User.insertMany(demoUsers);
        await Payment.insertMany(payments);
        await Invoice.insertMany(invoices);
        res.json({ message: 'Demo data seeded successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error seeding users' });
    }
});
