const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const ClassModel = require('../models/Class');
const FeeStructure = require('../models/FeeStructure');
const Attendance = require('../models/Attendance');
const Timetable = require('../models/Timetable');
const AcademicHistory = require('../models/AcademicHistory');
const LeaveRequest = require('../models/LeaveRequest');
const SalarySlip = require('../models/SalarySlip');
const Contact = require('../models/Contact');
const Notification = require('../models/Notification');

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

// Seed demo data (call via GET /api/auth/seed)
router.get('/seed', async (req, res) => {
    try {
        // Clear all collections
        await Promise.all([
            User.deleteMany(), ClassModel.deleteMany(), FeeStructure.deleteMany(),
            Timetable.deleteMany(), Attendance.deleteMany(), Invoice.deleteMany(),
            Payment.deleteMany(), LeaveRequest.deleteMany(), AcademicHistory.deleteMany(),
            SalarySlip.deleteMany(), Contact.deleteMany(), Notification.deleteMany()
        ]);

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('Test@123', salt);

        // 1. Create classes
        const classNames = [];
        for (let i = 1; i <= 12; i++) {
            const name = `Class ${i}`;
            classNames.push(name);
            await ClassModel.create({ name, medium: ['ENGLISH','HINDI','MARATHI','GUJARATI'][i%4], sections: i <= 8 ? 2 : 1 });
        }

        // 2. Create admin
        const adminUser = await User.create({ name: 'Admin User', email: 'demo@edufordge.com', password: 'Test@123', role: 'admin' });

        // Notifications for admin
        const notifMessages = [
          { title: 'Welcome to EduFordge', message: 'Your school management platform is ready.' },
          { title: 'New Student Registered', message: 'Shikha Bansal has been registered in Class 1-A.' },
          { title: 'Payment Received', message: 'A payment of ₹4,000 has been received from Shikha Bansal.' },
          { title: 'Salary Slips Generated', message: 'Salary slips for June 2026 have been generated.' },
          { title: 'Leave Request Pending', message: 'Shikha Bansal has submitted a leave request for Dec 22-24.' },
        ];
        await Notification.insertMany(notifMessages.map(n => ({ recipient: adminUser._id, title: n.title, message: n.message })));

        // 3. Create staff
        const staffDocs = [];
        for (let i = 1; i <= 20; i++) {
            staffDocs.push({ name: `Staff ${i}`, schoolId: `STF-2026-${i.toString().padStart(4, '0')}`, password: hashedPassword, role: 'staff' });
        }
        const staffUsers = await User.insertMany(staffDocs);

        // 4. Create students
        const studentDocs = [];
        for (let i = 1; i <= 100; i++) {
            const classIdx = (i - 1) % 12;
            studentDocs.push({
                name: `Student ${i}`, schoolId: `STU-2026-${i.toString().padStart(4, '0')}`,
                password: hashedPassword, role: 'student',
                profile: { className: `Class ${classIdx + 1}`, section: i % 2 === 0 ? 'A' : 'B', status: 'active', academicYear: '2025-2026' }
            });
        }
        const studentUsers = await User.insertMany(studentDocs);

        // 5. Create fee structures
        const feeData = [];
        for (const cn of classNames) {
            feeData.push({ className: cn, academicYear: '2025-2026', category: 'Tuition Fee', amount: 3000 + classNames.indexOf(cn) * 300, frequency: 'Monthly', dueDay: 10 });
            feeData.push({ className: cn, academicYear: '2025-2026', category: 'Annual Charges', amount: 5000 + classNames.indexOf(cn) * 500, frequency: 'Annually', dueDay: 10 });
        }
        await FeeStructure.insertMany(feeData);

        // 6. Create timetables (Class 1, section A only for brevity)
        const days = ['MON','TUE','WED','THU','FRI','SAT'];
        const subs = ['Mathematics','Science','English','Hindi','Social Studies','Computer Science','Sanskrit'];
        const teachers = ['Mr. Sharma','Ms. Gupta','Mr. Kumar','Ms. Patel','Mr. Reddy','Ms. Nair','Mr. Joshi'];
        const colors = ['#6C63FF','#10B981','#F59E0B','#EF4444','#8B5CF6','#14B8A6','#EC4899'];
        const tt = [];
        for (const cn of classNames.slice(0, 3)) {
            for (const sec of ['A','B']) {
                for (const day of days) {
                    for (let p = 1; p <= 7; p++) {
                        const idx = (p - 1 + days.indexOf(day)) % subs.length;
                        tt.push({ className: cn, section: sec, dayOfWeek: day, period: p,
                            timeRange: `${7 + p}:00 AM - ${7 + p}:45 AM`, subject: subs[idx], teacher: teachers[idx], colorCode: colors[idx] });
                    }
                }
            }
        }
        await Timetable.insertMany(tt);

        // 7. Create some invoices and payments
        const payMethods = ['Online','Cash','Bank Transfer','Cheque'];
        const invData = [];
        const payData = [];
        for (let i = 0; i < 30; i++) {
            const student = studentUsers[i];
            const amt = (3000 + (i % 5) * 1000).toString();
            invData.push({ invoiceId: `INV-2026-${(3000 + i).toString().padStart(5, '0')}`, student: student._id, studentName: student.name, amount: `₹${amt}`, paidAmount: i % 3 === 0 ? `₹${amt}` : '₹0', balance: i % 3 === 0 ? '₹0' : `₹${amt}`, dueDate: `10 ${['Jan','Feb','Mar'][i%3]} 2026`, status: i % 3 === 0 ? 'Paid' : 'Pending' });
            if (i % 3 === 0) {
                payData.push({ receiptId: `RCP-2026-${(2500 + i).toString().padStart(5, '0')}`, invoiceId: `INV-2026-${(3000 + i).toString().padStart(5, '0')}`, student: student._id, studentName: student.name, amount: `₹${amt}`, method: payMethods[i % 4], date: `05 ${['Jan','Feb','Mar'][i%3]} 2026` });
            }
        }
        await Invoice.insertMany(invData);
        await Payment.insertMany(payData);

        // 8. Create salary slips for staff
        const salaryData = [];
        for (const staff of staffUsers) {
            for (const month of ['April 2026', 'May 2026', 'June 2026']) {
                const gross = 25000 + Math.floor(Math.random() * 40000);
                salaryData.push({ staff: staff._id, month, gross, deductions: Math.round(gross * 0.1), net: Math.round(gross * 0.9), status: month === 'June 2026' ? 'Pending' : 'Paid' });
            }
        }
        await SalarySlip.insertMany(salaryData);

        res.json({ message: 'Full demo data seeded successfully', stats: { classes: 12, staff: 20, students: 100, invoices: 30, payments: payData.length, salarySlips: 60 } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error seeding data' });
    }
});
