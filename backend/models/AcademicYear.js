const mongoose = require('mongoose');

const AcademicYearSchema = new mongoose.Schema({
    label: { type: String, required: true, unique: true, trim: true },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    isCurrent: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('AcademicYear', AcademicYearSchema);
