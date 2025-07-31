# Doctor Profile APIs

This document describes the APIs for managing doctor profiles with percentage completion tracking.

## Base URL
```
http://localhost:3000/api
```

## Authentication
All APIs require authentication using Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Login Process for Doctors

Since doctors can register without a password, there are multiple ways to login:

### 1. Standard Login (with or without password)
```
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "doctor@example.com",
  "password": "optional_password"
}
```

**Response (if no password set):**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "fullName": "Dr. John Doe",
    "email": "doctor@example.com",
    "role": "doctor",
    "specialization": "Cardiology",
    "hospitalName": "City Hospital"
  },
  "message": "Login successful. Please set a password for security.",
  "requiresPasswordSetup": true
}
```

### 2. Passwordless Doctor Login
```
POST /api/auth/doctor-login
```

**Request Body:**
```json
{
  "email": "doctor@example.com"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "fullName": "Dr. John Doe",
    "email": "doctor@example.com",
    "role": "doctor",
    "specialization": "Cardiology",
    "hospitalName": "City Hospital"
  },
  "message": "Login successful. Please set a password for security.",
  "requiresPasswordSetup": true
}
```

### 3. Set Password (after login)
```
POST /api/auth/set-password
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "password": "newSecurePassword123",
  "confirmPassword": "newSecurePassword123"
}
```

**Response:**
```json
{
  "message": "Password set successfully",
  "user": {
    "id": "user_id",
    "fullName": "Dr. John Doe",
    "email": "doctor@example.com",
    "role": "doctor"
  }
}
```

---

## 1. Get Doctor Profile with Percentage Completion

### Endpoint
```
GET /api/doctors/profile
```

### Description
Retrieves the doctor's profile information along with detailed percentage completion analysis.

### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Response Format
```json
{
  "doctor": {
    "_id": "doctor_id",
    "firstName": "John",
    "lastName": "Doe",
    "middleName": "Michael",
    "fullName": "Dr. John Michael Doe",
    "gender": "male",
    "dateOfBirth": "1985-05-15T00:00:00.000Z",
    "contactNumber1": "+1234567890",
    "contactNumber2": "+1234567891",
    "showContactDetails": true,
    "email": "john.doe@example.com",
    "homeAddress": {
      "street": "123 Medical Street",
      "city": "New York",
      "state": "NY",
      "country": "USA",
      "pincode": "10001"
    },
    "medicalLicenseNumber": "MD123456",
    "medicalDegrees": ["MBBS", "MD"],
    "specialization": "Cardiology",
    "hospitalName1": "City General Hospital",
    "hospitalAddress1": {
      "street": "456 Hospital Ave",
      "city": "New York",
      "state": "NY",
      "country": "USA"
    },
    "hospitalName2": "Community Medical Center",
    "hospitalAddress2": {
      "street": "789 Health Blvd",
      "city": "Brooklyn",
      "state": "NY",
      "country": "USA"
    },
    "clinicAddress": {
      "street": "321 Clinic Road",
      "city": "Manhattan",
      "state": "NY",
      "country": "USA"
    },
    "practiceStartDate": "2010-06-01T00:00:00.000Z",
    "workExperience": 13,
    "treatedDiseases": ["Heart disease", "Hypertension", "Diabetes"],
    "documents": {
      "medicalCertificates": ["cert1.pdf", "cert2.pdf"],
      "casteCertificate": "caste_cert.pdf",
      "identificationProof": "id_proof.pdf"
    },
    "communityDetails": {
      "kapuCommunityAffiliation": true,
      "communityReferrals": [
        {
          "name": "Jane Smith",
          "relationship": "Colleague",
          "contactNumber": "+1234567892"
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
  "profileCompletion": {
    "percentage": 85,
    "completedFields": [
      {
        "field": "firstName",
        "label": "First Name",
        "required": true
      },
      {
        "field": "lastName",
        "label": "Last Name",
        "required": true
      }
    ],
    "missingFields": [
      {
        "field": "contactNumber2",
        "label": "Contact Number 2",
        "required": false
      },
      {
        "field": "clinicAddress.city",
        "label": "Clinic City",
        "required": false
      }
    ]
  }
}
```

### Profile Completion Calculation

The percentage completion is calculated based on the following fields:

#### Required Fields (17 fields):
1. First Name
2. Last Name
3. Gender (male/female)
4. Date of Birth
5. Contact Number 1
6. Email
7. Home City
8. Home State
9. Home Country
10. Medical License Number
11. Medical Degrees
12. Specialization
13. Hospital Name 1
14. Hospital City 1
15. Hospital State 1
16. Hospital Country 1
17. Practice Start Date

#### Optional Fields (19 fields):
1. Contact Number 2
2. Home Street Address
3. Home Pincode
4. Hospital Name 2
5. Hospital Street Address 2
6. Hospital City 2
7. Hospital State 2
8. Hospital Country 2
9. Clinic Street Address
10. Clinic City
11. Clinic State
12. Clinic Country
13. Mostly Treated Diseases
14. Medical Certificates
15. Caste Certificate
16. Identification Proof
17. Kapu Community Affiliation
18. Community Referrals
19. Notification Preference
20. Email Communication

### Error Responses
```json
{
  "message": "Doctor not found"
}
```
```json
{
  "message": "Unauthorized"
}
```

---

## 2. Update Doctor Profile

### Endpoint
```
PATCH /api/doctors/profile
```

### Description
Updates the doctor's profile information and recalculates the completion percentage.

### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Request Body
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "middleName": "Michael",
  "gender": "male",
  "dateOfBirth": "1985-05-15",
  "contactNumber1": "+1234567890",
  "contactNumber2": "+1234567891",
  "showContactDetails": true,
  "homeAddress": {
    "street": "123 Medical Street",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "pincode": "10001"
  },
  "medicalLicenseNumber": "MD123456",
  "medicalDegrees": ["MBBS", "MD"],
  "specialization": "Cardiology",
  "hospitalName1": "City General Hospital",
  "hospitalAddress1": {
    "street": "456 Hospital Ave",
    "city": "New York",
    "state": "NY",
    "country": "USA"
  },
  "hospitalName2": "Community Medical Center",
  "hospitalAddress2": {
    "street": "789 Health Blvd",
    "city": "Brooklyn",
    "state": "NY",
    "country": "USA"
  },
  "clinicAddress": {
    "street": "321 Clinic Road",
    "city": "Manhattan",
    "state": "NY",
    "country": "USA"
  },
  "practiceStartDate": "2010-06-01",
  "treatedDiseases": ["Heart disease", "Hypertension", "Diabetes"],
  "documents": {
    "medicalCertificates": ["cert1.pdf", "cert2.pdf"],
    "casteCertificate": "caste_cert.pdf",
    "identificationProof": "id_proof.pdf"
  },
  "communityDetails": {
    "kapuCommunityAffiliation": true,
    "communityReferrals": [
      {
        "name": "Jane Smith",
        "relationship": "Colleague",
        "contactNumber": "+1234567892"
      }
    ]
  },
  "communicationPreferences": {
    "notificationPreference": true,
    "emailCommunication": true
  }
}
```

### Response Format
```json
{
  "message": "Profile updated successfully",
  "doctor": {
    "_id": "doctor_id",
    "firstName": "John",
    "lastName": "Doe",
    "middleName": "Michael",
    "fullName": "Dr. John Michael Doe",
    "gender": "male",
    "dateOfBirth": "1985-05-15T00:00:00.000Z",
    "contactNumber1": "+1234567890",
    "contactNumber2": "+1234567891",
    "showContactDetails": true,
    "email": "john.doe@example.com",
    "homeAddress": {
      "street": "123 Medical Street",
      "city": "New York",
      "state": "NY",
      "country": "USA",
      "pincode": "10001"
    },
    "medicalLicenseNumber": "MD123456",
    "medicalDegrees": ["MBBS", "MD"],
    "specialization": "Cardiology",
    "hospitalName1": "City General Hospital",
    "hospitalAddress1": {
      "street": "456 Hospital Ave",
      "city": "New York",
      "state": "NY",
      "country": "USA"
    },
    "hospitalName2": "Community Medical Center",
    "hospitalAddress2": {
      "street": "789 Health Blvd",
      "city": "Brooklyn",
      "state": "NY",
      "country": "USA"
    },
    "clinicAddress": {
      "street": "321 Clinic Road",
      "city": "Manhattan",
      "state": "NY",
      "country": "USA"
    },
    "practiceStartDate": "2010-06-01T00:00:00.000Z",
    "workExperience": 13,
    "treatedDiseases": ["Heart disease", "Hypertension", "Diabetes"],
    "documents": {
      "medicalCertificates": ["cert1.pdf", "cert2.pdf"],
      "casteCertificate": "caste_cert.pdf",
      "identificationProof": "id_proof.pdf"
    },
    "communityDetails": {
      "kapuCommunityAffiliation": true,
      "communityReferrals": [
        {
          "name": "Jane Smith",
          "relationship": "Colleague",
          "contactNumber": "+1234567892"
        }
      ]
    },
    "communicationPreferences": {
      "notificationPreference": true,
      "emailCommunication": true
    },
    "role": "doctor",
    "verificationStatus": "pending",
    "profileCompletion": 90,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-15T00:00:00.000Z"
  },
  "profileCompletion": 90
}
```

### Field Descriptions

#### Basic Information
- **firstName** (required): Doctor's first name
- **lastName** (required): Doctor's last name
- **middleName** (optional): Doctor's middle name
- **gender** (required): "male" or "female"
- **dateOfBirth** (required): Date of birth in ISO format

#### Contact Information
- **contactNumber1** (required): Primary contact number
- **contactNumber2** (optional): Secondary contact number
- **showContactDetails** (optional): Boolean to show contact details to patients

#### Address Information
- **homeAddress**: Object containing street, city, state, country, pincode
  - **city** (required): Home city
  - **state** (required): Home state
  - **country** (required): Home country
  - **street** (optional): Street address
  - **pincode** (optional): Postal code

#### Professional Information
- **medicalLicenseNumber** (required): Medical license number
- **medicalDegrees** (required): Array of medical degrees and qualifications
- **specialization** (required): Medical specialization

#### Hospital Information
- **hospitalName1** (required): Primary hospital name
- **hospitalAddress1** (required): Primary hospital address object
- **hospitalName2** (optional): Secondary hospital name
- **hospitalAddress2** (optional): Secondary hospital address object

#### Clinic Information
- **clinicAddress** (optional): Clinic address object

#### Professional Experience
- **practiceStartDate** (required): Date when practice started
- **treatedDiseases** (optional): Array of mostly treated diseases

#### Documents
- **documents**: Object containing document URLs
  - **medicalCertificates** (optional): Array of medical certificate URLs
  - **casteCertificate** (optional): Caste certificate URL
  - **identificationProof** (optional): Identification proof URL

#### Community Details
- **communityDetails**: Object containing community information
  - **kapuCommunityAffiliation** (optional): Boolean for Kapu community affiliation
  - **communityReferrals** (optional): Array of community referral objects

#### Communication Preferences
- **communicationPreferences**: Object containing communication settings
  - **notificationPreference** (optional): Boolean for app notifications
  - **emailCommunication** (optional): Boolean for email communication

### Error Responses
```json
{
  "message": "Doctor not found"
}
```
```json
{
  "message": "Unauthorized"
}
```
```json
{
  "message": "Validation error message"
}
```

---

## Notes

1. **Work Experience Calculation**: Automatically calculated based on the practice start date
2. **Profile Completion**: Automatically recalculated after each update
3. **Full Name**: Automatically generated as "Dr. {firstName} {middleName} {lastName}"
4. **Validation**: All required fields must be provided for successful profile completion
5. **Authentication**: Both APIs require valid JWT token for doctor authentication
6. **Password Management**: Doctors can register without password and set it later for security

## Testing

You can test these APIs using Postman or any API testing tool. Make sure to:
1. Register a doctor account first (with or without password)
2. Login using one of the login methods
3. Get the authentication token
4. Include the token in the Authorization header
5. Use the correct HTTP methods (GET for profile retrieval, PATCH for updates)
6. Optionally set a password for security after login 