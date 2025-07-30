const express = require('express');
const User = require('../models/user.model');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all doctors
router.get('/', async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' })
      .select('-password')
      .sort({ fullName: 1 });
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Search doctors by specialization or name
router.get('/search', async (req, res) => {
  try {
    const { query, specialization, page = 1, limit = 10 } = req.query;
    let searchQuery = { role: 'doctor' };

    if (query) {
      searchQuery.$or = [
        { fullName: { $regex: query, $options: 'i' } },
        { hospitalName: { $regex: query, $options: 'i' } },
        { specialization: { $regex: query, $options: 'i' } }
      ];
    }

    if (specialization) {
      searchQuery.specialization = { $regex: specialization, $options: 'i' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [doctors, total] = await Promise.all([
      User.find(searchQuery)
        .select('-password')
        .sort({ fullName: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(searchQuery)
    ]);

    res.json({
      doctors,
      totalDoctors: total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get doctor by ID
router.get('/:id', async (req, res) => {
  try {
    const { query, specialization } = req.query;
    let searchQuery = { role: 'doctor' };

    if (query) {
      searchQuery.$or = [
        { fullName: { $regex: query, $options: 'i' } },
        { hospitalName: { $regex: query, $options: 'i' } }
      ];
    }

    if (specialization) {
      searchQuery.specialization = specialization;
    }

    const doctors = await User.find(searchQuery)
      .select('-password')
      .sort({ fullName: 1 });

    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get doctor statistics
router.get('/stats/:id', auth, async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $match: { _id: mongoose.Types.ObjectId(req.params.id) }
      },
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
          foreignField: 'referredToDoctor',
          as: 'referralsReceived'
        }
      },
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
          totalReferralsSent: { $size: '$referralsSent' },
          totalReferralsReceived: { $size: '$referralsReceived' },
          pendingReferrals: {
            $size: {
              $filter: {
                input: '$referralsReceived',
                as: 'referral',
                cond: { $eq: ['$$referral.status', 'pending'] }
              }
            }
          },
          unreadMessages: {
            $size: {
              $filter: {
                input: '$messagesReceived',
                as: 'message',
                cond: { $eq: ['$$message.read', false] }
              }
            }
          }
        }
      }
    ]);

    res.json(stats[0] || {
      totalReferralsSent: 0,
      totalReferralsReceived: 0,
      pendingReferrals: 0,
      unreadMessages: 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Register new doctor
router.post('/register', async (req, res) => {
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

    // Create new doctor user
    const doctor = new User({
      firstName,
      middleName,
      lastName,
      fullName: `Dr. ${firstName}${middleName ? ' ' + middleName : ''} ${lastName}`,
      gender,
      dateOfBirth,
      contactNumber1,
      contactNumber2,
      showContactDetails,
      address,
      email,
      password,
      role: 'doctor',
      medicalLicenseNumber,
      medicalDegrees,
      specialization,
      hospitals,
      clinicAddress,
      practiceStartDate,
      treatedDiseases,
      documents,
      communityDetails,
      communicationPreferences,
      verificationStatus: 'pending',
      profileCompletion: 100 // Calculate based on filled fields
    });

    await doctor.save();

    // Return response without password
    const doctorResponse = doctor.toObject();
    delete doctorResponse.password;

    res.status(201).json(doctorResponse);
  } catch (error) {
    console.error('Doctor registration error:', error);
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
