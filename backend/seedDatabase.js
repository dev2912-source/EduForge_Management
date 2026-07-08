const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('./models/User');
const ClassModel = require('./models/Class');
const FeeStructure = require('./models/FeeStructure');
const Timetable = require('./models/Timetable');
const Attendance = require('./models/Attendance');
const Invoice = require('./models/Invoice');
const Payment = require('./models/Payment');
const LeaveRequest = require('./models/LeaveRequest');
const AcademicHistory = require('./models/AcademicHistory');
const SalarySlip = require('./models/SalarySlip');
const Contact = require('./models/Contact');
const Notification = require('./models/Notification');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/edufordge');
  console.log('MongoDB Connected');
};

const staffNames = [
  'Amit Sharma', 'Priya Gupta', 'Rajesh Kumar', 'Sunita Patel', 'Vikram Singh',
  'Anita Desai', 'Suresh Reddy', 'Neha Verma', 'Deepak Joshi', 'Kavita Nair',
  'Rahul Mehta', 'Pooja Saxena', 'Manish Tiwari', 'Shweta Kapoor', 'Arun Pillai',
  'Divya Agarwal', 'Sanjay Yadav', 'Megha Roy', 'Ravi Shankar', 'Nandini Iyer'
];

const studentFirstNames = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
  'Ananya', 'Aadhya', 'Diya', 'Anaya', 'Myra', 'Sara', 'Ira', 'Saanvi', 'Aaradhya', 'Navya',
  'Rohan', 'Shiv', 'Kabir', 'Dhruv', 'Aryan', 'Shaurya', 'Yash', 'Pranav', 'Om', 'Rudra',
  'Aanya', 'Paridhi', 'Kyra', 'Tara', 'Riya', 'Siya', 'Ishita', 'Jhanvi', 'Mishika', 'Sneha',
  'Laksh', 'Tanay', 'Neel', 'Dev', 'Rishabh', 'Kian', 'Aarush', 'Veer', 'Ansh', 'Harsh',
  'Tanvi', 'Gauri', 'Vaishnavi', 'Ishani', 'Tanisha', 'Kritika', 'Swara', 'Shanaya', 'Manvi', 'Bhavya',
  'Kunal', 'Raghav', 'Harshit', 'Sarthak', 'Naman', 'Yuvraj', 'Kartik', 'Mohan', 'Abhay', 'Ayush',
  'Charvi', 'Anvi', 'Hiral', 'Kashvi', 'Lavanya', 'Manya', 'Nishtha', 'Prisha', 'Rudrani', 'Shreya',
  'Samar', 'Shaan', 'Rian', 'Reyansh', 'Krishiv', 'Siddharth', 'Ritvik', 'Ihaan', 'Dhruv', 'Kanav'
];

const lastNames = [
  'Sharma', 'Verma', 'Patel', 'Gupta', 'Singh', 'Reddy', 'Nair', 'Joshi', 'Mehta', 'Kapoor',
  'Desai', 'Kumar', 'Agarwal', 'Pillai', 'Saxena', 'Yadav', 'Roy', 'Iyer', 'Shankar', 'Tiwari',
  'Bansal', 'Chopra', 'Malhotra', 'Seth', 'Bhatia', 'Ghosh', 'Mukherjee', 'Das', 'Saha', 'Bose'
];

const subjectsList = [
  { name: 'Mathematics', teachers: ['Mr. Sharma', 'Mr. Kumar', 'Ms. Gupta'], color: '#6C63FF' },
  { name: 'Science', teachers: ['Ms. Patel', 'Mr. Reddy', 'Mrs. Nair'], color: '#10B981' },
  { name: 'English', teachers: ['Mr. Joshi', 'Ms. Mehta', 'Mr. Singh'], color: '#F59E0B' },
  { name: 'Hindi', teachers: ['Ms. Verma', 'Mr. Kapoor', 'Mrs. Desai'], color: '#EF4444' },
  { name: 'Social Studies', teachers: ['Mr. Agarwal', 'Ms. Saxena', 'Mr. Yadav'], color: '#8B5CF6' },
  { name: 'Sanskrit', teachers: ['Ms. Iyer', 'Mr. Shankar', 'Mrs. Roy'], color: '#EC4899' },
  { name: 'Computer Science', teachers: ['Mr. Pillai', 'Ms. Tiwari', 'Mr. Chopra'], color: '#14B8A6' }
];

const feeCategories = {
  'Class 1': [
    { category: 'Tuition Fee', amount: 3000, frequency: 'Monthly' },
    { category: 'Annual Charges', amount: 5000, frequency: 'Annually' },
    { category: 'Development Fee', amount: 1500, frequency: 'Quarterly' }
  ],
  'Class 2': [
    { category: 'Tuition Fee', amount: 3200, frequency: 'Monthly' },
    { category: 'Annual Charges', amount: 5500, frequency: 'Annually' },
    { category: 'Development Fee', amount: 1500, frequency: 'Quarterly' }
  ],
  'Class 3': [
    { category: 'Tuition Fee', amount: 3500, frequency: 'Monthly' },
    { category: 'Annual Charges', amount: 6000, frequency: 'Annually' },
    { category: 'Development Fee', amount: 2000, frequency: 'Quarterly' }
  ],
  'Class 4': [
    { category: 'Tuition Fee', amount: 3500, frequency: 'Monthly' },
    { category: 'Annual Charges', amount: 6000, frequency: 'Annually' },
    { category: 'Development Fee', amount: 2000, frequency: 'Quarterly' }
  ],
  'Class 5': [
    { category: 'Tuition Fee', amount: 4000, frequency: 'Monthly' },
    { category: 'Annual Charges', amount: 6500, frequency: 'Annually' },
    { category: 'Development Fee', amount: 2000, frequency: 'Quarterly' }
  ],
  'Class 6': [
    { category: 'Tuition Fee', amount: 4500, frequency: 'Monthly' },
    { category: 'Annual Charges', amount: 7000, frequency: 'Annually' },
    { category: 'Development Fee', amount: 2500, frequency: 'Quarterly' },
    { category: 'Computer Lab Fee', amount: 500, frequency: 'Monthly' }
  ],
  'Class 7': [
    { category: 'Tuition Fee', amount: 4500, frequency: 'Monthly' },
    { category: 'Annual Charges', amount: 7500, frequency: 'Annually' },
    { category: 'Development Fee', amount: 2500, frequency: 'Quarterly' },
    { category: 'Computer Lab Fee', amount: 500, frequency: 'Monthly' }
  ],
  'Class 8': [
    { category: 'Tuition Fee', amount: 5000, frequency: 'Monthly' },
    { category: 'Annual Charges', amount: 8000, frequency: 'Annually' },
    { category: 'Development Fee', amount: 3000, frequency: 'Quarterly' },
    { category: 'Computer Lab Fee', amount: 500, frequency: 'Monthly' },
    { category: 'Science Lab Fee', amount: 300, frequency: 'Monthly' }
  ],
  'Class 9': [
    { category: 'Tuition Fee', amount: 5500, frequency: 'Monthly' },
    { category: 'Annual Charges', amount: 9000, frequency: 'Annually' },
    { category: 'Development Fee', amount: 3500, frequency: 'Quarterly' },
    { category: 'Computer Lab Fee', amount: 500, frequency: 'Monthly' },
    { category: 'Science Lab Fee', amount: 500, frequency: 'Monthly' }
  ],
  'Class 10': [
    { category: 'Tuition Fee', amount: 6000, frequency: 'Monthly' },
    { category: 'Annual Charges', amount: 10000, frequency: 'Annually' },
    { category: 'Development Fee', amount: 4000, frequency: 'Quarterly' },
    { category: 'Computer Lab Fee', amount: 500, frequency: 'Monthly' },
    { category: 'Science Lab Fee', amount: 500, frequency: 'Monthly' }
  ],
  'Class 11': [
    { category: 'Tuition Fee', amount: 7000, frequency: 'Monthly' },
    { category: 'Annual Charges', amount: 12000, frequency: 'Annually' },
    { category: 'Development Fee', amount: 5000, frequency: 'Quarterly' },
    { category: 'Computer Lab Fee', amount: 500, frequency: 'Monthly' },
    { category: 'Science Lab Fee', amount: 500, frequency: 'Monthly' }
  ],
  'Class 12': [
    { category: 'Tuition Fee', amount: 7500, frequency: 'Monthly' },
    { category: 'Annual Charges', amount: 15000, frequency: 'Annually' },
    { category: 'Development Fee', amount: 5000, frequency: 'Quarterly' },
    { category: 'Computer Lab Fee', amount: 500, frequency: 'Monthly' },
    { category: 'Science Lab Fee', amount: 500, frequency: 'Monthly' }
  ]
};

const languageMediums = ['ENGLISH', 'HINDI', 'MARATHI', 'GUJARATI'];

const fatherNames = [
  'Rajesh', 'Suresh', 'Ramesh', 'Dinesh', 'Mukesh', 'Mahesh', 'Bhavesh', 'Girish',
  'Amit', 'Vijay', 'Sanjay', 'Ravi', 'Arun', 'Nitin', 'Prakash', 'Deepak',
  'Manoj', 'Anil', 'Sunil', 'Rakesh', 'Vinod', 'Ajay', 'Dhruv', 'Nikhil'
];
const motherNames = [
  'Priya', 'Sunita', 'Anita', 'Kavita', 'Neha', 'Pooja', 'Divya', 'Shweta',
  'Megha', 'Nandini', 'Pallavi', 'Rekha', 'Sneha', 'Geeta', 'Seema', 'Ritu',
  'Preeti', 'Anjali', 'Lata', 'Usha', 'Asha', 'Rashmi', 'Deepa', 'Madhu'
];
const phonePrefixes = ['98', '97', '99', '95', '93', '91', '87', '88', '94', '96'];

const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

let studentIndex = 0;

const seedData = async () => {
  try {
    await connectDB();

    console.log('Clearing old data...');
    await Promise.all([
      User.deleteMany(),
      ClassModel.deleteMany(),
      FeeStructure.deleteMany(),
      Timetable.deleteMany(),
      Attendance.deleteMany(),
      Invoice.deleteMany(),
      Payment.deleteMany(),
      LeaveRequest.deleteMany(),
      AcademicHistory.deleteMany(),
      SalarySlip.deleteMany(),
      Contact.deleteMany(),
      Notification.deleteMany()
    ]);

    console.log('Seeding new data...');

    // ── 1. CLASSES ──
    console.log('  Creating classes...');
    const classNames = [];
    const classDocs = [];
    for (let i = 1; i <= 12; i++) {
      const name = `Class ${i}`;
      classNames.push(name);
      classDocs.push({ name, medium: getRandomElement(languageMediums), sections: i <= 8 ? 2 : 1 });
    }
    await ClassModel.insertMany(classDocs);

    // ── 2. ADMIN ──
    console.log('  Creating admin user...');
    const admin = await User.create({
      name: 'Admin User',
      email: 'demo@edufordge.com',
      password: 'Test@123',
      role: 'admin'
    });

    // ── 3. NOTIFICATIONS FOR ADMIN ──
    console.log('  Creating notifications for admin...');
    const notificationMessages = [
      { title: 'Welcome to EduFordge', message: 'Your school management platform is ready. Start by adding students and staff.' },
      { title: 'New Student Registered', message: 'Shikha Bansal has been registered in Class 1-A.' },
      { title: 'Payment Received', message: 'A payment of ₹4,000 has been received from Shikha Bansal.' },
      { title: 'Leave Request Pending', message: 'Shikha Bansal has submitted a leave request for Dec 22-24.' },
      { title: 'Salary Slips Generated', message: 'Salary slips for June 2026 have been generated for all staff members.' },
    ];
    for (const notif of notificationMessages) {
      await Notification.create({ recipient: admin._id, title: notif.title, message: notif.message });
    }

    // ── 4. STAFF ──
    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash('Test@123', salt);
    const departments = ['Science', 'Mathematics', 'English', 'Hindi', 'Social Studies', 'Computer Science', 'Physical Education', 'Arts', 'Administration'];
    const designations = ['Senior Teacher', 'Junior Teacher', 'Department Head', 'Lab Assistant', 'Administrative Staff', 'Counselor', 'Librarian'];
    const employmentTypes = ['full-time', 'full-time', 'full-time', 'full-time', 'part-time', 'contract'];
    const staffDocs = staffNames.map((name, i) => {
      const nameParts = name.split(' ');
      return {
        name,
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(' ') || nameParts[0],
        email: `staff${i + 1}@edufordge.com`,
        schoolId: `STF-2026-${(i + 1).toString().padStart(4, '0')}`,
        password: hashedPass,
        role: 'staff',
        department: departments[i % departments.length],
        designation: designations[i % designations.length],
        employmentType: employmentTypes[i % employmentTypes.length],
        dateOfJoining: new Date(today.getFullYear() - getRandomInt(1, 5), getRandomInt(0, 11), getRandomInt(1, 28)),
        isActive: i < 18,
        profile: {
          phone: `${getRandomElement(phonePrefixes)}${getRandomInt(10000000, 99999999)}`,
          gender: i % 2 === 0 ? 'Male' : 'Female',
          address: `${getRandomInt(1, 999)}, ${['MG Road', 'Park Street', 'Lake View', 'Green Park', 'Sector'][getRandomInt(0, 4)]}, ${['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Ahmedabad'][getRandomInt(0, 4)]}`
        }
      };
    });
    const staffUsers = await User.insertMany(staffDocs);

    // ── 5. PRIMARY TEST STUDENT ──
    console.log('  Creating primary test student (Shikha Bansal)...');
    const mainStudent = await User.create({
      name: 'Shikha Bansal',
      email: 'shikha.bansal@school.com',
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

    // ── 6. STUDENTS ──
    console.log('  Creating student users...');
    const allStudents = [mainStudent];
    const studentsByClass = {};

    for (const cn of classNames) {
      studentsByClass[cn] = [];
    }
    studentsByClass['Class 1'].push(mainStudent);

    const studentDocs = [];
    for (let i = 0; i < studentFirstNames.length; i++) {
      const firstName = studentFirstNames[i];
      const lastName = getRandomElement(lastNames);
      const fullName = `${firstName} ${lastName}`;
      const classIdx = i % classNames.length;
      const className = classNames[classIdx];
      const sec = String.fromCharCode(65 + (Math.floor(i / classNames.length) % 2)); // A, B only

      studentDocs.push({
        name: fullName,
        email: `stu-2026-${(i + 2).toString().padStart(4, '0')}@school.com`,
        schoolId: `STU-2026-${(i + 2).toString().padStart(4, '0')}`,
        password: hashedPass,
        role: 'student',
        profile: {
          phone: `${getRandomElement(phonePrefixes)}${getRandomInt(10000000, 99999999)}`,
          dateOfBirth: new Date(`${2016 - Math.floor(classIdx / 2)}-${getRandomInt(1, 12)}-${getRandomInt(1, 28)}`),
          gender: getRandomElement(['Male', 'Female']),
          bloodGroup: getRandomElement(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']),
          admissionDate: new Date('2025-06-01'),
          address: `${getRandomInt(1, 999)}, ${['MG Road', 'Park Street', 'Lake View', 'Green Park', 'Sector'][getRandomInt(0, 4)]}, ${['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Ahmedabad'][getRandomInt(0, 4)]}`,
          parentDetails: {
            fatherName: `${getRandomElement(fatherNames)} ${lastName}`,
            fatherPhone: `${getRandomElement(phonePrefixes)}${getRandomInt(10000000, 99999999)}`,
            motherName: `${getRandomElement(motherNames)} ${lastName}`,
            motherPhone: `${getRandomElement(phonePrefixes)}${getRandomInt(10000000, 99999999)}`
          },
          className,
          section: sec,
          status: 'active',
          academicYear: '2025-2026',
          rollNumber: '001'
        }
      });
    }

    const createdStudents = await User.insertMany(studentDocs);
    for (const s of createdStudents) {
      allStudents.push(s);
      const cn = s.profile.className;
      if (!studentsByClass[cn]) studentsByClass[cn] = [];
      studentsByClass[cn].push(s);
    }

    // ── 7. FEE STRUCTURES ──
    console.log('  Creating fee structures...');
    for (const [className, categories] of Object.entries(feeCategories)) {
      for (const cat of categories) {
        await FeeStructure.create({
          className,
          academicYear: '2025-2026',
          category: cat.category,
          amount: cat.amount,
          frequency: cat.frequency,
          dueDay: 10
        });
      }
    }

    // ── 8. TIMETABLES ──
    console.log('  Creating timetables...');
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const timePeriods = [
      '8:00 AM - 8:45 AM', '8:45 AM - 9:30 AM', '9:30 AM - 10:15 AM', '10:15 AM - 11:00 AM',
      '11:15 AM - 12:00 PM', '12:00 PM - 12:45 PM', '12:45 PM - 1:30 PM'
    ];

    const allTimetables = [];
    for (const className of classNames) {
      for (const section of ['A', 'B']) {
        for (const day of days) {
          for (let period = 1; period <= 7; period++) {
            const sub = subjectsList[(period - 1 + days.indexOf(day)) % subjectsList.length];
            allTimetables.push({
              className, section, dayOfWeek: day, period,
              timeRange: timePeriods[period - 1],
              subject: sub.name,
              teacher: sub.teachers[period % sub.teachers.length],
              colorCode: sub.color
            });
          }
        }
      }
    }
    // Split into chunks of 1000 to avoid huge single inserts
    for (let i = 0; i < allTimetables.length; i += 1000) {
      await Timetable.insertMany(allTimetables.slice(i, i + 1000));
    }

    // ── 9. ATTENDANCE (Students - 30 days) ──
    console.log('  Creating attendance records...');
    const today = new Date();
    const attendanceBatch = [];
    const usedDateStudent = new Set();

    for (const student of allStudents) {
      for (let i = 1; i <= 30; i++) {
        const date = new Date(today.getFullYear(), today.getMonth(), i);
        const key = `${student._id}-${date.toISOString().split('T')[0]}`;
        if (usedDateStudent.has(key)) continue;
        usedDateStudent.add(key);

        let status, remark;
        if (date.getDay() === 0) {
          status = 'Weekend'; remark = '—';
        } else if (date.getDay() === 6) {
          status = 'Weekend'; remark = '—';
        } else {
          const r = Math.random();
          if (r < 0.75) { status = 'Present'; remark = '—'; }
          else if (r < 0.85) { status = 'Absent'; remark = 'Sick'; }
          else if (r < 0.93) { status = 'Late'; remark = 'Traffic'; }
          else { status = 'Leave'; remark = 'Personal'; }
        }

        attendanceBatch.push({ student: student._id, date, status, remark });
      }
    }
    for (let i = 0; i < attendanceBatch.length; i += 1000) {
      await Attendance.insertMany(attendanceBatch.slice(i, i + 1000));
    }

    // ── 10. STAFF ATTENDANCE (Clock-in records - 30 days) ──
    console.log('  Creating staff attendance (clock-in) records...');
    const staffAttendanceBatch = [];
    for (const staff of staffUsers) {
      for (let i = 1; i <= 30; i++) {
        const date = new Date(today.getFullYear(), today.getMonth(), i);
        if (date.getDay() === 0) continue;
        const isPresent = Math.random() > 0.15;
        staffAttendanceBatch.push({
          student: staff._id,
          date,
          status: isPresent ? 'Present' : 'Absent',
          remark: isPresent ? '—' : 'Leave'
        });
      }
    }
    await Attendance.insertMany(staffAttendanceBatch);

    // ── 11. INVOICES ──
    console.log('  Creating invoices...');
    const invoiceMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const invoices = [];
    let invCounter = 2977;

    for (const student of allStudents) {
      const numInvoices = getRandomInt(2, 4);
      for (let j = 0; j < numInvoices; j++) {
        const monthIdx = j % invoiceMonths.length;
        const month = invoiceMonths[monthIdx];
        const amount = (getRandomInt(3, 8) * 1000);
        const isPaid = Math.random() > 0.4;
        const paidAmount = isPaid ? amount : getRandomInt(0, Math.floor(amount / 2));
        const invoiceStatus = isPaid ? 'Paid' : (paidAmount > 0 ? 'Partial' : 'Pending');

        invoices.push({
          invoiceId: `INV-2026-${invCounter.toString().padStart(5, '0')}`,
          student: student._id,
          studentName: student.name,
          amount: `₹${amount.toLocaleString('en-IN')}`,
          paidAmount: `₹${(paidAmount).toLocaleString('en-IN')}`,
          balance: `₹${(amount - paidAmount).toLocaleString('en-IN')}`,
          dueDate: `10 ${month} 2026`,
          status: invoiceStatus
        });
        invCounter++;
      }
    }
    await Invoice.insertMany(invoices);

    // ── 12. PAYMENTS ──
    console.log('  Creating payments...');
    const paymentMethods = ['Online', 'Cash', 'Bank Transfer', 'Cheque'];
    const paidInvoices = invoices.filter(inv => inv.status === 'Paid');
    const payments = [];
    let rcpCounter = 2502;

    for (const inv of paidInvoices) {
      payments.push({
        receiptId: `RCP-2026-${rcpCounter.toString().padStart(5, '0')}`,
        invoiceId: inv.invoiceId,
        student: inv.student,
        studentName: inv.studentName,
        amount: inv.amount,
        method: getRandomElement(paymentMethods),
        date: `${getRandomInt(1, 28)} ${inv.dueDate.split(' ')[1]} 2026`
      });
      rcpCounter++;
    }
    await Payment.insertMany(payments);

    // ── 13. LEAVE REQUESTS ──
    console.log('  Creating leave requests...');
    const leaveReasons = [
      'Family function', 'Medical appointment', 'Personal reason',
      'Religious festival', 'Travel with family', 'Not feeling well',
      'Family emergency', 'Competition participation'
    ];

    for (const student of allStudents) {
      if (Math.random() > 0.4) {
        const fromDay = getRandomInt(1, 28);
        const toDay = Math.min(fromDay + getRandomInt(1, 3), 30);
        const statusRoll = Math.random();
        const status = statusRoll < 0.5 ? 'pending' : (statusRoll < 0.8 ? 'approved' : 'rejected');

        await LeaveRequest.create({
          student: student._id,
          fromDate: new Date(today.getFullYear(), today.getMonth(), fromDay),
          toDate: new Date(today.getFullYear(), today.getMonth(), toDay),
          reason: getRandomElement(leaveReasons),
          status
        });
      }
    }

    // ── 14. ACADEMIC HISTORY ──
    console.log('  Creating academic history...');
    const pastYears = ['2022-2023', '2023-2024', '2024-2025'];
    const classMapping = {
      'Class 1': { prev: 'UKG', secPrev: 'LKG' },
      'Class 2': { prev: 'Class 1', secPrev: 'UKG' },
      'Class 3': { prev: 'Class 2', secPrev: 'Class 1' },
      'Class 4': { prev: 'Class 3', secPrev: 'Class 2' },
      'Class 5': { prev: 'Class 4', secPrev: 'Class 3' },
      'Class 6': { prev: 'Class 5', secPrev: 'Class 4' },
      'Class 7': { prev: 'Class 6', secPrev: 'Class 5' },
      'Class 8': { prev: 'Class 7', secPrev: 'Class 6' },
      'Class 9': { prev: 'Class 8', secPrev: 'Class 7' },
      'Class 10': { prev: 'Class 9', secPrev: 'Class 8' },
      'Class 11': { prev: 'Class 10', secPrev: 'Class 9' },
      'Class 12': { prev: 'Class 11', secPrev: 'Class 10' }
    };

    for (const student of allStudents) {
      const currentClass = student.profile.className || 'Class 1';
      const mapping = classMapping[currentClass] || { prev: 'UKG', secPrev: 'LKG' };

      await AcademicHistory.create({
        student: student._id,
        academicYear: '2024-2025',
        className: mapping.prev,
        section: 'A',
        status: 'promoted',
        remarks: 'Good performance'
      });
      await AcademicHistory.create({
        student: student._id,
        academicYear: '2023-2024',
        className: mapping.secPrev,
        section: 'A',
        status: 'promoted',
        remarks: 'Satisfactory progress'
      });
    }

    // ── 15. SALARY SLIPS ──
    console.log('  Creating salary slips...');
    const salaryMonths = [
      { label: 'April 2026', date: new Date(2026, 3, 1) },
      { label: 'May 2026', date: new Date(2026, 4, 1) },
      { label: 'June 2026', date: new Date(2026, 5, 1) }
    ];
    for (const staff of staffUsers) {
      for (const { label, date } of salaryMonths) {
        const gross = getRandomInt(30000, 70000);
        const basic = Math.round(gross * 0.5);
        const hra = Math.round(gross * 0.2);
        const da = Math.round(gross * 0.15);
        const ta = Math.round(gross * 0.08);
        const otherAllowances = gross - basic - hra - da - ta;
        const pfDeduction = Math.round(gross * 0.12);
        const taxDeduction = Math.round(gross * 0.05);
        const otherDeductions = getRandomInt(0, 500);
        const deductions = pfDeduction + taxDeduction + otherDeductions;
        const net = gross - deductions;
        const status = label === 'June 2026' ? 'Pending' : (Math.random() > 0.2 ? 'Paid' : 'Pending');

        await SalarySlip.create({
          staff: staff._id,
          month: label,
          slipMonth: date,
          gross,
          deductions,
          net,
          status,
          basic, hra, da, ta, otherAllowances,
          pfDeduction, taxDeduction, otherDeductions,
          paymentDate: status === 'Paid' ? new Date(date.getFullYear(), date.getMonth(), getRandomInt(1, 28)) : undefined
        });
      }
    }

    // ── 16. CONTACT FORM ──
    console.log('  Creating contact form submissions...');
    await Contact.create({
      name: 'Rahul Verma',
      email: 'rahul.verma@example.com',
      phone: '9876543210',
      schoolName: 'Delhi Public School',
      message: 'Interested in your school management platform. Please share pricing details.'
    });
    await Contact.create({
      name: 'Neha Gupta',
      email: 'neha.gupta@example.com',
      phone: '9876501234',
      schoolName: 'St. Marys Convent',
      message: 'We are looking for an ERP solution for our school. Can you arrange a demo?'
    });

    // ── 17. EXTRA DATA FOR PRIMARY TEST STUDENT ──
    console.log('  Creating extra data for primary test student (Shikha Bansal)...');
    // Extra invoices for mainStudent
    await Invoice.create({
      invoiceId: 'INV-2026-02977',
      student: mainStudent._id,
      studentName: mainStudent.name,
      amount: '₹4,000',
      paidAmount: '₹0',
      balance: '₹4,000',
      dueDate: '10 Feb 2026',
      status: 'Pending'
    });
    await Invoice.create({
      invoiceId: 'INV-2026-01550',
      student: mainStudent._id,
      studentName: mainStudent.name,
      amount: '₹4,000',
      paidAmount: '₹4,000',
      balance: '₹0',
      dueDate: '10 Jan 2026',
      status: 'Paid'
    });
    await Payment.create({
      receiptId: 'RCP-2026-02502',
      invoiceId: 'INV-2026-01550',
      student: mainStudent._id,
      studentName: mainStudent.name,
      amount: '₹4,000',
      method: 'Online',
      date: '05 Jan 2026'
    });
    // Extra leave for mainStudent
    await LeaveRequest.create({
      student: mainStudent._id,
      fromDate: new Date('2025-12-22'),
      toDate: new Date('2025-12-24'),
      reason: 'Family travel',
      status: 'approved'
    });
    // Extra academic history for mainStudent
    await AcademicHistory.create({
      student: mainStudent._id,
      academicYear: '2024-2025',
      className: 'UKG',
      section: 'A',
      status: 'promoted',
      remarks: 'Excellent performance'
    });
    await AcademicHistory.create({
      student: mainStudent._id,
      academicYear: '2023-2024',
      className: 'LKG',
      section: 'A',
      status: 'promoted',
      remarks: 'Good progress'
    });

    console.log('');
    console.log('══════════════════════════════════════════');
    console.log('  DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('══════════════════════════════════════════');
    console.log('');
    console.log('  Demo Credentials:');
    console.log('  ─────────────────────────────────────');
    console.log('  Admin:  demo@edufordge.com / Test@123');
    console.log('  Staff:  STF-2026-0001 / Test@123');
    console.log('  Student: STU-2026-0001 / Test@123');
    console.log('');
    console.log(`  Created:`);
    console.log(`  • ${classNames.length} classes`);
    console.log(`  • 1 Admin`);
    console.log(`  • ${staffUsers.length} Staff members`);
    console.log(`  • ${allStudents.length} Students`);
    console.log(`  • ${Object.keys(feeCategories).length * 3} Fee structures`);
    console.log(`  • Timetables for ${classNames.length} classes x 3 sections x 6 days x 7 periods`);
    console.log(`  • ${attendanceBatch.length} Student attendance records`);
    console.log(`  • ${staffAttendanceBatch.length} Staff attendance records`);
    console.log(`  • ${invoices.length} Invoices`);
    console.log(`  • ${payments.length} Payments`);
    console.log(`  • Leave requests across students`);
    console.log(`  • Academic history for all students`);
    console.log(`  • ${staffUsers.length * salaryMonths.length} Salary slips`);
    console.log(`  • 2 Contact form submissions`);
    console.log('══════════════════════════════════════════');

    process.exit();
  } catch (err) {
    console.error('Seeding Error:', err);
    process.exit(1);
  }
};

seedData();
