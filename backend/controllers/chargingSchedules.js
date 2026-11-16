const ChargingSchedule = require('../models/ChargingSchedule');
const ClassSchedule = require('../models/ClassSchedule');
const Holiday = require('../models/Holiday');
const User = require('../models/User');
const Charger = require('../models/Charger');
const ChargingHistory = require('../models/ChargingHistory');
const { getPagination } = require('../utils/pagination');
const { isValidTime, timeToMinutes, isValidDate, startOfDay } = require('../utils/dates');
const { getWeekDays, buildWeekShifts } = require('../utils/shifts');

const POPULATE = [
  { path: 'user_id', select: 'firstName lastName nia email' },
  { path: 'charger', select: 'name status isActive' }
];

const STATUS = ['Pending', 'InProgress', 'Completed', 'Cancelled', 'NotUsed'];

// Construeix el filtre a partir dels paràmetres de la URL
const buildFilter = (query) => {
  const filter = {};

  if (query.user) filter.user_id = query.user;
  if (query.charger) filter.charger = query.charger;
  if (query.status) filter.status = query.status;

  if (query.date) {
    filter.date = startOfDay(query.date);
  } else if (query.from || query.to) {
    filter.date = {};
    if (query.from) filter.date.$gte = startOfDay(query.from);
    if (query.to) filter.date.$lte = startOfDay(query.to);
  }

  return filter;
};

// GET /api/charging-schedules (Admin)
const listSchedules = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);

    const [data, total] = await Promise.all([
      ChargingSchedule.find(buildFilter(req.query))
        .populate(POPULATE)
        .sort({ date: 1, start_time: 1 })
        .skip(skip)
        .limit(limit),
      ChargingSchedule.countDocuments(buildFilter(req.query))
    ]);

    return res.json({ data, total, page, limit });
  } catch (error) {
    return next(error);
  }
};

// GET /api/charging-schedules/me
const listMySchedules = async (req, res, next) => {
  try {
    const data = await ChargingSchedule.find({ user_id: req.user.id })
      .populate(POPULATE)
      .sort({ date: 1, start_time: 1 });

    return res.json({ data, total: data.length });
  } catch (error) {
    return next(error);
  }
};

// GET /api/charging-schedules/:id
const getSchedule = async (req, res, next) => {
  try {
    const schedule = await ChargingSchedule.findById(req.params.id).populate(POPULATE);

    if (!schedule) {
      return res.status(404).json({ message: 'Torn no trobat' });
    }

    return res.json({ data: schedule });
  } catch (error) {
    return next(error);
  }
};

// POST /api/charging-schedules (Admin)
const createSchedule = async (req, res, next) => {
  try {
    const { user_id, charger, date, start_time, end_time, assigned_hours } = req.body;

    if (!user_id || !charger || !date || !start_time || !end_time) {
      return res.status(400).json({ message: 'Falten camps obligatoris' });
    }

    if (!isValidTime(start_time) || !isValidTime(end_time)) {
      return res.status(400).json({ message: 'Les hores han de tenir format HH:MM' });
    }

    if (timeToMinutes(start_time) >= timeToMinutes(end_time)) {
      return res.status(400).json({ message: "L'hora d'inici ha de ser anterior a la de fi" });
    }

    if (!isValidDate(date)) {
      return res.status(400).json({ message: 'Data no vàlida' });
    }

    const hours = Number(assigned_hours);
    if (!hours || hours <= 0) {
      return res.status(400).json({ message: 'assigned_hours ha de ser més gran que 0' });
    }

    const userExists = await User.findById(user_id);
    if (!userExists) {
      return res.status(400).json({ message: 'Usuari no trobat' });
    }

    const chargerExists = await Charger.findById(charger);
    if (!chargerExists) {
      return res.status(400).json({ message: 'Carregador no trobat' });
    }

    // No poden haver-hi dos torns al mateix carregador a la mateixa hora
    const chargerOverlap = await ChargingSchedule.findOne({
      charger,
      date: startOfDay(date),
      status: { $ne: 'Cancelled' },
      start_time: { $lt: end_time },
      end_time: { $gt: start_time }
    });

    if (chargerOverlap) {
      return res.status(400).json({ message: 'El carregador ja té un altre torn en aquest horari' });
    }

    // Ni dos torns del mateix usuari a la mateixa hora
    const userOverlap = await ChargingSchedule.findOne({
      user_id,
      date: startOfDay(date),
      status: { $ne: 'Cancelled' },
      start_time: { $lt: end_time },
      end_time: { $gt: start_time }
    });

    if (userOverlap) {
      return res.status(400).json({ message: "L'usuari ja té un altre torn en aquest horari" });
    }

    const schedule = await ChargingSchedule.create({
      user_id,
      charger,
      date: startOfDay(date),
      start_time,
      end_time,
      assigned_hours: hours
    });

    return res.status(201).json({ message: 'Torn creat', data: schedule });
  } catch (error) {
    return next(error);
  }
};

// Calcula les hores reals d'un torn completat
const getActualHours = (schedule) => {
  if (schedule.connection_time && schedule.disconnection_time) {
    const ms = new Date(schedule.disconnection_time) - new Date(schedule.connection_time);
    const hours = Math.round((ms / 3600000) * 100) / 100;
    if (hours >= 0) return hours;
  }
  return Number(schedule.assigned_hours) || 0;
};

// Guarda l'historial i actualitza el total d'hores de l'usuari
const syncCompletion = async (schedule) => {
  if (schedule.status !== 'Completed') return;

  const actualHours = getActualHours(schedule);

  if (schedule.actual_hours !== actualHours) {
    schedule.actual_hours = actualHours;
    await schedule.save();
  }

  await ChargingHistory.findOneAndUpdate(
    { charging_schedule: schedule._id },
    {
      user: schedule.user_id,
      charging_schedule: schedule._id,
      charger: schedule.charger,
      date: schedule.date,
      action: 'Completed',
      assigned_hours: schedule.assigned_hours || 0,
      actual_hours: actualHours,
      connection_time: schedule.connection_time || null,
      disconnection_time: schedule.disconnection_time || null
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const result = await ChargingHistory.aggregate([
    { $match: { user: schedule.user_id } },
    { $group: { _id: '$user', total: { $sum: '$actual_hours' } } }
  ]);

  const total = result[0]?.total || 0;
  await User.findByIdAndUpdate(schedule.user_id, { total_hours: Math.round(total * 100) / 100 });
};

// PATCH /api/charging-schedules/:id (Admin)
const updateSchedule = async (req, res, next) => {
  try {
    const changes = {};

    ['status', 'connection_time', 'disconnection_time', 'actual_hours'].forEach((field) => {
      if (req.body[field] !== undefined) {
        changes[field] = req.body[field];
      }
    });

    if (changes.status && !STATUS.includes(changes.status)) {
      return res.status(400).json({ message: 'Estat no vàlid' });
    }

    // Un torn acabat ha de tenir hora de connexió i de desconnexió
    if (changes.status === 'Completed') {
      const current = await ChargingSchedule.findById(req.params.id);

      if (!current) {
        return res.status(404).json({ message: 'Torn no trobat' });
      }

      const connection = changes.connection_time || current.connection_time;
      const disconnection = changes.disconnection_time || current.disconnection_time;

      if (!connection || !disconnection) {
        return res.status(400).json({
          message: 'Per completar el torn cal connection_time i disconnection_time'
        });
      }
    }

    const schedule = await ChargingSchedule.findByIdAndUpdate(req.params.id, changes, {
      new: true,
      runValidators: true
    });

    if (!schedule) {
      return res.status(404).json({ message: 'Torn no trobat' });
    }

    if (schedule.status === 'Completed') {
      await syncCompletion(schedule);
    }

    await schedule.populate(POPULATE);
    return res.json({ message: 'Torn actualitzat', data: schedule });
  } catch (error) {
    return next(error);
  }
};

// POST /api/charging-schedules/:id/connect
const connectSchedule = async (req, res, next) => {
  try {
    const schedule = await ChargingSchedule.findByIdAndUpdate(
      req.params.id,
      { status: 'InProgress', connection_time: new Date() },
      { new: true }
    ).populate(POPULATE);

    if (!schedule) {
      return res.status(404).json({ message: 'Torn no trobat' });
    }

    return res.json({ message: 'Torn connectat', data: schedule });
  } catch (error) {
    return next(error);
  }
};

// POST /api/charging-schedules/:id/disconnect
const disconnectSchedule = async (req, res, next) => {
  try {
    const schedule = await ChargingSchedule.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({ message: 'Torn no trobat' });
    }

    if (!schedule.connection_time) {
      return res.status(400).json({ message: 'El torn encara no s\'ha connectat' });
    }

    const disconnection = new Date();
    const milliseconds = disconnection - schedule.connection_time;
    const actualHours = Math.round((milliseconds / 3600000) * 100) / 100;

    schedule.status = 'Completed';
    schedule.disconnection_time = disconnection;
    schedule.actual_hours = actualHours;
    await schedule.save();
    await syncCompletion(schedule);
    await schedule.populate(POPULATE);

    return res.json({ message: 'Torn desconnectat', data: schedule });
  } catch (error) {
    return next(error);
  }
};

// POST /api/charging-schedules/:id/cancel (Admin)
const cancelSchedule = async (req, res, next) => {
  try {
    const schedule = await ChargingSchedule.findByIdAndUpdate(
      req.params.id,
      { status: 'Cancelled' },
      { new: true }
    ).populate(POPULATE);

    if (!schedule) {
      return res.status(404).json({ message: 'Torn no trobat' });
    }

    return res.json({ message: 'Torn cancel·lat', data: schedule });
  } catch (error) {
    return next(error);
  }
};

// DELETE /api/charging-schedules/:id (Admin)
const deleteSchedule = async (req, res, next) => {
  try {
    const schedule = await ChargingSchedule.findByIdAndDelete(req.params.id);

    if (!schedule) {
      return res.status(404).json({ message: 'Torn no trobat' });
    }

    return res.json({ message: 'Torn eliminat' });
  } catch (error) {
    return next(error);
  }
};

// POST /api/charging-schedules/generate-week (Admin)
const generateWeek = async (req, res, next) => {
  try {
    const { week_start, hours = 2 } = req.body;

    if (!isValidDate(week_start)) {
      return res.status(400).json({ message: 'Cal indicar week_start (YYYY-MM-DD)' });
    }

    if (![2, 3].includes(Number(hours))) {
      return res.status(400).json({ message: 'La durada ha de ser de 2 o 3 hores' });
    }

    const days = getWeekDays(week_start);
    const from = days[0];
    const to = days[4];

    const students = await User.find({ role: 'User', isActive: true })
      .select('firstName lastName');

    if (students.length === 0) {
      return res.status(400).json({ message: 'No hi ha alumnes actius' });
    }

    const userIds = students.map((student) => student._id);

    const [schedules, holidays, chargers, existingShifts] = await Promise.all([
      ClassSchedule.find({ user_id: { $in: userIds } }),
      Holiday.find(),
      Charger.find({ isActive: true, status: 'Available' }),
      ChargingSchedule.find({
        date: { $gte: from, $lte: to },
        status: { $ne: 'Cancelled' }
      }).select('user_id charger date start_time end_time')
    ]);

    if (chargers.length === 0) {
      return res.status(400).json({ message: 'No hi ha carregadors disponibles' });
    }

    const schedulesByUser = new Map(
      schedules.map((schedule) => [String(schedule.user_id), schedule])
    );

    const newShifts = buildWeekShifts({
      days,
      students,
      schedulesByUser,
      holidays,
      chargers,
      existingShifts,
      hours: Number(hours)
    });

    if (newShifts.length === 0) {
      return res.json({ message: 'No hi ha torns per assignar aquesta setmana', data: [] });
    }

    const created = await ChargingSchedule.insertMany(newShifts);

    return res.status(201).json({
      message: `${created.length} torns assignats`,
      data: created
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listSchedules,
  listMySchedules,
  getSchedule,
  createSchedule,
  updateSchedule,
  connectSchedule,
  disconnectSchedule,
  cancelSchedule,
  deleteSchedule,
  generateWeek
};
