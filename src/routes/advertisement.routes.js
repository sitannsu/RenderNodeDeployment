const express = require('express');
const router = express.Router();
const Advertisement = require('../models/advertisement.model');
const auth = require('../middleware/auth');

// Get all advertisements
router.get('/', auth, async (req, res) => {
  try {
    const { status, position, search } = req.query;
    let query = {};

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    // Filter by position if provided
    if (position) {
      query.position = position;
    }

    // Search in title and description if search term provided
    if (search) {
      query.$text = { $search: search };
    }

    const advertisements = await Advertisement.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .lean(); // Convert to plain objects

    // Set proper content type and send JSON response
    res.setHeader('Content-Type', 'application/json');
    res.json(advertisements || []);
  } catch (error) {
    console.error('Error fetching advertisements:', error);
    res.status(500).json({ message: 'Error fetching advertisements' });
  }
});

// Create new advertisement (admin only)
router.post('/', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.headers['x-user-role'] !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Validate required fields
    const { title, description, imageUrl, targetUrl, startDate, endDate } = req.body;
    
    if (!title || !description || !imageUrl || !targetUrl || !startDate || !endDate) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['title', 'description', 'imageUrl', 'targetUrl', 'startDate', 'endDate']
      });
    }

    // Create advertisement with validated data
    const advertisementData = {
      title,
      description,
      imageUrl,
      targetUrl,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: req.body.status || 'active',
      position: req.body.position || 'sidebar',
      priority: req.body.priority || 0,
      isActive: true,
      clicks: 0,
      impressions: 0
    };

    const advertisement = new Advertisement(advertisementData);
    await advertisement.save();

    // Set proper content type and send JSON response
    res.setHeader('Content-Type', 'application/json');
    res.status(201).json(advertisement.toObject());
  } catch (error) {
    console.error('Error creating advertisement:', error);
    
    // Handle specific validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: Object.keys(error.errors).reduce((acc, key) => {
          acc[key] = error.errors[key].message;
          return acc;
        }, {})
      });
    }
    
    // Handle date parsing errors
    if (error instanceof Date && isNaN(error)) {
      return res.status(400).json({
        message: 'Invalid date format',
        required: 'Use ISO date format (YYYY-MM-DD) or ISO datetime'
      });
    }

    res.status(500).json({ message: 'Error creating advertisement' });
  }
});

// Update advertisement (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.headers['x-user-role'] !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { id } = req.params;
    const updates = { ...req.body };

    // Convert dates if provided
    if (updates.startDate) {
      updates.startDate = new Date(updates.startDate);
    }
    if (updates.endDate) {
      updates.endDate = new Date(updates.endDate);
    }

    const advertisement = await Advertisement.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).lean(); // Convert to plain object

    if (!advertisement) {
      return res.status(404).json({ message: 'Advertisement not found' });
    }

    // Set proper content type and send JSON response
    res.setHeader('Content-Type', 'application/json');
    res.json(advertisement);
  } catch (error) {
    console.error('Error updating advertisement:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: Object.keys(error.errors).reduce((acc, key) => {
          acc[key] = error.errors[key].message;
          return acc;
        }, {})
      });
    }

    // Handle date parsing errors
    if (error instanceof Date && isNaN(error)) {
      return res.status(400).json({
        message: 'Invalid date format',
        required: 'Use ISO date format (YYYY-MM-DD) or ISO datetime'
      });
    }

    res.status(500).json({ message: 'Error updating advertisement' });
  }
});

// Delete advertisement (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.headers['x-user-role'] !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const advertisement = await Advertisement.findById(req.params.id);
    if (!advertisement) {
      return res.status(404).json({ message: 'Advertisement not found' });
    }

    // Soft delete by setting isActive to false
    advertisement.isActive = false;
    await advertisement.save();

    res.json({ message: 'Advertisement deleted successfully' });
  } catch (error) {
    console.error('Error deleting advertisement:', error);
    res.status(500).json({ message: error.message });
  }
});

// Track advertisement click
router.post('/:id/click', auth, async (req, res) => {
  try {
    const advertisement = await Advertisement.findById(req.params.id);
    if (!advertisement) {
      return res.status(404).json({ message: 'Advertisement not found' });
    }

    advertisement.clicks += 1;
    await advertisement.save();

    res.json({ message: 'Click tracked successfully' });
  } catch (error) {
    console.error('Error tracking click:', error);
    res.status(500).json({ message: error.message });
  }
});

// Track advertisement impression
router.post('/:id/impression', auth, async (req, res) => {
  try {
    const advertisement = await Advertisement.findById(req.params.id);
    if (!advertisement) {
      return res.status(404).json({ message: 'Advertisement not found' });
    }

    advertisement.impressions += 1;
    await advertisement.save();

    res.json({ message: 'Impression tracked successfully' });
  } catch (error) {
    console.error('Error tracking impression:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
