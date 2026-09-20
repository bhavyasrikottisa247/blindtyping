const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getSettings, getUserAttemptForLevel, createAttempt, getAllStudentLeaderboard } = require('../dataStore');

// Fetch Paragraph for a given level (1, 2, or 3)
router.get('/level/:levelNum', authenticateToken, async (req, res) => {
    try {
        const levelNum = parseInt(req.params.levelNum);

        if (![1, 2, 3].includes(levelNum)) {
            return res.status(400).json({ error: 'Invalid level number. Must be 1, 2, or 3.' });
        }

        // Check if student has already completed this level
        const existingAttempt = await getUserAttemptForLevel(req.user.id, levelNum);
        if (existingAttempt) {
            return res.status(403).json({
                error: `You have already completed Level ${levelNum}. Retries are not permitted for this challenge.`,
                alreadyCompleted: true,
                attempt: existingAttempt
            });
        }

        const settings = await getSettings();
        let text = '';
        if (levelNum === 1) text = settings.level1Text;
        else if (levelNum === 2) text = settings.level2Text;
        else if (levelNum === 3) text = settings.level3Text;

        return res.json({
            level: levelNum,
            text,
            rules: {
                level1: { backspace: true, masked: false, desc: 'Simple text. Backspace allowed. Visible typing.' },
                level2: { backspace: false, masked: false, desc: 'Complex text with punctuation. NO backspace. Visible typing.' },
                level3: { backspace: false, masked: true, desc: 'Technical code snippet. NO backspace. Typed letters masked with *.' }
            }[`level${levelNum}`]
        });
    } catch (err) {
        console.error('Fetch level error:', err);
        return res.status(500).json({ error: 'Error loading challenge level.' });
    }
});

// Submit Attempt for a level
router.post('/submit', authenticateToken, async (req, res) => {
    try {
        const {
            level,
            wpm,
            accuracy,
            totalWords,
            correctWords,
            incorrectWords,
            totalChars,
            correctChars,
            incorrectChars,
            timeTakenSeconds
        } = req.body;

        const levelNum = parseInt(level);

        if (![1, 2, 3].includes(levelNum)) {
            return res.status(400).json({ error: 'Invalid level number.' });
        }

        // Strict enforce: check if student has already completed this level
        const existingAttempt = await getUserAttemptForLevel(req.user.id, levelNum);
        if (existingAttempt) {
            return res.status(403).json({
                error: `Level ${levelNum} has already been submitted! Each level can be attempted only once.`
            });
        }

        // Calculate score formula
        const safeWpm = Math.max(0, parseInt(wpm) || 0);
        const safeAcc = Math.min(100, Math.max(0, parseFloat(accuracy) || 0));
        const safeTime = Math.max(1, parseInt(timeTakenSeconds) || 1);

        const score = Math.round((safeWpm * (safeAcc / 100)) * 10 + (levelNum * 50));

        const newAttempt = await createAttempt({
            userId: String(req.user.id),
            suc: req.user.suc,
            fullName: req.user.fullName,
            section: req.user.section || 'A',
            level: levelNum,
            wpm: safeWpm,
            accuracy: safeAcc,
            totalWords: parseInt(totalWords) || 0,
            correctWords: parseInt(correctWords) || 0,
            incorrectWords: parseInt(incorrectWords) || 0,
            totalChars: parseInt(totalChars) || 0,
            correctChars: parseInt(correctChars) || 0,
            incorrectChars: parseInt(incorrectChars) || 0,
            timeTakenSeconds: safeTime,
            score
        });

        return res.status(201).json({
            message: `Level ${levelNum} completed successfully!`,
            attempt: newAttempt
        });
    } catch (err) {
        console.error('Submit attempt error:', err);
        return res.status(500).json({ error: 'Error saving challenge attempt result.' });
    }
});

// Fetch Leaderboard Endpoint
router.get('/leaderboard', authenticateToken, async (req, res) => {
    try {
        const settings = await getSettings();

        // If user is not admin and leaderboard is not revealed yet
        if (!settings.leaderboardRevealed && req.user.role !== 'admin') {
            return res.json({
                revealed: false,
                message: 'Leaderboard is currently locked! It will be revealed by the admin once all participants complete their tests.'
            });
        }

        const leaderboard = await getAllStudentLeaderboard();

        return res.json({
            revealed: true,
            leaderboard
        });
    } catch (err) {
        console.error('Fetch leaderboard error:', err);
        return res.status(500).json({ error: 'Error fetching leaderboard data.' });
    }
});

module.exports = router;
