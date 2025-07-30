const Notification = require('../models/notification.model');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../config/firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

class NotificationService {
  static async createNotification(data) {
    try {
      const {
        recipient,
        type,
        title,
        message,
        referralId,
        messageId,
        senderId,
        fcmToken
      } = data;

      const notification = new Notification({
        recipient,
        type,
        title,
        message,
        data: {
          referralId,
          messageId,
          senderId
        },
        fcmToken
      });

      await notification.save();

      // Send push notification if FCM token is available
      if (fcmToken) {
        await this.sendPushNotification(fcmToken, title, message, {
          type,
          referralId: referralId?.toString(),
          messageId: messageId?.toString(),
          senderId: senderId?.toString()
        });
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  static async sendPushNotification(fcmToken, title, body, data = {}) {
    try {
      const message = {
        notification: {
          title,
          body
        },
        data: {
          ...data,
          click_action: 'FLUTTER_NOTIFICATION_CLICK'
        },
        token: fcmToken
      };

      const response = await admin.messaging().send(message);
      return response;
    } catch (error) {
      console.error('Error sending push notification:', error);
      throw error;
    }
  }

  static async createReferralNotification(type, referral, recipient, sender) {
    let title, message;

    switch (type) {
      case 'NEW_REFERRAL':
        title = 'New Referral Received';
        message = `Dr. ${sender.fullName} has sent you a new referral for patient ${referral.patientName}`;
        break;
      case 'REFERRAL_STATUS_CHANGE':
        title = 'Referral Status Updated';
        message = `Your referral for ${referral.patientName} has been ${referral.status.toLowerCase()}`;
        break;
      case 'REFERRAL_NOTE':
        title = 'New Note on Referral';
        message = `Dr. ${sender.fullName} added a note to referral for ${referral.patientName}`;
        break;
      default:
        throw new Error('Invalid notification type');
    }

    return this.createNotification({
      recipient: recipient._id,
      type,
      title,
      message,
      referralId: referral._id,
      senderId: sender._id,
      fcmToken: recipient.fcmToken
    });
  }

  static async createMessageNotification(message, recipient) {
    return this.createNotification({
      recipient: recipient._id,
      type: 'NEW_MESSAGE',
      title: 'New Message',
      message: `You have received a new message from Dr. ${message.sender.fullName}`,
      messageId: message._id,
      senderId: message.sender._id,
      fcmToken: recipient.fcmToken
    });
  }

  static async markAsRead(notificationId, userId) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId, read: false },
      { read: true, readAt: new Date() },
      { new: true }
    );
  }

  static async getUnreadCount(userId) {
    return Notification.countDocuments({
      recipient: userId,
      read: false
    });
  }
}

module.exports = NotificationService;
