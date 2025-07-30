const express = require('express');
const User = require('../models/user.model');
const Occupation = require('../models/occupation.model');
const Feature = require('../models/feature.model');
const Advertisement = require('../models/advertisement.model');
const auth = require('../middleware/auth');
const router = express.Router();

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
            foreignField: 'referredToDoctor',
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

module.exports = router;
