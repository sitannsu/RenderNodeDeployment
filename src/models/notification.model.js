const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['NEW_REFERRAL', 'REFERRAL_STATUS_CHANGE', 'NEW_MESSAGE', 'REFERRAL_NOTE', 'SYSTEM'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    referralId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Referral'
    },
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  fcmToken: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for faster queries
notificationSchema.index({ recipient: 1, read: 1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
