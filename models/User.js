const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    suc: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    section: {
        type: String,
        enum: ['A', 'B'],
        required: function () {
            return this.role === 'student';
        }
    },
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['student', 'admin'],
        default: 'student'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);
