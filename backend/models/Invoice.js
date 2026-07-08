const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
    invoiceId: { type: String, required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    studentName: { type: String, required: true },
    amount: { type: String, required: true },
    paidAmount: { type: String, default: '₹0' },
    balance: { type: String },
    dueDate: { type: String, required: true },
    status: { type: String, required: true, default: 'Pending' },
    feeStructure: { type: mongoose.Schema.Types.ObjectId, ref: 'FeeStructure' },
    academicYear: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
