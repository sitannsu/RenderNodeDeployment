const mongoose = require('mongoose');

const advertisementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Advertisement title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Advertisement description is required'],
    trim: true
  },
  imageUrl: {
    type: String,
    required: [true, 'Advertisement image URL is required']
  },
  targetUrl: {
    type: String,
    required: [true, 'Target URL is required']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'scheduled'],
    default: 'active'
  },
  placement: {
    type: String,
    enum: ['home', 'search', 'profile', 'all'],
    default: 'all'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Made optional
  }
}, {
  timestamps: true
});

// Add index for efficient date-based queries
advertisementSchema.index({ startDate: 1, endDate: 1 });

const Advertisement = mongoose.model('Advertisement', advertisementSchema);
module.exports = Advertisement;
