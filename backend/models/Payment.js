const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    receiptId: { type: String, required: true },
    invoiceId: { type: String },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    studentName: { type: String, required: true },
    amount: { type: String, required: true },
    method: { type: String, required: true },
    date: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
