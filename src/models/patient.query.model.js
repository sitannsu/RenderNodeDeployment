const mongoose = require('mongoose');

const patientQuerySchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  symptoms: {
    type: String,
    required: [true, 'Symptoms description is required']
  },
  duration: {
    type: String,
    required: [true, 'Duration of symptoms is required']
  },
  previousTreatments: {
    type: String
  },
  attachments: [{
    type: String,
    description: String
  }],
  preferredTime: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed'],
    default: 'pending'
  },
  doctorResponse: {
    type: String
  },
  doctorResponseTime: {
    type: Date
  },
  consultationType: {
    type: String,
    enum: ['online', 'in-person'],
    required: true
  },
  appointmentTime: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for faster queries
patientQuerySchema.index({ patient: 1, status: 1 });
patientQuerySchema.index({ doctor: 1, status: 1 });
patientQuerySchema.index({ status: 1, createdAt: -1 });

const PatientQuery = mongoose.model('PatientQuery', patientQuerySchema);
module.exports = PatientQuery;
