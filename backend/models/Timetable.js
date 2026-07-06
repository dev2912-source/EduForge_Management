const mongoose = require('mongoose');

const TimetableSchema = new mongoose.Schema({
    className: {
        type: String,
        required: true
    },
    section: {
        type: String,
        required: true
    },
    dayOfWeek: {
        type: String, // MON, TUE, WED, etc.
        required: true
    },
    period: {
        type: Number,
        required: true
    },
    timeRange: {
        type: String, // e.g., "8:00 AM - 8:45 AM"
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    teacher: {
        type: String,
        required: true
    },
    colorCode: {
        type: String,
        default: '#6C63FF'
    }
}, { timestamps: true });

module.exports = mongoose.model('Timetable', TimetableSchema);
