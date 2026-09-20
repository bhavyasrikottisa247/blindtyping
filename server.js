const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const { connectDB } = require('./config/db');
const { initDefaultData } = require('./dataStore');

const authRoutes = require('./routes/authRoutes');
const challengeRoutes = require('./routes/challengeRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/challenge', challengeRoutes);
app.use('/api/admin', adminRoutes);

// Single Page Application fallback route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize DB and start server
const startServer = async () => {
    await connectDB();
    await initDefaultData();

    app.listen(PORT, () => {
        console.log(`====================================================`);
        console.log(` BCAlgorix 2k26 - Blind Typing Challenge Server`);
        console.log(` Kakinada Sri Aditya Degree College, Srikakulam`);
        console.log(` Server running on: http://localhost:${PORT}`);
        console.log(`====================================================`);
    });
};

startServer();
