const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load env vars
dotenv.config();

const User = require('./models/User');
const Payment = require('./models/Payment');
const Invoice = require('./models/Invoice');
const Attendance = require('./models/Attendance');
const Timetable = require('./models/Timetable');
const AcademicHistory = require('./models/AcademicHistory');
const LeaveRequest = require('./models/LeaveRequest');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/edufordge');
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
        process.exit(1);
    }
};

const seedData = async () => {
    try {
        await connectDB();

        console.log('Clearing old data...');
        await User.deleteMany();
        await Payment.deleteMany();
        await Invoice.deleteMany();
        await Attendance.deleteMany();
        await Timetable.deleteMany();
        await AcademicHistory.deleteMany();
        await LeaveRequest.deleteMany();

        console.log('Seeding new data...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('Test@123', salt);

        // 1. Create a primary student user for testing
        const mainStudent = await User.create({
            name: 'Shikha Bansal',
            email: 'stu-2026-0001@school.com',
            schoolId: 'STU-2026-0001',
            password: 'Test@123',
            role: 'student',
            profile: {
                phone: '9585819729',
                dateOfBirth: new Date('2009-01-24'),
                gender: 'Female',
                bloodGroup: 'AB+',
                admissionDate: new Date('2025-06-01'),
                address: '519, Shyam Nagar, Vijayawada',
                parentDetails: {
                    fatherName: 'Dhruv Das',
                    fatherPhone: '9270602946',
                    motherName: 'Pallavi Shukla',
                    motherPhone: '9402204584'
                },
                className: 'Class 1',
                section: 'A',
                status: 'active',
                academicYear: '2025-2026',
                rollNumber: '001'
            }
        });

        // 2. Create Invoices and Payments for the student
        await Invoice.insertMany([
            { invoiceId: "INV-2026-02977", student: mainStudent._id, studentName: mainStudent.name, amount: "₹4,000", dueDate: "10 Feb 2026", status: "Pending" },
            { invoiceId: "INV-2026-01550", student: mainStudent._id, studentName: mainStudent.name, amount: "₹4,000", paidAmount: "₹4,000", balance: "₹0", dueDate: "10 Jan 2026", status: "Paid" }
        ]);

        await Payment.insertMany([
            { receiptId: "RCP-2026-02502", invoiceId: "INV-2026-01550", student: mainStudent._id, studentName: mainStudent.name, amount: "₹4,000", method: "Online", date: "05 Jan 2026" }
        ]);

        // 3. Create Timetable for Class 1 Section A
        const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        const subjects = [
            { name: 'Mathematics', teacher: 'Mr. Sharma', color: '#6C63FF' },
            { name: 'Science', teacher: 'Mrs. Gupta', color: '#10B981' },
            { name: 'English', teacher: 'Mr. Davis', color: '#F59E0B' },
            { name: 'History', teacher: 'Ms. Patel', color: '#EF4444' }
        ];

        const timetables = [];
        for (const day of days) {
            for (let period = 1; period <= 4; period++) {
                const sub = subjects[(period - 1 + days.indexOf(day)) % subjects.length];
                timetables.push({
                    className: 'Class 1',
                    section: 'A',
                    dayOfWeek: day,
                    period: period,
                    timeRange: `${8 + period - 1}:00 AM - ${8 + period - 1}:45 AM`,
                    subject: sub.name,
                    teacher: sub.teacher,
                    colorCode: sub.color
                });
            }
            // Add periods after lunch
            for (let period = 5; period <= 7; period++) {
                 const sub = subjects[(period - 1 + days.indexOf(day)) % subjects.length];
                 timetables.push({
                    className: 'Class 1',
                    section: 'A',
                    dayOfWeek: day,
                    period: period,
                    timeRange: `${8 + period - 1 + 1}:00 AM - ${8 + period - 1 + 1}:45 AM`,
                    subject: sub.name,
                    teacher: sub.teacher,
                    colorCode: sub.color
                });
            }
        }
        await Timetable.insertMany(timetables);

        // 4. Create Academic History
        await AcademicHistory.insertMany([
            { student: mainStudent._id, academicYear: '2024-2025', className: 'UKG', section: 'A', status: 'promoted', remarks: 'Excellent performance' },
            { student: mainStudent._id, academicYear: '2023-2024', className: 'LKG', section: 'A', status: 'promoted', remarks: 'Good progress' }
        ]);

        // 5. Create Leave Requests
        await LeaveRequest.create({
            student: mainStudent._id,
            fromDate: new Date('2025-12-22'),
            toDate: new Date('2025-12-24'),
            reason: 'Family travel',
            status: 'approved'
        });

        // 6. Create Attendance for the current month
        const attendanceRecords = [];
        const today = new Date();
        for (let i = 1; i <= 30; i++) {
            const date = new Date(today.getFullYear(), today.getMonth(), i);
            if (date.getDay() === 0) {
                // Sunday
                attendanceRecords.push({ student: mainStudent._id, date, status: 'Weekend' });
            } else if (date.getDay() === 6) {
                // Saturday
                attendanceRecords.push({ student: mainStudent._id, date, status: 'Weekend' });
            } else {
                // Randomly assign Present or Absent
                const isPresent = Math.random() > 0.1;
                attendanceRecords.push({ 
                    student: mainStudent._id, 
                    date, 
                    status: isPresent ? 'Present' : 'Absent',
                    remark: isPresent ? '—' : 'Sick'
                });
            }
        }
        await Attendance.insertMany(attendanceRecords);


        // Add Admin and Staff users just so they exist
        await User.create({
            name: 'Admin User',
            email: 'demo@edufordge.com',
            password: 'Test@123',
            role: 'admin'
        });

        await User.create({
            name: 'Staff Member',
            email: 'staff@edufordge.com',
            schoolId: 'STF-2026-0001',
            password: 'Test@123',
            role: 'staff'
        });

        console.log('Database Seeding Completed Successfully!');
        process.exit();
    } catch (err) {
        console.error('Seeding Error:', err);
        process.exit(1);
    }
};

seedData();
