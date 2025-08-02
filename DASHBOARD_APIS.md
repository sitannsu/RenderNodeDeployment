# Dashboard APIs Documentation

This document describes the dashboard APIs for the Doctor App backend. All endpoints require admin authentication.

## Authentication

All dashboard endpoints require:
- Valid JWT token in Authorization header: `Bearer <token>`
- User must have `admin` role

## Endpoints

### 1. GET /api/dashboard/stats

Returns comprehensive dashboard statistics including totals and trends.

**URL:** `/api/dashboard/stats`  
**Method:** `GET`  
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "doctors": {
    "total": 150,
    "trend": 12.5
  },
  "referrals": {
    "monthly": 45,
    "trend": -5.2
  },
  "inquiries": {
    "pending": 23,
    "trend": 8.7
  },
  "searches": {
    "monthly": 89,
    "trend": 15.3
  }
}
```

**Response Fields:**
- `doctors.total`: Total number of registered doctors
- `doctors.trend`: Percentage change in doctor registrations (current month vs previous month)
- `referrals.monthly`: Number of referrals in current month
- `referrals.trend`: Percentage change in referrals (current month vs previous month)
- `inquiries.pending`: Number of pending patient inquiries
- `inquiries.trend`: Percentage change in inquiries (current month vs previous month)
- `searches.monthly`: Number of doctor searches in current month
- `searches.trend`: Percentage change in searches (current month vs previous month)

### 2. GET /api/dashboard/activity

Returns recent activities across the platform with configurable limit.

**URL:** `/api/dashboard/activity`  
**Method:** `GET`  
**Headers:** `Authorization: Bearer <token>`  
**Query Parameters:**
- `limit` (optional): Number of activities to return (default: 5, max: 50)

**Example Request:**
```
GET /api/dashboard/activity?limit=10
```

**Response:**
```json
{
  "activities": [
    {
      "type": "doctor_registration",
      "data": {
        "doctorName": "Dr. John Smith",
        "email": "john.smith@example.com",
        "date": "2024-01-15T10:30:00.000Z"
      },
      "timestamp": "2024-01-15T10:30:00.000Z"
    },
    {
      "type": "referral",
      "data": {
        "patientName": "Jane Doe",
        "referringDoctor": "Dr. Alice Johnson",
        "referredDoctor": "Dr. Bob Wilson",
        "status": "pending",
        "date": "2024-01-15T09:15:00.000Z"
      },
      "timestamp": "2024-01-15T09:15:00.000Z"
    },
    {
      "type": "inquiry",
      "data": {
        "patientName": "Mike Brown",
        "doctorName": "Dr. Sarah Davis",
        "symptoms": "Headache and fever",
        "status": "pending",
        "consultationType": "online",
        "date": "2024-01-15T08:45:00.000Z"
      },
      "timestamp": "2024-01-15T08:45:00.000Z"
    }
  ],
  "total": 3
}
```

**Activity Types:**
- `doctor_registration`: New doctor registrations
- `referral`: Patient referrals between doctors
- `inquiry`: Patient inquiries/queries
- `search`: Doctor searches by patients

### 3. GET /api/dashboard/referral-trends

Returns daily referral counts with configurable date range.

**URL:** `/api/dashboard/referral-trends`  
**Method:** `GET`  
**Headers:** `Authorization: Bearer <token>`  
**Query Parameters:**
- `days` (optional): Number of days to analyze (default: 30, max: 365)

**Example Request:**
```
GET /api/dashboard/referral-trends?days=7
```

**Response:**
```json
{
  "trends": [
    {
      "date": "2024-01-09",
      "count": 5
    },
    {
      "date": "2024-01-10",
      "count": 3
    },
    {
      "date": "2024-01-11",
      "count": 7
    },
    {
      "date": "2024-01-12",
      "count": 2
    },
    {
      "date": "2024-01-13",
      "count": 4
    },
    {
      "date": "2024-01-14",
      "count": 6
    },
    {
      "date": "2024-01-15",
      "count": 1
    }
  ],
  "totalReferrals": 28,
  "averageDaily": 4.0,
  "dateRange": {
    "start": "2024-01-09",
    "end": "2024-01-15"
  }
}
```

**Response Fields:**
- `trends`: Array of daily referral counts
  - `date`: Date in YYYY-MM-DD format
  - `count`: Number of referrals on that date
- `totalReferrals`: Total referrals in the date range
- `averageDaily`: Average daily referrals (rounded to 1 decimal)
- `dateRange`: Start and end dates of the analysis period

## Error Responses

All endpoints return standard error responses:

**401 Unauthorized:**
```json
{
  "message": "Access denied. Admin only."
}
```

**500 Internal Server Error:**
```json
{
  "message": "Error message description"
}
```

## Usage Examples

### Frontend Integration

```javascript
// Get dashboard statistics
const getStats = async () => {
  const response = await fetch('/api/dashboard/stats', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const stats = await response.json();
  return stats;
};

// Get recent activities
const getActivities = async (limit = 5) => {
  const response = await fetch(`/api/dashboard/activity?limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const activities = await response.json();
  return activities;
};

// Get referral trends
const getReferralTrends = async (days = 30) => {
  const response = await fetch(`/api/dashboard/referral-trends?days=${days}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const trends = await response.json();
  return trends;
};
```

## Notes

1. **Trend Calculations**: Trends are calculated as percentage change between current month and previous month
2. **Date Ranges**: All date-based queries use UTC timestamps
3. **Performance**: All endpoints use optimized MongoDB queries with proper indexing
4. **Security**: All endpoints require admin authentication and role verification
5. **Rate Limiting**: Consider implementing rate limiting for production use
6. **Caching**: For high-traffic scenarios, consider implementing Redis caching for dashboard data

## Database Indexes

The following indexes are recommended for optimal performance:

```javascript
// User collection
db.users.createIndex({ "role": 1, "createdAt": -1 })

// Referrals collection
db.referrals.createIndex({ "createdAt": -1 })
db.referrals.createIndex({ "referringDoctor": 1, "status": 1 })

// PatientQueries collection
db.patientqueries.createIndex({ "createdAt": -1 })
db.patientqueries.createIndex({ "status": 1, "createdAt": -1 })
``` 