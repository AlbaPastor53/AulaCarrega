// Hores en format "HH:MM" (24 hores)
const isValidTime = (value) => {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
};

// Converteix "08:30" a 510 minuts
const timeToMinutes = (value) => {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
};

// Comprova que una data es pot convertir correctament
const isValidDate = (value) => value != null && !Number.isNaN(new Date(value).getTime());

// Retorna només el dia (00:00) per guardar dates sense hora
const startOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

module.exports = { isValidTime, timeToMinutes, isValidDate, startOfDay };
