const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { getPagination } = require('../utils/pagination');

const PUBLIC_FIELDS = '-password -__v';

// GET /api/users
const listUsers = async (req, res, next) => {
  try {
    const { role, isActive, search } = req.query;
    const { page, limit, skip } = getPagination(req.query);

    const filter = {};

    if (role) {
      filter.role = role;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { nia: { $regex: search, $options: 'i' } },
        { car: { $regex: search, $options: 'i' } }
      ];
    }

    const [data, total] = await Promise.all([
      User.find(filter).select(PUBLIC_FIELDS).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter)
    ]);

    return res.json({ data, total, page, limit });
  } catch (error) {
    return next(error);
  }
};

// GET /api/users/:id
const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select(PUBLIC_FIELDS);

    if (!user) {
      return res.status(404).json({ message: 'Usuari no trobat' });
    }

    return res.json({ data: user });
  } catch (error) {
    return next(error);
  }
};

// POST /api/users
const createUser = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      email,
      course,
      estudis,
      nia,
      car,
      password,
      role,
      isActive
    } = req.body;

    if (!firstName || !lastName || !email || !course || !estudis || !nia || !car || !password) {
      return res.status(400).json({ message: 'Falten camps obligatoris' });
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      course,
      estudis,
      nia,
      car,
      password: await bcrypt.hash(password, 10),
      role: role === 'Admin' ? 'Admin' : 'User',
      isActive: isActive !== false
    });

    return res.status(201).json({
      message: 'Usuari creat correctament',
      data: await User.findById(user._id).select(PUBLIC_FIELDS)
    });
  } catch (error) {
    return next(error);
  }
};

// PATCH /api/users/:id
const updateUser = async (req, res, next) => {
  try {
    const allowed = [
      'firstName',
      'lastName',
      'email',
      'course',
      'estudis',
      'nia',
      'car',
      'role',
      'isActive',
      'penalties'
    ];

    const changes = {};

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        changes[field] = req.body[field];
      }
    });

    // Si arriba una contrasenya nova, es torna a xifrar
    if (req.body.password) {
      changes.password = await bcrypt.hash(req.body.password, 10);
    }

    const user = await User.findByIdAndUpdate(req.params.id, changes, {
      new: true,
      runValidators: true
    }).select(PUBLIC_FIELDS);

    if (!user) {
      return res.status(404).json({ message: 'Usuari no trobat' });
    }

    return res.json({ message: 'Usuari actualitzat', data: user });
  } catch (error) {
    return next(error);
  }
};

// PATCH /api/users/:id/status
const updateUserStatus = async (req, res, next) => {
  try {
    if (req.body.isActive === undefined) {
      return res.status(400).json({ message: 'Cal indicar isActive' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: req.body.isActive },
      { new: true }
    ).select(PUBLIC_FIELDS);

    if (!user) {
      return res.status(404).json({ message: 'Usuari no trobat' });
    }

    return res.json({ message: 'Estat actualitzat', data: user });
  } catch (error) {
    return next(error);
  }
};

// PATCH /api/users/:id/penalties
const updateUserPenalties = async (req, res, next) => {
  try {
    const penalties = Number(req.body.penalties);

    if (!Number.isInteger(penalties) || penalties < 0) {
      return res.status(400).json({ message: 'penalties ha de ser un enter igual o superior a 0' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { penalties },
      { new: true }
    ).select(PUBLIC_FIELDS);

    if (!user) {
      return res.status(404).json({ message: 'Usuari no trobat' });
    }

    return res.json({ message: 'Penalitzacions actualitzades', data: user });
  } catch (error) {
    return next(error);
  }
};

// DELETE /api/users/:id
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Usuari no trobat' });
    }

    return res.json({ message: 'Usuari eliminat' });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listUsers,
  getUser,
  createUser,
  updateUser,
  updateUserStatus,
  updateUserPenalties,
  deleteUser
};
