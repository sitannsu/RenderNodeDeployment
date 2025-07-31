# Complete API Documentation

This document describes all the APIs for doctor profile registration, login, get profile, update profile, patient login, admin login, referral management, and dashboard analytics.

## Base URL
```
http://localhost:5005/api
```

## Authentication
Most APIs require authentication using Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## 1. Doctor Registration

### Endpoint
```
POST /api/auth/doctor/register
```

### Description
Registers a new doctor with comprehensive profile information. Password is optional - if not provided, a default password will be set and the doctor can login with just email initially.

### Request Body
```json
{
  "firstName": "John",
  "middleName": "",
  "lastName": "Doe",
  "gender": "male",
  "dateOfBirth": "1980-01-01",
  "contactNumber1": "+911234567890",
  "contactNumber2": "+911234567891",
  "showContactDetails": true,
  "address": {
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India"
  },
  "email": "john.doe@example.com",
  "password": "securePassword123",
  "medicalLicenseNumber": "MCI123456",
  "medicalDegrees": ["MBBS", "MD"],
  "specialization": "Cardiology",
  "hospitals": [
    {
      "name": "City Hospital",
      "address": "123 Main St",
      "city": "Mumbai",
      "state": "Maharashtra",
      "country": "India"
    }
  ],
  "clinicAddress": {
    "address": "456 Clinic St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India"
  },
  "practiceStartDate": "2010-01-01",
  "treatedDiseases": ["Heart Disease", "Hypertension"],
  "documents": {
    "medicalCertificates": ["url1"],
    "casteCertificate": "url2",
    "identificationProof": "url3"
  },
  "communityDetails": {
    "kapuAffiliation": true,
    "communityReferrals": ["ref1", "ref2"]
  },
  "communicationPreferences": {
    "notificationPreference": true,
    "emailCommunication": true
  }
}
```

### Request Body (Without Password)
```json
{
  "firstName": "John",
  "middleName": "",
  "lastName": "Doe",
  "gender": "male",
  "dateOfBirth": "1980-01-01",
  "contactNumber1": "+911234567890",
  "contactNumber2": "+911234567891",
  "showContactDetails": true,
  "address": {
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India"
  },
  "email": "john.doe@example.com",
  "medicalLicenseNumber": "MCI123456",
  "medicalDegrees": ["MBBS", "MD"],
  "specialization": "Cardiology",
  "hospitals": [
    {
      "name": "City Hospital",
      "address": "123 Main St",
      "city": "Mumbai",
      "state": "Maharashtra",
      "country": "India"
    }
  ],
  "clinicAddress": {
    "address": "456 Clinic St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India"
  },
  "practiceStartDate": "2010-01-01",
  "treatedDiseases": ["Heart Disease", "Hypertension"],
  "documents": {
    "medicalCertificates": ["url1"],
    "casteCertificate": "url2",
    "identificationProof": "url3"
  },
  "communityDetails": {
    "kapuAffiliation": true,
    "communityReferrals": ["ref1", "ref2"]
  },
  "communicationPreferences": {
    "notificationPreference": true,
    "emailCommunication": true
  }
}
```

### Response
```json
{
  "message": "Doctor registered successfully",
  "doctor": {
    "_id": "doctor_id",
    "firstName": "John",
    "lastName": "Doe",
    "fullName": "Dr. John Doe",
    "gender": "male",
    "email": "john.doe@example.com",
    "role": "doctor",
    "profileCompletion": 85
  },
  "profileCompletion": 85
}
```

### Notes:
- **Password is optional** - If not provided, a default password will be set
- **Login options**: 
  - With password: Use `POST /api/auth/login` with email and password
  - Without password: Use `POST /api/auth/doctor/login` with just email
- **Security**: After login, doctors can set a proper password using `POST /api/auth/set-password`

---

## 2. Doctor Login

### 2.1 Passwordless Doctor Login
```
POST /api/auth/doctor/login
```

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "fcmToken": "fcm_token_here",
  "deviceType": "android",
  "appVersion": "1.0.0"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "fullName": "Dr. John Doe",
    "email": "john.doe@example.com",
    "role": "doctor",
    "specialization": "Cardiology",
    "hospitalName": "City Hospital"
  },
  "message": "Login successful. Please set a password for security.",
  "requiresPasswordSetup": true
}
```

### 2.2 Universal Login (with password)
```
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "securePassword123",
  "fcmToken": "fcm_token_here",
  "deviceType": "android",
  "appVersion": "1.0.0"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "fullName": "Dr. John Doe",
    "email": "john.doe@example.com",
    "role": "doctor",
    "specialization": "Cardiology",
    "hospitalName": "City Hospital"
  },
  "requiresPasswordSetup": false
}
```

---

## 3. Patient Registration

### Endpoint
```
POST /api/auth/patient/register
```

### Request Body
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "middleName": "",
  "gender": "female",
  "dateOfBirth": "1990-05-15",
  "contactNumber": "+911234567892",
  "email": "jane.smith@example.com",
  "address": {
    "city": "Delhi",
    "state": "Delhi",
    "country": "India"
  },
  "allowContactVisibility": false
}
```

### Response
```json
{
  "message": "Patient registered successfully",
  "patient": {
    "_id": "patient_id",
    "firstName": "Jane",
    "lastName": "Smith",
    "fullName": "Jane Smith",
    "gender": "female",
    "email": "jane.smith@example.com",
    "role": "patient",
    "profileCompletion": 75
  },
  "profileCompletion": 75
}
```

---

## 4. Patient Login

### Endpoint
```
POST /api/auth/patient/login
```

### Request Body
```json
{
  "email": "jane.smith@example.com",
  "password": "securePassword123",
  "fcmToken": "fcm_token_here",
  "deviceType": "android",
  "appVersion": "1.0.0"
}
```

### Response
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "fullName": "Jane Smith",
    "email": "jane.smith@example.com",
    "role": "patient",
    "contactNumber": "+911234567892"
  },
  "requiresPasswordSetup": false
}
```

---

## 5. Admin Login

### Endpoint
```
POST /api/auth/admin/login
```

### Request Body
```json
{
  "email": "admin@example.com",
  "password": "adminPassword123",
  "fcmToken": "fcm_token_here",
  "deviceType": "android",
  "appVersion": "1.0.0"
}
```

### Response
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "fullName": "Admin User",
    "email": "admin@example.com",
    "role": "admin"
  },
  "requiresPasswordSetup": false
}
```

---

## 6. FCM Token Management

### Overview
All login APIs now support FCM (Firebase Cloud Messaging) token management for push notifications. When users log in, they can provide their FCM token along with device information, which will be stored in the database for sending push notifications.

### FCM Token Fields
- **`fcmToken`** (optional): The FCM token from the user's device
- **`deviceType`** (optional): Device type - `android`, `ios`, or `web` (defaults to `android`)
- **`appVersion`** (optional): App version for tracking

### Usage
```json
{
  "email": "user@example.com",
  "password": "password123",
  "fcmToken": "fcm_token_from_device",
  "deviceType": "android",
  "appVersion": "1.0.0"
}
```

### Benefits
- **Push Notifications**: Store FCM tokens to send notifications
- **Device Tracking**: Track device type and app version
- **Login History**: Record last login time for analytics
- **Multi-device Support**: Users can login from multiple devices

---

## 7. Update FCM Token

### Endpoint
```
POST /api/auth/update-fcm-token
Authorization: Bearer <token>
```

### Description
Update FCM token for the authenticated user. This API can be called independently to refresh FCM tokens without requiring a full login.

### Request Body
```json
{
  "fcmToken": "new_fcm_token_here",
  "deviceType": "android",
  "appVersion": "1.0.0"
}
```

### Response
```json
{
  "message": "FCM token updated successfully",
  "user": {
    "id": "user_id",
    "fullName": "Dr. John Doe",
    "email": "john.doe@example.com",
    "role": "doctor",
    "deviceInfo": {
      "deviceType": "android",
      "appVersion": "1.0.0",
      "lastLoginAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Use Cases
- **Token Refresh**: Update FCM token when it expires
- **Device Change**: Update token when user switches devices
- **App Update**: Update token after app version changes
- **Background Sync**: Refresh token in background without user interaction

---

## 8. Get Profile

### Endpoint
```
GET /api/auth/profile
Authorization: Bearer <token>
```

### Response (Doctor)
```json
{
  "user": {
    "_id": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    "middleName": "",
    "fullName": "Dr. John Doe",
    "gender": "male",
    "dateOfBirth": "1980-01-01T00:00:00.000Z",
    "contactNumber1": "+911234567890",
    "contactNumber2": "+911234567891",
    "showContactDetails": true,
    "email": "john.doe@example.com",
    "homeAddress": {
      "street": "",
      "city": "Mumbai",
      "state": "Maharashtra",
      "country": "India",
      "pincode": ""
    },
    "medicalLicenseNumber": "MCI123456",
    "medicalDegrees": ["MBBS", "MD"],
    "specialization": "Cardiology",
    "hospitalName1": "City Hospital",
    "hospitalAddress1": {
      "street": "123 Main St",
      "city": "Mumbai",
      "state": "Maharashtra",
      "country": "India"
    },
    "clinicAddress": {
      "street": "456 Clinic St",
      "city": "Mumbai",
      "state": "Maharashtra",
      "country": "India"
    },
    "practiceStartDate": "2010-01-01T00:00:00.000Z",
    "workExperience": 13,
    "treatedDiseases": ["Heart Disease", "Hypertension"],
    "documents": {
      "medicalCertificates": ["url1"],
      "casteCertificate": "url2",
      "identificationProof": "url3"
    },
    "communityDetails": {
      "kapuCommunityAffiliation": true,
      "communityReferrals": [
        {
          "name": "ref1",
          "relationship": "Referral",
          "contactNumber": ""
        }
      ]
    },
    "communicationPreferences": {
      "notificationPreference": true,
      "emailCommunication": true
    },
    "role": "doctor",
    "verificationStatus": "pending",
    "profileCompletion": 85,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-15T00:00:00.000Z"
  },
  "profileCompletion": 85
}
```

### Response (Patient)
```json
{
  "user": {
    "_id": "user_id",
    "firstName": "Jane",
    "lastName": "Smith",
    "middleName": "",
    "fullName": "Jane Smith",
    "gender": "female",
    "dateOfBirth": "1990-05-15T00:00:00.000Z",
    "contactNumber1": "+911234567892",
    "email": "jane.smith@example.com",
    "homeAddress": {
      "street": "",
      "city": "Delhi",
      "state": "Delhi",
      "country": "India",
      "pincode": ""
    },
    "role": "patient",
    "verificationStatus": "pending",
    "profileCompletion": 75,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-15T00:00:00.000Z"
  },
  "profileCompletion": 75
}
```

---

## 7. Update Profile

### Endpoint
```
PATCH /api/auth/profile
Authorization: Bearer <token>
```

### Request Body (Doctor)
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "specialization": "Cardiology",
  "hospitalName1": "Updated Hospital",
  "treatedDiseases": ["Heart Disease", "Hypertension", "Diabetes"],
  "homeAddress": {
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India"
  }
}
```

### Request Body (Patient)
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "contactNumber1": "+911234567893",
  "homeAddress": {
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India"
  }
}
```

### Response
```json
{
  "message": "Profile updated successfully",
  "user": {
    "_id": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    "fullName": "Dr. John Doe",
    "email": "john.doe@example.com",
    "role": "doctor",
    "profileCompletion": 90
  },
  "profileCompletion": 90
}
```

---

## 8. Set Password

### Endpoint
```
POST /api/auth/set-password
Authorization: Bearer <token>
```

### Request Body
```json
{
  "password": "newSecurePassword123",
  "confirmPassword": "newSecurePassword123"
}
```

### Response
```json
{
  "message": "Password set successfully",
  "user": {
    "id": "user_id",
    "fullName": "Dr. John Doe",
    "email": "john.doe@example.com",
    "role": "doctor"
  }
}
```

---

## 9. Validate Doctor Registration

### Endpoint
```
POST /api/auth/validate-registration
```

### Request Body
```json
{
  "registrationNo": "MCI123456",
  "name": "Dr. John Doe",
  "year": 2020
}
```

### Response
```json
{
  "isValid": true,
  "message": "Registration number is valid",
  "data": {
    "doctorName": "Dr. John Doe",
    "registrationNo": "MCI123456",
    "council": "Medical Council of India"
  }
}
```

---

## 10. Referral Management APIs

### 10.1 Create Referral
```
POST /api/referrals
Authorization: Bearer <doctor_token>
```

**Request Body:**
```json
{
  "referredDoctor": "doctor_id_here",
  "patientName": "John Smith",
  "patientPhone": "+911234567890",
  "reason": "Cardiac consultation required",
  "notes": "Patient has chest pain and shortness of breath",
  "medicalHistory": "Hypertension for 5 years, diabetes for 2 years",
  "attachments": ["url1", "url2"]
}
```

**Response:**
```json
{
  "_id": "referral_id",
  "referringDoctor": {
    "_id": "doctor_id",
    "fullName": "Dr. John Doe",
    "specialization": "Cardiology",
    "hospitalName": "City Hospital"
  },
  "referredDoctor": {
    "_id": "referred_doctor_id",
    "fullName": "Dr. Jane Smith",
    "specialization": "Cardiology",
    "hospitalName": "Heart Institute"
  },
  "patientName": "John Smith",
  "patientPhone": "+911234567890",
  "reason": "Cardiac consultation required",
  "notes": "Patient has chest pain and shortness of breath",
  "medicalHistory": "Hypertension for 5 years, diabetes for 2 years",
  "status": "pending",
  "attachments": ["url1", "url2"],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### 10.2 Get All Referrals
```
GET /api/referrals
Authorization: Bearer <doctor_token>
```

**Response:**
```json
[
  {
    "_id": "referral_id",
    "referringDoctor": {
      "_id": "doctor_id",
      "fullName": "Dr. John Doe",
      "specialization": "Cardiology",
      "hospitalName": "City Hospital"
    },
    "referredDoctor": {
      "_id": "referred_doctor_id",
      "fullName": "Dr. Jane Smith",
      "specialization": "Cardiology",
      "hospitalName": "Heart Institute"
    },
    "patientName": "John Smith",
    "patientPhone": "+911234567890",
    "reason": "Cardiac consultation required",
    "status": "pending",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
]
```

### 10.3 Get Sent Referrals
```
GET /api/referrals?type=sent
Authorization: Bearer <doctor_token>
```

### 10.4 Get Received Referrals
```
GET /api/referrals?type=received
Authorization: Bearer <doctor_token>
```

### 10.5 Get Referrals by Status
```
GET /api/referrals?status=pending
Authorization: Bearer <doctor_token>
```

**Status Options:** `pending`, `accepted`, `rejected`, `completed`

### 10.6 Get Specific Referral
```
GET /api/referrals/:referral_id
Authorization: Bearer <doctor_token>
```

### 10.7 Update Referral Status
```
PATCH /api/referrals/:referral_id/status
Authorization: Bearer <doctor_token>
```

**Request Body:**
```json
{
  "status": "accepted"
}
```

### 10.8 Add Notes to Referral
```
PATCH /api/referrals/:referral_id/notes
Authorization: Bearer <doctor_token>
```

**Request Body:**
```json
{
  "notes": "Patient responded well to treatment. Follow-up scheduled."
}
```

### 10.9 Get Referral Statistics
```
GET /api/referrals/stats/summary
Authorization: Bearer <doctor_token>
```

**Response:**
```json
{
  "pending": 5,
  "accepted": 12,
  "rejected": 2,
  "completed": 8
}
```

---

## 11. Dashboard APIs (Admin Only)

### 11.1 Get Dashboard Stats
```
GET /api/dashboard/stats
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "doctors": {
    "total": 150,
    "trend": 15.5
  },
  "referrals": {
    "monthly": 45,
    "trend": 8.2
  },
  "inquiries": {
    "pending": 23,
    "trend": -5.1
  },
  "searches": {
    "monthly": 120,
    "trend": 12.3
  }
}
```

### 11.2 Get Dashboard Activity
```
GET /api/dashboard/activity?limit=10
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "activities": [
    {
      "type": "doctor_registration",
      "data": {
        "doctorName": "Dr. John Doe",
        "email": "john.doe@example.com",
        "date": "2024-01-15T10:30:00.000Z"
      },
      "timestamp": "2024-01-15T10:30:00.000Z"
    },
    {
      "type": "referral",
      "data": {
        "patientName": "John Smith",
        "referringDoctor": "Dr. John Doe",
        "referredToDoctor": "Dr. Jane Smith",
        "status": "pending",
        "date": "2024-01-15T09:15:00.000Z"
      },
      "timestamp": "2024-01-15T09:15:00.000Z"
    }
  ],
  "total": 2
}
```

### 11.3 Get Referral Trends
```
GET /api/dashboard/referral-trends?days=30
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "trends": [
    {
      "date": "2024-01-01",
      "count": 5
    },
    {
      "date": "2024-01-02",
      "count": 8
    }
  ],
  "totalReferrals": 150,
  "averageDaily": 5.0,
  "dateRange": {
    "start": "2024-01-01",
    "end": "2024-01-30"
  }
}
```

---

## API Endpoints Summary

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| POST | `/api/auth/doctor/register` | Register new doctor | No | - |
| POST | `/api/auth/patient/register` | Register new patient | No | - |
| POST | `/api/auth/doctor/login` | Doctor login (passwordless) | No | - |
| POST | `/api/auth/patient/login` | Patient login | No | - |
| POST | `/api/auth/admin/login` | Admin login | No | - |
| POST | `/api/auth/login` | Universal login | No | - |
| GET | `/api/auth/profile` | Get user profile | Yes | All |
| PATCH | `/api/auth/profile` | Update user profile | Yes | All |
| POST | `/api/auth/set-password` | Set password | Yes | All |
| POST | `/api/auth/update-fcm-token` | Update FCM token | Yes | All |
| POST | `/api/auth/validate-registration` | Validate doctor registration | No | - |
| POST | `/api/referrals` | Create referral | Yes | Doctor |
| GET | `/api/referrals` | Get all referrals | Yes | Doctor |
| GET | `/api/referrals/:id` | Get specific referral | Yes | Doctor |
| PATCH | `/api/referrals/:id/status` | Update referral status | Yes | Doctor |
| PATCH | `/api/referrals/:id/notes` | Add notes to referral | Yes | Doctor |
| GET | `/api/referrals/stats/summary` | Get referral statistics | Yes | Doctor |
| GET | `/api/dashboard/stats` | Get dashboard stats | Yes | Admin |
| GET | `/api/dashboard/activity` | Get dashboard activity | Yes | Admin |
| GET | `/api/dashboard/referral-trends` | Get referral trends | Yes | Admin |
| POST | `/api/notifications/test/:userId` | Send test notification | Yes | All |
| POST | `/api/notifications/broadcast/doctors` | Broadcast to all doctors | Yes | Admin |
| POST | `/api/notifications/validate-token` | Validate FCM token | Yes | All |
| GET | `/api/notifications/status` | Get notification status | Yes | All |
| GET | `/api/notifications` | Get user notifications | Yes | All |
| GET | `/api/notifications/unread/count` | Get unread count | Yes | All |
| PATCH | `/api/notifications/:id/read` | Mark notification as read | Yes | All |
| POST | `/api/notifications/read-all` | Mark all as read | Yes | All |
| DELETE | `/api/notifications/:id` | Delete notification | Yes | All |
| DELETE | `/api/notifications/read/all` | Delete all read notifications | Yes | All |
| POST | `/api/upload/file` | Upload single file | Yes | All |
| POST | `/api/upload/files` | Upload multiple files | Yes | All |
| DELETE | `/api/upload/file/:key` | Delete file from S3 | Yes | All |
| GET | `/api/upload/file/:key/info` | Get file info | Yes | All |

---

## Authentication Flow

### For Doctors:
1. **Register**: `POST /api/auth/doctor/register`
2. **Login**: `POST /api/auth/doctor/login` (passwordless) or `POST /api/auth/login` (with password)
3. **Set Password**: `POST /api/auth/set-password` (optional but recommended)
4. **Get Profile**: `GET /api/auth/profile`
5. **Update Profile**: `PATCH /api/auth/profile`
6. **Manage Referrals**: Use referral APIs

### For Patients:
1. **Register**: `POST /api/auth/patient/register`
2. **Login**: `POST /api/auth/patient/login`
3. **Get Profile**: `GET /api/auth/profile`
4. **Update Profile**: `PATCH /api/auth/profile`

### For Admins:
1. **Login**: `POST /api/auth/admin/login`
2. **Get Profile**: `GET /api/auth/profile`
3. **Update Profile**: `PATCH /api/auth/profile`
4. **Dashboard Analytics**: Use dashboard APIs

---

## Referral Workflow

### Creating a Referral:
1. **Login as Doctor**: `POST /api/auth/doctor/login`
2. **Create Referral**: `POST /api/referrals`
3. **Track Status**: `GET /api/referrals?status=pending`

### Managing Received Referrals:
1. **Login as Doctor**: `POST /api/auth/doctor/login`
2. **View Received**: `GET /api/referrals?type=received`
3. **Update Status**: `PATCH /api/referrals/:id/status`
4. **Add Notes**: `PATCH /api/referrals/:id/notes`

---

## Push Notification System

### Overview
The system includes automatic push notifications using Firebase Cloud Messaging (FCM) for the following events:

### Automatic Notifications

#### 1. New Referral Notifications
- **Trigger**: When a doctor creates a referral for another doctor
- **Recipient**: The referred doctor
- **Notification**: "New Patient Referral - You have received a new patient referral from [Doctor Name]"
- **Data**: Includes referral ID, patient name, reason, and referring doctor info

#### 2. Referral Status Update Notifications
- **Trigger**: When a referred doctor updates the status of a referral
- **Recipient**: The referring doctor
- **Notification**: "Referral Status Updated - Your referral for [Patient Name] has been [status]"
- **Data**: Includes referral ID, new status, patient name, and updated by info

#### 3. Patient Query Notifications
- **Trigger**: When a patient sends a query to a doctor
- **Recipient**: The queried doctor
- **Notification**: "New Patient Query - You have received a new query from [Patient Name]"
- **Data**: Includes query ID, patient info, and query details

### Manual Notification APIs

#### Send Test Notification
```
POST /api/notifications/test/:userId
Authorization: Bearer <token>
```
```json
{
  "title": "Test Notification",
  "body": "This is a test notification",
  "data": {
    "type": "test",
    "customData": "value"
  }
}
```

#### Broadcast to All Doctors
```
POST /api/notifications/broadcast/doctors
Authorization: Bearer <admin_token>
```
```json
{
  "title": "System Announcement",
  "body": "Important system update",
  "data": {
    "type": "announcement",
    "priority": "high"
  }
}
```

#### Validate FCM Token
```
POST /api/notifications/validate-token
Authorization: Bearer <token>
```
```json
{
  "fcmToken": "fcm_token_here"
}
```

#### Get Notification Status
```
GET /api/notifications/status
Authorization: Bearer <token>
```

### Firebase Configuration
The system uses Firebase Cloud Messaging with the following configuration:
- **Project ID**: kappudoctor
- **Sender ID**: 903130882940
- **Supported Platforms**: Android, iOS, Web

### Notification Features
- **High Priority**: Notifications are sent with high priority for immediate delivery
- **Sound & Vibration**: Default sound and vibration patterns
- **Click Actions**: Custom click actions for different notification types
- **Data Payload**: Additional data sent with each notification for app handling
- **Multi-platform**: Support for Android, iOS, and Web platforms

### Notification Collection APIs

#### Get User Notifications
```
GET /api/notifications?page=1&limit=20&read=false&type=referral
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `read` (optional): Filter by read status (true/false)
- `type` (optional): Filter by notification type

**Response:**
```json
{
  "notifications": [
    {
      "_id": "notification_id",
      "type": "referral",
      "title": "New Patient Referral",
      "body": "You have received a new patient referral from Dr. John Doe",
      "data": {
        "referralId": "referral_id",
        "patientName": "Jane Smith",
        "reason": "Cardiac consultation"
      },
      "read": false,
      "priority": "high",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "senderId": {
        "_id": "doctor_id",
        "fullName": "Dr. John Doe",
        "specialization": "Cardiology"
      },
      "referralId": {
        "_id": "referral_id",
        "patientName": "Jane Smith",
        "status": "pending"
      }
    }
  ],
  "totalPages": 5,
  "currentPage": 1,
  "totalNotifications": 100,
  "unreadCount": 15
}
```

#### Get Unread Count
```
GET /api/notifications/unread/count
Authorization: Bearer <token>
```

**Response:**
```json
{
  "count": 15
}
```

#### Mark Notification as Read
```
PATCH /api/notifications/notification_id/read
Authorization: Bearer <token>
```

**Response:**
```json
{
  "_id": "notification_id",
  "read": true,
  "readAt": "2024-01-15T10:35:00.000Z",
  "title": "New Patient Referral",
  "body": "You have received a new patient referral from Dr. John Doe"
}
```

#### Mark All Notifications as Read
```
POST /api/notifications/read-all
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "All notifications marked as read"
}
```

#### Delete Notification
```
DELETE /api/notifications/notification_id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Notification deleted successfully"
}
```

#### Delete All Read Notifications
```
DELETE /api/notifications/read/all
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "All read notifications deleted successfully",
  "deletedCount": 25
}
```

### Notification Types
- **`referral`**: New patient referrals
- **`referral_status`**: Referral status updates
- **`patient_query`**: New patient queries
- **`system`**: System notifications
- **`test`**: Test notifications
- **`announcement`**: Broadcast announcements

### Notification Priorities
- **`high`**: Important notifications (referrals, queries)
- **`normal`**: Regular notifications (status updates)
- **`low`**: Informational notifications

---

## File Upload System (AWS S3)

### Overview
The system includes comprehensive file upload functionality using AWS S3 for secure and scalable file storage.

### AWS S3 Configuration
- **Bucket**: video-travel-2025
- **Region**: us-east-1
- **Access**: Public read access for uploaded files
- **File Size Limit**: 10MB per file
- **Supported Formats**: Images, PDFs, Documents, Excel files

### Upload APIs

#### Upload Single File
```
POST /api/upload/file
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `file`: File to upload
- `folder`: (Optional) Folder name - `documents`, `medical-certificates`, `profile-pictures`, `referral-attachments`

**Response:**
```json
{
  "message": "File uploaded successfully",
  "file": {
    "success": true,
    "url": "https://video-travel-2025.s3.amazonaws.com/documents/1705123456789-abc123.pdf",
    "key": "documents/1705123456789-abc123.pdf",
    "originalName": "medical_certificate.pdf",
    "size": 2048576,
    "mimeType": "application/pdf"
  }
}
```

#### Upload Multiple Files
```
POST /api/upload/files
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `files`: Array of files to upload (max 10)
- `folder`: (Optional) Folder name - `documents`, `medical-certificates`, `profile-pictures`, `referral-attachments`

**Response:**
```json
{
  "message": "Files uploaded successfully",
  "uploaded": [
    {
      "success": true,
      "url": "https://video-travel-2025.s3.amazonaws.com/documents/1705123456789-abc123.pdf",
      "key": "documents/1705123456789-abc123.pdf",
      "originalName": "certificate1.pdf",
      "size": 2048576,
      "mimeType": "application/pdf"
    }
  ],
  "failed": [],
  "totalUploaded": 1,
  "totalFailed": 0
}
```

#### Delete File from S3
```
DELETE /api/upload/file/:key
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "File deleted successfully",
  "key": "documents/1705123456789-abc123.pdf"
}
```

#### Get File Info
```
GET /api/upload/file/:key/info
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "File info retrieved successfully",
  "info": {
    "success": true,
    "size": 2048576,
    "mimeType": "application/pdf",
    "lastModified": "2024-01-15T10:30:00.000Z",
    "metadata": {
      "originalName": "medical_certificate.pdf",
      "uploadedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Supported File Types
- **Images**: JPEG, JPG, PNG, GIF
- **Documents**: PDF, DOC, DOCX, TXT
- **Spreadsheets**: XLS, XLSX
- **Size Limit**: 10MB per file

### File Organization
- **`documents/`**: General documents
- **`medical-certificates/`**: Medical certificates and licenses
- **`profile-pictures/`**: User profile pictures
- **`referral-attachments/`**: Referral-related files

### Security Features
- **Authentication Required**: All upload endpoints require authentication
- **File Type Validation**: Only allowed file types are accepted
- **Size Limits**: 10MB maximum file size
- **Unique Filenames**: Timestamp + random string to prevent conflicts
- **Public Read Access**: Files are publicly accessible via URL

---

## Error Responses

### Common Error Responses:
```json
{
  "message": "Email already registered"
}
```
```json
{
  "message": "Invalid email or password"
}
```
```json
{
  "message": "Authentication required"
}
```
```json
{
  "message": "User not found"
}
```
```json
{
  "message": "Access denied. Admin only."
}
```

### Validation Errors:
```json
{
  "message": "User validation failed: firstName: First name is required"
}
```

---

## Notes

1. **Password Management**: Doctors can register without password and set it later
2. **Profile Completion**: Automatically calculated based on filled fields
3. **Role-Based Access**: Different login endpoints for different user types
4. **Token Expiry**: JWT tokens expire after 30 days
5. **Validation**: All required fields must be provided for successful registration
6. **Security**: Passwords are hashed using bcrypt before storage
7. **Referral Status**: Only the referred doctor can update referral status
8. **Dashboard Access**: Dashboard APIs are restricted to admin users only

## Testing

Use the provided Postman collection `Complete_API_Collection.postman_collection.json` to test all APIs. The collection includes:

- Doctor registration and login flows
- Patient registration and login flows
- Admin login and dashboard access
- Profile management
- Password setup
- Registration validation
- Complete referral management workflow
- Dashboard analytics for admins

Make sure to:
1. Set the correct base URL in the collection variables
2. Use the tokens returned from login responses in subsequent requests
3. Test both passwordless and password-based login flows
4. Verify profile completion calculations
5. Test all user types (doctor, patient, admin)
6. Test referral creation and management workflow
7. Test dashboard analytics with admin credentials 