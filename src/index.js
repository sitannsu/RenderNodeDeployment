require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const doctorRoutes = require('./routes/doctor.routes');
const referralRoutes = require('./routes/referral.routes');
const messageRoutes = require('./routes/message.routes');
const nmcRoutes = require('./routes/nmc.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const adminRoutes = require('./routes/admin.routes');
const notificationRoutes = require('./routes/notification.routes');
const { router: patientAuthRoutes } = require('./routes/patient.auth.routes');
const patientDoctorRoutes = require('./routes/patient.doctor.routes');
const patientQueryRoutes = require('./routes/patient.query.routes');

const app = express();
const PORT = process.env.PORT || 5005``;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
  socketTimeoutMS: 45000, // Socket timeout
  keepAlive: true,
  keepAliveInitialDelay: 300000, // 5 minutes
  maxPoolSize: 50,
  minPoolSize: 10,
  connectTimeoutMS: 30000,
  retryWrites: true,
  heartbeatFrequencyMS: 10000
})
.then(() => {
  console.log('✅ Connected to MongoDB');
  // Log connection pool information
  const db = mongoose.connection;
  console.log(`ℹ️ MongoDB Connection Pool Size: ${db.config.poolSize}`);
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  // Check if error is due to authentication
  if (err.name === 'MongoServerError' && err.code === 18) {
    console.error('⚠️ Authentication failed - Please check MongoDB credentials');
  }
  // Check if error is due to network
  else if (err.name === 'MongoNetworkError') {
    console.error('⚠️ Network error - Please check MongoDB URI and network connection');
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api', nmcRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
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
