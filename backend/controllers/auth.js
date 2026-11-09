const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Crea un token JWT amb l'id i el rol de l'usuari
const signToken = (user) => {
  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
};

// Dades públiques de l'usuari (sense contrasenya)
const publicUser = (user) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  nia: user.nia,
  car: user.car,
  course: user.course,
  estudis: user.estudis,
  role: user.role,
  isActive: user.isActive,
  penalties: user.penalties
});

// Registre de usuari. El rol mai s'accepta des del formulari:
// tots els registres nous es creen com a User.
const register = async (req, res, next) => {
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
      confirmPassword
    } = req.body;

    if (!firstName || !lastName || !email || !course || !estudis || !nia || !car || !password || !confirmPassword) {
      return res.status(400).json({ message: 'Tots els camps són obligatoris' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Les contrasenyes no coincideixen' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedNia = nia.trim();
    const normalizedCar = car.trim().toUpperCase();

    const existingUser = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { nia: normalizedNia },
        { car: normalizedCar }
      ]
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Ja existeix un usuari amb aquest email, NIA o matrícula' });
    }

    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      course,
      estudis,
      nia: normalizedNia,
      car: normalizedCar,
      password: await bcrypt.hash(password, 10),
      role: 'User'
    });

    return res.status(201).json({
      message: 'Usuari registrat correctament',
      token: signToken(user),
      user: publicUser(user)
    });
  } catch (error) {
    return next(error);
  }
};

// Inici de sessió mitjançant NIA, matrícula i contrasenya
const login = async (req, res, next) => {
  try {
    const { identity, car, password } = req.body;

    if (!identity || !car || !password) {
      return res.status(400).json({ message: 'NIA, matrícula i contrasenya són obligatoris' });
    }

    const user = await User.findOne({
      nia: identity.trim(),
      car: car.trim().toUpperCase()
    });

    if (!user || user.isActive === false) {
      return res.status(400).json({ message: 'Credencials incorrectes' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Credencials incorrectes' });
    }

    return res.status(200).json({
      message: 'Inici de sessió correcte',
      token: signToken(user),
      user: publicUser(user)
    });
  } catch (error) {
    return next(error);
  }
};

// GET /api/auth/me
const me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'Usuari no trobat' });
    }

    return res.json({ data: publicUser(user) });
  } catch (error) {
    return next(error);
  }
};

// PATCH /api/auth/password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Cal indicar la contrasenya actual i la nova' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'La nova contrasenya ha de tenir com a mínim 6 caràcters' });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'Usuari no trobat' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'La contrasenya actual no és correcta' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({ message: 'Contrasenya actualitzada' });
  } catch (error) {
    return next(error);
  }
};

module.exports = { register, login, me, changePassword };
