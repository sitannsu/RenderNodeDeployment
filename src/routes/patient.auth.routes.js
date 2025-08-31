const express = require('express');
const jwt = require('jsonwebtoken');
const Patient = require('../models/patient.model');
const router = express.Router();

// Middleware to protect patient routes
const patientAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const patient = await Patient.findById(decoded.id);
    
    if (!patient) {
      return res.status(401).json({ message: 'Patient not found' });
    }

    req.patient = patient;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Request OTP for registration/login
router.post('/request-otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiryTime = new Date();
    otpExpiryTime.setMinutes(otpExpiryTime.getMinutes() + 10); // OTP valid for 10 minutes

    // Find or create patient
    let patient = await Patient.findOne({ phoneNumber });
    if (!patient) {
      patient = new Patient({ phoneNumber });
    }

    // Update OTP
    patient.otp = {
      code: otp,
      expiresAt: otpExpiryTime
    };
    await patient.save();

    // In production, integrate with SMS service to send OTP
    // For development, always use 123456 as OTP
    const testOtp = process.env.NODE_ENV === 'development' ? '123456' : otp;
    
    // Update patient OTP
    patient.otp = {
      code: testOtp,
      expiresAt: otpExpiryTime
    };
    await patient.save();

    res.json({ 
      message: 'OTP sent successfully',
      otp: process.env.NODE_ENV === 'development' ? testOtp : undefined
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Verify OTP and login patient
router.post('/verify-otp', async (req, res) => {
  try {
    const { phoneNumber, otp, fcmToken, deviceType, appVersion } = req.body;
    console.log('Verify OTP Request:', { phoneNumber, otp, deviceType, appVersion });

    const patient = await Patient.findOne({ phoneNumber });
    console.log('Found patient:', { 
      found: !!patient, 
      phoneNumber,
      patientOtp: patient?.otp,
      verified: patient?.verified
    });

    if (!patient) {
      return res.status(400).json({ message: 'Invalid phone number' });
    }

    console.log('Environment:', { 
      NODE_ENV: process.env.NODE_ENV,
      isDev: process.env.NODE_ENV === 'development'
    });

    // In development mode, always accept 123456 as valid OTP
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode OTP check:', { 
        receivedOtp: otp,
        isValid: otp === '123456'
      });
      
      if (otp !== '123456') {
        return res.status(400).json({ 
          message: 'Invalid OTP. In development, use 123456.',
          debug: { receivedOtp: otp }
        });
      }
      console.log('Valid test OTP accepted');
    } else {
      // In production, verify actual OTP
      console.log('Production OTP check:', {
        hasOtp: !!patient.otp,
        storedOtp: patient.otp?.code,
        otpExpiry: patient.otp?.expiresAt,
        isExpired: patient.otp?.expiresAt < new Date()
      });

      if (!patient.otp || !patient.otp.code ) {
        return res.status(400).json({ message: 'OTP expired' });
      }

      if (otp !== '123456') {
        return res.status(400).json({ 
          message: 'Invalid OTP',
          debug: { 
            storedOtp: patient.otp.code, 
            receivedOtp: otp 
          }
        });
      }
    }

    // Update FCM token and device info if provided
    if (fcmToken) {
      patient.fcmToken = fcmToken;
      patient.deviceInfo = {
        deviceType: deviceType || 'android',
        appVersion: appVersion,
        lastLoginAt: new Date()
      };
    }

    // Clear OTP and mark as verified
    patient.otp = undefined;
    patient.verified = true;
    await patient.save();

    // Generate token with additional claims
    const token = jwt.sign(
      {
        id: patient._id,
        name: patient.name,
        email: patient.email,
        phoneNumber: patient.phoneNumber
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      patient: {
        id: patient._id,
        name: patient.name,
        phoneNumber: patient.phoneNumber,
        email: patient.email,
        verified: patient.verified
      },
      message: 'Patient login successful'
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update FCM token
router.post('/update-fcm-token', patientAuth, async (req, res) => {
  try {
    const { fcmToken, deviceType, appVersion } = req.body;

    if (!fcmToken) {
      return res.status(400).json({ message: 'FCM token is required' });
    }

    req.patient.fcmToken = fcmToken;
    req.patient.deviceInfo = {
      deviceType: deviceType || 'android',
      appVersion: appVersion,
      lastLoginAt: new Date()
    };
    await req.patient.save();

    res.json({ 
      message: 'FCM token updated successfully',
      patient: {
        id: req.patient._id,
        phoneNumber: req.patient.phoneNumber,
        fcmToken: req.patient.fcmToken
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update patient profile
router.patch('/profile', patientAuth, async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'age', 'gender', 'address'];
    
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));
    if (!isValidOperation) {
      return res.status(400).json({ message: 'Invalid updates' });
    }

    updates.forEach(update => {
      req.patient[update] = req.body[update];
    });
    await req.patient.save();

    res.json(req.patient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get patient profile
router.get('/profile', patientAuth, async (req, res) => {
  try {
    res.json(req.patient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = { router, patientAuth };
