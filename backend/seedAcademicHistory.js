const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const AcademicHistory = require('./models/AcademicHistory');

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

const histories = [
  { year: '2025-2026', offset: 0, remarks: 'Current year - good progress' },
  { year: '2024-2025', offset: 1, remarks: 'Promoted with distinction' },
  { year: '2023-2024', offset: 2, remarks: 'Satisfactory performance' },
  { year: '2022-2023', offset: 3, remarks: 'Excellent attendance' },
];

async function seedAcademicHistory() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const students = await User.find({ role: 'student' });
    let created = 0;

    for (const student of students) {
      const existing = await AcademicHistory.find({ student: student._id }).sort({ academicYear: -1 });
      const existingYears = new Set(existing.map(e => e.academicYear));

      const currentClass = student.profile?.className || 'Class 1';
      const mapping = classMapping[currentClass] || { prev: 'UKG', secPrev: 'LKG' };
      const prevClasses = [mapping.prev, mapping.secPrev, 'Nursery', 'Pre-Nursery'];

      for (let i = 0; i < histories.length; i++) {
        const h = histories[i];
        if (existingYears.has(h.year)) {
          console.log(`  ${student.schoolId}: ${h.year} exists, skipping`);
          continue;
        }
        const prevClass = prevClasses[h.offset] || `Class ${Math.max(1, parseInt(currentClass.split(' ')[1]) - h.offset)}`;
        await AcademicHistory.create({
          student: student._id,
          academicYear: h.year,
          className: i === 0 ? currentClass : prevClass,
          section: student.profile?.section || 'A',
          status: i === 0 ? 'active' : 'promoted',
          remarks: h.remarks
        });
        created++;
        console.log(`  ${student.schoolId}: created ${h.year} (${prevClass})`);
      }
    }

    console.log(`\nDone. Created ${created} new academic history records.`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

seedAcademicHistory();
