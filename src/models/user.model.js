const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  middleName: {
    type: String,
    trim: true
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'Male', 'Female'],
    required: [true, 'Gender is required']
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  
  // Contact Information
  contactNumber1: {
    type: String,
    required: [true, 'Contact number 1 is required'],
    trim: true
  },
  contactNumber2: {
    type: String,
    trim: true
  },
  showContactDetails: {
    type: Boolean,
    default: false
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  
  // Address Information
  homeAddress: {
    street: String,
    city: {
      type: String,
      required: [true, 'City is required']
    },
    state: {
      type: String,
      required: [true, 'State is required']
    },
    country: {
      type: String,
      required: [true, 'Country is required']
    },
    pincode: String
  },
  
  // Professional Information
  medicalLicenseNumber: {
    type: String,
    required: [true, 'Medical license number is required'],
    trim: true
  },
  medicalDegrees: {
    type: [String],
    required: [true, 'Medical degrees are required'],
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'At least one medical degree is required'
    }
  },
  specialization: {
    type: String,
    required: [true, 'Specialization is required'],
    trim: true
  },
  
  // Hospital Information
  hospitalName1: {
    type: String,
    required: [true, 'Hospital name 1 is required'],
    trim: true
  },
  hospitalAddress1: {
    street: String,
    city: {
      type: String,
      required: [true, 'Hospital city 1 is required']
    },
    state: {
      type: String,
      required: [true, 'Hospital state 1 is required']
    },
    country: {
      type: String,
      required: [true, 'Hospital country 1 is required']
    }
  },
  hospitalName2: {
    type: String,
    trim: true
  },
  hospitalAddress2: {
    street: String,
    city: String,
    state: String,
    country: String
  },
  
  // Clinic Information
  clinicAddress: {
    street: String,
    city: String,
    state: String,
    country: String
  },
  
  // Professional Experience
  practiceStartDate: {
    type: Date,
    required: [true, 'Practice start date is required']
  },
  workExperience: {
    type: Number,
    default: 0
  },
  treatedDiseases: {
    type: [String],
    default: []
  },
  
  // Documents
  documents: {
    medicalCertificates: [String],
    casteCertificate: String,
    identificationProof: String
  },
  
  // Community Details
  communityDetails: {
    kapuCommunityAffiliation: {
      type: Boolean,
      default: false
    },
    communityReferrals: [{
      name: String,
      relationship: String,
      contactNumber: String
    }]
  },
  
  // Communication Preferences
  communicationPreferences: {
    notificationPreference: {
      type: Boolean,
      default: true
    },
    emailCommunication: {
      type: Boolean,
      default: true
    }
  },
  
  // Referral System
  myReferralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  referredBy: {
    type: String,
    trim: true
  },
  
  // System Fields
  password: {
    type: String,
    minlength: 8,
    select: false
  },
  role: {
    type: String,
    enum: ['doctor', 'admin', 'patient'],
    default: 'patient'
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  profileCompletion: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // FCM Token for Push Notifications
  fcmToken: {
    type: String,
    trim: true
  },
  deviceInfo: {
    deviceType: {
      type: String,
      enum: ['android', 'ios', 'web'],
      default: 'android'
    },
    appVersion: String,
    lastLoginAt: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Index for referral code lookups
userSchema.index({ myReferralCode: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Generate unique referral code before saving
userSchema.pre('save', async function(next) {
  if (!this.myReferralCode) {
    // Generate a unique 8-character referral code
    const generateCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    // Keep trying until we get a unique code
    let code;
    let isUnique = false;
    while (!isUnique) {
      code = generateCode();
      const existingUser = await User.findOne({ myReferralCode: code });
      if (!existingUser) {
        isUnique = true;
      }
    }
    this.myReferralCode = code;
  }
  next();
});

// Calculate profile completion percentage
userSchema.methods.calculateProfileCompletion = function() {
  const requiredFields = [
    'firstName', 'lastName', 'gender', 'dateOfBirth', 'contactNumber1',
    'email', 'homeAddress.city', 'homeAddress.state', 'homeAddress.country',
    'medicalLicenseNumber', 'medicalDegrees', 'specialization',
    'hospitalName1', 'hospitalAddress1.city', 'hospitalAddress1.state', 'hospitalAddress1.country',
    'practiceStartDate'
  ];
  
  const optionalFields = [
    'contactNumber2', 'homeAddress.street', 'homeAddress.pincode',
    'hospitalName2', 'hospitalAddress2.street', 'hospitalAddress2.city', 'hospitalAddress2.state', 'hospitalAddress2.country',
    'clinicAddress.street', 'clinicAddress.city', 'clinicAddress.state', 'clinicAddress.country',
    'treatedDiseases', 'documents.medicalCertificates', 'documents.casteCertificate', 'documents.identificationProof',
    'communityDetails.kapuCommunityAffiliation', 'communityDetails.communityReferrals',
    'communicationPreferences.notificationPreference', 'communicationPreferences.emailCommunication'
  ];
  
  let completedFields = 0;
  const totalFields = requiredFields.length + optionalFields.length;
  
  // Check required fields
  requiredFields.forEach(field => {
    const value = this.get(field);
    if (value && (typeof value === 'string' ? value.trim() !== '' : true)) {
      completedFields++;
    }
  });
  
  // Check optional fields
  optionalFields.forEach(field => {
    const value = this.get(field);
    if (value && (typeof value === 'string' ? value.trim() !== '' : true)) {
      completedFields++;
    }
  });
  
  return Math.round((completedFields / totalFields) * 100);
};

// Calculate work experience based on practice start date
userSchema.methods.calculateWorkExperience = function() {
  if (!this.practiceStartDate) return 0;
  
  const today = new Date();
  const startDate = new Date(this.practiceStartDate);
  const diffTime = Math.abs(today - startDate);
  const diffYears = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 365));
  
  return diffYears;
};

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
