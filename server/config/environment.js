// Purpose: Centralized server environment variable loading and validation.
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '../.env');

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const config = {
  PORT: Number(process.env.PORT) || 5000,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  MONGODB_URI: (process.env.MONGODB_URI || '').trim(),
  JWT_SECRET: process.env.JWT_SECRET || '',
  PUBLIC_API_URL: (process.env.PUBLIC_API_URL || `http://localhost:${Number(process.env.PORT) || 5000}`).replace(/\/+$/, ''),
  NODE_ENV: process.env.NODE_ENV || 'development',
};

module.exports = config;
