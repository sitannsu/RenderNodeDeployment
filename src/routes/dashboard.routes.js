const express = require('express');
const User = require('../models/user.model');
const DoctorProfile = require('../models/doctorProfile.model');
const Referral = require('../models/referral.model');
const PatientQuery = require('../models/patient.query.model');
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

// GET /api/dashboard/stats - Returns dashboard statistics
router.get('/stats', auth, isAdmin, async (req, res) => {
  try {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());

    // Get current month and previous month data
    const [
      totalDoctors,
      currentMonthDoctors,
      previousMonthDoctors,
      currentMonthReferrals,
      previousMonthReferrals,
      pendingInquiries,
      previousMonthInquiries,
      currentMonthSearches,
      previousMonthSearches
    ] = await Promise.all([
      // Total doctors
      User.countDocuments({ role: 'doctor' }),
      
      // Current month doctor registrations
      User.countDocuments({
        role: 'doctor',
        createdAt: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) }
      }),
      
      // Previous month doctor registrations
      User.countDocuments({
        role: 'doctor',
        createdAt: { 
          $gte: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
          $lt: new Date(now.getFullYear(), now.getMonth(), 1)
        }
      }),
      
      // Current month referrals
      Referral.countDocuments({
        createdAt: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) }
      }),
      
      // Previous month referrals
      Referral.countDocuments({
        createdAt: { 
          $gte: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
          $lt: new Date(now.getFullYear(), now.getMonth(), 1)
        }
      }),
      
      // Current pending inquiries
      PatientQuery.countDocuments({ status: 'pending' }),
      
      // Previous month inquiries
      PatientQuery.countDocuments({
        createdAt: { 
          $gte: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
          $lt: new Date(now.getFullYear(), now.getMonth(), 1)
        }
      }),
      
      // Current month searches (approximated by patient queries)
      PatientQuery.countDocuments({
        createdAt: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) }
      }),
      
      // Previous month searches
      PatientQuery.countDocuments({
        createdAt: { 
          $gte: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
          $lt: new Date(now.getFullYear(), now.getMonth(), 1)
        }
      })
    ]);

    // Calculate trends (percentage change)
    const doctorTrend = previousMonthDoctors > 0 
      ? ((currentMonthDoctors - previousMonthDoctors) / previousMonthDoctors * 100).toFixed(1)
      : currentMonthDoctors > 0 ? 100 : 0;

    const referralTrend = previousMonthReferrals > 0 
      ? ((currentMonthReferrals - previousMonthReferrals) / previousMonthReferrals * 100).toFixed(1)
      : currentMonthReferrals > 0 ? 100 : 0;

    const inquiryTrend = previousMonthInquiries > 0 
      ? ((pendingInquiries - previousMonthInquiries) / previousMonthInquiries * 100).toFixed(1)
      : pendingInquiries > 0 ? 100 : 0;

    const searchTrend = previousMonthSearches > 0 
      ? ((currentMonthSearches - previousMonthSearches) / previousMonthSearches * 100).toFixed(1)
      : currentMonthSearches > 0 ? 100 : 0;

    res.json({
      doctors: {
        total: totalDoctors,
        trend: parseFloat(doctorTrend)
      },
      referrals: {
        monthly: currentMonthReferrals,
        trend: parseFloat(referralTrend)
      },
      inquiries: {
        pending: pendingInquiries,
        trend: parseFloat(inquiryTrend)
      },
      searches: {
        monthly: currentMonthSearches,
        trend: parseFloat(searchTrend)
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET /api/dashboard/activity - Returns recent activities
router.get('/activity', auth, isAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const [
      recentDoctors,
      recentReferrals,
      recentInquiries,
      recentSearches
    ] = await Promise.all([
      // Recent doctor registrations
      User.find({ role: 'doctor' })
        .select('fullName email createdAt')
        .sort({ createdAt: -1 })
        .limit(limit),
      
      // Recent referrals
      Referral.find()
        .populate('referringDoctor', 'fullName')
        .populate('referredDoctor', 'fullName')
        .select('patientName status createdAt')
        .sort({ createdAt: -1 })
        .limit(limit),
      
      // Recent inquiries
      PatientQuery.find()
        .populate('patient', 'fullName')
        .populate('doctor', 'fullName')
        .select('symptoms status createdAt consultationType')
        .sort({ createdAt: -1 })
        .limit(limit),
      
      // Recent searches (approximated by patient queries)
      PatientQuery.find()
        .populate('patient', 'fullName')
        .populate('doctor', 'fullName')
        .select('symptoms status createdAt consultationType')
        .sort({ createdAt: -1 })
        .limit(limit)
    ]);

    // Combine and sort all activities by date
    const activities = [
      ...recentDoctors.map(doctor => ({
        type: 'doctor_registration',
        data: {
          doctorName: doctor.fullName,
          email: doctor.email,
          date: doctor.createdAt
        },
        timestamp: doctor.createdAt
      })),
      ...recentReferrals.map(referral => ({
        type: 'referral',
        data: {
          patientName: referral.patientName,
          referringDoctor: referral.referringDoctor?.fullName || 'Unknown',
          referredDoctor: referral.referredDoctor?.fullName || 'Unknown',
          status: referral.status,
          date: referral.createdAt
        },
        timestamp: referral.createdAt
      })),
      ...recentInquiries.map(inquiry => ({
        type: 'inquiry',
        data: {
          patientName: inquiry.patient?.fullName || 'Unknown',
          doctorName: inquiry.doctor?.fullName || 'Unknown',
          symptoms: inquiry.symptoms,
          status: inquiry.status,
          consultationType: inquiry.consultationType,
          date: inquiry.createdAt
        },
        timestamp: inquiry.createdAt
      })),
      ...recentSearches.map(search => ({
        type: 'search',
        data: {
          patientName: search.patient?.fullName || 'Unknown',
          doctorName: search.doctor?.fullName || 'Unknown',
          symptoms: search.symptoms,
          consultationType: search.consultationType,
          date: search.createdAt
        },
        timestamp: search.createdAt
      }))
    ].sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);

    res.json({
      activities,
      total: activities.length
    });
  } catch (error) {
    console.error('Dashboard activity error:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET /api/dashboard/referral-trends - Returns daily referral counts
router.get('/referral-trends', auth, isAdmin, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

    // Generate daily referral counts
    const dailyReferrals = await Referral.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Generate array of all dates in range
    const dateArray = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      dateArray.push({
        date: new Date(currentDate),
        count: 0
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Merge actual data with date array
    const trends = dateArray.map(dateObj => {
      const matchingData = dailyReferrals.find(item => 
        item._id.year === dateObj.date.getFullYear() &&
        item._id.month === dateObj.date.getMonth() + 1 &&
        item._id.day === dateObj.date.getDate()
      );
      
      return {
        date: dateObj.date.toISOString().split('T')[0],
        count: matchingData ? matchingData.count : 0
      };
    });

    res.json({
      trends,
      totalReferrals: trends.reduce((sum, item) => sum + item.count, 0),
      averageDaily: trends.length > 0 
        ? (trends.reduce((sum, item) => sum + item.count, 0) / trends.length).toFixed(1)
        : 0,
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      }
    });
  } catch (error) {
    console.error('Dashboard referral trends error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 