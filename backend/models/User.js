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
        nationality: String,
        religion: String,
        photoUrl: String,
        medium: String,
        parentDetails: {
            fatherName: String,
            fatherPhone: String,
            motherName: String,
            motherPhone: String,
            guardianName: String,
            guardianPhone: String,
            relation: String,
            annualIncome: Number
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
    },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null }
}, { timestamps: true });

UserSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
