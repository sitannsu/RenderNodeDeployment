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

// ==================== DOCTOR REGISTRATION ====================

// Register new doctor
router.post('/doctor/register', async (req, res) => {
  try {
    const {
      firstName,
      middleName,
      lastName,
      gender,
      dateOfBirth,
      contactNumber1,
      contactNumber2,
      showContactDetails,
      address,
      email,
      password,
      medicalLicenseNumber,
      medicalDegrees,
      specialization,
      hospitals,
      clinicAddress,
      practiceStartDate,
      treatedDiseases,
      documents,
      communityDetails,
      communicationPreferences
    } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Process hospitals array to extract first hospital as primary
    let hospitalName1 = '';
    let hospitalAddress1 = {};
    
    if (hospitals && hospitals.length > 0) {
      const primaryHospital = hospitals[0];
      hospitalName1 = primaryHospital.name || '';
      hospitalAddress1 = {
        street: primaryHospital.address || '',
        city: primaryHospital.city || '',
        state: primaryHospital.state || '',
        country: primaryHospital.country || ''
      };
    }

    // Process clinic address
    let processedClinicAddress = {};
    if (clinicAddress) {
      processedClinicAddress = {
        street: clinicAddress.address || '',
        city: clinicAddress.city || '',
        state: clinicAddress.state || '',
        country: clinicAddress.country || ''
      };
    }

    // Process community details
    let processedCommunityDetails = {};
    if (communityDetails) {
      processedCommunityDetails = {
        kapuCommunityAffiliation: communityDetails.kapuAffiliation || false,
        communityReferrals: []
      };
      
      // Convert community referrals to proper format
      if (communityDetails.communityReferrals && Array.isArray(communityDetails.communityReferrals)) {
        processedCommunityDetails.communityReferrals = communityDetails.communityReferrals.map(ref => ({
          name: typeof ref === 'string' ? ref : ref.name || '',
          relationship: typeof ref === 'string' ? 'Referral' : ref.relationship || 'Referral',
          contactNumber: typeof ref === 'string' ? '' : ref.contactNumber || ''
        }));
      }
    }

    // Create new doctor user
    const doctor = new User({
      firstName,
      middleName: middleName || '',
      lastName,
      fullName: `Dr. ${firstName}${middleName ? ' ' + middleName : ''} ${lastName}`,
      gender: gender ? gender.toLowerCase() : 'male',
      dateOfBirth: new Date(dateOfBirth),
      contactNumber1,
      contactNumber2: contactNumber2 || '',
      showContactDetails: showContactDetails || false,
      homeAddress: {
        street: address?.street || '',
        city: address?.city || '',
        state: address?.state || '',
        country: address?.country || '',
        pincode: address?.pincode || ''
      },
      email,
      password: password || 'defaultPassword123', // Set a default password if not provided
      role: 'doctor',
      medicalLicenseNumber,
      medicalDegrees: Array.isArray(medicalDegrees) ? medicalDegrees : [medicalDegrees],
      specialization,
      hospitalName1,
      hospitalAddress1,
      clinicAddress: processedClinicAddress,
      practiceStartDate: new Date(practiceStartDate),
      treatedDiseases: Array.isArray(treatedDiseases) ? treatedDiseases : [treatedDiseases],
      documents: {
        medicalCertificates: documents?.medicalCertificates || [],
        casteCertificate: documents?.casteCertificate || '',
        identificationProof: documents?.identificationProof || ''
      },
      communityDetails: processedCommunityDetails,
      communicationPreferences: {
        notificationPreference: communicationPreferences?.notificationPreference || true,
        emailCommunication: communicationPreferences?.emailCommunication || true
      },
      verificationStatus: 'pending',
      profileCompletion: 0 // Will be calculated after save
    });

    // Calculate profile completion
    doctor.profileCompletion = doctor.calculateProfileCompletion();

    await doctor.save();

    // Return response without password
    const doctorResponse = doctor.toObject();
    delete doctorResponse.password;

    res.status(201).json({
      message: 'Doctor registered successfully',
      doctor: doctorResponse,
      profileCompletion: doctor.profileCompletion
    });
  } catch (error) {
    console.error('Doctor registration error:', error);
    res.status(400).json({ message: error.message });
  }
});

// ==================== PATIENT AUTHENTICATION ====================
// Note: Patient authentication is handled via OTP in /api/patient-auth/ routes
// No registration required - patients login directly with phone number and OTP

// ==================== LOGIN ENDPOINTS ====================

// Universal login (works for all user types)
router.post('/login', async (req, res) => {
  try {
    const { email, password, fcmToken, deviceType, appVersion } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if user has a password set
    if (!user.password) {
      // For users without password (like doctors who registered without password)
      // Allow login with just email for now, but suggest setting a password
      
      // Update FCM token and device info
      if (fcmToken) {
        user.fcmToken = fcmToken;
        user.deviceInfo.deviceType = deviceType || 'android';
        user.deviceInfo.appVersion = appVersion;
        user.deviceInfo.lastLoginAt = new Date();
        await user.save();
      }

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
      });

      return res.json({
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          specialization: user.specialization,
          hospitalName: user.hospitalName1
        },
        message: 'Login successful. Please set a password for security.',
        requiresPasswordSetup: true
      });
    }

    // Check password for users who have one set
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Update FCM token and device info
    if (fcmToken) {
      user.fcmToken = fcmToken;
      user.deviceInfo.deviceType = deviceType || 'android';
      user.deviceInfo.appVersion = appVersion;
      user.deviceInfo.lastLoginAt = new Date();
      await user.save();
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
        role: user.role,
        specialization: user.specialization,
        hospitalName: user.hospitalName1
      },
      requiresPasswordSetup: false
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Doctor-specific login (passwordless)
router.post('/doctor/login', async (req, res) => {
  try {
    const { email, fcmToken, deviceType, appVersion } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Check if user is a doctor
    if (user.role !== 'doctor') {
      return res.status(401).json({ message: 'This login is only for doctors' });
    }

    // Update FCM token and device info
    if (fcmToken) {
      user.fcmToken = fcmToken;
      user.deviceInfo.deviceType = deviceType || 'android';
      user.deviceInfo.appVersion = appVersion;
      user.deviceInfo.lastLoginAt = new Date();
      await user.save();
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
        role: user.role,
        specialization: user.specialization,
        hospitalName: user.hospitalName1
      },
      message: 'Login successful. Please set a password for security.',
      requiresPasswordSetup: !user.password
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Note: Patient login is handled via OTP in /api/patient-auth/ routes

// Admin login
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password, fcmToken, deviceType, appVersion } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if user is an admin
    if (user.role !== 'admin') {
      return res.status(401).json({ message: 'This login is only for administrators' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Update FCM token and device info
    if (fcmToken) {
      user.fcmToken = fcmToken;
      user.deviceInfo.deviceType = deviceType || 'android';
      user.deviceInfo.appVersion = appVersion;
      user.deviceInfo.lastLoginAt = new Date();
      await user.save();
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
        role: user.role
      },
      requiresPasswordSetup: false
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ==================== PASSWORD MANAGEMENT ====================

// Set password for user
router.post('/set-password', auth, async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    // Set the password
    req.user.password = password;
    await req.user.save();

    res.json({
      message: 'Password set successfully',
      user: {
        id: req.user._id,
        fullName: req.user.fullName,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update FCM token
router.post('/update-fcm-token', auth, async (req, res) => {
  try {
    const { fcmToken, deviceType, appVersion } = req.body;

    if (!fcmToken) {
      return res.status(400).json({ message: 'FCM token is required' });
    }

    // Update FCM token and device info
    req.user.fcmToken = fcmToken;
    req.user.deviceInfo.deviceType = deviceType || 'android';
    req.user.deviceInfo.appVersion = appVersion;
    req.user.deviceInfo.lastLoginAt = new Date();
    await req.user.save();

    res.json({
      message: 'FCM token updated successfully',
      user: {
        id: req.user._id,
        fullName: req.user.fullName,
        email: req.user.email,
        role: req.user.role,
        deviceInfo: req.user.deviceInfo
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ==================== PROFILE ENDPOINTS ====================

// Get current user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    // Calculate current profile completion
    const profileCompletion = user.calculateProfileCompletion();
    
    // Create response object with profile completion
    const userResponse = user.toObject();
    userResponse.profileCompletion = profileCompletion;
    
    res.json({
      user: userResponse,
      profileCompletion: profileCompletion
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update user profile
router.patch('/profile', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = [
    'firstName', 'lastName', 'middleName', 'gender', 'dateOfBirth',
    'contactNumber1', 'contactNumber2', 'showContactDetails',
    'homeAddress', 'medicalLicenseNumber', 'medicalDegrees', 'specialization',
    'hospitalName1', 'hospitalAddress1', 'hospitalName2', 'hospitalAddress2',
    'clinicAddress', 'practiceStartDate', 'treatedDiseases', 'documents',
    'communityDetails', 'communicationPreferences'
  ];

  const isValidOperation = updates.every(update => allowedUpdates.includes(update));
  if (!isValidOperation) {
    return res.status(400).json({ message: 'Invalid updates' });
  }

  try {
    updates.forEach(update => req.user[update] = req.body[update]);
    
    // Update full name if first or last name changed
    if (req.body.firstName || req.body.lastName) {
      req.user.fullName = `${req.user.firstName}${req.user.middleName ? ' ' + req.user.middleName : ''} ${req.user.lastName}`;
      if (req.user.role === 'doctor') {
        req.user.fullName = `Dr. ${req.user.fullName}`;
      }
    }

    // Calculate profile completion
    req.user.profileCompletion = req.user.calculateProfileCompletion();
    
    await req.user.save();
    
    const userResponse = req.user.toObject();
    delete userResponse.password;
    
    res.json({
      message: 'Profile updated successfully',
      user: userResponse,
      profileCompletion: req.user.profileCompletion
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ==================== VALIDATION ENDPOINTS ====================

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
