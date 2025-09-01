const express = require('express');
const User = require('../models/user.model');
const DoctorView = require('../models/doctor.view.model');
const { patientAuth } = require('./patient.auth.routes');
const jwt = require('jsonwebtoken');
const Patient = require('../models/patient.model');
const DoctorVisitTotal = require('../models/doctor.visit.total.model');
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

// Optional patient auth: attaches req.patient if valid token provided; otherwise continues
const optionalPatientAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return next();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const patient = await Patient.findById(decoded.id);
    if (patient && !patient.isDeleted) {
      req.patient = patient;
    }
  } catch (err) {
    // ignore invalid/expired tokens for optional flow
  } finally {
    next();
  }
};

// Get doctor details by ID (records a view if called by an authenticated patient)
router.get('/:id', optionalPatientAuth, async (req, res) => {
  try {
    const doctor = await User.findById(req.params.id)
      .select('fullName specialization hospitalName address yearsOfExperience');
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    // Record view if patient context is present
    if (req.patient) {
      try {
        await DoctorView.findOneAndUpdate(
          { doctor: doctor._id, patient: req.patient._id },
          { $inc: { views: 1 }, $set: { lastViewedAt: new Date() } },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        // Increment global total views for the doctor
        await DoctorVisitTotal.findOneAndUpdate(
          { doctor: doctor._id },
          { $inc: { totalViews: 1 }, $set: { lastViewedAt: new Date() } },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        );
      } catch (e) {
        // best-effort; do not block response
      }
    }

    res.json(doctor);
  } catch (error) {
    console.error('Error getting doctor details:', error);
    res.status(500).json({ message: error.message });
  }
});

// Record a view for a doctor by the authenticated patient
router.post('/:id/view', patientAuth, async (req, res) => {
  try {
    const doctorId = req.params.id;
    const patientId = req.patient._id;

    // Ensure doctor exists and is a doctor
    const doctor = await User.findOne({ _id: doctorId, role: 'doctor' }).select('_id');
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Upsert view counter for this doctor-patient pair
    const view = await DoctorView.findOneAndUpdate(
      { doctor: doctorId, patient: patientId },
      { $inc: { views: 1 }, $set: { lastViewedAt: new Date() } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ message: 'View recorded', data: view });
  } catch (error) {
    console.error('Error recording doctor view:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get view stats for a doctor (total views and unique patients)
router.get('/:id/view-stats', async (req, res) => {
  try {
    const doctorId = req.params.id;

    const [aggregate] = await DoctorView.aggregate([
      { $match: { doctor: require('mongoose').Types.ObjectId.createFromHexString(doctorId) } },
      {
        $group: {
          _id: '$doctor',
          totalViews: { $sum: '$views' },
          uniquePatients: { $sum: 1 }
        }
      }
    ]);

    res.json({
      doctorId,
      totalViews: aggregate?.totalViews || 0,
      uniquePatients: aggregate?.uniquePatients || 0
    });
  } catch (error) {
    console.error('Error fetching doctor view stats:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
