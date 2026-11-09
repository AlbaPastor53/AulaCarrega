// Ruta no trobada
const notFound = (req, res) => {
  res.status(404).json({ message: `Ruta no trobada: ${req.method} ${req.originalUrl}` });
};

// Traducció centralitzada d'errors de Mongoose i errors generals
const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((item) => item.message);
    return res.status(400).json({ message: 'Dades no vàlides', errors });
  }

  if (err.code === 11000) {
    return res.status(400).json({
      message: 'Ja existeix un registre amb aquest valor únic',
      fields: err.keyValue
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'ID no vàlid' });
  }

  return res.status(err.status || 500).json({
    message: err.message || 'Error en el servidor'
  });
};

module.exports = { notFound, errorHandler };
