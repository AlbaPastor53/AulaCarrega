const mongoose = require('mongoose');

const chargingHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Un sol registre d'historial per cada torn
  charging_schedule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChargingSchedule',
    required: true,
    unique: true
  },
  charger: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Charger',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  action: {
    type: String,
    enum: ['Completed', 'NotUsed', 'Cancelled'],
    required: true
  },
  assigned_hours: {
    type: Number,
    required: true,
    min: 0
  },
  actual_hours: {
    type: Number,
    required: true,
    min: 0
  },
  connection_time: {
    type: Date,
    default: null
  },
  disconnection_time: {
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('ChargingHistory', chargingHistorySchema, 'charging_history');
