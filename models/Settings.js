const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    key: {
        type: String,
        default: 'config',
        unique: true
    },
    level1Text: {
        type: String,
        required: true
    },
    level2Text: {
        type: String,
        required: true
    },
    level3Text: {
        type: String,
        required: true
    },
    leaderboardRevealed: {
        type: Boolean,
        default: false
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Settings', settingsSchema);
