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
    // Support ranges: last7, last30, or custom startDate/endDate (ISO date strings)
    const { range, startDate, endDate } = req.query;

    const now = new Date();
    const end = endDate ? new Date(endDate) : now;

    let start;
    const startOfWeekSunday = d => new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay());
    const endOfWeekSaturday = d => new Date(d.getFullYear(), d.getMonth(), d.getDate() + (6 - d.getDay()), 23, 59, 59, 999);

    if (range === 'today') {
      start = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    } else if (range === 'yesterday') {
      const y = new Date(end.getFullYear(), end.getMonth(), end.getDate() - 1);
      start = new Date(y.getFullYear(), y.getMonth(), y.getDate());
      end.setFullYear(y.getFullYear(), y.getMonth(), y.getDate());
      end.setHours(23, 59, 59, 999);
    } else if (range === 'thisWeek') {
      const sow = startOfWeekSunday(end);
      start = new Date(sow.getFullYear(), sow.getMonth(), sow.getDate());
    } else if (range === 'lastWeek') {
      const lastWeekEnd = endOfWeekSaturday(new Date(end.getFullYear(), end.getMonth(), end.getDate() - (end.getDay() + 1)));
      const lastWeekStart = startOfWeekSunday(new Date(lastWeekEnd.getFullYear(), lastWeekEnd.getMonth(), lastWeekEnd.getDate()));
      start = new Date(lastWeekStart.getFullYear(), lastWeekStart.getMonth(), lastWeekStart.getDate());
      end.setTime(lastWeekEnd.getTime());
    } else if (range === 'last7') {
      start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === 'last28') {
      start = new Date(end.getTime() - 28 * 24 * 60 * 60 * 1000);
    } else if (range === 'last30' || !range) {
      start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (range === 'last90') {
      start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else if (range === 'last12months') {
      const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      start = new Date(e.getFullYear(), e.getMonth() - 12, e.getDate());
    } else if (range === 'custom' && startDate) {
      start = new Date(startDate);
    } else {
      start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Normalize to start of day and end of day
    const startOfRange = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0, 0);
    const endOfRange = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999);

    // Previous range of equal length
    const rangeMs = endOfRange - startOfRange;
    const previousEnd = new Date(startOfRange.getTime() - 1);
    const previousStart = new Date(previousEnd.getTime() - rangeMs);

    const [
      totalDoctors,
      rangeDoctors,
      previousRangeDoctors,
      rangeReferrals,
      previousRangeReferrals,
      pendingInquiries,
      rangeInquiries,
      previousRangeInquiries,
      rangeSearches,
      previousRangeSearches
    ] = await Promise.all([
      // Total doctors overall
      User.countDocuments({ role: 'doctor' }),

      // Doctors created in range
      User.countDocuments({
        role: 'doctor',
        createdAt: { $gte: startOfRange, $lte: endOfRange }
      }),

      // Doctors created in previous range
      User.countDocuments({
        role: 'doctor',
        createdAt: { $gte: previousStart, $lte: previousEnd }
      }),

      // Referrals in range
      Referral.countDocuments({
        createdAt: { $gte: startOfRange, $lte: endOfRange }
      }),

      // Referrals in previous range
      Referral.countDocuments({
        createdAt: { $gte: previousStart, $lte: previousEnd }
      }),

      // Current pending inquiries (independent of range)
      PatientQuery.countDocuments({ status: 'pending' }),

      // Inquiries created in range
      PatientQuery.countDocuments({ createdAt: { $gte: startOfRange, $lte: endOfRange } }),

      // Inquiries created in previous range
      PatientQuery.countDocuments({ createdAt: { $gte: previousStart, $lte: previousEnd } }),

      // Searches approximated by patient queries in range
      PatientQuery.countDocuments({ createdAt: { $gte: startOfRange, $lte: endOfRange } }),

      // Searches in previous range
      PatientQuery.countDocuments({ createdAt: { $gte: previousStart, $lte: previousEnd } })
    ]);

    const pctChange = (curr, prev) => {
      if (prev > 0) return parseFloat(((curr - prev) / prev * 100).toFixed(1));
      return curr > 0 ? 100 : 0;
    };

    res.json({
      dateRange: {
        start: startOfRange.toISOString(),
        end: endOfRange.toISOString()
      },
      doctors: {
        total: totalDoctors,
        trend: pctChange(rangeDoctors, previousRangeDoctors)
      },
      referrals: {
        monthly: rangeReferrals,
        trend: pctChange(rangeReferrals, previousRangeReferrals)
      },
      inquiries: {
        pending: pendingInquiries,
        trend: pctChange(rangeInquiries, previousRangeInquiries)
      },
      searches: {
        monthly: rangeSearches,
        trend: pctChange(rangeSearches, previousRangeSearches)
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
    const { startDate: startParam, endDate: endParam, days, range } = req.query;
    const now = new Date();
    let endDate = endParam ? new Date(endParam) : new Date();
    let startDate;

    const startOfWeekSunday = d => new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay());
    const endOfWeekSaturday = d => new Date(d.getFullYear(), d.getMonth(), d.getDate() + (6 - d.getDay()), 23, 59, 59, 999);

    if (range === 'today') {
      startDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    } else if (range === 'yesterday') {
      const y = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() - 1);
      startDate = new Date(y.getFullYear(), y.getMonth(), y.getDate());
      endDate = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59, 999);
    } else if (range === 'thisWeek') {
      const sow = startOfWeekSunday(now);
      startDate = new Date(sow.getFullYear(), sow.getMonth(), sow.getDate());
    } else if (range === 'lastWeek') {
      const lastWeekEnd = endOfWeekSaturday(new Date(now.getFullYear(), now.getMonth(), now.getDate() - (now.getDay() + 1)));
      const lastWeekStart = startOfWeekSunday(new Date(lastWeekEnd.getFullYear(), lastWeekEnd.getMonth(), lastWeekEnd.getDate()));
      startDate = new Date(lastWeekStart.getFullYear(), lastWeekStart.getMonth(), lastWeekStart.getDate());
      endDate = lastWeekEnd;
    } else if (range === 'last7') {
      startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === 'last28') {
      startDate = new Date(endDate.getTime() - 28 * 24 * 60 * 60 * 1000);
    } else if (range === 'last30' || !range) {
      startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (range === 'last90') {
      startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else if (range === 'last12months') {
      startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 12, endDate.getDate());
    } else if (range === 'custom' && (startParam || endParam)) {
      startDate = startParam ? new Date(startParam) : new Date(endDate.getTime() - ((parseInt(days) || 30) * 24 * 60 * 60 * 1000));
    } else {
      startDate = startParam ? new Date(startParam) : new Date(endDate.getTime() - ((parseInt(days) || 30) * 24 * 60 * 60 * 1000));
    }

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