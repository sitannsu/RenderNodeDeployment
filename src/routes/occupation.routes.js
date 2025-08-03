const express = require('express');
const Occupation = require('../models/occupation.model');
const auth = require('../middleware/auth');
const router = express.Router();

// Create a new occupation (Admin only)
router.post('/', auth, async (req, res) => {
  try {
    // Verify admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { name, description } = req.body;
    
    // Check if occupation already exists
    const existingOccupation = await Occupation.findOne({ name });
    if (existingOccupation) {
      return res.status(400).json({ message: 'Occupation already exists' });
    }

    const occupation = new Occupation({
      name,
      description
    });

    await occupation.save();
    res.status(201).json(occupation);
  } catch (error) {
    console.error('Error creating occupation:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all occupations
router.get('/', async (req, res) => {
  try {
    const occupations = await Occupation.find({ isActive: true })
      .select('name description doctorCount')
      .sort({ name: 1 });
    
    res.json(occupations);
  } catch (error) {
    console.error('Error fetching occupations:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update an occupation (Admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { name, description, isActive } = req.body;
    const occupation = await Occupation.findById(req.params.id);

    if (!occupation) {
      return res.status(404).json({ message: 'Occupation not found' });
    }

    // Check if new name already exists (if name is being changed)
    if (name && name !== occupation.name) {
      const existingOccupation = await Occupation.findOne({ name });
      if (existingOccupation) {
        return res.status(400).json({ message: 'Occupation name already exists' });
      }
    }

    occupation.name = name || occupation.name;
    occupation.description = description || occupation.description;
    if (typeof isActive === 'boolean') {
      occupation.isActive = isActive;
    }

    await occupation.save();
    res.json(occupation);
  } catch (error) {
    console.error('Error updating occupation:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete an occupation (Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const occupation = await Occupation.findById(req.params.id);
    if (!occupation) {
      return res.status(404).json({ message: 'Occupation not found' });
    }

    // Soft delete by setting isActive to false
    occupation.isActive = false;
    await occupation.save();
    
    res.json({ message: 'Occupation deleted successfully' });
  } catch (error) {
    console.error('Error deleting occupation:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
