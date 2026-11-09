const mongoose = require('mongoose');

const chargingScheduleSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
  // Hores en format "HH:MM"
  start_time: {
    type: String,
    required: true,
    trim: true
  },
  end_time: {
    type: String,
    required: true,
    trim: true
  },
  assigned_hours: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['Pending', 'InProgress', 'Completed', 'Cancelled', 'NotUsed'],
    default: 'Pending',
    required: true
  },
  connection_time: {
    type: Date,
    default: null
  },
  disconnection_time: {
    type: Date,
    default: null
  },
  actual_hours: {
    type: Number,
    default: 0,
    min: 0
  }
}, { timestamps: true });

// Un usuari no hauria de tenir dos torns el mateix dia sense control.
// Aquests índexs ajuden a consultar ràpidament per usuari i per carregador.
chargingScheduleSchema.index({ user_id: 1, date: 1 });
chargingScheduleSchema.index({ charger: 1, date: 1 });

module.exports = mongoose.model('ChargingSchedule', chargingScheduleSchema, 'charging_schedules');
