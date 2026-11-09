const ChargingHistory = require('../models/ChargingHistory');
const User = require('../models/User');
const Charger = require('../models/Charger');
const ChargingSchedule = require('../models/ChargingSchedule');
const { getPagination } = require('../utils/pagination');
const { isValidDate, startOfDay } = require('../utils/dates');

const POPULATE = [
  { path: 'user', select: 'firstName lastName nia' },
  { path: 'charger', select: 'name status' },
  { path: 'charging_schedule', select: 'date start_time end_time status' }
];

const ACTIONS = ['Completed', 'NotUsed', 'Cancelled'];

const buildFilter = (query) => {
  const filter = {};

  if (query.user) filter.user = query.user;
  if (query.charger) filter.charger = query.charger;
  if (query.action) filter.action = query.action;

  if (query.from || query.to) {
    filter.date = {};
    if (query.from) filter.date.$gte = startOfDay(query.from);
    if (query.to) filter.date.$lte = startOfDay(query.to);
  }

  return filter;
};

// GET /api/charging-history (Admin)
const listHistory = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = buildFilter(req.query);

    const [data, total] = await Promise.all([
      ChargingHistory.find(filter)
        .populate(POPULATE)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      ChargingHistory.countDocuments(filter)
    ]);

    return res.json({ data, total, page, limit });
  } catch (error) {
    return next(error);
  }
};

// GET /api/charging-history/me
const listMyHistory = async (req, res, next) => {
  try {
    const data = await ChargingHistory.find({ user: req.user.id })
      .populate(POPULATE)
      .sort({ date: -1 });

    return res.json({ data, total: data.length });
  } catch (error) {
    return next(error);
  }
};

// GET /api/charging-history/:id
const getHistory = async (req, res, next) => {
  try {
    const history = await ChargingHistory.findById(req.params.id).populate(POPULATE);

    if (!history) {
      return res.status(404).json({ message: 'Registre no trobat' });
    }

    return res.json({ data: history });
  } catch (error) {
    return next(error);
  }
};

// POST /api/charging-history (Admin)
const createHistory = async (req, res, next) => {
  try {
    const {
      user,
      charging_schedule,
      charger,
      date,
      action,
      assigned_hours,
      actual_hours,
      connection_time,
      disconnection_time
    } = req.body;

    if (!user || !charging_schedule || !charger || !date || !action) {
      return res.status(400).json({ message: 'Falten camps obligatoris' });
    }

    if (!ACTIONS.includes(action)) {
      return res.status(400).json({ message: 'Acció no vàlida' });
    }

    if (!isValidDate(date)) {
      return res.status(400).json({ message: 'Data no vàlida' });
    }

    const [userExists, chargerExists, scheduleExists] = await Promise.all([
      User.findById(user),
      Charger.findById(charger),
      ChargingSchedule.findById(charging_schedule)
    ]);

    if (!userExists || !chargerExists || !scheduleExists) {
      return res.status(400).json({ message: 'Usuari, carregador o torn no vàlid' });
    }

    const history = await ChargingHistory.create({
      user,
      charging_schedule,
      charger,
      date: startOfDay(date),
      action,
      assigned_hours: Number(assigned_hours) || 0,
      actual_hours: Number(actual_hours) || 0,
      connection_time: connection_time || null,
      disconnection_time: disconnection_time || null
    });

    return res.status(201).json({ message: 'Registre creat', data: history });
  } catch (error) {
    return next(error);
  }
};

// PATCH /api/charging-history/:id (Admin)
const updateHistory = async (req, res, next) => {
  try {
    const changes = {};

    ['action', 'assigned_hours', 'actual_hours', 'connection_time', 'disconnection_time'].forEach((field) => {
      if (req.body[field] !== undefined) {
        changes[field] = req.body[field];
      }
    });

    if (changes.action && !ACTIONS.includes(changes.action)) {
      return res.status(400).json({ message: 'Acció no vàlida' });
    }

    const history = await ChargingHistory.findByIdAndUpdate(req.params.id, changes, {
      new: true,
      runValidators: true
    }).populate(POPULATE);

    if (!history) {
      return res.status(404).json({ message: 'Registre no trobat' });
    }

    return res.json({ message: 'Registre actualitzat', data: history });
  } catch (error) {
    return next(error);
  }
};

// DELETE /api/charging-history/:id (Admin)
const deleteHistory = async (req, res, next) => {
  try {
    const history = await ChargingHistory.findByIdAndDelete(req.params.id);

    if (!history) {
      return res.status(404).json({ message: 'Registre no trobat' });
    }

    return res.json({ message: 'Registre eliminat' });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listHistory,
  listMyHistory,
  getHistory,
  createHistory,
  updateHistory,
  deleteHistory
};
