const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bcalgorix_db';

let isMongoConnected = false;

const connectDB = async () => {
    try {
        mongoose.set('strictQuery', false);
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 3000
        });
        isMongoConnected = true;
        console.log('[Database] Connected successfully.');
    } catch (err) {
        isMongoConnected = false;
        console.log('[Database] MongoDB connection bypassed - running in hybrid memory fallback mode.');
    }
};

const getMongoStatus = () => isMongoConnected;

module.exports = { connectDB, getMongoStatus };
