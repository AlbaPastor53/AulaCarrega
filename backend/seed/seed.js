// Carrega dades inicials: un administrador, carregadors i festius.
// Executa'l amb: npm run seed
require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const connectDB = require('../config/db');
const User = require('../models/User');
const Charger = require('../models/Charger');
const Holiday = require('../models/Holiday');

const ADMIN = {
  firstName: 'Admin',
  lastName: 'AulaCarrega',
  email: 'admin@aulacarrega.cat',
  course: 'Administració',
  estudis: 'Centre',
  nia: 'ADMIN001',
  car: '0000AAA',
  password: 'Admin1234',
  role: 'Admin'
};

const CHARGERS = [
  { name: 'Carregador 1', status: 'Available', isActive: true },
  { name: 'Carregador 2', status: 'Available', isActive: true },
  { name: 'Carregador 3', status: 'Maintenance', isActive: true },
  { name: 'Carregador 4', status: 'Broken', isActive: false }
];

const HOLIDAYS = [
  {
    name: 'Nadal',
    type: 'Vacation',
    start_date: new Date('2026-12-21'),
    end_date: new Date('2027-01-06'),
    description: 'Període de vacances de Nadal'
  },
  {
    name: 'Setmana Santa',
    type: 'Vacation',
    start_date: new Date('2027-03-29'),
    end_date: new Date('2027-04-02'),
    description: 'Període de vacances de Setmana Santa'
  },
  {
    name: 'Diada de Catalunya',
    type: 'Holiday',
    start_date: new Date('2026-09-11'),
    end_date: new Date('2026-09-11'),
    description: 'Festiu nacional'
  }
];

const run = async () => {
  try {
    await connectDB();

    const existingAdmin = await User.findOne({ email: ADMIN.email });

    if (existingAdmin) {
      console.log(`L'administrador ${ADMIN.email} ja existeix, no es torna a crear`);
    } else {
      await User.create({
        ...ADMIN,
        password: await bcrypt.hash(ADMIN.password, 10),
        isActive: true,
        penalties: 0
      });

      console.log(`Administrador creat: ${ADMIN.email} / ${ADMIN.password}`);
    }

    for (const charger of CHARGERS) {
      await Charger.updateOne(
        { name: charger.name },
        { $set: charger },
        { upsert: true, runValidators: true }
      );
    }

    console.log(`${CHARGERS.length} carregadors carregats`);

    for (const holiday of HOLIDAYS) {
      await Holiday.updateOne(
        { name: holiday.name, start_date: holiday.start_date },
        { $set: holiday },
        { upsert: true, runValidators: true }
      );
    }

    console.log(`${HOLIDAYS.length} festius carregats`);
    console.log('Seed acabat correctament');
  } catch (error) {
    console.error('Error al fer el seed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

run();
