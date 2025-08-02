const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/user.model');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all doctors
router.get('/', async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' })
      .select('-password')
      .sort({ fullName: 1 });
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Search doctors by specialization or name
router.get('/search', async (req, res) => {
  try {
    const { query, specialization, page = 1, limit = 10 } = req.query;
    let searchQuery = { role: 'doctor' };

    if (query) {
      searchQuery.$or = [
        { fullName: { $regex: query, $options: 'i' } },
        { hospitalName: { $regex: query, $options: 'i' } },
        { specialization: { $regex: query, $options: 'i' } }
      ];
    }

    if (specialization) {
      searchQuery.specialization = { $regex: specialization, $options: 'i' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [doctors, total] = await Promise.all([
      User.find(searchQuery)
        .select('-password')
        .sort({ fullName: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(searchQuery)
    ]);

    res.json({
      doctors,
      totalDoctors: total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get doctor by ID
router.get('/:id', async (req, res) => {
  try {
    const { query, specialization } = req.query;
    let searchQuery = { role: 'doctor' };

    if (query) {
      searchQuery.$or = [
        { fullName: { $regex: query, $options: 'i' } },
        { hospitalName: { $regex: query, $options: 'i' } }
      ];
    }

    if (specialization) {
      searchQuery.specialization = specialization;
    }

    const doctors = await User.find(searchQuery)
      .select('-password')
      .sort({ fullName: 1 });

    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get doctor statistics
router.get('/stats/:id', auth, async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(req.params.id) }
      },
      {
        $lookup: {
          from: 'referrals',
          localField: '_id',
          foreignField: 'referringDoctor',
          as: 'referralsSent'
        }
      },
      {
        $lookup: {
          from: 'referrals',
          localField: '_id',
          foreignField: 'referredDoctor',
          as: 'referralsReceived'
        }
      },
      {
        $lookup: {
          from: 'messages',
          localField: '_id',
          foreignField: 'recipient',
          as: 'messagesReceived'
        }
      },
      {
        $project: {
          totalReferralsSent: { $size: '$referralsSent' },
          totalReferralsReceived: { $size: '$referralsReceived' },
          pendingReferrals: {
            $size: {
              $filter: {
                input: '$referralsReceived',
                as: 'referral',
                cond: { $eq: ['$$referral.status', 'pending'] }
              }
            }
          },
          unreadMessages: {
            $size: {
              $filter: {
                input: '$messagesReceived',
                as: 'message',
                cond: { $eq: ['$$message.read', false] }
              }
            }
          },
          referredDoctors: 1,
          referringDoctors: 1
        }
      }
    ]);

    res.json(stats[0] || {
      totalReferralsSent: 0,
      totalReferralsReceived: 0,
      pendingReferrals: 0,
      unreadMessages: 0,
      referredDoctors: [],
      referringDoctors: []
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get detailed doctor statistics with referral doctor lists
router.get('/statsDetails/:id', auth, async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(req.params.id) }
      },
      {
        $lookup: {
          from: 'referrals',
          localField: '_id',
          foreignField: 'referringDoctor',
          as: 'referralsSent'
        }
      },
      {
        $lookup: {
          from: 'referrals',
          localField: '_id',
          foreignField: 'referredDoctor',
          as: 'referralsReceived'
        }
      },
      {
        $lookup: {
          from: 'messages',
          localField: '_id',
          foreignField: 'recipient',
          as: 'messagesReceived'
        }
      },
      {
        $lookup: {
          from: 'users',
          let: { referralsSent: '$referralsSent' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ['$_id', {
                    $map: {
                      input: '$$referralsSent',
                      as: 'ref',
                      in: '$$ref.referredDoctor'
                    }
                  }]
                }
              }
            },
            {
              $project: {
                _id: 1,
                fullName: 1,
                specialization: 1,
                hospitalName1: 1,
                contactNo: 1,
                profileImage: {
                  $ifNull: [
                    '$profileImage',
                    {
                      $concat: [
                        'https://ui-avatars.com/api/?name=',
                        { $replaceAll: { input: '$fullName', find: ' ', replacement: '+' } },
                        '&background=random'
                      ]
                    }
                  ]
                }
              }
            }
          ],
          as: 'referredDoctors'
        }
      },
      {
        $lookup: {
          from: 'users',
          let: { referralsReceived: '$referralsReceived' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ['$_id', {
                    $map: {
                      input: '$$referralsReceived',
                      as: 'ref',
                      in: '$$ref.referringDoctor'
                    }
                  }]
                }
              }
            },
            {
              $project: {
                _id: 1,
                fullName: 1,
                specialization: 1,
                hospitalName1: 1,
                contactNo: 1,
                profileImage: {
                  $ifNull: [
                    '$profileImage',
                    {
                      $concat: [
                        'https://ui-avatars.com/api/?name=',
                        { $replaceAll: { input: '$fullName', find: ' ', replacement: '+' } },
                        '&background=random'
                      ]
                    }
                  ]
                }
              }
            }
          ],
          as: 'referringDoctors'
        }
      },
      {
        $project: {
          totalReferralsSent: { $size: '$referralsSent' },
          totalReferralsReceived: { $size: '$referralsReceived' },
          pendingReferrals: {
            $size: {
              $filter: {
                input: '$referralsReceived',
                as: 'referral',
                cond: { $eq: ['$$referral.status', 'pending'] }
              }
            }
          },
          unreadMessages: {
            $size: {
              $filter: {
                input: '$messagesReceived',
                as: 'message',
                cond: { $eq: ['$$message.read', false] }
              }
            }
          },
          referredDoctors: 1,
          referringDoctors: 1
        }
      }
    ]);

    res.json(stats[0] || {
      totalReferralsSent: 0,
      totalReferralsReceived: 0,
      pendingReferrals: 0,
      unreadMessages: 0,
      referredDoctors: [],
      referringDoctors: []
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Register new doctor
router.post('/register', async (req, res) => {
  try {
    const {
      firstName,
      middleName,
      lastName,
      gender,
      dateOfBirth,
      contactNumber1,
      contactNumber2,
      showContactDetails,
      address,
      email,
      password,
      medicalLicenseNumber,
      medicalDegrees,
      specialization,
      hospitals,
      clinicAddress,
      practiceStartDate,
      treatedDiseases,
      documents,
      communityDetails,
      communicationPreferences
    } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Process hospitals array to extract first hospital as primary
    let hospitalName1 = '';
    let hospitalAddress1 = {};
    
    if (hospitals && hospitals.length > 0) {
      const primaryHospital = hospitals[0];
      hospitalName1 = primaryHospital.name || '';
      hospitalAddress1 = {
        street: primaryHospital.address || '',
        city: primaryHospital.city || '',
        state: primaryHospital.state || '',
        country: primaryHospital.country || ''
      };
    }

    // Process clinic address
    let processedClinicAddress = {};
    if (clinicAddress) {
      processedClinicAddress = {
        street: clinicAddress.address || '',
        city: clinicAddress.city || '',
        state: clinicAddress.state || '',
        country: clinicAddress.country || ''
      };
    }

    // Process community details
    let processedCommunityDetails = {};
    if (communityDetails) {
      processedCommunityDetails = {
        kapuCommunityAffiliation: communityDetails.kapuAffiliation || false,
        communityReferrals: []
      };
      
      // Convert community referrals to proper format
      if (communityDetails.communityReferrals && Array.isArray(communityDetails.communityReferrals)) {
        processedCommunityDetails.communityReferrals = communityDetails.communityReferrals.map(ref => ({
          name: typeof ref === 'string' ? ref : ref.name || '',
          relationship: typeof ref === 'string' ? 'Referral' : ref.relationship || 'Referral',
          contactNumber: typeof ref === 'string' ? '' : ref.contactNumber || ''
        }));
      }
    }

    // Create new doctor user
    const doctor = new User({
      firstName,
      middleName: middleName || '',
      lastName,
      fullName: `Dr. ${firstName}${middleName ? ' ' + middleName : ''} ${lastName}`,
      gender: gender ? gender.toLowerCase() : 'male',
      dateOfBirth: new Date(dateOfBirth),
      contactNumber1,
      contactNumber2: contactNumber2 || '',
      showContactDetails: showContactDetails || false,
      homeAddress: {
        street: address?.street || '',
        city: address?.city || '',
        state: address?.state || '',
        country: address?.country || '',
        pincode: address?.pincode || ''
      },
      email,
      password: password || 'defaultPassword123', // Set a default password if not provided
      role: 'doctor',
      medicalLicenseNumber,
      medicalDegrees: Array.isArray(medicalDegrees) ? medicalDegrees : [medicalDegrees],
      specialization,
      hospitalName1,
      hospitalAddress1,
      clinicAddress: processedClinicAddress,
      practiceStartDate: new Date(practiceStartDate),
      treatedDiseases: Array.isArray(treatedDiseases) ? treatedDiseases : [treatedDiseases],
      documents: {
        medicalCertificates: documents?.medicalCertificates || [],
        casteCertificate: documents?.casteCertificate || '',
        identificationProof: documents?.identificationProof || ''
      },
      communityDetails: processedCommunityDetails,
      communicationPreferences: {
        notificationPreference: communicationPreferences?.notificationPreference || true,
        emailCommunication: communicationPreferences?.emailCommunication || true
      },
      verificationStatus: 'pending',
      profileCompletion: 0 // Will be calculated after save
    });

    // Calculate profile completion
    doctor.profileCompletion = doctor.calculateProfileCompletion();

    await doctor.save();

    // Return response without password
    const doctorResponse = doctor.toObject();
    delete doctorResponse.password;

    res.status(201).json({
      message: 'Doctor registered successfully',
      doctor: doctorResponse,
      profileCompletion: doctor.profileCompletion
    });
  } catch (error) {
    console.error('Doctor registration error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Get doctor profile with percentage completion
router.get('/profile', auth, async (req, res) => {
  try {
    const doctor = await User.findById(req.user.userId)
      .select('-password');
    
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Calculate profile completion percentage
    const profileCompletion = doctor.calculateProfileCompletion();
    
    // Calculate work experience
    const workExperience = doctor.calculateWorkExperience();
    
    // Update the profile completion in database
    doctor.profileCompletion = profileCompletion;
    doctor.workExperience = workExperience;
    await doctor.save();

    // Prepare response with profile completion details
    const response = {
      doctor: doctor.toObject(),
      profileCompletion: {
        percentage: profileCompletion,
        completedFields: [],
        missingFields: []
      }
    };

    // Identify completed and missing fields
    const requiredFields = [
      { field: 'firstName', label: 'First Name' },
      { field: 'lastName', label: 'Last Name' },
      { field: 'gender', label: 'Gender' },
      { field: 'dateOfBirth', label: 'Date of Birth' },
      { field: 'contactNumber1', label: 'Contact Number 1' },
      { field: 'email', label: 'Email' },
      { field: 'homeAddress.city', label: 'Home City' },
      { field: 'homeAddress.state', label: 'Home State' },
      { field: 'homeAddress.country', label: 'Home Country' },
      { field: 'medicalLicenseNumber', label: 'Medical License Number' },
      { field: 'medicalDegrees', label: 'Medical Degrees' },
      { field: 'specialization', label: 'Specialization' },
      { field: 'hospitalName1', label: 'Hospital Name 1' },
      { field: 'hospitalAddress1.city', label: 'Hospital City 1' },
      { field: 'hospitalAddress1.state', label: 'Hospital State 1' },
      { field: 'hospitalAddress1.country', label: 'Hospital Country 1' },
      { field: 'practiceStartDate', label: 'Practice Start Date' }
    ];

    const optionalFields = [
      { field: 'contactNumber2', label: 'Contact Number 2' },
      { field: 'homeAddress.street', label: 'Home Street Address' },
      { field: 'homeAddress.pincode', label: 'Home Pincode' },
      { field: 'hospitalName2', label: 'Hospital Name 2' },
      { field: 'hospitalAddress2.street', label: 'Hospital Street Address 2' },
      { field: 'hospitalAddress2.city', label: 'Hospital City 2' },
      { field: 'hospitalAddress2.state', label: 'Hospital State 2' },
      { field: 'hospitalAddress2.country', label: 'Hospital Country 2' },
      { field: 'clinicAddress.street', label: 'Clinic Street Address' },
      { field: 'clinicAddress.city', label: 'Clinic City' },
      { field: 'clinicAddress.state', label: 'Clinic State' },
      { field: 'clinicAddress.country', label: 'Clinic Country' },
      { field: 'treatedDiseases', label: 'Mostly Treated Diseases' },
      { field: 'documents.medicalCertificates', label: 'Medical Certificates' },
      { field: 'documents.casteCertificate', label: 'Caste Certificate' },
      { field: 'documents.identificationProof', label: 'Identification Proof' },
      { field: 'communityDetails.kapuCommunityAffiliation', label: 'Kapu Community Affiliation' },
      { field: 'communityDetails.communityReferrals', label: 'Community Referrals' },
      { field: 'communicationPreferences.notificationPreference', label: 'Notification Preference' },
      { field: 'communicationPreferences.emailCommunication', label: 'Email Communication' }
    ];

    // Check required fields
    requiredFields.forEach(({ field, label }) => {
      const value = doctor.get(field);
      if (value && (typeof value === 'string' ? value.trim() !== '' : true)) {
        response.profileCompletion.completedFields.push({ field, label, required: true });
      } else {
        response.profileCompletion.missingFields.push({ field, label, required: true });
      }
    });

    // Check optional fields
    optionalFields.forEach(({ field, label }) => {
      const value = doctor.get(field);
      if (value && (typeof value === 'string' ? value.trim() !== '' : true)) {
        response.profileCompletion.completedFields.push({ field, label, required: false });
      } else {
        response.profileCompletion.missingFields.push({ field, label, required: false });
      }
    });

    res.json(response);
  } catch (error) {
    console.error('Get doctor profile error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update doctor profile
router.patch('/profile', auth, async (req, res) => {
  try {
    const doctor = await User.findById(req.user.userId);
    
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const {
      firstName,
      lastName,
      middleName,
      gender,
      dateOfBirth,
      contactNumber1,
      contactNumber2,
      showContactDetails,
      homeAddress,
      medicalLicenseNumber,
      medicalDegrees,
      specialization,
      hospitalName1,
      hospitalAddress1,
      hospitalName2,
      hospitalAddress2,
      clinicAddress,
      practiceStartDate,
      treatedDiseases,
      documents,
      communityDetails,
      communicationPreferences
    } = req.body;

    // Update basic information
    if (firstName) doctor.firstName = firstName;
    if (lastName) doctor.lastName = lastName;
    if (middleName !== undefined) doctor.middleName = middleName;
    if (gender) doctor.gender = gender;
    if (dateOfBirth) doctor.dateOfBirth = new Date(dateOfBirth);
    
    // Update full name if first or last name changed
    if (firstName || lastName) {
      doctor.fullName = `Dr. ${doctor.firstName}${doctor.middleName ? ' ' + doctor.middleName : ''} ${doctor.lastName}`;
    }

    // Update contact information
    if (contactNumber1) doctor.contactNumber1 = contactNumber1;
    if (contactNumber2 !== undefined) doctor.contactNumber2 = contactNumber2;
    if (showContactDetails !== undefined) doctor.showContactDetails = showContactDetails;

    // Update address information
    if (homeAddress) {
      if (homeAddress.street !== undefined) doctor.homeAddress.street = homeAddress.street;
      if (homeAddress.city) doctor.homeAddress.city = homeAddress.city;
      if (homeAddress.state) doctor.homeAddress.state = homeAddress.state;
      if (homeAddress.country) doctor.homeAddress.country = homeAddress.country;
      if (homeAddress.pincode !== undefined) doctor.homeAddress.pincode = homeAddress.pincode;
    }

    // Update professional information
    if (medicalLicenseNumber) doctor.medicalLicenseNumber = medicalLicenseNumber;
    if (medicalDegrees) doctor.medicalDegrees = medicalDegrees;
    if (specialization) doctor.specialization = specialization;

    // Update hospital information
    if (hospitalName1) doctor.hospitalName1 = hospitalName1;
    if (hospitalAddress1) {
      if (hospitalAddress1.street !== undefined) doctor.hospitalAddress1.street = hospitalAddress1.street;
      if (hospitalAddress1.city) doctor.hospitalAddress1.city = hospitalAddress1.city;
      if (hospitalAddress1.state) doctor.hospitalAddress1.state = hospitalAddress1.state;
      if (hospitalAddress1.country) doctor.hospitalAddress1.country = hospitalAddress1.country;
    }

    if (hospitalName2 !== undefined) doctor.hospitalName2 = hospitalName2;
    if (hospitalAddress2) {
      if (hospitalAddress2.street !== undefined) doctor.hospitalAddress2.street = hospitalAddress2.street;
      if (hospitalAddress2.city !== undefined) doctor.hospitalAddress2.city = hospitalAddress2.city;
      if (hospitalAddress2.state !== undefined) doctor.hospitalAddress2.state = hospitalAddress2.state;
      if (hospitalAddress2.country !== undefined) doctor.hospitalAddress2.country = hospitalAddress2.country;
    }

    // Update clinic information
    if (clinicAddress) {
      if (clinicAddress.street !== undefined) doctor.clinicAddress.street = clinicAddress.street;
      if (clinicAddress.city !== undefined) doctor.clinicAddress.city = clinicAddress.city;
      if (clinicAddress.state !== undefined) doctor.clinicAddress.state = clinicAddress.state;
      if (clinicAddress.country !== undefined) doctor.clinicAddress.country = clinicAddress.country;
    }

    // Update professional experience
    if (practiceStartDate) {
      doctor.practiceStartDate = new Date(practiceStartDate);
      doctor.workExperience = doctor.calculateWorkExperience();
    }

    if (treatedDiseases !== undefined) doctor.treatedDiseases = treatedDiseases;

    // Update documents
    if (documents) {
      if (documents.medicalCertificates !== undefined) doctor.documents.medicalCertificates = documents.medicalCertificates;
      if (documents.casteCertificate !== undefined) doctor.documents.casteCertificate = documents.casteCertificate;
      if (documents.identificationProof !== undefined) doctor.documents.identificationProof = documents.identificationProof;
    }

    // Update community details
    if (communityDetails) {
      if (communityDetails.kapuCommunityAffiliation !== undefined) {
        doctor.communityDetails.kapuCommunityAffiliation = communityDetails.kapuCommunityAffiliation;
      }
      if (communityDetails.communityReferrals !== undefined) {
        doctor.communityDetails.communityReferrals = communityDetails.communityReferrals;
      }
    }

    // Update communication preferences
    if (communicationPreferences) {
      if (communicationPreferences.notificationPreference !== undefined) {
        doctor.communicationPreferences.notificationPreference = communicationPreferences.notificationPreference;
      }
      if (communicationPreferences.emailCommunication !== undefined) {
        doctor.communicationPreferences.emailCommunication = communicationPreferences.emailCommunication;
      }
    }

    // Calculate and update profile completion
    doctor.profileCompletion = doctor.calculateProfileCompletion();

    await doctor.save();

    // Return updated profile with completion percentage
    const updatedDoctor = doctor.toObject();
    delete updatedDoctor.password;

    res.json({
      message: 'Profile updated successfully',
      doctor: updatedDoctor,
      profileCompletion: doctor.profileCompletion
    });
  } catch (error) {
    console.error('Update doctor profile error:', error);
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
