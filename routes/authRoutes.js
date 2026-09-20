const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');
const { findUserBySuc, createUser, getUserAttempts } = require('../dataStore');

// Student Registration
router.post('/register', async (req, res) => {
    try {
        const { suc, fullName, section, password, confirmPassword } = req.body;

        // Validation checks
        if (!suc || !fullName || !section || !password || !confirmPassword) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        const trimmedSuc = String(suc).trim();
        const trimmedName = String(fullName).trim();
        const trimmedSection = String(section).trim().toUpperCase();

        // Check SUC format: exactly 10 digits starting with 260300
        const sucRegex = /^260300\d{4}$/;
        if (!sucRegex.test(trimmedSuc)) {
            return res.status(400).json({
                error: 'SUC Number must be exactly 10 digits and start with "260300" (e.g., 2603001234).'
            });
        }

        // Section validation
        if (!['A', 'B'].includes(trimmedSection)) {
            return res.status(400).json({ error: 'Section must be either A or B.' });
        }

        // Password confirmation check
        if (password !== confirmPassword) {
            return res.status(400).json({ error: 'Password and Confirm Password do not match.' });
        }

        if (password.length < 4) {
            return res.status(400).json({ error: 'Password must be at least 4 characters long.' });
        }

        // Existing user check
        const existingUser = await findUserBySuc(trimmedSuc);
        if (existingUser) {
            return res.status(400).json({ error: 'Student with this SUC Number is already registered.' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const newUser = await createUser({
            suc: trimmedSuc,
            fullName: trimmedName,
            section: trimmedSection,
            password: passwordHash,
            role: 'student'
        });

        // Sign JWT token
        const token = jwt.sign(
            { id: newUser._id, suc: newUser.suc, fullName: newUser.fullName, section: newUser.section, role: newUser.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        return res.status(201).json({
            message: 'Registration successful!',
            token,
            user: {
                id: newUser._id,
                suc: newUser.suc,
                fullName: newUser.fullName,
                section: newUser.section,
                role: newUser.role
            }
        });
    } catch (err) {
        console.error('Registration error:', err);
        return res.status(500).json({ error: 'Server error during registration.' });
    }
});

// Student Login
router.post('/login', async (req, res) => {
    try {
        const { suc, password } = req.body;

        if (!suc || !password) {
            return res.status(400).json({ error: 'SUC Number and Password are required.' });
        }

        const trimmedSuc = String(suc).trim();
        const user = await findUserBySuc(trimmedSuc);

        if (!user || user.role === 'admin') {
            return res.status(401).json({ error: 'Invalid SUC Number or Password.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid SUC Number or Password.' });
        }

        const token = jwt.sign(
            { id: user._id, suc: user.suc, fullName: user.fullName, section: user.section, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        return res.json({
            message: 'Login successful!',
            token,
            user: {
                id: user._id,
                suc: user.suc,
                fullName: user.fullName,
                section: user.section,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ error: 'Server error during login.' });
    }
});

// Admin Login
router.post('/admin-login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and Password are required.' });
        }

        const trimmedUser = String(username).trim();

        if (trimmedUser !== 'Admin123') {
            return res.status(401).json({ error: 'Invalid Admin Credentials.' });
        }

        const admin = await findUserBySuc('Admin123');
        if (!admin) {
            return res.status(401).json({ error: 'Admin user not initialized.' });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid Admin Credentials.' });
        }

        const token = jwt.sign(
            { id: admin._id, suc: admin.suc, fullName: admin.fullName, role: 'admin' },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        return res.json({
            message: 'Admin login successful!',
            token,
            user: {
                id: admin._id,
                suc: admin.suc,
                fullName: admin.fullName,
                role: 'admin'
            }
        });
    } catch (err) {
        console.error('Admin login error:', err);
        return res.status(500).json({ error: 'Server error during admin login.' });
    }
});

// Get Current Logged-in User Profile & Progress
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await findUserBySuc(req.user.suc);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const attempts = user.role === 'student' ? await getUserAttempts(user._id) : [];
        const completedLevels = attempts.map(a => a.level);

        return res.json({
            user: {
                id: user._id,
                suc: user.suc,
                fullName: user.fullName,
                section: user.section,
                role: user.role
            },
            completedLevels,
            attempts
        });
    } catch (err) {
        return res.status(500).json({ error: 'Server error fetching user profile.' });
    }
});

module.exports = router;
