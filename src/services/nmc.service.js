const axios = require('axios');

class NMCService {
  constructor() {
    this.baseUrl = 'https://www.nmc.org.in/MCIRest/open';
  }

  async verifyDoctor(name, registrationNo, year) {
    console.log('🔍 NMC Verification Request:', { name, registrationNo, year });
    try {
      const response = await axios.get(`${this.baseUrl}/getPaginatedData`, {
        params: {
          service: 'getPaginatedDoctor',
          start: 0,
          length: 10,
          name: name,
          registrationNo: registrationNo,
          year: year
        }
      });

      // Log the full response for debugging
      console.log('✅ NMC API Response:', JSON.stringify(response.data, null, 2));

      // Validate response structure
      if (!response.data || !Array.isArray(response.data.data)) {
        console.error('❌ Invalid NMC API response structure:', response.data);
        return {
          isValid: false,
          message: 'Invalid response from NMC API'
        };
      }

      // If data is found, it means the doctor is registered with NMC
      if (response.data.data.length > 0) {
        // NMC API returns array in format: [index, year, regNo, council, name, fatherName, viewLink]
        const doctorData = response.data.data[0];

        // Validate doctor data array structure
        if (!Array.isArray(doctorData) || doctorData.length < 5) {
          console.error('❌ Invalid doctor data structure:', doctorData);
          return {
            isValid: false,
            message: 'Invalid doctor data format'
          };
        }

        const [_, year, regNo, council, doctorName] = doctorData;

        // Validate required fields
        if (!regNo || !doctorName) {
          console.error('❌ Missing required fields:', { regNo, doctorName });
          return {
            isValid: false,
            message: 'Missing required doctor information'
          };
        }

        // Safely convert to string and compare
        const normalizedRegNo = String(regNo).toLowerCase();
        const normalizedInputRegNo = String(registrationNo).toLowerCase();
        const normalizedName = String(doctorName).toLowerCase();
        const normalizedInputName = String(name).toLowerCase();

        // Check if registration details match
        const isMatch = normalizedRegNo === normalizedInputRegNo &&
                       normalizedName.includes(normalizedInputName);

        console.log('🔍 Exact Match Check:', { isMatch, foundDoctor: doctorData });
        if (isMatch) {
          return {
            isValid: true,
            data: {
              name: doctorName,
              registrationNo: regNo,
              year: year,
              council: council
            }
          };
        }
      }

      return {
        isValid: false,
        message: 'Doctor not found in NMC records'
      };

    } catch (error) {
      console.error('NMC API Error:', error);
      return {
        isValid: false,
        message: 'Failed to verify with NMC. Please try again later.'
      };
    }
  }
}

module.exports = new NMCService();
