const mongoose = require('mongoose');

const ClassSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    medium: {
        type: String,
        required: true,
        enum: ['ENGLISH', 'HINDI', 'MARATHI', 'GUJARATI'],
        default: 'ENGLISH'
    },
    sections: {
        type: Number,
        default: 1
    }
}, { timestamps: true });

module.exports = mongoose.model('Class', ClassSchema);
