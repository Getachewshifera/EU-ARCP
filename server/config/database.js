// Purpose: Database connection configuration and setup.
const mongoose = require('mongoose');

async function connectDatabase(mongoUri) {
  const uri = (mongoUri || process.env.MONGODB_URI || '').trim();
  if (!uri) throw new Error('MONGODB_URI is required to start the API.');
  if (!/^mongodb(?:\+srv)?:\/\//i.test(uri)) {
    throw new Error('MONGODB_URI must use mongodb:// or mongodb+srv://.');
  }
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  console.log('MongoDB connected successfully.');
  return mongoose.connection;
}

async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
}

module.exports = { connectDatabase, disconnectDatabase };
