const jwt = require('jsonwebtoken');

// Comprova que la petició porta un token JWT vàlid.
// Si és correcte, deixa les dades de l'usuari a req.user.
const protect = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionat' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Token invàlid o caducat' });
  }
};

// Permet només els rols indicats. S'ha d'usar després de protect.
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'No tens permisos per fer aquesta acció' });
  }
  return next();
};

module.exports = { protect, requireRole };
