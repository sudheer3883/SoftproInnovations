const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        default: 'Not provided'
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'delete'],
        default: 'active'
    },
    picture: {
        type: String,
        default: ''
    },
    gender: {
        type: String,
        default: 'unspecified'
    },
    resetOtpHash: String,
    resetOtpExpires: Date,
    resetOtpAttempts: { type: Number, default: 0 },
}, {
    timestamps: true
});

const user = mongoose.model("User", UserSchema);

module.exports = user;