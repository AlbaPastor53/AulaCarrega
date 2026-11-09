const Holiday = require('../models/Holiday');
const { getPagination } = require('../utils/pagination');
const { isValidDate, startOfDay } = require('../utils/dates');

const TYPES = ['Holiday', 'Vacation', 'NonSchoolDay'];

// GET /api/holidays
const listHolidays = async (req, res, next) => {
  try {
    const { type, from, to } = req.query;
    const { page, limit, skip } = getPagination(req.query);

    const filter = {};

    if (type) {
      filter.type = type;
    }

    // Retorna els períodes que es creuen amb el rang demanat
    if (from) {
      filter.end_date = { $gte: startOfDay(from) };
    }

    if (to) {
      filter.start_date = { $lte: startOfDay(to) };
    }

    const [data, total] = await Promise.all([
      Holiday.find(filter).sort({ start_date: 1 }).skip(skip).limit(limit),
      Holiday.countDocuments(filter)
    ]);

    return res.json({ data, total, page, limit });
  } catch (error) {
    return next(error);
  }
};

// GET /api/holidays/:id
const getHoliday = async (req, res, next) => {
  try {
    const holiday = await Holiday.findById(req.params.id);

    if (!holiday) {
      return res.status(404).json({ message: 'Període no trobat' });
    }

    return res.json({ data: holiday });
  } catch (error) {
    return next(error);
  }
};

// Comprova les dades comunes de creació i edició
const validateHoliday = (body) => {
  const { name, type, start_date, end_date, description } = body;

  if (!name || !type || !start_date || !end_date || !description) {
    return 'Falten camps obligatoris';
  }

  if (!TYPES.includes(type)) {
    return 'Tipus no vàlid';
  }

  if (!isValidDate(start_date) || !isValidDate(end_date)) {
    return 'Dates no vàlides';
  }

  if (startOfDay(start_date) > startOfDay(end_date)) {
    return 'La data d\'inici ha de ser anterior o igual a la de fi';
  }

  return null;
};

// POST /api/holidays (Admin)
const createHoliday = async (req, res, next) => {
  try {
    const errorMessage = validateHoliday(req.body);

    if (errorMessage) {
      return res.status(400).json({ message: errorMessage });
    }

    const holiday = await Holiday.create({
      name: req.body.name,
      type: req.body.type,
      start_date: startOfDay(req.body.start_date),
      end_date: startOfDay(req.body.end_date),
      description: req.body.description
    });

    return res.status(201).json({ message: 'Període creat', data: holiday });
  } catch (error) {
    return next(error);
  }
};

// PATCH /api/holidays/:id (Admin)
const updateHoliday = async (req, res, next) => {
  try {
    const current = await Holiday.findById(req.params.id);

    if (!current) {
      return res.status(404).json({ message: 'Període no trobat' });
    }

    const merged = {
      name: req.body.name ?? current.name,
      type: req.body.type ?? current.type,
      start_date: req.body.start_date ?? current.start_date,
      end_date: req.body.end_date ?? current.end_date,
      description: req.body.description ?? current.description
    };

    const errorMessage = validateHoliday(merged);

    if (errorMessage) {
      return res.status(400).json({ message: errorMessage });
    }

    const holiday = await Holiday.findByIdAndUpdate(
      req.params.id,
      {
        ...merged,
        start_date: startOfDay(merged.start_date),
        end_date: startOfDay(merged.end_date)
      },
      { new: true, runValidators: true }
    );

    return res.json({ message: 'Període actualitzat', data: holiday });
  } catch (error) {
    return next(error);
  }
};

// DELETE /api/holidays/:id (Admin)
const deleteHoliday = async (req, res, next) => {
  try {
    const holiday = await Holiday.findByIdAndDelete(req.params.id);

    if (!holiday) {
      return res.status(404).json({ message: 'Període no trobat' });
    }

    return res.json({ message: 'Període eliminat' });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listHolidays,
  getHoliday,
  createHoliday,
  updateHoliday,
  deleteHoliday
};
