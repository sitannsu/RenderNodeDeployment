require('dotenv').config({ path: './environments/dev.env' });
const express = require('express');
const mongoose = require('mongoose');
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
const PORT = process.env.PORT || 3000;

// Debug: Log environment variables (remove in production)
console.log('🔧 Environment Debug:', {
  port: process.env.PORT,
  mongoUri: process.env.MONGODB_URI ? 'Set' : 'Not set',
  awsAccessKey: process.env.AWS_ACCESS_KEY_ID ? 'Set' : 'Not set',
  awsSecretKey: process.env.AWS_SECRET_ACCESS_KEY ? 'Set' : 'Not set',
  awsRegion: process.env.AWS_REGION,
  s3Bucket: process.env.S3_BUCKET
});

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
  socketTimeoutMS: 45000, // Socket timeout
  maxPoolSize: 50
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
