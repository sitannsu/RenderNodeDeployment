const mongoose = require('mongoose');

const doctorProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required']
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  country: {
    type: String,
    required: [true, 'Country is required']
  },
  state: {
    type: String,
    required: [true, 'State is required']
  },
  city: {
    type: String,
    required: [true, 'City is required']
  },
  pincode: {
    type: String,
    required: [true, 'Pincode is required']
  },
  address: {
    type: String,
    required: [true, 'Address is required']
  },
  hospitalAddress: {
    type: String,
    required: [true, 'Hospital address is required']
  },
  mciNumber: {
    type: String,
    required: [true, 'MCI number is required']
  },
  graduationYear: {
    type: Number,
    required: [true, 'Graduation year is required']
  },
  degree: {
    type: String,
    required: [true, 'Degree is required']
  },
  medicalDegreeSpecialization: {
    type: String,
    required: [true, 'Medical degree specialization is required']
  },
  nmcValidated: {
    type: Boolean,
    default: false
  },
  verifiedDoctorData: {
    id: Number,
    year: Number,
    registrationNo: String,
    council: String,
    doctorName: String,
    fatherName: String
  },
  specialization: {
    type: String,
    required: [true, 'Specialization is required']
  },
  hospitalName: {
    type: String,
    required: [true, 'Hospital name is required']
  },
  hospitalIName: String,
  yearsOfExperience: {
    type: Number,
    required: [true, 'Years of experience is required']
  },
  referalCode: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const DoctorProfile = mongoose.model('DoctorProfile', doctorProfileSchema);
module.exports = DoctorProfile;
