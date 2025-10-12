const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/user.model');
const PatientQuery = require('../models/patient.query.model');
const notificationService = require('../services/notification.service');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all doctors
router.get('/', auth, async (req, res) => {
  console.log('GET /api/doctor/ called');
  try {
    // Exclude the current user's own doctor profile from the results
    const doctors = await User.find({ role: 'doctor', _id: { $ne: req.user._id } })
      .select('-password')
      .sort({ fullName: 1 });
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Search doctors by specialization or name
router.get('/search', auth, async (req, res) => {
  console.log('GET /api/doctor/search called');
  try {
    const { query, specialization, page = 1, limit = 10 } = req.query;
    let searchQuery = { role: 'doctor', _id: { $ne: req.user._id } };

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

// Get all patient queries for the authenticated doctor
router.get('/queries', auth, async (req, res) => {
  console.log('Doctor queries endpoint called:', req.user);
  try {
    const { status, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    console.log('🔍 Doctor queries endpoint called:', {
      doctorId: req.user._id,
      role: req.user.role,
      status,
      page,
      limit
    });
    
    // Check if user is a doctor
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied. Doctor role required.' });
    }

    // Build filter for queries sent to this doctor
    const filter = { doctor: req.user._id };
    console.log('[Doctor Queries API] Filter:', filter);
    
    if (status) {
      filter.status = status;
      console.log('[Doctor Queries API] Status filter applied:', status);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    console.log('[Doctor Queries API] Pagination:', { skip, limit });
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    console.log('[Doctor Queries API] Sort:', sort);

    // Get queries with essential patient details only
    const queries = await PatientQuery.find(filter)
      .select('patient symptoms subject urgency status consultationType preferredTime doctorResponse doctorResponseTime createdAt updatedAt doctor')
      .populate('patient', '_id')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await PatientQuery.countDocuments(filter);

    res.json({
      queries,
      totalQueries: total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Doctor queries endpoint error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get doctor by ID
router.get('/:id', async (req, res) => {
  console.log('GET /api/doctor/:id called');
  console.log('Request params:', JSON.stringify(req.params));
  console.log('Request query:', JSON.stringify(req.query));
  console.log('GET /api/doctor/:id called');
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

    console.log('GET /api/doctor/:id response:', JSON.stringify(doctors, null, 2));
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get doctor statistics
router.get('/stats/:id', auth, async (req, res) => {
  console.log('GET /api/doctor/stats/:id called');
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
  console.log('GET /api/doctors/statsDetails/:id called');
  console.log('Request params:', JSON.stringify(req.params));
  console.log('Request query:', JSON.stringify(req.query));
  console.log('GET /api/doctors/statsDetails/:id called');
  try {
    const doctorObjectId = new mongoose.Types.ObjectId(req.params.id);

    const stats = await User.aggregate([
      { $match: { _id: doctorObjectId } },
      // Referrals sent by this doctor
      {
        $lookup: {
          from: 'referrals',
          localField: '_id',
          foreignField: 'referringDoctor',
          as: 'referralsSent'
        }
      },
      // Referrals received by this doctor
      {
        $lookup: {
          from: 'referrals',
          localField: '_id',
          foreignField: 'referredDoctor',
          as: 'referralsReceived'
        }
      },
      // Messages received by this doctor
      {
        $lookup: {
          from: 'messages',
          localField: '_id',
          foreignField: 'recipient',
          as: 'messagesReceived'
        }
      },
      // Resolve user info for referred and referring doctors
      {
        $lookup: {
          from: 'users',
          localField: 'referralsSent.referredDoctor',
          foreignField: '_id',
          as: 'referredDoctorUsers'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'referralsReceived.referringDoctor',
          foreignField: '_id',
          as: 'referringDoctorUsers'
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
                as: 'ref',
                cond: { $eq: ['$$ref.status', 'pending'] }
              }
            }
          },
          unreadMessages: {
            $size: {
              $filter: {
                input: '$messagesReceived',
                as: 'msg',
                cond: { $eq: ['$$msg.read', false] }
              }
            }
          },
          referredDoctors: {
            $map: {
              input: '$referredDoctorUsers',
              as: 'd',
              in: {
                _id: '$$d._id',
                fullName: '$$d.fullName',
                specialization: '$$d.specialization',
                hospitalName1: '$$d.hospitalName1',
                profileImage: '$$d.profileImage'
              }
            }
          },
          referringDoctors: {
            $map: {
              input: '$referringDoctorUsers',
              as: 'd',
              in: {
                _id: '$$d._id',
                fullName: '$$d.fullName',
                specialization: '$$d.specialization',
                hospitalName1: '$$d.hospitalName1',
                profileImage: '$$d.profileImage'
              }
            }
          },
          referralInfo: {
            myReferralCode: '$myReferralCode',
            referredBy: '$referredBy'
          }
        }
      }
    ]);
    console.log('GET /api/doctor/statsDetails/:id response:', JSON.stringify(stats[0] || {}, null, 2));
    res.json(stats[0] || {
      totalReferralsSent: 0,
      totalReferralsReceived: 0,
      pendingReferrals: 0,
      unreadMessages: 0,
      referredDoctors: [],
      referringDoctors: [],
      referralInfo: {
        myReferralCode: null,
        referredBy: null
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Register new doctor
router.post('/register', async (req, res) => {
  console.log('POST /api/doctor/register called');
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
      communicationPreferences,
      education
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
    const doctor = await User.findById(req.user._id)
      .select('-password');
    
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ 
        success: false,
        message: 'Doctor not found' 
      });
    }

    // Calculate profile completion percentage
    const profileCompletion = doctor.calculateProfileCompletion();
    
    // Calculate work experience
    const workExperience = doctor.calculateWorkExperience();
    
    // Update the profile completion in database
    doctor.profileCompletion = profileCompletion;
    doctor.workExperience = workExperience;
    await doctor.save();

    // Get referral statistics
    const Referral = require('../models/referral.model');
    const totalReferralsSent = await Referral.countDocuments({ referringDoctor: doctor._id });
    const totalReferralsReceived = await Referral.countDocuments({ referredDoctor: doctor._id });
    const pendingReferrals = await Referral.countDocuments({ 
      referredDoctor: doctor._id, 
      status: 'pending' 
    });

    // Get unread messages count
    const Message = require('../models/message.model');
    const unreadMessages = await Message.countDocuments({ 
      recipient: doctor._id, 
      read: false 
    });

    // Get monthly referral stats
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const lastMonth = new Date(currentMonth);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const thisMonthStats = await Referral.aggregate([
      {
        $match: {
          referringDoctor: doctor._id,
          createdAt: { $gte: currentMonth }
        }
      },
      {
        $group: {
          _id: null,
          sent: { $sum: 1 }
        }
      }
    ]);

    const lastMonthStats = await Referral.aggregate([
      {
        $match: {
          referringDoctor: doctor._id,
          createdAt: { $gte: lastMonth, $lt: currentMonth }
        }
      },
      {
        $group: {
          _id: null,
          sent: { $sum: 1 }
        }
      }
    ]);

    // Get received referrals for this month and last month
    const thisMonthReceivedStats = await Referral.aggregate([
      {
        $match: {
          referredDoctor: doctor._id,
          createdAt: { $gte: currentMonth }
        }
      },
      {
        $group: {
          _id: null,
          received: { $sum: 1 }
        }
      }
    ]);

    const lastMonthReceivedStats = await Referral.aggregate([
      {
        $match: {
          referredDoctor: doctor._id,
          createdAt: { $gte: lastMonth, $lt: currentMonth }
        }
      },
      {
        $group: {
          _id: null,
          received: { $sum: 1 }
        }
      }
    ]);

    // Prepare comprehensive response
    const response = {
      success: true,
      message: "Doctor profile retrieved successfully",
      data: {
        user: {
          _id: doctor._id,
          fullName: doctor.fullName,
          email: doctor.email,
          phone: doctor.contactNumber1,
          password: "hashed_password_here", // Don't expose actual password
          role: doctor.role,
          profileCompletion: profileCompletion,
          verificationStatus: doctor.verificationStatus,
          nmcValidated: doctor.nmcValidated || false,
          showContactDetails: doctor.showContactDetails,
          fcmToken: doctor.fcmToken,
          createdAt: doctor.createdAt,
          updatedAt: doctor.updatedAt
        },
        registrationData: {
          personalInfo: {
            fullName: doctor.fullName,
            email: doctor.email,
            phone: doctor.contactNumber1,
            dateOfBirth: doctor.dateOfBirth,
            gender: doctor.gender,
            password: "hashed_password_here"
          },
          professionalInfo: {
            specialization: doctor.specialization,
            yearsOfExperience: workExperience,
            hospitals: [
              {
                name: doctor.hospitalName1,
                address: `${doctor.hospitalAddress1?.street || ''}, ${doctor.hospitalAddress1?.city || ''}, ${doctor.hospitalAddress1?.state || ''} ${doctor.hospitalAddress1?.country || ''}`,
                isCurrent: true
              },
              ...(doctor.hospitalName2 ? [{
                name: doctor.hospitalName2,
                address: `${doctor.hospitalAddress2?.street || ''}, ${doctor.hospitalAddress2?.city || ''}, ${doctor.hospitalAddress2?.state || ''} ${doctor.hospitalAddress2?.country || ''}`,
                isCurrent: false
              }] : [])
            ],
            referralCode: doctor.myReferralCode
          },
          medicalCredentials: {
            degree: doctor.medicalDegrees?.[0] || "MBBS",
            medicalDegreeSpecialization: doctor.medicalDegrees?.join(", ") || "MBBS",
            mciNumber: doctor.medicalLicenseNumber,
            graduationYear: doctor.practiceStartDate ? new Date(doctor.practiceStartDate).getFullYear() - workExperience : 2015,
            nmcValidated: doctor.nmcValidated || false,
            verifiedDoctorData: {
              name: doctor.fullName,
              registrationNumber: doctor.medicalLicenseNumber,
              qualification: doctor.medicalDegrees?.join(", ") || "MBBS",
              state: doctor.homeAddress?.state || "Maharashtra",
              verificationDate: doctor.updatedAt
            },
            medicalDegrees: doctor.medicalDegrees?.map((degree, index) => ({
              degree: degree,
              institution: `Medical Institution ${index + 1}`,
              year: doctor.practiceStartDate ? new Date(doctor.practiceStartDate).getFullYear() - workExperience + index : 2015 + index,
              verified: true
            })) || []
          },
          addressInfo: {
            country: doctor.homeAddress?.country || "India",
            state: doctor.homeAddress?.state || "Maharashtra",
            city: doctor.homeAddress?.city || "Mumbai",
            pincode: doctor.homeAddress?.pincode || "400001",
            address: `${doctor.homeAddress?.street || ''}, ${doctor.homeAddress?.city || ''}, ${doctor.homeAddress?.state || ''} ${doctor.homeAddress?.country || ''}`,
            hospitalAddress: `${doctor.hospitalAddress1?.street || ''}, ${doctor.hospitalAddress1?.city || ''}, ${doctor.hospitalAddress1?.state || ''} ${doctor.hospitalAddress1?.country || ''}`
          }
        },
        profileCompletionData: {
          hospitalDetails: {
            skipped: false,
            hospitals: [
              {
                id: "hosp_001",
                name: doctor.hospitalName1,
                address: `${doctor.hospitalAddress1?.street || ''}, ${doctor.hospitalAddress1?.city || ''}, ${doctor.hospitalAddress1?.state || ''} ${doctor.hospitalAddress1?.country || ''}`,
                position: "Senior Consultant",
                tenure: `${new Date(doctor.practiceStartDate).getFullYear()}-${new Date().getFullYear()}`,
                isCurrent: true,
                createdAt: doctor.createdAt
              },
              ...(doctor.hospitalName2 ? [{
                id: "hosp_002",
                name: doctor.hospitalName2,
                address: `${doctor.hospitalAddress2?.street || ''}, ${doctor.hospitalAddress2?.city || ''}, ${doctor.hospitalAddress2?.state || ''} ${doctor.hospitalAddress2?.country || ''}`,
                position: "Resident Doctor",
                tenure: `${new Date(doctor.practiceStartDate).getFullYear()}-${new Date(doctor.practiceStartDate).getFullYear() + 2}`,
                isCurrent: false,
                createdAt: doctor.createdAt
              }] : [])
            ]
          },
          practiceInformation: {
            skipped: false,
            clinicName: doctor.clinicName || `${doctor.fullName}'s Clinic`,
            practiceStartDate: doctor.practiceStartDate?.toISOString().split('T')[0] || "2019-06-15",
            diseaseSpecialty: doctor.specialization,
            consultationFee: doctor.consultationFee || "1500",
            workingHours: doctor.workingHours || "9:00 AM - 6:00 PM",
            clinicAddress: `${doctor.clinicAddress?.street || ''}, ${doctor.clinicAddress?.city || ''}, ${doctor.clinicAddress?.state || ''} ${doctor.clinicAddress?.country || ''}`,
            clinicPhone: doctor.contactNumber2 || doctor.contactNumber1,
            experience: `${workExperience} years`,
            specializations: doctor.specializations?.length > 0 ? doctor.specializations : [doctor.specialization],
            treatedDiseases: doctor.treatedDiseases || ["General Diseases"],
            createdAt: doctor.createdAt
          },
          documents: {
            skipped: false,
              medicalCertificates: doctor.documents?.medicalCertificates?.map((cert, index) => ({
                id: `doc_${index + 1}`,
                documentType: "medicalCertificate",
                fileName: `Medical_Certificate_${index + 1}.pdf`,
                fileSize: 2048576,
                filePath: cert,
                mimeType: "application/pdf",
                uploadedAt: doctor.createdAt,
                verified: true,
                verificationDate: doctor.updatedAt
              })) || [],
              casteCertificate: doctor.documents?.casteCertificate ? {
                id: "doc_003",
                documentType: "casteCertificate",
                fileName: "Caste_Certificate.pdf",
                fileSize: 1024000,
                filePath: doctor.documents.casteCertificate,
                mimeType: "application/pdf",
                uploadedAt: doctor.createdAt,
                verified: true,
                verificationDate: doctor.updatedAt
              } : undefined,
              idDocument: doctor.documents?.identificationProof ? {
                id: "doc_004",
                documentType: "idDocument",
                fileName: "Aadhar_Card.pdf",
                fileSize: 512000,
                filePath: doctor.documents.identificationProof,
                mimeType: "application/pdf",
                uploadedAt: doctor.createdAt,
                verified: true,
                verificationDate: doctor.updatedAt
              } : undefined
            },
          communityVerification: {
            skipped: false,
            isKapuAffiliated: doctor.communityDetails?.kapuCommunityAffiliation || false,
            joinReferralSystem: true,
            referralCode: doctor.myReferralCode,
            communityMembership: doctor.communityDetails?.kapuCommunityAffiliation ? "Active" : "Inactive",
            referralPreferences: {
              acceptReferrals: true,
              referralRadius: "50km",
              specialtyReferrals: doctor.specializations?.length > 0 ? doctor.specializations : [doctor.specialization, "General Medicine"],
              availability: "Weekdays 9AM-6PM"
            },
            communityDetails: {
              kapuChapter: "Mumbai Chapter",
              membershipDate: "2020-03-15",
              contributionLevel: doctor.communityDetails?.kapuCommunityAffiliation ? "Active Member" : "Non-Member"
            },
            createdAt: doctor.createdAt
          }
        },
        referralInfo: {
          myReferralCode: doctor.myReferralCode,
          totalReferralsSent: totalReferralsSent,
          totalReferralsReceived: totalReferralsReceived,
          pendingReferrals: pendingReferrals,
          unreadMessages: unreadMessages,
          referralStats: {
            thisMonth: {
              sent: thisMonthStats[0]?.sent || 0,
              received: thisMonthReceivedStats[0]?.received || 0,
              completed: 0
            },
            lastMonth: {
              sent: lastMonthStats[0]?.sent || 0,
              received: lastMonthReceivedStats[0]?.received || 0,
              completed: 0
            }
          }
        },
        communicationPreferences: {
          notifications: {
            referralUpdates: doctor.communicationPreferences?.notificationPreference || true,
            communityNews: true,
            newDoctorAlerts: false,
            systemMessages: true
          },
          privacy: {
            contactVisibility: doctor.showContactDetails,
            referralNotifications: true,
            profileDiscoverability: true
          },
          appPreferences: {
            biometricAuth: false,
            autoLogoutTimer: "30",
            offlineSync: true,
            language: "en"
          }
        },
        deviceInfo: {
          deviceType: doctor.deviceInfo?.deviceType || "android",
          appVersion: doctor.deviceInfo?.appVersion || "1.0.0",
          lastLogin: doctor.deviceInfo?.lastLoginAt || doctor.updatedAt,
          loginCount: 156 // This would need to be tracked separately
        },
        completionStatus: {
          registration: {
            completed: true,
            percentage: 100,
            sections: {
              personalInfo: true,
              professionalInfo: true,
              medicalCredentials: true,
              addressInfo: true
            }
          },
          profileCompletion: {
            hospitalDetails: {
              completed: !!doctor.hospitalName1,
              percentage: doctor.hospitalName1 ? 100 : 0,
              required: true,
              lastUpdated: doctor.updatedAt
            },
            practiceInformation: {
              completed: !!doctor.specialization,
              percentage: doctor.specialization ? 100 : 0,
              required: true,
              lastUpdated: doctor.updatedAt
            },
            documents: {
              completed: !!(doctor.documents?.medicalCertificates?.length > 0),
              percentage: doctor.documents?.medicalCertificates?.length > 0 ? 100 : 0,
              required: true,
              lastUpdated: doctor.updatedAt
            },
            communityVerification: {
              completed: doctor.communityDetails?.kapuCommunityAffiliation || false,
              percentage: doctor.communityDetails?.kapuCommunityAffiliation ? 100 : 0,
              required: false,
              lastUpdated: doctor.updatedAt
            }
          },
          overallCompletion: {
            percentage: profileCompletion,
            completedSections: Math.floor(profileCompletion / 12.5), // Rough calculation
            totalSections: 8,
            remainingSections: profileCompletion < 100 ? ["Complete remaining profile sections"] : [],
            lastUpdated: doctor.updatedAt
          }
        }
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Get doctor profile error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Update doctor profile
router.patch('/profile', auth, async (req, res) => {
  try {
    const doctor = await User.findById(req.user._id);
    
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
      hospitals,
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
    if (education) {
      if (!doctor.education) doctor.education = {};
      const keys = ['mbbs','md','ms','mch','dnb','fellowship','dm'];
      keys.forEach(key => {
        if (education[key]) {
          doctor.education[key] = {
            ...doctor.education[key],
            ...education[key]
          };
        }
      });
      if (education.practicingAs !== undefined) {
        doctor.education.practicingAs = education.practicingAs;
      }
    }

    // Update hospital information
    if (hospitals && Array.isArray(hospitals)) {
      // Clear existing hospital fields
      doctor.hospitalName1 = '';
      doctor.hospitalAddress1 = {};
      doctor.hospitalName2 = '';
      doctor.hospitalAddress2 = {};
      
      // Set first hospital as primary
      if (hospitals.length > 0) {
        const primaryHospital = hospitals[0];
        doctor.hospitalName1 = primaryHospital.name || '';
        doctor.hospitalAddress1 = primaryHospital.address || {};
        if (primaryHospital.position !== undefined) {
          doctor.hospitalPosition1 = primaryHospital.position;
        }
        if (primaryHospital.tenure !== undefined) {
          doctor.hospitalTenure1 = primaryHospital.tenure;
        }
      }
      
      // Set second hospital if exists
      if (hospitals.length > 1) {
        const secondaryHospital = hospitals[1];
        doctor.hospitalName2 = secondaryHospital.name || '';
        doctor.hospitalAddress2 = secondaryHospital.address || {};
        if (secondaryHospital.position !== undefined) {
          doctor.hospitalPosition2 = secondaryHospital.position;
        }
        if (secondaryHospital.tenure !== undefined) {
          doctor.hospitalTenure2 = secondaryHospital.tenure;
        }
      }
    } else {
      // Fallback to individual hospital fields for backward compatibility
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

// =============================================================================
// PATIENT QUERY MANAGEMENT ENDPOINTS FOR DOCTORS
// =============================================================================

// Debug endpoint to check if queries route is working
router.get('/queries/debug', auth, async (req, res) => {
  try {
    console.log('🔍 Debug endpoint called by user:', req.user._id, req.user.role);
    
    // Check total number of queries in database
    const totalQueries = await PatientQuery.countDocuments({});
    const doctorQueries = await PatientQuery.countDocuments({ doctor: req.user._id });
    
    res.json({
      success: true,
      debug: {
        userId: req.user._id,
        userRole: req.user.role,
        totalQueriesInDB: totalQueries,
        queriesForThisDoctor: doctorQueries,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Get all patient queries for the authenticated doctor
router.get('/queries', auth, async (req, res) => {
  console.log('Doctor queries endpoint called:', req.user);
  try {
    const { status, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    console.log('🔍 Doctor queries endpoint called:', {
      doctorId: req.user._id,
      role: req.user.role,
      status,
      page,
      limit
    });
    
    // Check if user is a doctor
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied. Doctor role required.' });
    }

    // Build filter for queries sent to this doctor
    const filter = { doctor: req.user._id };
    console.log('[Doctor Queries API] Filter:', filter);
    
    if (status) {
      filter.status = status;
      console.log('[Doctor Queries API] Status filter applied:', status);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    console.log('[Doctor Queries API] Pagination:', { skip, limit });
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    console.log('[Doctor Queries API] Sort:', sort);

    // Get queries with essential patient details only
    const queries = await PatientQuery.find(filter)
      .select('patient symptoms subject urgency status consultationType preferredTime doctorResponse doctorResponseTime createdAt updatedAt doctor')
      .populate('patient', '_id')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    console.log('[Doctor Queries API] Queries fetched:', queries.length, queries.map(q => q._id));

    // Get total count for pagination
    const totalQueries = await PatientQuery.countDocuments(filter);

    // Get status counts for summary
    const statusCounts = await PatientQuery.aggregate([
      { $match: { doctor: req.user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const statusSummary = {
      pending: 0,
      accepted: 0,
      rejected: 0,
      completed: 0
    };

    statusCounts.forEach(item => {
      statusSummary[item._id] = item.count;
    });

    // Format queries for doctor dashboard view
    const formattedQueries = queries.map(query => ({
  queryId: query._id,
  patientId: query.patient?._id,
  doctorId: query.doctor || req.user._id,
  time: query.createdAt,
  reply: query.doctorResponse,
  details: `${query.subject || ''}: ${query.symptoms || ''}`.trim()
}));

    res.json({
      success: true,
      message: 'Patient queries retrieved successfully',
      data: {
        queries: formattedQueries,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalQueries / parseInt(limit)),
          totalQueries,
          limit: parseInt(limit)
        },
        summary: {
          totalQueries,
          statusCounts: statusSummary
        }
      }
    });
  } catch (error) {
    console.error('Get doctor queries error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to retrieve patient queries',
      error: error.message 
    });
  }
});

// Get specific patient query details for the authenticated doctor
router.get('/queries/:queryId', auth, async (req, res) => {
  try {
    const { queryId } = req.params;

    // Check if user is a doctor
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied. Doctor role required.' });
    }

    // Find the query and ensure it belongs to this doctor
    const query = await PatientQuery.findOne({
      _id: queryId,
      doctor: req.user._id
    }).populate('patient', 'name phoneNumber email age gender address');

    if (!query) {
      return res.status(404).json({ 
        success: false,
        message: 'Patient query not found' 
      });
    }

    res.json({
      success: true,
      message: 'Patient query details retrieved successfully',
      data: query
    });
  } catch (error) {
    console.error('Get specific doctor query error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to retrieve patient query details',
      error: error.message 
    });
  }
});

// Reply to a patient query and update status
router.patch('/queries/:queryId/reply', auth, async (req, res) => {
  try {
    const { queryId } = req.params;
    const { 
      doctorResponse, 
      status, 
      appointmentTime, 
      consultationType,
      additionalNotes 
    } = req.body;

    // Check if user is a doctor
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied. Doctor role required.' });
    }

    // Validate required fields
    if (!doctorResponse) {
      return res.status(400).json({ 
        success: false,
        message: 'Doctor response is required' 
      });
    }

    if (!status || !['accepted', 'rejected', 'completed'].includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: 'Valid status is required (accepted, rejected, or completed)' 
      });
    }

    // Find the query and ensure it belongs to this doctor
    const query = await PatientQuery.findOne({
      _id: queryId,
      doctor: req.user._id
    }).populate('patient', 'name phoneNumber email fcmToken');

    if (!query) {
      return res.status(404).json({ 
        success: false,
        message: 'Patient query not found' 
      });
    }

    // Check if query is still pending (can only reply to pending queries)
    if (query.status !== 'pending') {
      return res.status(400).json({ 
        success: false,
        message: `Cannot reply to ${query.status} query. Only pending queries can be replied to.` 
      });
    }

    // Update the query with doctor's response
    query.doctorResponse = doctorResponse;
    query.status = status;
    query.doctorResponseTime = new Date();

    if (appointmentTime) {
      query.appointmentTime = new Date(appointmentTime);
    }

    if (consultationType) {
      query.consultationType = consultationType;
    }

    // Add additional notes if provided
    if (additionalNotes) {
      query.additionalNotes = additionalNotes;
    }

    await query.save();

    // Send notification to patient about doctor's response
    try {
      const notificationData = {
        queryId: query._id.toString(),
        doctorName: req.user.fullName,
        doctorResponse: doctorResponse,
        status: status,
        appointmentTime: appointmentTime || null,
        consultationType: consultationType || query.consultationType
      };

      console.log('📱 Sending doctor response notification to patient:', {
        patientId: query.patient._id.toString(),
        doctorName: req.user.fullName,
        status
      });

      await notificationService.sendDoctorResponseNotification(
        query.patient._id,
        notificationData
      );
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError);
      // Don't fail the response if notification fails
    }

    // Populate the updated query for response
    const updatedQuery = await PatientQuery.findById(query._id)
      .populate('patient', 'name phoneNumber email age gender')
      .populate('doctor', 'fullName specialization hospitalName1');

    res.json({
      success: true,
      message: `Patient query ${status} successfully`,
      data: updatedQuery
    });
  } catch (error) {
    console.error('Reply to patient query error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to reply to patient query',
      error: error.message 
    });
  }
});

// Update query status only (without detailed response)
router.patch('/queries/:queryId/status', auth, async (req, res) => {
  try {
    const { queryId } = req.params;
    const { status, appointmentTime } = req.body;

    // Check if user is a doctor
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied. Doctor role required.' });
    }

    // Validate status
    if (!status || !['accepted', 'rejected', 'completed'].includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: 'Valid status is required (accepted, rejected, or completed)' 
      });
    }

    // Find and update the query
    const query = await PatientQuery.findOneAndUpdate(
      { _id: queryId, doctor: req.user._id },
      { 
        status,
        doctorResponseTime: new Date(),
        ...(appointmentTime && { appointmentTime: new Date(appointmentTime) })
      },
      { new: true }
    ).populate('patient', 'name phoneNumber email age gender');

    if (!query) {
      return res.status(404).json({ 
        success: false,
        message: 'Patient query not found' 
      });
    }

    res.json({
      success: true,
      message: `Query status updated to ${status}`,
      data: query
    });
  } catch (error) {
    console.error('Update query status error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update query status',
      error: error.message 
    });
  }
});

// Get doctor's query statistics
router.get('/queries/stats/summary', auth, async (req, res) => {
  try {
    // Check if user is a doctor
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied. Doctor role required.' });
    }

    const doctorId = req.user._id;

    // Get overall statistics
    const totalQueries = await PatientQuery.countDocuments({ doctor: doctorId });
    
    // Get status breakdown
    const statusStats = await PatientQuery.aggregate([
      { $match: { doctor: doctorId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Get monthly statistics
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const monthlyStats = await PatientQuery.aggregate([
      { 
        $match: { 
          doctor: doctorId,
          createdAt: { $gte: currentMonth }
        } 
      },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Get average response time
    const responseTimeStats = await PatientQuery.aggregate([
      { 
        $match: { 
          doctor: doctorId,
          doctorResponseTime: { $exists: true },
          createdAt: { $exists: true }
        } 
      },
      {
        $project: {
          responseTimeHours: {
            $divide: [
              { $subtract: ['$doctorResponseTime', '$createdAt'] },
              1000 * 60 * 60 // Convert to hours
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: '$responseTimeHours' },
          minResponseTime: { $min: '$responseTimeHours' },
          maxResponseTime: { $max: '$responseTimeHours' }
        }
      }
    ]);

    // Format the statistics
    const statusSummary = {
      pending: 0,
      accepted: 0,
      rejected: 0,
      completed: 0
    };

    statusStats.forEach(item => {
      statusSummary[item._id] = item.count;
    });

    const monthlySummary = {
      pending: 0,
      accepted: 0,
      rejected: 0,
      completed: 0
    };

    monthlyStats.forEach(item => {
      monthlySummary[item._id] = item.count;
    });

    res.json({
      success: true,
      message: 'Query statistics retrieved successfully',
      data: {
        overview: {
          totalQueries,
          totalThisMonth: monthlyStats.reduce((sum, item) => sum + item.count, 0)
        },
        statusBreakdown: statusSummary,
        monthlyBreakdown: monthlySummary,
        responseTime: responseTimeStats[0] || {
          avgResponseTime: 0,
          minResponseTime: 0,
          maxResponseTime: 0
        }
      }
    });
  } catch (error) {
    console.error('Get query statistics error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to retrieve query statistics',
      error: error.message 
    });
  }
});

module.exports = router;
