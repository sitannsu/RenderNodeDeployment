const admin = require('../config/firebaseAdmin');

async function sendFCMNotification(token, title, body, data = {}) {
  try {
    const message = {
      token: token,
      notification: {
        title: title,
        body: body,
        sound: 'default'
      },
      data: {
        ...data,
        click_action: 'fcm.action.OPEN',
        title: title,  // Required for Android foreground notifications
        body: body,    // Required for Android foreground notifications
        type: data.type || 'default'
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'default',
          sound: 'default',
          priority: 'high',
          visibility: 'public'
        }
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: title,
              body: body
            },
            sound: 'default',
            badge: 1,
            'content-available': 1,
            'mutable-content': 1
          },
          notificationType: data.type || 'default'
        },
        headers: {
          'apns-priority': '10',
          'apns-push-type': 'alert'
        }
      }
    };

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
