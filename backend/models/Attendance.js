const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'Late', 'Leave', 'Weekend', 'Holiday', 'Not marked'],
        required: true
    },
    remark: {
        type: String,
        default: '—'
    },
    submitted: {
        type: Boolean,
        default: false
    },
    submittedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

// Ensure a student can only have one attendance record per day
AttendanceSchema.index({ student: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
