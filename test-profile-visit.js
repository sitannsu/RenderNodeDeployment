const axios = require('axios');

// Test script to simulate a patient visiting a doctor's profile
async function testProfileVisit() {
  const baseURL = 'http://localhost:3000/api';
  
  try {
    console.log('🧪 Testing profile visit notification system...\n');
    
    // Test 1: Get doctor details (this should trigger notification if patient is authenticated)
    console.log('1. Testing GET /api/patient/doctors/:id with patient auth...');
    
    // You would need to replace these with actual IDs from your database
    const doctorId = '68cfa82ce3c926032049fcc0'; // Replace with actual doctor ID
    const patientToken = 'YOUR_PATIENT_JWT_TOKEN'; // Replace with actual patient token
    
    const response = await axios.get(`${baseURL}/patient/doctors/${doctorId}`, {
      headers: {
        'Authorization': `Bearer ${patientToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Doctor details retrieved:', response.data);
    console.log('📱 Notification should have been sent to the doctor\n');
    
    // Test 2: Record a view explicitly
    console.log('2. Testing POST /api/patient/doctors/:id/view...');
    
    const viewResponse = await axios.post(`${baseURL}/patient/doctors/${doctorId}/view`, {}, {
      headers: {
        'Authorization': `Bearer ${patientToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ View recorded:', viewResponse.data);
    console.log('📱 Notification should have been sent to the doctor\n');
    
    // Test 3: Check visitors list
    console.log('3. Testing GET /api/patient/doctors/:id/visitors...');
    
    const visitorsResponse = await axios.get(`${baseURL}/patient/doctors/${doctorId}/visitors`);
    console.log('✅ Visitors list:', visitorsResponse.data);
    
    console.log('\n🎉 All tests completed! Check the server logs for notification details.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testProfileVisit();














