const mongoose = require('mongoose');

const patientProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  contactNumber: {
    type: String,
    required: [true, 'Contact number is required'],
    trim: true
  },
  allowContactVisibility: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const PatientProfile = mongoose.model('PatientProfile', patientProfileSchema);
module.exports = PatientProfile;
