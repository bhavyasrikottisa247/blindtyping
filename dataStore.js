/**
 * Hybrid Data Store Manager
 * Wraps Mongoose models with in-memory store fallback if MongoDB service is offline.
 */
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Attempt = require('./models/Attempt');
const Settings = require('./models/Settings');
const { getMongoStatus } = require('./config/db');

// Default initial paragraphs
const DEFAULT_LEVEL_1 = `Technology changes the way we live and work and communicate every single day. In the modern world computers and mobile phones are essential tools for almost every profession. Whether you are writing a report in an office or studying for a school exam fast and accurate typing saves valuable time and boosts daily productivity. However speed means very little if your work is full of mistakes. Accuracy is always more important than raw speed when you are starting out. Professional typists build their skills through patient and consistent daily practice rather than rushing through sentences. Proper posture also plays a major role in how long you can type without feeling tired or sore. Keep your back straight and place your feet flat on the floor and position your fingers correctly on the home row keys of your keyboard. As you practice try not to look down at your hands. Focus your eyes entirely on the screen so your muscle memory can develop naturally over time. If you make an error do not panic just stay calm and correct the mistake and keep moving forward. Consistency is the true secret to becoming a better and faster typist.`;

const DEFAULT_LEVEL_2 = ` Technology—in its broadest sense—is evolving at a breakneck speed; consequently, it shapes every facet of modern life. Think about artificial intelligence (AI): it drives algorithms, automates tasks, and predicts human behavior. While some view AI as a "miracle tool," others ask, "At what cost does this convenience come?" Engineers must balance innovation, security, and ethics; it is a difficult, multi-layered puzzle. Furthermore, the rise of the Internet of Things (IoT) means our homes, cars, and appliances are now interconnected. Your refrigerator might track your groceries, your watch monitors your heart rate, and your thermostat adjusts to your habits. If a system is hacked, however, user privacy vanishes instantly—a terrifying thought for the average consumer. Developers are racing to build unbreachable firewalls, encrypted networks, and biometric locks. Meanwhile, quantum computing—though still in its infancy—promises to solve calculations that would take classic supercomputers millennia. Tech giants like Google, IBM, and Microsoft are competing fiercely for dominance. Whether we look at virtual reality, blockchain, or automated robotics; the destination remains identical: a fully digitalized, hyper-connected world. It is an exciting, fast-paced era, but are we truly ready for what comes next? `;

const DEFAULT_LEVEL_3 = `const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');
const app = express();
app.use(express.json());

// BCAlgorix 2k26 - Blind Typing Engine Score Calculator
const ScoreSchema = new mongoose.Schema({
    sucNumber: { type: String, required: true, match: /^260300\\d{4}$/ },
    sectionName: { type: String, enum: ['A', 'B'], required: true },
    levelIndex: { type: Number, min: 1, max: 3, required: true },
    wpmScore: { type: Number, required: true, default: 0 },
    accuracyRate: { type: Number, required: true, default: 0.0 },
    wordsTyped: { total: Number, correct: Number, incorrect: Number },
    charsTyped: { total: Number, correct: Number, incorrect: Number },
    timeElapsedSeconds: { type: Number, required: true },
    submittedAt: { type: Date, default: Date.now }
});

const ScoreModel = mongoose.model('ScoreRecord', ScoreSchema);

async function processChallengeMetrics(req, res) {
    try {
        const { suc, section, level, typedText, targetText, duration } = req.body;
        if (!suc || !level || duration <= 0) {
            return res.status(400).json({ error: 'Invalid payload submitted!' });
        }
        let totalChars = typedText.length;
        let correctChars = 0;
        for (let i = 0; i < totalChars; i++) {
            if (typedText[i] === targetText[i]) correctChars++;
        }
        let accuracy = totalChars > 0 ? (correctChars / totalChars) * 100 : 0;
        let minutes = duration / 60;
        let wpm = minutes > 0 ? Math.round((totalChars / 5) / minutes) : 0;
        
        const newRecord = new ScoreModel({
            sucNumber: suc,
            sectionName: section,
            levelIndex: level,
            wpmScore: wpm,
            accuracyRate: parseFloat(accuracy.toFixed(2)),
            timeElapsedSeconds: duration
        });
        await newRecord.save();
        return res.status(201).json({ success: true, record: newRecord });
    } catch (err) {
        return res.status(500).json({ error: 'Internal Server Error: ' + err.message });
    }
}
app.post('/api/v1/scores/calculate', processChallengeMetrics);`;

// Memory collections
let memUsers = [];
let memAttempts = [];
let memSettings = {
    key: 'config',
    level1Text: DEFAULT_LEVEL_1,
    level2Text: DEFAULT_LEVEL_2,
    level3Text: DEFAULT_LEVEL_3,
    leaderboardRevealed: false
};

// Seed default Admin user
const initDefaultData = async () => {
    const adminPasswordHash = await bcrypt.hash('Aditya@123', 10);

    const adminUser = {
        suc: 'Admin123',
        fullName: 'Administrator',
        section: 'A',
        password: adminPasswordHash,
        role: 'admin',
        createdAt: new Date()
    };

    memUsers = [{ _id: 'admin_id_001', ...adminUser }];

    if (getMongoStatus()) {
        try {
            // Seed Admin in Mongo
            const existingAdmin = await User.findOne({ suc: 'Admin123' });
            if (!existingAdmin) {
                await User.create(adminUser);
            }
            // Seed Settings in Mongo
            const existingSettings = await Settings.findOne({ key: 'config' });
            if (!existingSettings) {
                await Settings.create(memSettings);
            }
        } catch (e) {
            console.error('Mongo seeding error:', e.message);
        }
    }
};

const findUserBySuc = async (suc) => {
    if (getMongoStatus()) {
        try { return await User.findOne({ suc }); } catch (e) { }
    }
    return memUsers.find(u => u.suc === suc);
};

const createUser = async (userData) => {
    if (getMongoStatus()) {
        try {
            return await User.create(userData);
        } catch (e) { }
    }
    const newUser = {
        _id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        ...userData,
        createdAt: new Date()
    };
    memUsers.push(newUser);
    return newUser;
};

const getSettings = async () => {
    if (getMongoStatus()) {
        try {
            let s = await Settings.findOne({ key: 'config' });
            if (s) return s;
        } catch (e) { }
    }
    return memSettings;
};

const updateSettings = async (updateData) => {
    if (getMongoStatus()) {
        try {
            let s = await Settings.findOneAndUpdate(
                { key: 'config' },
                { $set: updateData, updatedAt: new Date() },
                { new: true, upsert: true }
            );
            memSettings = { ...memSettings, ...updateData };
            return s;
        } catch (e) { }
    }
    memSettings = { ...memSettings, ...updateData };
    return memSettings;
};

const getUserAttemptForLevel = async (userId, level) => {
    if (getMongoStatus()) {
        try {
            return await Attempt.findOne({ userId, level: Number(level) });
        } catch (e) { }
    }
    return memAttempts.find(a => String(a.userId) === String(userId) && Number(a.level) === Number(level));
};

const getUserAttempts = async (userId) => {
    if (getMongoStatus()) {
        try {
            return await Attempt.find({ userId }).sort({ level: 1 });
        } catch (e) { }
    }
    return memAttempts.filter(a => String(a.userId) === String(userId)).sort((a, b) => a.level - b.level);
};

const createAttempt = async (attemptData) => {
    if (getMongoStatus()) {
        try {
            return await Attempt.create(attemptData);
        } catch (e) { }
    }
    const newAttempt = {
        _id: 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        ...attemptData,
        completedAt: new Date()
    };
    memAttempts.push(newAttempt);
    return newAttempt;
};

const getAllStudentLeaderboard = async () => {
    let attemptsList = [];
    let usersList = [];

    if (getMongoStatus()) {
        try {
            attemptsList = await Attempt.find({});
            usersList = await User.find({ role: 'student' });
        } catch (e) { }
    } else {
        attemptsList = memAttempts;
        usersList = memUsers.filter(u => u.role === 'student');
    }

    // Aggregate overall scores per user
    const map = {};
    usersList.forEach(u => {
        map[String(u._id)] = {
            userId: u._id,
            suc: u.suc,
            fullName: u.fullName,
            section: u.section,
            levelsCompleted: 0,
            level1Wpm: 0,
            level1Acc: 0,
            level2Wpm: 0,
            level2Acc: 0,
            level3Wpm: 0,
            level3Acc: 0,
            totalWpm: 0,
            avgAccuracy: 0,
            totalTimeSeconds: 0,
            overallScore: 0
        };
    });

    attemptsList.forEach(a => {
        const uId = String(a.userId);
        if (!map[uId]) {
            map[uId] = {
                userId: a.userId,
                suc: a.suc,
                fullName: a.fullName,
                section: a.section,
                levelsCompleted: 0,
                level1Wpm: 0,
                level1Acc: 0,
                level2Wpm: 0,
                level2Acc: 0,
                level3Wpm: 0,
                level3Acc: 0,
                totalWpm: 0,
                avgAccuracy: 0,
                totalTimeSeconds: 0,
                overallScore: 0
            };
        }
        const record = map[uId];
        record.levelsCompleted += 1;
        record.totalTimeSeconds += (a.timeTakenSeconds || 0);
        record.overallScore += (a.score || 0);

        if (a.level === 1) {
            record.level1Wpm = a.wpm;
            record.level1Acc = a.accuracy;
        } else if (a.level === 2) {
            record.level2Wpm = a.wpm;
            record.level2Acc = a.accuracy;
        } else if (a.level === 3) {
            record.level3Wpm = a.wpm;
            record.level3Acc = a.accuracy;
        }
    });

    const leaderboard = Object.values(map).map(r => {
        const count = r.levelsCompleted || 1;
        const totalWpm = r.level1Wpm + r.level2Wpm + r.level3Wpm;
        const avgAcc = parseFloat(((r.level1Acc + r.level2Acc + r.level3Acc) / count).toFixed(2));
        return {
            ...r,
            totalWpm,
            avgAccuracy: avgAcc
        };
    });

    // Sort by overallScore descending, then totalWpm descending, then totalTime ascending
    leaderboard.sort((a, b) => {
        if (b.overallScore !== a.overallScore) return b.overallScore - a.overallScore;
        if (b.totalWpm !== a.totalWpm) return b.totalWpm - a.totalWpm;
        return a.totalTimeSeconds - b.totalTimeSeconds;
    });

    return leaderboard;
};

module.exports = {
    initDefaultData,
    findUserBySuc,
    createUser,
    getSettings,
    updateSettings,
    getUserAttemptForLevel,
    getUserAttempts,
    createAttempt,
    getAllStudentLeaderboard
};
