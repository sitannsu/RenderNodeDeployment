const express = require('express');
const User = require('../models/user.model');
const router = express.Router();

// Search doctors with filters (no auth required for patient app)
router.get('/search', async (req, res) => {
  try {
    const { query, specialization, location, hospital, page = 1, limit = 10 } = req.query;
    let searchQuery = { role: 'doctor' };
    
    // Build search query based on filters
    if (query) {
      searchQuery.$or = [
        { fullName: { $regex: query, $options: 'i' } },
        { specialization: { $regex: query, $options: 'i' } },
        { hospitalName: { $regex: query, $options: 'i' } },
        { address: { $regex: query, $options: 'i' } }
      ];
    } else {
      if (specialization) {
        searchQuery.specialization = { $regex: specialization, $options: 'i' };
      }
      if (location) {
        searchQuery.address = { $regex: location, $options: 'i' };
      }
      if (hospital) {
        searchQuery.hospitalName = { $regex: hospital, $options: 'i' };
      }
    }

    // Calculate skip for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Find doctors with pagination
    const doctors = await User.find(searchQuery)
      .select('fullName specialization hospitalName address yearsOfExperience')
      .sort({ fullName: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await User.countDocuments(searchQuery);

    res.json({
      doctors,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error searching doctors:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get doctor details by ID (no auth required for patient app)
router.get('/:id', async (req, res) => {
  try {
    const doctor = await User.findById(req.params.id)
      .select('fullName specialization hospitalName address yearsOfExperience');
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    res.json(doctor);
  } catch (error) {
    console.error('Error getting doctor details:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
