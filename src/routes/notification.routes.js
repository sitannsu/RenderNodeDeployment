const express = require('express');
const notificationService = require('../services/notification.service');
const auth = require('../middleware/auth');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');
const router = express.Router();

// Send test notification to a specific user
router.post('/test/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { title, body, data } = req.body;

    const notification = {
      title: title || 'Test Notification',
      body: body || 'This is a test notification',
      clickAction: 'OPEN_TEST'
    };

    const result = await notificationService.sendNotificationToUser(userId, notification, data || {});

    res.json({
      message: 'Test notification sent',
      result
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send notification to all doctors
router.post('/broadcast/doctors', auth, async (req, res) => {
  try {
    // Only admins can broadcast to all doctors
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { title, body, data } = req.body;

    if (!title || !body) {
      return res.status(400).json({ message: 'Title and body are required' });
    }

    const notification = {
      title,
      body,
      clickAction: 'OPEN_BROADCAST'
    };

    const results = await notificationService.sendNotificationToAllDoctors(notification, data || {});

    res.json({
      message: 'Broadcast notification sent to all doctors',
      results,
      totalSent: results.filter(r => r.success).length,
      totalFailed: results.filter(r => !r.success).length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Validate FCM token
router.post('/validate-token', auth, async (req, res) => {
  try {
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({ message: 'FCM token is required' });
    }

    const isValid = await notificationService.validateFCMToken(fcmToken);

    res.json({
      isValid,
      message: isValid ? 'FCM token is valid' : 'FCM token is invalid'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's notification status (FCM token availability)
router.get('/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('fcmToken deviceInfo');
    
    res.json({
      hasFCMToken: !!user.fcmToken,
      deviceInfo: user.deviceInfo,
      message: user.fcmToken ? 'FCM token is available' : 'No FCM token found'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all notifications for the current user
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, read, type } = req.query;
    const query = { recipient: req.user._id };

    // Filter by read status
    if (read !== undefined) {
      query.read = read === 'true';
    }

    // Filter by type
    if (type) {
      query.type = type;
    }

    const notifications = await Notification.find(query)
      .populate('senderId', 'fullName specialization')
      .populate('referralId', 'patientName status')
      .populate('queryId', 'symptoms duration')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.getUnreadCount(req.user._id);

    res.json({
      notifications,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      totalNotifications: total,
      unreadCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get unread notification count
router.get('/unread/count', auth, async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.user._id);
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark notification as read
router.patch('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await notification.markAsRead();
    res.json(notification);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Mark all notifications as read
router.post('/read-all', auth, async (req, res) => {
  try {
    await Notification.markAllAsRead(req.user._id);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a notification
router.delete('/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete all read notifications
router.delete('/read/all', auth, async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      recipient: req.user._id,
      read: true
    });

    res.json({ 
      message: 'All read notifications deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
