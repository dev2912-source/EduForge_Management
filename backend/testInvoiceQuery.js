const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const Invoice = require('./models/Invoice');

async function test() {
  await mongoose.connect(process.env.MONGO_URI);

  const student = await User.findOne({ schoolId: 'STU-2026-0001' });
  if (!student) { console.log('Student not found'); process.exit(1); }

  console.log(`Student: ${student.schoolId} (${student.name})`);
  console.log(`Student _id: ${student._id}`);
  console.log(`Student name: "${student.name}"`);

  // Test the exact query from the route
  const query = { $or: [{ student: student._id }, { studentName: student.name }] };
  const invoices = await Invoice.find(query).sort({ dueDate: -1 });

  console.log(`\nQuery: ${JSON.stringify(query)}`);
  console.log(`Invoices found: ${invoices.length}`);
  
  for (const inv of invoices) {
    console.log(`  ${inv.invoiceId} | student=${inv.student} | studentName="${inv.studentName}" | amount=${inv.amount} | status=${inv.status}`);
  }

  // Also try just by student ID
  const byId = await Invoice.find({ student: student._id });
  console.log(`\nBy student ID only: ${byId.length}`);

  // By name only
  const byName = await Invoice.find({ studentName: student.name });
  console.log(`By student name only: ${byName.length}`);

  process.exit(0);
}
test();
