// Environment variables are loaded in server.js
const dotenv = require("dotenv");
dotenv.config({ path: "./environments/dev.env" });

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./src/routes/auth.routes');
const doctorRoutes = require('./src/routes/doctor.routes');
const referralRoutes = require('./src/routes/referral.routes');
const messageRoutes = require('./src/routes/message.routes');
const nmcRoutes = require('./src/routes/nmc.routes');
const dashboardRoutes = require('./src/routes/dashboard.routes');
const notificationRoutes = require('./src/routes/notification.routes');
const uploadRoutes = require('./src/routes/upload.routes');
const { router: patientAuthRoutes } = require('./src/routes/patient.auth.routes');
const patientDoctorRoutes = require('./src/routes/patient.doctor.routes');
const patientQueryRoutes = require('./src/routes/patient.query.routes');
const adminRoutes = require('./src/routes/admin.routes');
const occupationRoutes = require('./src/routes/occupation.routes');
const advertisementRoutes = require('./src/routes/advertisement.routes');

const app = express();
const PORT = process.env.PORT || 5005;

// Middleware
app.use(cors());

// Only parse JSON for non-GET requests
app.use((req, res, next) => {
  if (req.method !== 'GET') {
    bodyParser.json({
      strict: true,
      limit: '10mb'
    })(req, res, next);
  } else {
    next();
  }
});

// Database connection is handled in server.js

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api', nmcRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/patient/auth', patientAuthRoutes);
app.use('/api/patient/doctors', patientDoctorRoutes);
app.use('/api/patient', patientQueryRoutes);
app.use('/api/occupations', occupationRoutes);
app.use('/api/advertisements', advertisementRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Handle JSON parsing errors
  if (err instanceof SyntaxError && err.type === 'entity.parse.failed') {
    return res.status(400).json({
      message: 'Invalid JSON format',
      error: err.message,
      location: err.stack
    });
  }

  // Handle other errors
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = app;

