const mongoose = require('mongoose');

const doctorViewSchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  views: {
    type: Number,
    default: 1,
    min: 1
  },
  lastViewedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure one document per doctor-patient pair
doctorViewSchema.index({ doctor: 1, patient: 1 }, { unique: true });

const DoctorView = mongoose.model('DoctorView', doctorViewSchema);
module.exports = DoctorView;


