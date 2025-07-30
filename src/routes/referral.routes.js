const express = require('express');
const Referral = require('../models/referral.model');
const auth = require('../middleware/auth');
const router = express.Router();

// Create a new referral
router.post('/', auth, async (req, res) => {
  try {
    const referral = new Referral({
      ...req.body,
      referringDoctor: req.user._id
    });
    await referral.save();
    
    // Populate doctor information
    await referral.populate('referringDoctor referredToDoctor', 'fullName specialization hospitalName');
    
    res.status(201).json(referral);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all referrals for a doctor (both sent and received)
router.get('/', auth, async (req, res) => {
  try {
    const { status, type } = req.query;
    let query = {};

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    // Filter by referral type (sent or received)
    if (type === 'sent') {
      query.referringDoctor = req.user._id;
    } else if (type === 'received') {
      query.referredToDoctor = req.user._id;
    } else {
      query.$or = [
        { referringDoctor: req.user._id },
        { referredToDoctor: req.user._id }
      ];
    }

    const referrals = await Referral.find(query)
      .populate('referringDoctor referredToDoctor', 'fullName specialization hospitalName')
      .sort({ createdAt: -1 });

    res.json(referrals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific referral by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const referral = await Referral.findById(req.params.id)
      .populate('referringDoctor referredToDoctor', 'fullName specialization hospitalName');

    if (!referral) {
      return res.status(404).json({ message: 'Referral not found' });
    }

    // Check if the user is involved in this referral
    if (!referral.referringDoctor._id.equals(req.user._id) && 
        !referral.referredToDoctor._id.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to view this referral' });
    }

    res.json(referral);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update referral status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const referral = await Referral.findById(req.params.id);

    if (!referral) {
      return res.status(404).json({ message: 'Referral not found' });
    }

    // Only the referred doctor can update the status
    if (!referral.referredToDoctor.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to update this referral' });
    }

    referral.status = status;
    await referral.save();
    await referral.populate('referringDoctor referredToDoctor', 'fullName specialization hospitalName');

    res.json(referral);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add notes to a referral
router.patch('/:id/notes', auth, async (req, res) => {
  try {
    const { notes } = req.body;
    const referral = await Referral.findById(req.params.id);

    if (!referral) {
      return res.status(404).json({ message: 'Referral not found' });
    }

    // Both doctors can add notes
    if (!referral.referringDoctor.equals(req.user._id) && 
        !referral.referredToDoctor.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to update this referral' });
    }

    referral.notes = notes;
    await referral.save();
    await referral.populate('referringDoctor referredToDoctor', 'fullName specialization hospitalName');

    res.json(referral);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get referral statistics
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const stats = await Referral.aggregate([
      {
        $match: {
          $or: [
            { referringDoctor: req.user._id },
            { referredToDoctor: req.user._id }
          ]
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const formattedStats = stats.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {
      pending: 0,
      accepted: 0,
      rejected: 0,
      completed: 0
    });

    res.json(formattedStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
