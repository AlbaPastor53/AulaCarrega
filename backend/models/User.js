const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  // Tipo general de estudios (batxillerat, mitja, superior...)
  course: {
    type: String,
    required: true,
    trim: true
  },
  // Estudios concretos seleccionados en el formulario
  estudis: {
    type: String,
    required: true,
    trim: true
  },
  nia: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  // Matrícula del vehicle (car)
  car: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['Admin', 'User'],
    default: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Nombre d'avisos o penalitzacions acumulades per l'usuari
  penalties: {
    type: Number,
    default: 0,
    min: 0
  },
  // Hores totals de càrrega utilitzades per l'alumne
  total_hours: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

module.exports = User;
