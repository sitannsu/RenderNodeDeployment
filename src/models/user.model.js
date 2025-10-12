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

  // Education details with year/college per degree (optional)
  education: {
    mbbs: {
      enabled: { type: Boolean, default: false },
      year: { type: String, default: '' },
      college: { type: String, default: '' }
    },
    md: {
      enabled: { type: Boolean, default: false },
      year: { type: String, default: '' },
      college: { type: String, default: '' }
    },
    ms: {
      enabled: { type: Boolean, default: false },
      year: { type: String, default: '' },
      college: { type: String, default: '' }
    },
    mch: {
      enabled: { type: Boolean, default: false },
      year: { type: String, default: '' },
      college: { type: String, default: '' }
    },
    dnb: {
      enabled: { type: Boolean, default: false },
      year: { type: String, default: '' },
      college: { type: String, default: '' }
    },
    fellowship: {
      enabled: { type: Boolean, default: false },
      year: { type: String, default: '' },
      college: { type: String, default: '' }
    },
    dm: {
      enabled: { type: Boolean, default: false },
      year: { type: String, default: '' },
      college: { type: String, default: '' }
    },
    practicingAs: { type: String, default: '' }
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
  // Additional hospital details for primary hospital
  hospitalPosition1: {
    type: String,
    trim: true
  },
  hospitalTenure1: {
    type: String,
    trim: true
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
  // Additional hospital details for secondary hospital
  hospitalPosition2: {
    type: String,
    trim: true
  },
  hospitalTenure2: {
    type: String,
    trim: true
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
  clinicName: {
    type: String,
    trim: true
  },
  consultationFee: {
    type: String,
    trim: true
  },
  workingHours: {
    type: String,
    trim: true
  },
  specializations: {
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
  nmcValidated: {
    type: Boolean,
    default: false
  },
  profileCompletion: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Soft delete flag
  isDeleted: {
    type: Boolean,
    default: false
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
  // Section-based completion aligned with app tabs
  // Mandatory sections: Hospital, Practice, Documents, Community
  const isNonEmptyString = (v) => typeof v === 'string' && v.trim() !== '';

  // Hospital section
  const hospitalComplete =
    isNonEmptyString(this.hospitalName1) &&
    isNonEmptyString(this.get('hospitalAddress1.city')) &&
    isNonEmptyString(this.get('hospitalAddress1.state')) &&
    isNonEmptyString(this.get('hospitalAddress1.country')) &&
    // Position is required in UI
    isNonEmptyString(this.hospitalPosition1 || '');

  // Practice section
  const practiceComplete = !!this.practiceStartDate ||
    isNonEmptyString(this.get('clinicAddress.city') || '') ||
    (Array.isArray(this.treatedDiseases) && this.treatedDiseases.length > 0);

  // Documents section
  const docs = this.documents || {};
  const documentsComplete =
    (Array.isArray(docs.medicalCertificates) && docs.medicalCertificates.length > 0) ||
    isNonEmptyString(docs.casteCertificate || '') ||
    isNonEmptyString(docs.identificationProof || '');

  // Community section
  const communityComplete = !!this.get('communityDetails.kapuCommunityAffiliation') ||
    (Array.isArray(this.get('communityDetails.communityReferrals')) &&
      this.get('communityDetails.communityReferrals').length > 0);

  // Optional Education section (does not affect reaching 100%)
  const edu = this.education || {};
  const degreeKeys = ['mbbs','md','ms','mch','dnb','fellowship','dm'];
  const educationComplete = degreeKeys.some(k => {
    const d = edu[k] || {};
    return d.enabled === true || isNonEmptyString(d.year || '') || isNonEmptyString(d.college || '');
  });

  const mandatorySections = [hospitalComplete, practiceComplete, documentsComplete, communityComplete];
  const completedMandatory = mandatorySections.filter(Boolean).length;
  const mandatoryTotal = mandatorySections.length; // 4

  let percentage = Math.round((completedMandatory / mandatoryTotal) * 100);

  // If not all mandatory complete, optionally give partial credit for education
  if (percentage < 100 && educationComplete) {
    // Treat education as a fifth section for incremental progress only
    percentage = Math.round(((completedMandatory + 1) / (mandatoryTotal + 1)) * 100);
  }

  // Cap to [0,100]
  if (percentage < 0) percentage = 0;
  if (percentage > 100) percentage = 100;
  return percentage;
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
