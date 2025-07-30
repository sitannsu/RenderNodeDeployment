const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Message content is required']
  },
  referral: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Referral'
  },
  attachments: [{
    type: String // URLs to uploaded files
  }],
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for faster queries
messageSchema.index({ sender: 1, recipient: 1 });
messageSchema.index({ recipient: 1, read: 1 });

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
