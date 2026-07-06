const mongoose = require('mongoose');

const AcademicHistorySchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    academicYear: {
        type: String,
        required: true
    },
    className: {
        type: String,
        required: true
    },
    section: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['promoted', 'active', 'failed'],
        required: true
    },
    remarks: {
        type: String
    },
    recordedOn: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('AcademicHistory', AcademicHistorySchema);
