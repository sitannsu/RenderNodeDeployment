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
    const { fcmToken, title, body } = req.body;
    
    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        message: "FCM token is required"
      });
    }

    // Send notification
    await sendFCMNotification(
      fcmToken,
      title,
      body,
      { type: 'test_notification' }
    );

    res.json({
      success: true,
      message: "Notification sent successfully"
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
