const mongoose = require('mongoose');
const validator = require('validator');

const patientSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true // Name is optional, can be added later in profile
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    validate: {
      validator: function(v) {
        return /^\+?[1-9]\d{9,14}$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return !v || validator.isEmail(v);
      },
      message: props => `${props.value} is not a valid email!`
    }
  },
  age: {
    type: Number,
    min: [0, 'Age cannot be negative']
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  otp: {
    code: String,
    expiresAt: Date
  },
  verified: {
    type: Boolean,
    default: false
  },
  fcmToken: String
}, {
  timestamps: true
});

// Index for phone number searches
patientSchema.index({ phoneNumber: 1 });

const Patient = mongoose.model('Patient', patientSchema);
module.exports = Patient;
