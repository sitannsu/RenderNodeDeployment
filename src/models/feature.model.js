const mongoose = require('mongoose');

const featureSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Feature name is required'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Feature description is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

const Feature = mongoose.model('Feature', featureSchema);
module.exports = Feature;
