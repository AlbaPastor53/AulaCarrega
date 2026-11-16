/*
  FITXER: js/dash_user.js
  RESPONSABILITAT:
    Carregar i pintar les dades del tauler principal de l'usuari.

  ENDPOINTS:
    GET /api/auth/me
    GET /api/charging-schedules/me
    GET /api/holidays
*/
import { ApiService } from "./api.js";

// Estats possibles d'un torn de càrrega.
const STATUS = {
  Pending: { label: 'Pendent', badge: 'badge--accent' },
  InProgress: { label: 'En curs', badge: 'badge--info' },
  Completed: { label: 'Completat', badge: 'badge--success' },
  Cancelled: { label: 'Cancel·lat', badge: 'badge--danger' },
  NotUsed: { label: 'No utilitzat', badge: 'badge--warning' }
};

// Etiquetes dels tipus de festiu.
const HOLIDAY_TYPE = {
  Holiday: 'Festiu',
  Vacation: 'Vacances',
  NonSchoolDay: 'Dia no lectiu'
};

// Converteix caràcters especials per poder mostrar-los sense problemes.
const escapeHtml = (value) => {
  const symbols = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };

  return String(value ?? '').replace(/[&<>"']/g, (char) => symbols[char]);
};

const toDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatLongDate = (value) => {
  const date = toDate(value);
  return date
    ? date.toLocaleDateString('ca-ES', { weekday: 'long', day: 'numeric', month: 'long' })
    : '—';
};

const formatShortDate = (value) => {
  const date = toDate(value);
  return date
    ? date.toLocaleDateString('ca-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '—';
};

const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const showMessage = (text, ok = true) => {
  const message = document.getElementById('message');
  if (!message) return;

  message.textContent = text;
  message.classList.toggle('is-error', !ok);
};

const renderProfile = (user) => {
  const welcome = document.getElementById('welcomeName');
  if (welcome) {
    welcome.textContent = user.firstName || 'benvingut/da';
  }

  document.getElementById('statPenalties').textContent = Number(user.penalties) || 0;
  document.getElementById('statAccount').textContent =
    user.isActive === false ? 'Inactiu' : 'Actiu';
};

const renderSchedules = (schedules) => {
  const pending = schedules.filter(
    (item) => item.status === 'Pending' || item.status === 'InProgress'
  );

  const totalHours = schedules
    .filter((item) => item.status !== 'Cancelled')
    .reduce((sum, item) => sum + (Number(item.assigned_hours) || 0), 0);

  document.getElementById('statPending').textContent = pending.length;
  document.getElementById('statHours').textContent = Math.round(totalHours * 100) / 100;

  const container = document.getElementById('nextSchedule');
  const today = startOfToday();

  const next = pending
    .filter((item) => {
      const date = toDate(item.date);
      return date && date >= today;
    })
    .sort((a, b) => toDate(a.date) - toDate(b.date))[0];

  if (!next) {
    container.innerHTML =
      '<p class="empty-state">No tens cap torn assignat de moment.</p>';
    return;
  }

  const statusInfo = STATUS[next.status] || STATUS.Pending;
  const chargerName = next.charger && next.charger.name ? next.charger.name : 'Carregador';

  container.innerHTML = `
    <div class="next-schedule">
      <div class="point">
        <span class="point__icon point__icon--info" aria-hidden="true">ϟ</span>
        <div>
          <strong>${escapeHtml(chargerName)}</strong>
          <small>${escapeHtml(formatLongDate(next.date))} · ${escapeHtml(next.start_time)}–${escapeHtml(next.end_time)}</small>
        </div>
      </div>
      <div class="actions">
        <span class="badge ${statusInfo.badge}">${statusInfo.label}</span>
        <span class="metric">${Number(next.assigned_hours) || 0} h</span>
      </div>
    </div>
  `;
};

const renderHolidays = (holidays) => {
  const container = document.getElementById('holidaysList');
  const today = startOfToday();

  const upcoming = holidays
    .filter((holiday) => {
      const end = toDate(holiday.end_date);
      return end && end >= today;
    })
    .sort((a, b) => toDate(a.start_date) - toDate(b.start_date))
    .slice(0, 5);

  if (upcoming.length === 0) {
    container.innerHTML = '<li class="empty-state">No hi ha festius pròxims.</li>';
    return;
  }

  container.innerHTML = upcoming
    .map((holiday) => {
      const start = formatShortDate(holiday.start_date);
      const end = formatShortDate(holiday.end_date);
      const range = start === end ? start : `${start} – ${end}`;
      const label = HOLIDAY_TYPE[holiday.type] || holiday.type;

      return `
        <li class="list__item">
          <div>
            <strong>${escapeHtml(holiday.name)}</strong>
            <small>${escapeHtml(range)}</small>
          </div>
          <span class="badge badge--warning">${escapeHtml(label)}</span>
        </li>
      `;
    })
    .join('');
};

const load = async () => {
  try {
    document.getElementById('lastUpdated').textContent = 'Carregant…';

    const [meResponse, schedulesResponse, holidaysResponse] = await Promise.all([
      ApiService.api('/auth/me'),
      ApiService.api('/charging-schedules/me'),
      ApiService.api('/holidays?limit=100')
    ]);

    const user = meResponse.data;
    const schedules = schedulesResponse.data || [];
    const holidays = holidaysResponse.data || [];

    // Actualitzem la sessió local amb les dades més recents del backend.
    if (user) {
      localStorage.setItem('aulacarregaUser', JSON.stringify(user));
      renderProfile(user);
    }

    renderSchedules(schedules);
    renderHolidays(holidays);

    document.getElementById('lastUpdated').textContent =
      `Actualitzat a les ${new Date().toLocaleTimeString('ca-ES')}`;
  } catch (error) {
    showMessage(error.message, false);
    document.getElementById('lastUpdated').textContent = 'Error de connexió';
  }
};

// Només arranquem si dash_shell.js ha confirmat que hi ha sessió.
if (window.userReady) {
  load();
}
