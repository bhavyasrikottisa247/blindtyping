const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config();

// Fix Node SRV DNS resolution on Windows/custom ISP networks
try {
    dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
    // Ignore fallback if custom DNS set fails
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bcalgorix_db';

let isMongoConnected = false;

const connectDB = async () => {
    try {
        mongoose.set('strictQuery', false);
        console.log('[Database] Connecting to MongoDB Cloud Atlas...');
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 10000
        });
        isMongoConnected = true;
        console.log('[Database] Connected to MongoDB Cloud Atlas successfully!');
    } catch (err) {
        isMongoConnected = false;
        console.log('[Database] Cloud Connection Error:', err.message);
        console.log('[Database] Running in hybrid memory fallback mode.');
    }
};

const getMongoStatus = () => isMongoConnected;

module.exports = { connectDB, getMongoStatus };
