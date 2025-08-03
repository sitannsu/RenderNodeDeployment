const mongoose = require('mongoose');

const occupationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  doctorCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Add text indexes for search
occupationSchema.index({ name: 'text', description: 'text' });

const Occupation = mongoose.model('Occupation', occupationSchema);

module.exports = Occupation;
