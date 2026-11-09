const mongoose = require('mongoose');

// Comprova que tots els paràmetres de la ruta són ObjectId vàlids.
const validateObjectId = (req, res, next) => {
  const ids = Object.values(req.params);

  if (ids.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
    return res.status(400).json({ message: 'ID no vàlid' });
  }

  return next();
};

module.exports = validateObjectId;
