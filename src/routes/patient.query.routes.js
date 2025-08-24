const express = require('express');
const PatientQuery = require('../models/patient.query.model');
const { patientAuth } = require('./patient.auth.routes');
const User = require('../models/user.model');
const notificationService = require('../services/notification.service');
const router = express.Router();

// Advanced doctor search with filters
router.get('/doctors/search', async (req, res) => {
  try {
    const {
      specialization,
      location,
      hospital,
      query,
      page = 1,
      limit = 10
    } = req.query;

    const filter = {};
    
    if (specialization) {
      filter.specialization = new RegExp(specialization, 'i');
    }
    
    if (hospital) {
      filter.hospitalName = new RegExp(hospital, 'i');
    }
    
    if (location) {
      filter['address'] = new RegExp(location, 'i');
    }

    if (query) {
      filter.$or = [
        { fullName: new RegExp(query, 'i') },
        { specialization: new RegExp(query, 'i') },
        { hospitalName: new RegExp(query, 'i') }
      ];
    }

    const doctors = await User.find(filter)
      .select('fullName specialization hospitalName address yearsOfExperience')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ yearsOfExperience: -1 });

    const total = await User.countDocuments(filter);

    res.json({
      doctors,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      totalDoctors: total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new query for a doctor
router.post('/queries', patientAuth, async (req, res) => {
  try {
    const {
      doctorId,
      symptoms,
      duration,
      previousTreatments,
      attachments,
      preferredTime,
      consultationType,
      subject,
      urgency,
      patientContactNo
    } = req.body;

    // Verify doctor exists and get patient data
    const doctor = await User.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Get patient data from JWT token
    const patient = req.patient;
    console.log('patientpatientpatient',patient)
    const patientName = patient.phoneNumber ||  'Patient'; // Try both fullName and name fields

    const query = new PatientQuery({
      patient: patient._id,
      doctor: doctorId,
      symptoms: symptoms || '',
      duration: duration || '',
      previousTreatments: previousTreatments || '',
      attachments: attachments || [],
      preferredTime: preferredTime || new Date(),
      consultationType: consultationType || 'online',
      subject: subject || '',
      urgency: urgency || 'medium',
      patientContactNo: patientContactNo || ''
    });

    await query.save();

    // Populate doctor details in response
    await query.populate('doctor', 'fullName specialization hospitalName');

    // Send notification to the doctor about the new query
    const queryData = {
      queryId: query._id.toString(),
      patientId: patient._id.toString(),
      patientName: patientName,
      patientContactNo: patient.phoneNumber|| '',
      query: symptoms || '',
      subject: subject || 'Medical Query',
      urgency: urgency || 'medium',
      consultationType: consultationType || 'online'
    };

    console.log('📱 Preparing to send notification:', {
      doctorId,
      patientName,
      patientContactNo,
      subject,
      urgency,
      queryData
    });

    const notificationResult = await notificationService.sendPatientQueryNotification(
      doctorId,
      queryData
    );

    console.log('📱 Patient query notification result:', notificationResult);

    res.status(201).json(query);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get patient's queries
router.get('/queries', patientAuth, async (req, res) => {
  console.log('Patient queries endpoint called:', req.patient);
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { patient: req.patient._id };

    if (status) {
      filter.status = status;
    }

    const queries = await PatientQuery.find(filter)
      .populate('doctor', 'fullName specialization hospitalName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await PatientQuery.countDocuments(filter);

    res.json({
      queries,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      totalQueries: total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get specific query details
router.get('/queries/:id', patientAuth, async (req, res) => {
  try {
    const query = await PatientQuery.findOne({
      _id: req.params.id,
      patient: req.patient._id
    }).populate('doctor', 'fullName specialization hospitalName');

    if (!query) {
      return res.status(404).json({ message: 'Query not found' });
    }

    res.json(query);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update query (e.g., add attachments)
router.patch('/queries/:id', patientAuth, async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['attachments', 'preferredTime', 'consultationType'];
    
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));
    if (!isValidOperation) {
      return res.status(400).json({ message: 'Invalid updates' });
    }

    const query = await PatientQuery.findOne({
      _id: req.params.id,
      patient: req.patient._id,
      status: 'pending'
    });

    if (!query) {
      return res.status(404).json({ message: 'Query not found or cannot be updated' });
    }

    updates.forEach(update => {
      query[update] = req.body[update];
    });
    await query.save();

    res.json(query);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
