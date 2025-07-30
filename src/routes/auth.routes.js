const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const DoctorProfile = require('../models/doctorProfile.model');
const PatientProfile = require('../models/patientProfile.model');
const nmcService = require('../services/nmc.service');
const router = express.Router();

// Middleware to protect routes
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Register new doctor
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, role = 'doctor', ...doctorData } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists with this email'
      });
    }

    // Create new user with basic info
    const user = new User({
      fullName,
      email,
      password,
      role
    });

    await user.save();

    // If registering as a doctor, create doctor profile
    if (role === 'doctor') {
      const doctorProfile = new DoctorProfile({
        userId: user._id,
        ...doctorData
      });
      await doctorProfile.save();
    }
    // If registering as a patient, create patient profile
    else if (role === 'patient') {
      const { contactNumber, allowContactVisibility = false } = doctorData;
      if (!contactNumber) {
        await user.remove();
        return res.status(400).json({
          message: 'Contact number is required for patient registration'
        });
      }
      const patientProfile = new PatientProfile({
        userId: user._id,
        contactNumber,
        allowContactVisibility
      });
      await patientProfile.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Remove password from response
    user.password = undefined;

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });

    res.json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        specialization: user.specialization,
        hospitalName: user.hospitalName
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get current user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update user profile
router.patch('/profile', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = [
    'fullName',
    'specialization',
    'hospitalName',
    'phoneNumber',
    'address',
    'profileImage'
  ];

  const isValidOperation = updates.every(update => allowedUpdates.includes(update));
  if (!isValidOperation) {
    return res.status(400).json({ message: 'Invalid updates' });
  }

  try {
    updates.forEach(update => req.user[update] = req.body[update]);
    await req.user.save();
    res.json(req.user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Validate doctor registration number
router.post('/validate-registration', async (req, res) => {
  console.log('🔍 [POST] /auth/validate-registration - Request:', {
    body: req.body,
    url: req.originalUrl,
    method: req.method
  });
  try {
    const { registrationNo, name, smcId, year } = req.body;

    if (!registrationNo) {
      return res.status(400).json({
        isValid: false,
        message: 'Registration number is required'
      });
    }

    // If name is not provided, only check if format is valid
    if (!name) {
      const isValidFormat = /^[A-Z0-9]+$/.test(registrationNo);
      return res.json({
        isValid: isValidFormat,
        message: isValidFormat ? 'Valid format' : 'Invalid registration number format'
      });
    }

    // If both registration number and name are provided, verify with NMC
    const nmcVerification = await nmcService.verifyDoctor(
      name,
      registrationNo,
      year || new Date().getFullYear()
    );

    res.json({
      isValid: nmcVerification.isValid,
      message: nmcVerification.message,
      data: nmcVerification.data
    });

  } catch (error) {
    console.error('❌ [POST] /auth/validate-registration - Error:', {
      error: error.message,
      stack: error.stack,
      url: req.originalUrl,
      method: req.method,
      body: req.body
    });
    res.status(500).json({
      isValid: false,
      message: 'Failed to validate registration. Please try again.'
    });
  }
});

module.exports = router;
