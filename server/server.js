// Purpose: Creates the Express app, configures middleware, exposes the health check, and starts the API.
const cors = require('cors');
const express = require('express');

const { PORT, CLIENT_ORIGIN, MONGODB_URI } = require('./config/environment');
const { connectDatabase } = require('./config/database');
const mongoose = require('mongoose');
const { seedUniversities } = require('./seeders/universitySeeder');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const materialRoutes = require('./routes/materialRoutes');
const groupRoutes = require('./routes/groupRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const privateMessageRoutes = require('./routes/privateMessageRoutes');
const reportRoutes = require('./routes/reportRoutes');
const universityRoutes = require('./routes/universityRoutes');
const academicRoutes = require('./routes/academicRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const settingRoutes = require('./routes/settingRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
require('./middleware/uploadMiddleware');
const notFoundMiddleware = require('./middleware/notFoundMiddleware');
const errorMiddleware = require('./middleware/errorMiddleware');

const app = express();
app.disable('x-powered-by');

const allowedOrigins = CLIENT_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    const error = new Error('Origin is not allowed by CORS.');
    error.status = 403;
    return callback(error);
  },
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/private-messages', privateMessageRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/universities', universityRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api', dashboardRoutes);

app.get('/api/health', (_request, response) => {
  const connected = mongoose.connection.readyState === 1;
  return response.status(connected ? 200 : 503).json({ status: connected ? 'ok' : 'unavailable' });
});
app.use(notFoundMiddleware);
app.use(errorMiddleware);

async function startServer() {
  try {
    if ((process.env.JWT_SECRET || '').trim().length < 32) {
      throw new Error('JWT_SECRET must contain at least 32 characters.');
    }
    await connectDatabase(MONGODB_URI);
    await seedUniversities();
    app.listen(PORT, () => {
      console.log(`EU-ARCP API listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start the server:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
