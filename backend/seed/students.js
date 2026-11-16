// Carrega 15 alumnes de demostració amb horaris de classe variats.
// Executa'l amb: npm run seed:students
require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const connectDB = require('../config/db');
const User = require('../models/User');
const ClassSchedule = require('../models/ClassSchedule');

const PASSWORD = 'Alumne1234';

const DAYS = ['Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres'];

// Blocs tal com els genera la graella d'horaris del frontend.
const MORNING = [
  { start: '08:00', end: '08:55', type: 'Class' },
  { start: '08:55', end: '09:50', type: 'Class' },
  { start: '09:50', end: '10:45', type: 'Class' },
  { start: '10:45', end: '11:15', type: 'Break' },
  { start: '11:15', end: '12:10', type: 'Class' },
  { start: '12:10', end: '13:05', type: 'Class' },
  { start: '13:05', end: '14:00', type: 'Class' }
];

const MORNING_SHORT = [
  { start: '08:00', end: '08:55', type: 'Class' },
  { start: '08:55', end: '09:50', type: 'Class' },
  { start: '09:50', end: '10:45', type: 'Class' }
];

const AFTERNOON = [
  { start: '15:10', end: '16:05', type: 'Class' },
  { start: '16:05', end: '17:00', type: 'Class' },
  { start: '17:00', end: '17:55', type: 'Class' },
  { start: '17:55', end: '18:15', type: 'Break' },
  { start: '18:15', end: '19:10', type: 'Class' },
  { start: '19:10', end: '20:05', type: 'Class' },
  { start: '20:05', end: '21:00', type: 'Class' }
];

const AFTERNOON_SHORT = [
  { start: '15:10', end: '16:05', type: 'Class' },
  { start: '16:05', end: '17:00', type: 'Class' },
  { start: '17:00', end: '17:55', type: 'Class' }
];

// Assigna els mateixos blocs als dies indicats.
const weekdays = (blocks, days = DAYS) => {
  return Object.fromEntries(days.map((day) => [day, blocks]));
};

// Construeix la setmana completa que espera ClassSchedule.
const buildWeek = (days) => {
  return DAYS.map((day) => {
    const blocks = days[day] || [];
    return { day, enabled: blocks.length > 0, blocks };
  });
};

const STUDENTS = [
  {
    firstName: 'Laia',
    lastName: 'Ferrer',
    email: 'laia.ferrer@alu.edu.gva.es',
    course: 'mitja',
    estudis: 'Sistemes Microinformàtics i Xarxes (presencial)',
    nia: '20260001',
    car: '7101LFR',
    days: weekdays(MORNING)
  },
  {
    firstName: 'Pau',
    lastName: 'Gómez',
    email: 'pau.gomez@alu.edu.gva.es',
    course: 'mitja',
    estudis: 'Gestió Administrativa (presencial)',
    nia: '20260002',
    car: '7102PGM',
    days: weekdays(MORNING)
  },
  {
    firstName: 'Carla',
    lastName: 'Sanchis',
    email: 'carla.sanchis@alu.edu.gva.es',
    course: 'superior',
    estudis: 'DAW: Desenvolupament d\'Aplicacions Web (semipresencial)',
    nia: '20260003',
    car: '7103CSN',
    days: weekdays(AFTERNOON)
  },
  {
    firstName: 'Marc',
    lastName: 'Torres',
    email: 'marc.torres@alu.edu.gva.es',
    course: 'superior',
    estudis: 'DAM: Desenvolupament d\'Aplicacions Multiplataforma (presencial)',
    nia: '20260004',
    car: '7104MTR',
    days: weekdays(AFTERNOON, ['Dilluns', 'Dimarts', 'Dimecres', 'Dijous'])
  },
  {
    firstName: 'Nerea',
    lastName: 'Blasco',
    email: 'nerea.blasco@alu.edu.gva.es',
    course: 'batxillerat',
    estudis: 'Ciències i Tecnologia',
    nia: '20260005',
    car: '7105NBL',
    days: weekdays(MORNING, ['Dilluns', 'Dimarts', 'Dimecres', 'Divendres'])
  },
  {
    firstName: 'Iker',
    lastName: 'Navarro',
    email: 'iker.navarro@alu.edu.gva.es',
    course: 'batxillerat',
    estudis: 'Humanitats i Ciències Socials',
    nia: '20260006',
    car: '7106IKN',
    days: weekdays(MORNING_SHORT, ['Dimarts', 'Dijous'])
  },
  {
    firstName: 'Aitana',
    lastName: 'López',
    email: 'aitana.lopez@alu.edu.gva.es',
    course: 'fp_basica',
    estudis: 'Servicis Administratius (presencial)',
    nia: '20260007',
    car: '7107ALP',
    days: weekdays(AFTERNOON_SHORT, ['Dilluns', 'Dimecres', 'Divendres'])
  },
  {
    firstName: 'Bruno',
    lastName: 'Ripoll',
    email: 'bruno.ripoll@alu.edu.gva.es',
    course: 'mitja',
    estudis: 'Activitats Comercials (presencial)',
    nia: '20260008',
    car: '7108BRP',
    days: weekdays(AFTERNOON, ['Dimarts', 'Dijous', 'Divendres'])
  },
  {
    firstName: 'Emma',
    lastName: 'Puig',
    email: 'emma.puig@alu.edu.gva.es',
    course: 'superior',
    estudis: 'Comerç Internacional (presencial)',
    nia: '20260009',
    car: '7109EPG',
    days: weekdays(MORNING, ['Dilluns', 'Dimarts', 'Dimecres', 'Dijous'])
  },
  {
    firstName: 'Hugo',
    lastName: 'Martí',
    email: 'hugo.marti@alu.edu.gva.es',
    course: 'superior',
    estudis: 'Administració i Finances (presencial)',
    nia: '20260010',
    car: '7110HMT',
    days: weekdays(AFTERNOON_SHORT, ['Dilluns', 'Dijous'])
  },
  {
    firstName: 'Sara',
    lastName: 'Vidal',
    email: 'sara.vidal@alu.edu.gva.es',
    course: 'mitja',
    estudis: 'Gestió Administrativa (semipresencial)',
    nia: '20260011',
    car: '7111SVD',
    days: {
      Dilluns: MORNING,
      Dimarts: MORNING,
      Dijous: AFTERNOON,
      Divendres: AFTERNOON
    }
  },
  {
    firstName: 'Pol',
    lastName: 'Esteve',
    email: 'pol.esteve@alu.edu.gva.es',
    course: 'batxillerat',
    estudis: 'Arts',
    nia: '20260012',
    car: '7112PES',
    days: weekdays(MORNING_SHORT, ['Dilluns', 'Dimecres'])
  },
  {
    firstName: 'Lucía',
    lastName: 'Campos',
    email: 'lucia.campos@alu.edu.gva.es',
    course: 'superior',
    estudis: 'Transport i Logística (presencial)',
    nia: '20260013',
    car: '7113LCM',
    days: weekdays(AFTERNOON)
  },
  {
    firstName: 'Álex',
    lastName: 'Roig',
    email: 'alex.roig@alu.edu.gva.es',
    course: 'mitja',
    estudis: 'Sistemes Microinformàtics i Xarxes (presencial)',
    nia: '20260014',
    car: '7114ARG',
    days: weekdays(AFTERNOON_SHORT, ['Dimarts', 'Divendres'])
  },
  {
    firstName: 'Noa',
    lastName: 'Bernat',
    email: 'noa.bernat@alu.edu.gva.es',
    course: 'fp_basica',
    estudis: 'Servicis Administratius (presencial)',
    nia: '20260015',
    car: '7115NBR',
    days: weekdays(MORNING, ['Dimecres', 'Divendres'])
  }
];

// Crea o actualitza l'alumne i el seu horari.
const saveStudent = async (student, passwordHash) => {
  const user = await User.findOneAndUpdate(
    { email: student.email },
    {
      $set: {
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        course: student.course,
        estudis: student.estudis,
        nia: student.nia,
        car: student.car,
        password: passwordHash,
        role: 'User',
        isActive: true,
        penalties: 0
      }
    },
    { upsert: true, new: true, runValidators: true }
  );

  await ClassSchedule.findOneAndUpdate(
    { user_id: user._id },
    { $set: { week: buildWeek(student.days) } },
    { upsert: true, new: true, runValidators: true }
  );

  return user;
};

const run = async () => {
  try {
    await connectDB();

    const passwordHash = await bcrypt.hash(PASSWORD, 10);

    for (const student of STUDENTS) {
      await saveStudent(student, passwordHash);
    }

    console.log(`${STUDENTS.length} alumnes de demostració carregats`);
    console.log(`Contrasenya per a tots: ${PASSWORD}`);
    console.log('NIA       Matrícula  Alumne');
    STUDENTS.forEach((student) => {
      console.log(`${student.nia}  ${student.car}    ${student.firstName} ${student.lastName}`);
    });
    console.log('Exemple de login: NIA 20260001, matrícula 7101LFR, contrasenya Alumne1234');
  } catch (error) {
    console.error('Error al carregar els alumnes:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

run();
