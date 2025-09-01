const mongoose = require('mongoose');

const doctorVisitTotalSchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  totalViews: {
    type: Number,
    default: 0,
    min: 0
  },
  lastViewedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const DoctorVisitTotal = mongoose.model('DoctorVisitTotal', doctorVisitTotalSchema);
module.exports = DoctorVisitTotal;


