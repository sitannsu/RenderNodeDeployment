const admin = require('../config/firebaseAdmin');

async function sendFCMNotification(token, title, body, data = {}) {
  try {
    // Simplified format for simulator testing
    const message = {
      token: token,
      notification: {
        title: title,
        body: body
      },
      data: {
        title: String(title),
        body: String(body),
        type: 'test_notification',
        click_action: 'FLUTTER_NOTIFICATION_CLICK'
      }
    };

    // Log for simulator testing
    console.log('Sending notification to simulator:', {
      token: token.substring(0, 20) + '...',
      title,
      body,
      data: message.data
    });

    const response = await admin.messaging().send(message);
    console.log('Successfully sent FCM notification:', response);
    return response;
  } catch (error) {
    console.error('Error sending FCM notification:', error);
    throw error;
  }
}

module.exports = {
  sendFCMNotification
};
