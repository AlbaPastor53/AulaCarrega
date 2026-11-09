const Charger = require('../models/Charger');
const { getPagination } = require('../utils/pagination');

// GET /api/chargers
const listChargers = async (req, res, next) => {
  try {
    const { status, isActive } = req.query;
    const { page, limit, skip } = getPagination(req.query);

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const [data, total] = await Promise.all([
      Charger.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
      Charger.countDocuments(filter)
    ]);

    return res.json({ data, total, page, limit });
  } catch (error) {
    return next(error);
  }
};

// GET /api/chargers/:id
const getCharger = async (req, res, next) => {
  try {
    const charger = await Charger.findById(req.params.id);

    if (!charger) {
      return res.status(404).json({ message: 'Carregador no trobat' });
    }

    return res.json({ data: charger });
  } catch (error) {
    return next(error);
  }
};

// POST /api/chargers (Admin)
const createCharger = async (req, res, next) => {
  try {
    const { name, status, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'El nom és obligatori' });
    }

    const charger = await Charger.create({
      name,
      status: status || 'Available',
      isActive: isActive !== false
    });

    return res.status(201).json({ message: 'Carregador creat', data: charger });
  } catch (error) {
    return next(error);
  }
};

// PATCH /api/chargers/:id (Admin)
const updateCharger = async (req, res, next) => {
  try {
    const changes = {};

    ['name', 'status', 'isActive'].forEach((field) => {
      if (req.body[field] !== undefined) {
        changes[field] = req.body[field];
      }
    });

    const charger = await Charger.findByIdAndUpdate(req.params.id, changes, {
      new: true,
      runValidators: true
    });

    if (!charger) {
      return res.status(404).json({ message: 'Carregador no trobat' });
    }

    return res.json({ message: 'Carregador actualitzat', data: charger });
  } catch (error) {
    return next(error);
  }
};

// DELETE /api/chargers/:id (Admin)
const deleteCharger = async (req, res, next) => {
  try {
    const charger = await Charger.findByIdAndDelete(req.params.id);

    if (!charger) {
      return res.status(404).json({ message: 'Carregador no trobat' });
    }

    return res.json({ message: 'Carregador eliminat' });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listChargers,
  getCharger,
  createCharger,
  updateCharger,
  deleteCharger
};
