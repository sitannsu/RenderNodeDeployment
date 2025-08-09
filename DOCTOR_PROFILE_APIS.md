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

---

# Doctor Patient Query Management APIs

This section describes the APIs for doctors to manage patient queries sent to them.

## Base URL
```
http://localhost:3000/api/doctors
```

All endpoints require doctor authentication using Bearer token.

---

## 1. Get All Patient Queries for Doctor

### Endpoint
```
GET /api/doctors/queries
```

### Description
Retrieves all patient queries sent to the authenticated doctor with essential information optimized for dashboard view. Returns patient details, query summary, and status information with filtering, pagination, and sorting options.

### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Query Parameters
- **status** (optional): Filter by query status (`pending`, `accepted`, `rejected`, `completed`)
- **page** (optional): Page number for pagination (default: 1)
- **limit** (optional): Number of queries per page (default: 10)
- **sortBy** (optional): Field to sort by (default: `createdAt`)
- **sortOrder** (optional): Sort order (`asc` or `desc`, default: `desc`)

### Example Request
```
GET /api/doctors/queries?status=pending&page=1&limit=5&sortBy=createdAt&sortOrder=desc
```

### Response Optimization
This endpoint returns **optimized data for doctor dashboard view**:
- **Patient info**: Only essential details (name, phone, age, gender)
- **Symptoms**: Truncated to 100 characters for list view
- **Query fields**: Subject, urgency, status, consultation type, timing
- **Response status**: Boolean flag indicating if doctor has responded
- **No doctor details**: Avoids returning doctor's own information
- **No full attachments**: Use detailed endpoint for complete information

### Response Format
```json
{
  "success": true,
  "message": "Patient queries retrieved successfully",
  "data": {
    "queries": [
      {
        "_id": "query_id",
        "patient": {
          "_id": "patient_id",
          "name": "John Doe",
          "phoneNumber": "+1234567890",
          "age": 35,
          "gender": "male"
        },
        "subject": "Chest pain consultation",
        "symptoms": "Chest pain and shortness of breath for the past 2 days. The pain is sharp and occurs especially...",
        "urgency": "high",
        "status": "pending",
        "consultationType": "online",
        "preferredTime": "Morning (9 AM - 12 PM)",
        "hasResponse": false,
        "responseTime": null,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalQueries": 15,
      "limit": 5
    },
    "summary": {
      "totalQueries": 15,
      "statusCounts": {
        "pending": 8,
        "accepted": 4,
        "rejected": 1,
        "completed": 2
      }
    }
  }
}
```

---

## 2. Get Specific Patient Query Details

### Endpoint
```
GET /api/doctors/queries/:queryId
```

### Description
Retrieves detailed information about a specific patient query sent to the authenticated doctor.

### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Path Parameters
- **queryId** (required): The ID of the patient query

### Example Request
```
GET /api/doctors/queries/507f1f77bcf86cd799439011
```

### Response Format
```json
{
  "success": true,
  "message": "Patient query details retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "patient": {
      "_id": "patient_id",
      "name": "John Doe",
      "phoneNumber": "+1234567890",
      "email": "patient@example.com",
      "age": 35,
      "gender": "male",
      "address": {
        "street": "123 Main St",
        "city": "New York",
        "state": "NY",
        "pincode": "10001"
      }
    },
    "symptoms": "Chest pain and shortness of breath",
    "duration": "2 days",
    "previousTreatments": "Took paracetamol",
    "attachments": [
      {
        "url": "attachment1.jpg",
        "description": "X-ray report"
      }
    ],
    "preferredTime": "Morning",
    "status": "pending",
    "consultationType": "online",
    "subject": "Chest pain consultation",
    "urgency": "high",
    "patientContactNo": "+1234567890",
    "doctorResponse": null,
    "doctorResponseTime": null,
    "appointmentTime": null,
    "additionalNotes": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## 3. Reply to Patient Query

### Endpoint
```
PATCH /api/doctors/queries/:queryId/reply
```

### Description
Allows the doctor to reply to a patient query with a detailed response and update the query status.

### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Path Parameters
- **queryId** (required): The ID of the patient query

### Request Body
```json
{
  "doctorResponse": "Based on your symptoms, I recommend you visit the emergency room immediately. The chest pain combined with shortness of breath could indicate a serious condition.",
  "status": "accepted",
  "appointmentTime": "2024-01-16T14:00:00.000Z",
  "consultationType": "in-person",
  "additionalNotes": "Please bring your recent ECG reports if available"
}
```

### Request Body Fields
- **doctorResponse** (required): Doctor's detailed response to the patient
- **status** (required): New status of the query (`accepted`, `rejected`, or `completed`)
- **appointmentTime** (optional): Scheduled appointment time (ISO format)
- **consultationType** (optional): Type of consultation (`online` or `in-person`)
- **additionalNotes** (optional): Any additional notes or instructions

### Response Format
```json
{
  "success": true,
  "message": "Patient query accepted successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "patient": {
      "_id": "patient_id",
      "name": "John Doe",
      "phoneNumber": "+1234567890",
      "email": "patient@example.com",
      "age": 35,
      "gender": "male"
    },
    "doctor": {
      "_id": "doctor_id",
      "fullName": "Dr. Jane Smith",
      "specialization": "Cardiology",
      "hospitalName1": "City General Hospital"
    },
    "symptoms": "Chest pain and shortness of breath",
    "duration": "2 days",
    "previousTreatments": "Took paracetamol",
    "status": "accepted",
    "doctorResponse": "Based on your symptoms, I recommend you visit the emergency room immediately...",
    "doctorResponseTime": "2024-01-15T11:30:00.000Z",
    "appointmentTime": "2024-01-16T14:00:00.000Z",
    "consultationType": "in-person",
    "additionalNotes": "Please bring your recent ECG reports if available",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T11:30:00.000Z"
  }
}
```

---

## 4. Update Query Status Only

### Endpoint
```
PATCH /api/doctors/queries/:queryId/status
```

### Description
Allows the doctor to quickly update only the status of a patient query without providing a detailed response.

### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Path Parameters
- **queryId** (required): The ID of the patient query

### Request Body
```json
{
  "status": "completed",
  "appointmentTime": "2024-01-16T14:00:00.000Z"
}
```

### Request Body Fields
- **status** (required): New status of the query (`accepted`, `rejected`, or `completed`)
- **appointmentTime** (optional): Scheduled appointment time (ISO format)

### Response Format
```json
{
  "success": true,
  "message": "Query status updated to completed",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "patient": {
      "_id": "patient_id",
      "name": "John Doe",
      "phoneNumber": "+1234567890",
      "email": "patient@example.com",
      "age": 35,
      "gender": "male"
    },
    "status": "completed",
    "doctorResponseTime": "2024-01-15T12:00:00.000Z",
    "appointmentTime": "2024-01-16T14:00:00.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

---

## 5. Get Doctor's Query Statistics

### Endpoint
```
GET /api/doctors/queries/stats/summary
```

### Description
Retrieves comprehensive statistics about the doctor's patient queries including status breakdown, monthly trends, and response times.

### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Response Format
```json
{
  "success": true,
  "message": "Query statistics retrieved successfully",
  "data": {
    "overview": {
      "totalQueries": 45,
      "totalThisMonth": 12
    },
    "statusBreakdown": {
      "pending": 8,
      "accepted": 25,
      "rejected": 5,
      "completed": 7
    },
    "monthlyBreakdown": {
      "pending": 3,
      "accepted": 6,
      "rejected": 1,
      "completed": 2
    },
    "responseTime": {
      "avgResponseTime": 2.5,
      "minResponseTime": 0.5,
      "maxResponseTime": 24.0
    }
  }
}
```

### Statistics Fields
- **overview**: General statistics
  - **totalQueries**: Total number of queries received by the doctor
  - **totalThisMonth**: Number of queries received this month
- **statusBreakdown**: Count of queries by status (all time)
- **monthlyBreakdown**: Count of queries by status (current month)
- **responseTime**: Response time statistics in hours
  - **avgResponseTime**: Average response time in hours
  - **minResponseTime**: Fastest response time in hours
  - **maxResponseTime**: Slowest response time in hours

---

## Error Responses

### 403 Forbidden (Non-doctor access)
```json
{
  "message": "Access denied. Doctor role required."
}
```

### 404 Not Found (Query not found)
```json
{
  "success": false,
  "message": "Patient query not found"
}
```

### 400 Bad Request (Invalid status)
```json
{
  "success": false,
  "message": "Valid status is required (accepted, rejected, or completed)"
}
```

### 400 Bad Request (Cannot reply to non-pending query)
```json
{
  "success": false,
  "message": "Cannot reply to accepted query. Only pending queries can be replied to."
}
```

### 401 Unauthorized
```json
{
  "message": "Authentication required"
}
```

---

## Query Status Flow

1. **pending**: Initial status when patient submits a query
2. **accepted**: Doctor accepts the query and may schedule an appointment
3. **rejected**: Doctor declines the query (with optional reason)
4. **completed**: Query has been fully addressed and closed

**Note**: Only queries with `pending` status can be replied to with detailed responses. Queries in other statuses can only have their status updated.

---

## Notification System

When a doctor replies to or updates a patient query, an automatic push notification is sent to the patient containing:
- Doctor's name
- Response status (accepted/rejected/completed)
- Appointment time (if scheduled)
- Consultation type

---

## Query Urgency Levels

- **low**: Non-urgent general inquiries
- **medium**: Standard medical questions (default)
- **high**: Urgent medical concerns requiring prompt attention

---

## Best Practices

1. **Response Time**: Try to respond to high urgency queries within 2-4 hours
2. **Detailed Responses**: Provide clear, actionable medical advice
3. **Appointment Scheduling**: Include specific appointment times when accepting queries
4. **Professional Communication**: Maintain professional language in all responses
5. **Patient Safety**: For emergency symptoms, advise immediate medical attention

---

## Testing the Doctor Query APIs

### Prerequisites
1. Register a doctor account
2. Login and get authentication token
3. Have patient queries in the system (use patient app to create queries)

### Example Test Sequence
```bash
# 1. Get all queries
GET /api/doctors/queries
Authorization: Bearer <doctor_token>

# 2. Get specific query details
GET /api/doctors/queries/{query_id}
Authorization: Bearer <doctor_token>

# 3. Reply to a query
PATCH /api/doctors/queries/{query_id}/reply
Authorization: Bearer <doctor_token>
Content-Type: application/json

{
  "doctorResponse": "I recommend you schedule an appointment for further evaluation.",
  "status": "accepted",
  "appointmentTime": "2024-01-20T10:00:00.000Z",
  "consultationType": "in-person"
}

# 4. Get updated statistics
GET /api/doctors/queries/stats/summary
Authorization: Bearer <doctor_token>
```