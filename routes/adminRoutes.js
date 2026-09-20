const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { getSettings, updateSettings, getAllStudentLeaderboard } = require('../dataStore');

// All endpoints in this router require Admin role
router.use(authenticateToken, requireAdmin);

// Get current admin settings
router.get('/settings', async (req, res) => {
    try {
        const settings = await getSettings();
        return res.json({ settings });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to fetch admin settings.' });
    }
});

// Update admin settings (Paragraphs / Leaderboard Reveal)
router.post('/settings', async (req, res) => {
    try {
        const { level1Text, level2Text, level3Text, leaderboardRevealed } = req.body;

        const updatePayload = {};
        if (typeof level1Text === 'string') updatePayload.level1Text = level1Text.trim();
        if (typeof level2Text === 'string') updatePayload.level2Text = level2Text.trim();
        if (typeof level3Text === 'string') updatePayload.level3Text = level3Text.trim();
        if (typeof leaderboardRevealed === 'boolean') updatePayload.leaderboardRevealed = leaderboardRevealed;

        const updatedSettings = await updateSettings(updatePayload);

        return res.json({
            message: 'Admin settings updated successfully!',
            settings: updatedSettings
        });
    } catch (err) {
        console.error('Update settings error:', err);
        return res.status(500).json({ error: 'Failed to update admin settings.' });
    }
});

// Get all student results / leaderboard for admin management
router.get('/students', async (req, res) => {
    try {
        const leaderboard = await getAllStudentLeaderboard();
        const settings = await getSettings();

        return res.json({
            leaderboardRevealed: settings.leaderboardRevealed,
            totalStudents: leaderboard.length,
            leaderboard
        });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to fetch student results.' });
    }
});

module.exports = router;
