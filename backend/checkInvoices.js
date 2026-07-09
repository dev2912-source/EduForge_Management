const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const Invoice = require('./models/Invoice');

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const students = await User.find({ role: 'student' });
  const invoices = await Invoice.find();
  console.log(`Students: ${students.length}`);
  console.log(`Invoices: ${invoices.length}`);
  for (const s of students.slice(0, 3)) {
    const cnt = await Invoice.countDocuments({ student: s._id });
    console.log(`  ${s.schoolId || s.name}: ${cnt} invoices`);
  }
  process.exit(0);
}
check();
