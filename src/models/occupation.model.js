const mongoose = require('mongoose');

const occupationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Occupation name is required'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

const Occupation = mongoose.model('Occupation', occupationSchema);
module.exports = Occupation;
