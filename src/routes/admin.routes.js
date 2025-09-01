const express = require('express');
const User = require('../models/user.model');
const Patient = require('../models/patient.model');
const Occupation = require('../models/occupation.model');
const Feature = require('../models/feature.model');
const Advertisement = require('../models/advertisement.model');
const auth = require('../middleware/auth');
const router = express.Router();
const DoctorView = require('../models/doctor.view.model');

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin Registration
router.post('/register', async (req, res) => {
  console.log("registerregister");
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check if admin already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create new admin user
    const admin = new User({
      email,
      password,
      role: 'admin',
      firstName: 'Admin', // Required by schema
      lastName: 'User',   // Required by schema
      fullName: 'Admin User', // Required by schema
      gender: 'male',     // Required by schema
      dateOfBirth: new Date('1900-01-01'), // Required by schema
      contactNumber1: '0000000000', // Required by schema
      medicalLicenseNumber: 'ADMIN000', // Required by schema
      medicalDegrees: ['Admin'], // Required by schema
      specialization: 'Administration', // Required by schema
      hospitalName1: 'Admin Hospital', // Required by schema
      hospitalAddress1: { // Required by schema
        city: 'Admin City',
        state: 'Admin State',
        country: 'Admin Country'
      },
      practiceStartDate: new Date(), // Required by schema
      verificationStatus: 'verified' // Auto-verify admin
    });

    await admin.save();

    res.status(201).json({ 
      message: 'Admin registered successfully',
      email: admin.email,
      role: admin.role
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin Dashboard Statistics
router.get('/statistics', auth, isAdmin, async (req, res) => {
  try {
    const [
      totalDoctors,
      doctorStats,
      messageStats
    ] = await Promise.all([
      // Total registered doctors
      User.countDocuments({ role: 'doctor' }),
      
      // Aggregate referral statistics for each doctor
      User.aggregate([
        { $match: { role: 'doctor' } },
        {
          $lookup: {
            from: 'referrals',
            localField: '_id',
            foreignField: 'referringDoctor',
            as: 'referralsSent'
          }
        },
        {
          $lookup: {
            from: 'referrals',
            localField: '_id',
            foreignField: 'referredDoctor',
            as: 'referralsReceived'
          }
        },
        {
          $project: {
            _id: 1,
            fullName: 1,
            email: 1,
            referralsSentCount: { $size: '$referralsSent' },
            referralsReceivedCount: { $size: '$referralsReceived' }
          }
        }
      ]),

      // Aggregate message statistics for each doctor
      User.aggregate([
        { $match: { role: 'doctor' } },
        {
          $lookup: {
            from: 'messages',
            localField: '_id',
            foreignField: 'recipient',
            as: 'messagesReceived'
          }
        },
        {
          $project: {
            _id: 1,
            fullName: 1,
            email: 1,
            messagesReceivedCount: { $size: '$messagesReceived' }
          }
        }
      ])
    ]);

    res.json({
      totalDoctors,
      doctorStats,
      messageStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Occupation Management
router.post('/occupations', auth, isAdmin, async (req, res) => {
  try {
    const occupation = new Occupation({
      ...req.body,
      createdBy: req.user._id
    });
    await occupation.save();
    res.status(201).json(occupation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/occupations', auth, isAdmin, async (req, res) => {
  try {
    const occupations = await Occupation.find().sort({ name: 1 });
    res.json(occupations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Feature Management
router.post('/features', auth, isAdmin, async (req, res) => {
  try {
    const feature = new Feature({
      ...req.body,
      createdBy: req.user._id
    });
    await feature.save();
    res.status(201).json(feature);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/features', auth, isAdmin, async (req, res) => {
  try {
    const features = await Feature.find().sort({ name: 1 });
    res.json(features);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Advertisement Management
router.post('/advertisements', auth, isAdmin, async (req, res) => {
  try {
    const advertisement = new Advertisement({
      ...req.body,
      createdBy: req.user._id
    });
    await advertisement.save();
    res.status(201).json(advertisement);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/advertisements', auth, isAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    
    const advertisements = await Advertisement.find(query)
      .sort({ startDate: -1 });
    res.json(advertisements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update advertisement status
router.patch('/advertisements/:id/status', auth, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const advertisement = await Advertisement.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!advertisement) {
      return res.status(404).json({ message: 'Advertisement not found' });
    }
    res.json(advertisement);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ==================== USER SOFT DELETE MANAGEMENT ====================

// Soft delete a doctor
router.patch('/doctors/:id/delete', auth, isAdmin, async (req, res) => {
  try {
    const updated = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'doctor' },
      { isDeleted: true },
      { new: true }
    ).select('-password');
    if (!updated) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    res.json({ message: 'Doctor soft-deleted successfully', user: updated });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Restore a doctor
router.patch('/doctors/:id/restore', auth, isAdmin, async (req, res) => {
  try {
    const updated = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'doctor' },
      { isDeleted: false },
      { new: true }
    ).select('-password');
    if (!updated) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    res.json({ message: 'Doctor restored successfully', user: updated });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Soft delete a patient
router.patch('/patients/:id/delete', auth, isAdmin, async (req, res) => {
  try {
    const updated = await Patient.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    res.json({ message: 'Patient soft-deleted successfully', patient: updated });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Restore a patient
router.patch('/patients/:id/restore', auth, isAdmin, async (req, res) => {
  try {
    const updated = await Patient.findByIdAndUpdate(
      req.params.id,
      { isDeleted: false },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    res.json({ message: 'Patient restored successfully', patient: updated });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// View stats for all doctors (total views and unique patients per doctor)
router.get('/doctor-view-stats', auth, isAdmin, async (req, res) => {
  try {
    const stats = await DoctorView.aggregate([
      {
        $group: {
          _id: '$doctor',
          totalViews: { $sum: '$views' },
          uniquePatients: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'doctor'
        }
      },
      { $unwind: '$doctor' },
      {
        $project: {
          doctorId: '$_id',
          fullName: '$doctor.fullName',
          email: '$doctor.email',
          specialization: '$doctor.specialization',
          totalViews: 1,
          uniquePatients: 1,
          _id: 0
        }
      }
    ]);

    res.json({ stats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
