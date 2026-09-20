const mongoose = require('mongoose');

const attemptSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    suc: {
        type: String,
        required: true
    },
    fullName: {
        type: String,
        required: true
    },
    section: {
        type: String,
        required: true
    },
    level: {
        type: Number,
        required: true,
        enum: [1, 2, 3]
    },
    wpm: {
        type: Number,
        required: true
    },
    accuracy: {
        type: Number,
        required: true
    },
    totalWords: {
        type: Number,
        required: true
    },
    correctWords: {
        type: Number,
        required: true
    },
    incorrectWords: {
        type: Number,
        required: true
    },
    totalChars: {
        type: Number,
        required: true
    },
    correctChars: {
        type: Number,
        required: true
    },
    incorrectChars: {
        type: Number,
        required: true
    },
    timeTakenSeconds: {
        type: Number,
        required: true
    },
    score: {
        type: Number,
        required: true
    },
    completedAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index to guarantee a user can attempt each level at most once
attemptSchema.index({ userId: 1, level: 1 }, { unique: true });

module.exports = mongoose.model('Attempt', attemptSchema);
