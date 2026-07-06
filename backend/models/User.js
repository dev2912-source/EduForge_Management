const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        unique: true,
        sparse: true
    },
    schoolId: {
        type: String,
        unique: true,
        sparse: true
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['admin', 'staff', 'student'],
        default: 'student'
    },
    profile: {
        phone: String,
        dateOfBirth: Date,
        gender: String,
        bloodGroup: String,
        admissionDate: Date,
        address: String,
        parentDetails: {
            fatherName: String,
            fatherPhone: String,
            motherName: String,
            motherPhone: String
        },
        // Student-specific fields
        className: String,
        section: String,
        status: {
            type: String,
            enum: ['active', 'inactive', 'graduated'],
            default: 'active'
        },
        academicYear: String,
        rollNumber: String
    }
}, { timestamps: true });

UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
