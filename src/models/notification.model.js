const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Recipient of the notification
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Notification type
  type: {
    type: String,
    enum: ['referral', 'referral_status', 'patient_query', 'system', 'test', 'announcement'],
    required: true
  },

  // Notification content
  title: {
    type: String,
    required: true
  },

  body: {
    type: String,
    required: true
  },

  // Additional data for the notification
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Related entities
  referralId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Referral'
  },

  queryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PatientQuery'
  },

  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Notification status
  read: {
    type: Boolean,
    default: false
  },

  readAt: {
    type: Date
  },

  // Push notification status
  sent: {
    type: Boolean,
    default: false
  },

  sentAt: {
    type: Date
  },

  // FCM message ID for tracking
  fcmMessageId: {
    type: String
  },

  // Error information if push failed
  error: {
    type: String
  },

  // Priority level
  priority: {
    type: String,
    enum: ['low', 'normal', 'high'],
    default: 'normal'
  },

  // Click action for the notification
  clickAction: {
    type: String,
    default: 'FLUTTER_NOTIFICATION_CLICK'
  }
}, {
  timestamps: true
});

// Index for efficient queries
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, read: 1 });
notificationSchema.index({ type: 1, createdAt: -1 });

// Virtual for notification age
notificationSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.read = true;
  this.readAt = new Date();
  return this.save();
};

// Method to mark as sent
notificationSchema.methods.markAsSent = function(messageId) {
  this.sent = true;
  this.sentAt = new Date();
  this.fcmMessageId = messageId;
  return this.save();
};

// Method to mark as failed
notificationSchema.methods.markAsFailed = function(error) {
  this.error = error;
  return this.save();
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    recipient: userId,
    read: false
  });
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { recipient: userId, read: false },
    { read: true, readAt: new Date() }
  );
};

// Static method to delete old notifications
notificationSchema.statics.deleteOldNotifications = function(days = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return this.deleteMany({
    createdAt: { $lt: cutoffDate },
    read: true
  });
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
