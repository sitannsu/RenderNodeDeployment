const { messaging } = require('../../config/firebase.config');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');

class NotificationService {
  /**
   * Send push notification to a single user
   * @param {string} userId - User ID to send notification to
   * @param {Object} notification - Notification object
   * @param {Object} data - Additional data to send
   * @param {string} type - Notification type
   * @param {Object} relatedData - Related entity data
   * @returns {Promise<Object>} - Result of sending notification
   */
  async sendNotificationToUser(userId, notification, data = {}, type = 'system', relatedData = {}) {
    let notificationRecord;
    try {
      // Create notification record in database
      notificationRecord = new Notification({
        recipient: userId,
        type: type,
        title: notification.title,
        body: notification.body,
        data: data,
        priority: notification.priority || 'normal',
        clickAction: notification.clickAction || 'FLUTTER_NOTIFICATION_CLICK',
        ...relatedData
      });

      // Find user and get FCM token
      const user = await User.findById(userId);
      if (!user || !user.fcmToken) {
        // Save notification even if FCM token is not available
        await notificationRecord.save();
        return {
          success: false,
          message: 'User not found or no FCM token available',
          userId,
          notificationId: notificationRecord._id
        };
      }

      // Prepare message
      const message = {
        token: user.fcmToken,
        notification: {
          title: notification.title,
          body: notification.body,
          ...(notification.image && { image: notification.image })
        },
        data: {
          ...data,
          notificationId: notificationRecord._id.toString(),
          clickAction: notification.clickAction || 'FLUTTER_NOTIFICATION_CLICK',
          sound: 'default'
        },
        android: {
          priority: 'high',
          notification: {
            channelId: 'kappu_doctor_channel',
            priority: 'high',
            defaultSound: true,
            defaultVibrateTimings: true
          },
          fcmOptions: {
            analyticsLabel: 'kappudoctors_notification'
          }
        },
        apns: {
          headers: {
            'apns-priority': '10'
          },
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              'mutable-content': 1
            }
          },
          fcmOptions: {
            analyticsLabel: 'kappudoctors_notification'
          }
        }
      };

      console.log('📱 Sending FCM message with token:', user.fcmToken);

      // Send notification
      const response = await messaging.send(message);
      
      // Mark notification as sent
      await notificationRecord.markAsSent(response);
      
      console.log('✅ Notification sent successfully:', {
        userId,
        messageId: response,
        title: notification.title,
        notificationId: notificationRecord._id
      });

      return {
        success: true,
        messageId: response,
        userId,
        title: notification.title,
        notificationId: notificationRecord._id
      };

    } catch (error) {
      console.error('❌ Error sending notification:', error);
      
      // Mark notification as failed if it was created
      if (notificationRecord) {
        await notificationRecord.markAsFailed(error.message);
      }
      
      return {
        success: false,
        error: error.message,
        userId
      };
    }
  }

  /**
   * Send notification for new referral
   * @param {string} referredDoctorId - ID of the doctor being referred to
   * @param {Object} referralData - Referral data
   * @returns {Promise<Object>} - Result of sending notification
   */
  async sendReferralNotification(referredDoctorId, referralData) {
    const notification = {
      title: 'New Patient Referral',
      body: `You have received a new patient referral from ${referralData.referringDoctorName || 'a doctor'}`,
      clickAction: 'OPEN_REFERRAL_DETAILS',
      priority: 'high'
    };

    const data = {
      type: 'referral',
      referralId: referralData.referralId,
      referringDoctorId: referralData.referringDoctorId,
      patientName: referralData.patientName,
      reason: referralData.reason
    };

    const relatedData = {
      referralId: referralData.referralId,
      senderId: referralData.referringDoctorId
    };

    return await this.sendNotificationToUser(referredDoctorId, notification, data, 'referral', relatedData);
  }

  /**
   * Send notification for patient query
   * @param {string} doctorId - ID of the doctor being queried
   * @param {Object} queryData - Query data
   * @returns {Promise<Object>} - Result of sending notification
   */
  async sendPatientQueryNotification(doctorId, queryData) {
    console.log('queryDataqueryDataqueryData',queryData);
    const notification = {
      title: 'New Patient Query',
      body: `You have received a new query from a patient with phone no${queryData.patientContactNo ? ` ${queryData.patientContactNo}` : ''}`,
      clickAction: 'OPEN_PATIENT_QUERY',
      priority: 'high'
    };

    const data = {
      type: 'patient_query',
      queryId: queryData.queryId,
      patientId: queryData.patientId,
      patientName: queryData.patientName,
      query: queryData.query
    };

    const relatedData = {
      queryId: queryData.queryId,
      senderId: queryData.patientId
    };

    return await this.sendNotificationToUser(doctorId, notification, data, 'patient_query', relatedData);
  }

  /**
   * Send notification for referral status update
   * @param {string} referringDoctorId - ID of the referring doctor
   * @param {Object} statusData - Status update data
   * @returns {Promise<Object>} - Result of sending notification
   */
  async sendReferralStatusNotification(referringDoctorId, statusData) {
    const notification = {
      title: 'Referral Status Updated',
      body: `Your referral for ${statusData.patientName} has been ${statusData.status}`,
      clickAction: 'OPEN_REFERRAL_DETAILS',
      priority: 'normal'
    };

    const data = {
      type: 'referral_status',
      referralId: statusData.referralId,
      status: statusData.status,
      patientName: statusData.patientName,
      updatedBy: statusData.updatedBy
    };

    const relatedData = {
      referralId: statusData.referralId,
      senderId: statusData.updatedBy
    };

    return await this.sendNotificationToUser(referringDoctorId, notification, data, 'referral_status', relatedData);
  }

  /**
   * Send notification for doctor response to patient query
   * @param {string} patientId - ID of the patient who sent the query
   * @param {Object} responseData - Doctor response data
   * @returns {Promise<Object>} - Result of sending notification
   */
  async sendDoctorResponseNotification(patientId, responseData) {
    const statusMessage = responseData.status === 'accepted' ? 'accepted' : 
                         responseData.status === 'rejected' ? 'declined' : 'responded to';
    
    const notification = {
      title: 'Doctor Response Received',
      body: `Dr. ${responseData.doctorName} has ${statusMessage} your medical query`,
      clickAction: 'OPEN_QUERY_RESPONSE',
      priority: 'high'
    };

    const data = {
      type: 'doctor_response',
      queryId: responseData.queryId,
      doctorName: responseData.doctorName,
      status: responseData.status,
      appointmentTime: responseData.appointmentTime,
      consultationType: responseData.consultationType
    };

    const relatedData = {
      queryId: responseData.queryId,
      senderId: responseData.doctorId || null
    };

    return await this.sendNotificationToUser(patientId, notification, data, 'doctor_response', relatedData);
  }

  /**
   * Send notification to multiple users
   * @param {Array<string>} userIds - Array of user IDs
   * @param {Object} notification - Notification object
   * @param {Object} data - Additional data
   * @returns {Promise<Array>} - Results of sending notifications
   */
  async sendNotificationToMultipleUsers(userIds, notification, data = {}) {
    const results = [];
    
    for (const userId of userIds) {
      const result = await this.sendNotificationToUser(userId, notification, data);
      results.push(result);
    }

    return results;
  }

  /**
   * Send notification to all doctors
   * @param {Object} notification - Notification object
   * @param {Object} data - Additional data
   * @returns {Promise<Array>} - Results of sending notifications
   */
  async sendNotificationToAllDoctors(notification, data = {}) {
    try {
      // Find all doctors with FCM tokens
      const doctors = await User.find({
        role: 'doctor',
        fcmToken: { $exists: true, $ne: null }
      }).select('_id fcmToken');

      const userIds = doctors.map(doctor => doctor._id.toString());
      return await this.sendNotificationToMultipleUsers(userIds, notification, data);

    } catch (error) {
      console.error('❌ Error sending notification to all doctors:', error);
      return [{
        success: false,
        error: error.message
      }];
    }
  }

  /**
   * Validate FCM token
   * @param {string} fcmToken - FCM token to validate
   * @returns {Promise<boolean>} - Whether token is valid
   */
  async validateFCMToken(fcmToken) {
    try {
      // Try to send a test message (this will fail if token is invalid)
      await messaging.send({
        token: fcmToken,
        data: {
          test: 'validation'
        }
      });
      return true;
    } catch (error) {
      console.log('❌ Invalid FCM token:', error.message);
      return false;
    }
  }
}

module.exports = new NotificationService();
