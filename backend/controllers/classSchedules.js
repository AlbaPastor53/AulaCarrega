const ClassSchedule = require('../models/ClassSchedule');
const User = require('../models/User');
const { isValidTime, timeToMinutes } = require('../utils/dates');

const DAYS = ['Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres'];

// Retorna un missatge d'error si el horari no és vàlid, o null si tot està bé.
const validateWeek = (week) => {
  if (!Array.isArray(week)) {
    return 'week ha de ser un array';
  }

  for (const day of week) {
    if (!DAYS.includes(day.day)) {
      return `Dia no vàlid: ${day.day}`;
    }

    if (!Array.isArray(day.blocks)) {
      return `Els blocs de ${day.day} han de ser un array`;
    }

    for (const block of day.blocks) {
      if (!isValidTime(block.start) || !isValidTime(block.end)) {
        return `Hora no vàlida a ${day.day} (format HH:MM)`;
      }

      if (timeToMinutes(block.start) >= timeToMinutes(block.end)) {
        return `L'hora d'inici ha de ser anterior a la de fi a ${day.day}`;
      }

      if (!['Class', 'Break'].includes(block.type)) {
        return `Tipus de bloc no vàlid a ${day.day}`;
      }
    }
  }

  return null;
};

// Crea o actualitza l'horari d'un usuari
const saveSchedule = async (userId, week) => {
  return ClassSchedule.findOneAndUpdate(
    { user_id: userId },
    { user_id: userId, week },
    { new: true, upsert: true, runValidators: true }
  );
};

// GET /api/class-schedules/me
const getMySchedule = async (req, res, next) => {
  try {
    const schedule = await ClassSchedule.findOne({ user_id: req.user.id });
    return res.json({ data: schedule });
  } catch (error) {
    return next(error);
  }
};

// PUT /api/class-schedules/me
const saveMySchedule = async (req, res, next) => {
  try {
    const errorMessage = validateWeek(req.body.week);

    if (errorMessage) {
      return res.status(400).json({ message: errorMessage });
    }

    const schedule = await saveSchedule(req.user.id, req.body.week);
    return res.json({ message: 'Horari guardat', data: schedule });
  } catch (error) {
    return next(error);
  }
};

// GET /api/class-schedules/:userId (Admin)
const getUserSchedule = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: 'Usuari no trobat' });
    }

    const schedule = await ClassSchedule.findOne({ user_id: req.params.userId });
    return res.json({ data: schedule });
  } catch (error) {
    return next(error);
  }
};

// PUT /api/class-schedules/:userId (Admin)
const saveUserSchedule = async (req, res, next) => {
  try {
    const errorMessage = validateWeek(req.body.week);

    if (errorMessage) {
      return res.status(400).json({ message: errorMessage });
    }

    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: 'Usuari no trobat' });
    }

    const schedule = await saveSchedule(req.params.userId, req.body.week);
    return res.json({ message: 'Horari guardat', data: schedule });
  } catch (error) {
    return next(error);
  }
};

// DELETE /api/class-schedules/:userId (Admin)
const deleteUserSchedule = async (req, res, next) => {
  try {
    const schedule = await ClassSchedule.findOneAndDelete({ user_id: req.params.userId });

    if (!schedule) {
      return res.status(404).json({ message: 'Horari no trobat' });
    }

    return res.json({ message: 'Horari eliminat' });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getMySchedule,
  saveMySchedule,
  getUserSchedule,
  saveUserSchedule,
  deleteUserSchedule
};
