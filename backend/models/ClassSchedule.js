const mongoose = require('mongoose');

// Bloc horari dins d'un dia (classe o pati)
const blockSchema = new mongoose.Schema({
  start: {
    type: String,
    required: true,
    trim: true
  },
  end: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['Class', 'Break'],
    required: true
  }
}, { _id: false });

// Cada dia de la setmana amb els seus blocs
const daySchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres'],
    required: true
  },
  enabled: {
    type: Boolean,
    default: false
  },
  blocks: {
    type: [blockSchema],
    default: []
  }
}, { _id: false });

const classScheduleSchema = new mongoose.Schema({
  // Un usuari només pot tenir un horari
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  week: {
    type: [daySchema],
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model('ClassSchedule', classScheduleSchema, 'class_schedule');
