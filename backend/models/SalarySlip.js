const mongoose = require('mongoose');

const SalarySlipSchema = new mongoose.Schema({
    staff: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    month: {
        type: String,
        required: true
    },
    slipMonth: Date,
    gross: {
        type: Number,
        required: true,
        default: 0
    },
    deductions: {
        type: Number,
        required: true,
        default: 0
    },
    net: {
        type: Number,
        required: true,
        default: 0
    },
    status: {
        type: String,
        enum: ['Paid', 'Pending', 'Unpaid'],
        default: 'Pending'
    },
    basic: { type: Number, default: 0 },
    hra: { type: Number, default: 0 },
    da: { type: Number, default: 0 },
    ta: { type: Number, default: 0 },
    otherAllowances: { type: Number, default: 0 },
    pfDeduction: { type: Number, default: 0 },
    taxDeduction: { type: Number, default: 0 },
    otherDeductions: { type: Number, default: 0 },
    paymentDate: Date,
    pdfPath: String
}, { timestamps: true });

module.exports = mongoose.model('SalarySlip', SalarySlipSchema);
