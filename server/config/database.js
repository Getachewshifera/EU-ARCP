// Purpose: Database connection configuration and setup.
const mongoose = require('mongoose');

async function connectDatabase(mongoUri) {
  const uri = mongoUri || process.env.MONGODB_URI;

  if (!uri) {
    console.warn('MongoDB connection skipped because MONGODB_URI is not configured.');
    return null;
  }

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri);
    console.log('MongoDB connected successfully.');
    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    throw error;
  }
}

async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
}

module.exports = {
  connectDatabase,
  disconnectDatabase,
};

