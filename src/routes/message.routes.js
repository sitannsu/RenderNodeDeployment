const express = require('express');
const Message = require('../models/message.model');
const auth = require('../middleware/auth');
const router = express.Router();

// Send a new message
router.post('/', auth, async (req, res) => {
  try {
    const message = new Message({
      ...req.body,
      sender: req.user._id
    });
    await message.save();
    
    // Populate sender and recipient information
    await message.populate('sender recipient', 'fullName specialization hospitalName');
    
    res.status(201).json(message);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all messages for a user (both sent and received)
router.get('/', auth, async (req, res) => {
  try {
    const { type, recipient } = req.query;
    let query = {};

    // Filter by message type (sent or received)
    if (type === 'sent') {
      query.sender = req.user._id;
    } else if (type === 'received') {
      query.recipient = req.user._id;
    } else {
      query.$or = [
        { sender: req.user._id },
        { recipient: req.user._id }
      ];
    }

    // Filter by recipient if provided
    if (recipient) {
      query.recipient = recipient;
    }

    const messages = await Message.find(query)
      .populate('sender recipient', 'fullName specialization hospitalName')
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get conversation with a specific doctor
router.get('/conversation/:doctorId', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, recipient: req.params.doctorId },
        { sender: req.params.doctorId, recipient: req.user._id }
      ]
    })
    .populate('sender recipient', 'fullName specialization hospitalName')
    .sort({ createdAt: -1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark message as read
router.patch('/:id/read', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only recipient can mark message as read
    if (!message.recipient.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to update this message' });
    }

    message.read = true;
    message.readAt = new Date();
    await message.save();
    await message.populate('sender recipient', 'fullName specialization hospitalName');

    res.json(message);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get unread message count
router.get('/unread/count', auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      recipient: req.user._id,
      read: false
    });

    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a message
router.delete('/:id', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only sender can delete the message
    if (!message.sender.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    await message.remove();
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
