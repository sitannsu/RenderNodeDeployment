const { sendFCMNotification } = require("../utils/notifications");
const User = require("../models/userModel");

exports.listUsersWithFCM = async (req, res) => {
  try {
    const users = await User.find({ fcmToken: { $exists: true, $ne: null } })
      .select('userId userName fcmToken')
      .lean();

    res.json({
      success: true,
      users: users.map(u => ({
        userId: u.userId,
        userName: u.userName,
        hasFCMToken: !!u.fcmToken
      }))
    });
  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

exports.testNotification = async (req, res) => {
  try {
    const fcmToken = 'fDCXisSVOUMTulRkHQusQr:APA91bEF4kx2nKHvPjSUDcqJq6KYuNkLUR5XupZKmz8YtMkbuQZB9Az-PbQPZwsFekAew9ctu-C69qQy5KfhYX1H0A2OKGVXmmb94MNTC8GxSNW4yZih9Ew';
    const title = 'Test iOS Notification';
    const body = 'This is a test notification for iOS device';
    
    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        message: "FCM token is required"
      });
    }

    // Send notification with iOS specific configuration
    await sendFCMNotification(
      fcmToken,
      title,
      body,
      {
        type: 'test_notification',
        sound: 'default',
        badge: 1,
        clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        priority: 'high'
      }
    );

    res.json({
      success: true,
      message: "iOS notification sent successfully"
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
