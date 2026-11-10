const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000, // 30s allows DNS resolution & TLS handshake
      socketTimeoutMS: 45000,
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    console.error('Check your MongoDB Atlas Network Access (whitelist IP 0.0.0.0/0) and MONGO_URI.');
  }
};

// Monitor connection events for drops & reconnects
mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB connection lost. Reconnecting...');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected successfully.');
});

module.exports = connectDB;
