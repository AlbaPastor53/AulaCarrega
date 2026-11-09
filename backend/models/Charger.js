const mongoose = require('mongoose');

const chargerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['Available', 'Broken', 'Maintenance'],
    default: 'Available',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Charger', chargerSchema, 'chargers');
