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
    }
}, { timestamps: true });

module.exports = mongoose.model('SalarySlip', SalarySlipSchema);
