const mongoose = require('mongoose');

const FeeStructureSchema = new mongoose.Schema({
    className: {
        type: String,
        required: true
    },
    academicYear: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    frequency: {
        type: String,
        required: true,
        enum: ['Annually', 'Quarterly', 'Monthly', 'Bi-Annually', 'One-Time'],
        default: 'Monthly'
    },
    dueDay: {
        type: Number,
        required: true,
        default: 10
    }
}, { timestamps: true });

module.exports = mongoose.model('FeeStructure', FeeStructureSchema);
