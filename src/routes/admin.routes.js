const express = require('express');
const User = require('../models/user.model');
const Patient = require('../models/patient.model');
const Occupation = require('../models/occupation.model');
const Feature = require('../models/feature.model');
const Advertisement = require('../models/advertisement.model');
const auth = require('../middleware/auth');
const Referral = require('../models/referral.model');
const PatientQuery = require('../models/patient.query.model');
const router = express.Router();
const DoctorView = require('../models/doctor.view.model');
const DoctorVisitTotal = require('../models/doctor.visit.total.model');

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
    // Combine fast totals with unique counts
    const [totals, uniques] = await Promise.all([
      DoctorVisitTotal.aggregate([
        { $project: { doctor: 1, totalViews: 1 } }
      ]),
      DoctorView.aggregate([
        { $group: { _id: '$doctor', uniquePatients: { $sum: 1 } } }
      ])
    ]);

    const uniqueMap = new Map(uniques.map(u => [u._id.toString(), u.uniquePatients]));

    const stats = await Promise.all(totals.map(async t => {
      const doc = await User.findById(t.doctor).select('fullName email specialization');
      return {
        doctorId: t.doctor,
        fullName: doc?.fullName,
        email: doc?.email,
        specialization: doc?.specialization,
        totalViews: t.totalViews || 0,
        uniquePatients: uniqueMap.get(t.doctor.toString()) || 0
      };
    }));

    res.json({ stats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== RECENT ACTIVITIES LIST ====================
// GET /api/admin/recent-activities?range=last30&type=all|doctor|referral|inquiry&limit=10&page=1
router.get('/recent-activities', auth, isAdmin, async (req, res) => {
  try {
    const { range = 'last30', startDate, endDate, type = 'all' } = req.query;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);

    const now = new Date();
    let end = endDate ? new Date(endDate) : now;
    let start;

    const startOfWeekSunday = d => new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay());
    const endOfWeekSaturday = d => new Date(d.getFullYear(), d.getMonth(), d.getDate() + (6 - d.getDay()), 23, 59, 59, 999);

    if (range === 'today') {
      start = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    } else if (range === 'yesterday') {
      const y = new Date(end.getFullYear(), end.getMonth(), end.getDate() - 1);
      start = new Date(y.getFullYear(), y.getMonth(), y.getDate());
      end = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59, 999);
    } else if (range === 'thisWeek') {
      const sow = startOfWeekSunday(end);
      start = new Date(sow.getFullYear(), sow.getMonth(), sow.getDate());
    } else if (range === 'lastWeek') {
      const lastWeekEnd = endOfWeekSaturday(new Date(end.getFullYear(), end.getMonth(), end.getDate() - (end.getDay() + 1)));
      const lastWeekStart = startOfWeekSunday(new Date(lastWeekEnd.getFullYear(), lastWeekEnd.getMonth(), lastWeekEnd.getDate()));
      start = new Date(lastWeekStart.getFullYear(), lastWeekStart.getMonth(), lastWeekStart.getDate());
      end = lastWeekEnd;
    } else if (range === 'last7') {
      start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === 'last28') {
      start = new Date(end.getTime() - 28 * 24 * 60 * 60 * 1000);
    } else if (range === 'last90') {
      start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else if (range === 'last12months') {
      start = new Date(end.getFullYear(), end.getMonth() - 12, end.getDate());
    } else if (range === 'custom' && (startDate || endDate)) {
      start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else {
      // default last30
      start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const startOfRange = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0, 0);
    const endOfRange = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999);

    const queries = [];
    if (type === 'all' || type === 'doctor') {
      queries.push(
        User.find({ role: 'doctor', createdAt: { $gte: startOfRange, $lte: endOfRange } })
          .select('fullName email createdAt')
          .sort({ createdAt: -1 })
          .lean()
          .then(list => list.map(d => ({
            type: 'doctor_registration',
            title: 'New doctor registered',
            details: { name: d.fullName, email: d.email },
            timestamp: d.createdAt
          })))
      );
    }

    if (type === 'all' || type === 'referral') {
      queries.push(
        Referral.find({ createdAt: { $gte: startOfRange, $lte: endOfRange } })
          .populate('referringDoctor', 'fullName')
          .populate('referredDoctor', 'fullName')
          .select('patientName status createdAt')
          .sort({ createdAt: -1 })
          .lean()
          .then(list => list.map(r => ({
            type: 'referral',
            title: `Referral ${r.status}`,
            details: {
              patientName: r.patientName,
              from: r.referringDoctor?.fullName || 'Unknown',
              to: r.referredDoctor?.fullName || 'Unknown'
            },
            timestamp: r.createdAt
          })))
      );
    }

    if (type === 'all' || type === 'inquiry') {
      queries.push(
        PatientQuery.find({ createdAt: { $gte: startOfRange, $lte: endOfRange } })
          .populate('patient', 'name fullName')
          .populate('doctor', 'fullName')
          .select('symptoms status consultationType createdAt')
          .sort({ createdAt: -1 })
          .lean()
          .then(list => list.map(q => ({
            type: 'inquiry',
            title: `New inquiry (${q.consultationType || 'general'})`,
            details: {
              patient: q.patient?.fullName || q.patient?.name || 'Unknown',
              doctor: q.doctor?.fullName || 'Unknown',
              status: q.status
            },
            timestamp: q.createdAt
          })))
      );
    }

    const results = (await Promise.all(queries)).flat();
    results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const total = results.length;
    const startIndex = (page - 1) * limit;
    const pageItems = results.slice(startIndex, startIndex + limit);

    res.json({
      activities: pageItems,
      total,
      page,
      limit,
      dateRange: { start: startOfRange.toISOString(), end: endOfRange.toISOString() }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== ALL REFERRALS (ADMIN) ====================
// GET /api/admin/referrals?status=all|pending|accepted|rejected|completed&search=&page=1&limit=10&range=last30
router.get('/referrals', auth, isAdmin, async (req, res) => {
  try {
    const {
      status = 'all',
      search = '',
      page: pageParam = '1',
      limit: limitParam = '10',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      range = 'last30',
      startDate,
      endDate
    } = req.query;

    const page = Math.max(parseInt(pageParam) || 1, 1);
    const limit = Math.min(Math.max(parseInt(limitParam) || 10, 1), 100);

    // Date range
    const now = new Date();
    let end = endDate ? new Date(endDate) : now;
    let start;
    const startOfWeekSunday = d => new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay());
    const endOfWeekSaturday = d => new Date(d.getFullYear(), d.getMonth(), d.getDate() + (6 - d.getDay()), 23, 59, 59, 999);
    if (range === 'today') {
      start = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    } else if (range === 'yesterday') {
      const y = new Date(end.getFullYear(), end.getMonth(), end.getDate() - 1);
      start = new Date(y.getFullYear(), y.getMonth(), y.getDate());
      end = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59, 999);
    } else if (range === 'thisWeek') {
      const sow = startOfWeekSunday(end);
      start = new Date(sow.getFullYear(), sow.getMonth(), sow.getDate());
    } else if (range === 'lastWeek') {
      const lastWeekEnd = endOfWeekSaturday(new Date(end.getFullYear(), end.getMonth(), end.getDate() - (end.getDay() + 1)));
      const lastWeekStart = startOfWeekSunday(new Date(lastWeekEnd.getFullYear(), lastWeekEnd.getMonth(), lastWeekEnd.getDate()));
      start = new Date(lastWeekStart.getFullYear(), lastWeekStart.getMonth(), lastWeekStart.getDate());
      end = lastWeekEnd;
    } else if (range === 'last7') {
      start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === 'last28') {
      start = new Date(end.getTime() - 28 * 24 * 60 * 60 * 1000);
    } else if (range === 'last90') {
      start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else if (range === 'last12months') {
      start = new Date(end.getFullYear(), end.getMonth() - 12, end.getDate());
    } else if (range === 'custom' && (startDate || endDate)) {
      start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else {
      start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    const startOfRange = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0, 0);
    const endOfRange = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999);

    // Filters
    const filter = { createdAt: { $gte: startOfRange, $lte: endOfRange } };
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { patientName: regex },
        { patientPhone: regex },
        { reason: regex },
        { notes: regex }
      ];
    }

    // Sorting
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    // Query
    const [referrals, total] = await Promise.all([
      Referral.find(filter)
        .populate('referringDoctor', 'fullName email specialization hospitalName1')
        .populate('referredDoctor', 'fullName email specialization hospitalName1')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit),
      Referral.countDocuments(filter)
    ]);

    res.json({
      referrals,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      dateRange: { start: startOfRange.toISOString(), end: endOfRange.toISOString() }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Patients who viewed a specific doctor (with counts)
// GET /api/admin/doctor-view-stats/:doctorId/patients?search=&page=1&limit=10&sortBy=views&sortOrder=desc
router.get('/doctor-view-stats/:doctorId/patients', auth, isAdmin, async (req, res) => {
  try {
    const { doctorId } = req.params;
    const {
      search = '',
      page: pageParam = '1',
      limit: limitParam = '10',
      sortBy = 'views',
      sortOrder = 'desc'
    } = req.query;

    const page = Math.max(parseInt(pageParam) || 1, 1);
    const limit = Math.min(Math.max(parseInt(limitParam) || 10, 1), 100);

    // Build match filter
    const match = { doctor: doctorId };

    // Sorting
    const sort = {};
    sort[sortBy === 'lastViewedAt' ? 'lastViewedAt' : 'views'] = sortOrder === 'asc' ? 1 : -1;

    // Aggregate to include patient details and optional search
    const pipeline = [
      { $match: match },
      {
        $lookup: {
          from: 'patients',
          localField: 'patient',
          foreignField: '_id',
          as: 'patient'
        }
      },
      { $unwind: '$patient' }
    ];

    if (search) {
      const regex = new RegExp(search, 'i');
      pipeline.push({
        $match: {
          $or: [
            { 'patient.name': regex },
            { 'patient.phoneNumber': regex },
            { 'patient.email': regex }
          ]
        }
      });
    }

    pipeline.push(
      { $project: {
          _id: 0,
          patientId: '$patient._id',
          name: '$patient.name',
          phoneNumber: '$patient.phoneNumber',
          email: '$patient.email',
          views: '$views',
          lastViewedAt: '$lastViewedAt'
        }
      },
      { $sort: sort },
      { $skip: (page - 1) * limit },
      { $limit: limit }
    );

    const [items, totalCountAgg] = await Promise.all([
      DoctorView.aggregate(pipeline),
      DoctorView.countDocuments(match)
    ]);

    res.json({
      doctorId,
      total: totalCountAgg,
      page,
      totalPages: Math.ceil(totalCountAgg / limit),
      patients: items
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
