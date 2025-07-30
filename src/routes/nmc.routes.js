const express = require('express');
const axios = require('axios');
const router = express.Router();

/**
 * @route GET /api/search-doctor
 * @description Search doctors in NMC database
 * @access Public
 */
router.get('/search-doctor', async (req, res) => {
  const { name, registrationNo, smcId, year } = req.query;

  try {
    // Create params object with only the provided query parameters
    const searchParams = {
      service: 'getPaginatedDoctor',
      draw: 1,
      start: 0,
      length: 500
    };

    // Only add parameters that are provided
    if (name) searchParams.name = name;
    if (registrationNo) searchParams.registrationNo = registrationNo;
    if (smcId) searchParams.smcId = smcId;
    if (year) searchParams.year = year;

    console.log('🔍 NMC API - Searching for doctor:', searchParams);

    const response = await axios.get('https://www.nmc.org.in/MCIRest/open/getPaginatedData', {
      headers: {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': 'https://www.nmc.org.in/information-desk/indian-medical-register/',
      },
      params: searchParams,
    });

    console.log('✅ NMC API - Search successful:', {
      recordsTotal: response.data.recordsTotal,
      recordsFiltered: response.data.recordsFiltered
    });

    res.json(response.data);
  } catch (err) {
    console.error('❌ NMC API - Search failed:', {
      error: err.message,
      details: err.response?.data
    });
    res.status(500).json({ 
      error: 'Failed to fetch data from NMC', 
      details: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
