// Environment variables are loaded in server.js
const express = require('express');
const cors = require('cors');
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

const app = express();
const PORT = process.env.PORT || 5005;



// Middleware
app.use(cors());
app.use(express.json());

// Database connection is handled in server.js

// Routes
app.use('/api/auth', authRoutes);
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
