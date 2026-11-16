/*
  FITXER: utils/shifts.js
  RESPONSABILITAT:
    Repartir els torns de càrrega d'una setmana segons l'horari de classes
    de cada alumne i els festius/vacances del centre.

  A TENIR EN COMPTE:
    - Només es reparteixen torns de dilluns a divendres.
    - Cada alumne pot tenir com a màxim un torn per dia.
    - La durada del torn és de 2 o 3 hores (es rep com a paràmetre).
    - Les funcions són pures: no consulten la base de dades.
*/

const { startOfDay } = require('./dates');

const DAY_NAMES = [
  'Diumenge', 'Dilluns', 'Dimarts', 'Dimecres',
  'Dijous', 'Divendres', 'Dissabte'
];

// Cada quants minuts es prova una nova hora d'inici.
const STEP_MINUTES = 30;

// "08:30" -> 510 minuts
const toMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// 510 minuts -> "08:30"
const toTime = (minutes) => {
  const hours = String(Math.floor(minutes / 60)).padStart(2, '0');
  const rest = String(minutes % 60).padStart(2, '0');
  return `${hours}:${rest}`;
};

// Dilluns de la setmana que conté la data
const getMonday = (date) => {
  const monday = startOfDay(date);
  const offset = (monday.getDay() + 6) % 7; // Dilluns = 0
  monday.setDate(monday.getDate() - offset);
  return monday;
};

// Els 5 dies lectius (dilluns a divendres)
const getWeekDays = (weekStart) => {
  const monday = getMonday(weekStart);

  return [0, 1, 2, 3, 4].map((offset) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + offset);
    return date;
  });
};

// Blocs de classe d'un dia concret
const getClasses = (classSchedule, date) => {
  const dayName = DAY_NAMES[date.getDay()];
  const day = classSchedule.week.find((item) => item.day === dayName);

  if (!day || !day.enabled) return [];

  return day.blocks.filter((block) => block.type === 'Class');
};

// Primera i última hora en què l'alumne està a l'institut (en minuts)
const getPresenceWindow = (classSchedule, date) => {
  const classes = getClasses(classSchedule, date);
  if (classes.length === 0) return null;

  const starts = classes.map((block) => toMinutes(block.start));
  const ends = classes.map((block) => toMinutes(block.end));

  return {
    start: Math.min(...starts),
    end: Math.max(...ends)
  };
};

// La data cau dins d'un festiu o de vacances?
const isHoliday = (holidays, date) => {
  return holidays.some((holiday) => {
    const start = startOfDay(holiday.start_date);
    const end = startOfDay(holiday.end_date);
    return date >= start && date <= end;
  });
};

// Possibles hores d'inici, cada 30 minuts dins de l'horari de l'alumne
const getPossibleStarts = (classSchedule, date, duration) => {
  const window = getPresenceWindow(classSchedule, date);
  if (!window) return [];

  const starts = [];

  for (let start = window.start; start + duration <= window.end; start += STEP_MINUTES) {
    starts.push(start);
  }

  return starts;
};

// El carregador ja té un altre torn que se solapa?
const isChargerFree = (shifts, chargerId, date, startTime, endTime) => {
  const busy = shifts.some((shift) => {
    return String(shift.charger) === String(chargerId)
      && startOfDay(shift.date).getTime() === date.getTime()
      && shift.start_time < endTime
      && shift.end_time > startTime;
  });

  return !busy;
};

// Busca la primera franja lliure per a l'alumne
const findFreeSlot = ({ chargers, shifts, classSchedule, date, duration }) => {
  const starts = getPossibleStarts(classSchedule, date, duration);

  for (const start of starts) {
    const startTime = toTime(start);
    const endTime = toTime(start + duration);

    const charger = chargers.find((candidate) => {
      return isChargerFree(shifts, candidate._id, date, startTime, endTime);
    });

    if (charger) {
      return { charger, start_time: startTime, end_time: endTime };
    }
  }

  return null;
};

// L'alumne ja té un torn aquest dia?
const hasShiftThatDay = (shifts, userId, date) => {
  return shifts.some((shift) => {
    return String(shift.user_id) === String(userId)
      && startOfDay(shift.date).getTime() === date.getTime();
  });
};

// Construeix tots els torns nous de la setmana
const buildWeekShifts = ({
  days,
  students,
  schedulesByUser,
  holidays,
  chargers,
  existingShifts,
  hours
}) => {
  const shifts = [...existingShifts];
  const newShifts = [];
  const duration = hours * 60;

  // Comptem els torns que ja té cada alumne per repartir de forma justa.
  const assignedCount = new Map(students.map((student) => [String(student._id), 0]));

  existingShifts.forEach((shift) => {
    const key = String(shift.user_id);
    if (assignedCount.has(key)) {
      assignedCount.set(key, assignedCount.get(key) + 1);
    }
  });

  days.forEach((date) => {
    if (isHoliday(holidays, date)) return;

    const candidates = students
      .filter((student) => {
        const classSchedule = schedulesByUser.get(String(student._id));

        return classSchedule
          && !hasShiftThatDay(shifts, student._id, date)
          && Boolean(getPresenceWindow(classSchedule, date));
      })
      .sort((a, b) => {
        return assignedCount.get(String(a._id)) - assignedCount.get(String(b._id));
      });

    candidates.forEach((student) => {
      const classSchedule = schedulesByUser.get(String(student._id));

      const slot = findFreeSlot({
        chargers,
        shifts,
        classSchedule,
        date,
        duration
      });

      if (!slot) return;

      const shift = {
        user_id: student._id,
        charger: slot.charger._id,
        date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        assigned_hours: hours
      };

      newShifts.push(shift);
      shifts.push(shift);

      assignedCount.set(
        String(student._id),
        assignedCount.get(String(student._id)) + 1
      );
    });
  });

  return newShifts;
};

module.exports = { getWeekDays, buildWeekShifts };
