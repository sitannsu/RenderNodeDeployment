# Screen-Based API Documentation

## Authentication Screens

### Login Screen
```http
POST /api/auth/login
Body: {
  "email": "string",
  "password": "string"
}
```

### Registration Screen
```http
POST /api/auth/register
Body: {
  "fullName": "string",
  "email": "string",
  "password": "string",
  "specialization": "string",
  "hospitalName": "string",
  "phoneNumber": "string",
  "address": "string",
  "registrationNumber": "string",
  "yearsOfExperience": "number"
}
```

## Dashboard Screen
```http
GET /api/doctors/stats/:id
Response: {
  "totalReferralsSent": "number",
  "totalReferralsReceived": "number",
  "pendingReferrals": "number",
  "unreadMessages": "number"
}

GET /api/notifications/unread/count
Response: {
  "count": "number"
}
```

## Profile Screen
```http
GET /api/auth/profile
Response: User object

PATCH /api/auth/profile
Body: {
  "fullName": "string",
  "specialization": "string",
  "hospitalName": "string",
  "phoneNumber": "string",
  "address": "string",
  "profileImage": "string"
}
```

## Find Doctors Screen
```http
GET /api/doctors
Query params: none
Response: Array of doctors

GET /api/doctors/search
Query params: {
  "query": "string",
  "specialization": "string"
}
Response: Array of doctors
```

## Referral Screens

### Send Referral Screen
```http
POST /api/referrals
Body: {
  "patientName": "string",
  "patientAge": "number",
  "patientGender": "string",
  "diagnosis": "string",
  "reason": "string",
  "urgency": "string",
  "referredToDoctor": "string",
  "medicalHistory": "string",
  "currentMedications": [
    {
      "name": "string",
      "dosage": "string",
      "frequency": "string"
    }
  ],
  "attachments": ["string"],
  "notes": "string"
}
```

### Referral List Screen
```http
GET /api/referrals
Query params: {
  "status": "string",
  "type": "sent" | "received"
}

GET /api/referrals/stats/summary
Response: {
  "pending": "number",
  "accepted": "number",
  "rejected": "number",
  "completed": "number"
}
```

### Referral Detail Screen
```http
GET /api/referrals/:id

PATCH /api/referrals/:id/status
Body: {
  "status": "pending" | "accepted" | "rejected" | "completed"
}

PATCH /api/referrals/:id/notes
Body: {
  "notes": "string"
}
```

## Messages Screens

### Messages List Screen
```http
GET /api/messages
Query params: {
  "type": "sent" | "received",
  "recipient": "string"
}

GET /api/messages/unread/count
Response: {
  "count": "number"
}
```

### Conversation Screen
```http
GET /api/messages/conversation/:doctorId

POST /api/messages
Body: {
  "recipient": "string",
  "content": "string",
  "referral": "string (optional)",
  "attachments": ["string"]
}

PATCH /api/messages/:id/read
```

## Notifications Screen
```http
GET /api/notifications
Query params: {
  "page": "number",
  "limit": "number",
  "read": "boolean"
}
Response: {
  "notifications": "array",
  "totalPages": "number",
  "currentPage": "number",
  "totalNotifications": "number"
}

PATCH /api/notifications/:id/read

POST /api/notifications/read-all

DELETE /api/notifications/:id

POST /api/notifications/fcm-token
Body: {
  "fcmToken": "string"
}
```

## Common Headers for All Protected Routes
```http
Authorization: Bearer JWT_TOKEN
Content-Type: application/json
```

## Notification Types
The system supports the following notification types:
- `NEW_REFERRAL`: When a doctor receives a new referral
- `REFERRAL_STATUS_CHANGE`: When a referral's status is updated
- `NEW_MESSAGE`: When a doctor receives a new message
- `REFERRAL_NOTE`: When a note is added to a referral
- `SYSTEM`: For system-generated notifications

## Error Response Format
```json
{
  "message": "Error description"
}
```
