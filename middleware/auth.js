const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'bcalgorix_2k26_secret_key_aditya';

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied. Please log in.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Session expired or invalid token.' });
        }
        req.user = user;
        next();
    });
};

const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access privileges required.' });
    }
    next();
};

module.exports = { authenticateToken, requireAdmin, JWT_SECRET };
