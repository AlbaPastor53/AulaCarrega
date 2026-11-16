import { ApiService } from "../api.js";
import { escapeHtml } from "../utils.js";

// Dies lectius (una pàgina per dia)
const DAY_LABELS = ['Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres'];

// Franja visible del calendari (minuts)
const CAL_START = 8 * 60;
const CAL_END = 21 * 60;
const SLOT_MINUTES = 30;

// Estats disponibles
const STATUS = {
  Pending: { label: 'Pendent', className: 'shift--pending' },
  InProgress: { label: 'En curs', className: 'shift--inprogress' },
  Completed: { label: 'Completat', className: 'shift--completed' },
  Cancelled: { label: 'Cancel·lat', className: 'shift--cancelled' },
  NotUsed: { label: 'No utilitzat', className: 'shift--notused' }
};

const CHARGER_COLORS = ['#4ec9b0', '#569cd6', '#dcdcaa', '#c586c0', '#ce9178', '#9cdcfe', '#b5cea8', '#d7ba7d'];

const weekCalendar = document.getElementById('weekCalendar');
const weekLabel = document.getElementById('weekLabel');
const weekStart = document.getElementById('weekStart');
const chargerLegend = document.getElementById('chargerLegend');

let currentShifts = [];
let currentMonday = null;
let currentPage = 0;

const showMessage = (text, ok = true) => {
  const message = document.getElementById('message');
  message.textContent = text;
  message.classList.toggle('is-error', !ok);
};

const handleLoadError = (error) => {
  showMessage(error.message, false);
  weekCalendar.innerHTML = '<p class="empty-state">No s\'han pogut carregar els torns.</p>';
};

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatShortDate = (date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
};

const parseDate = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date();
  parsed.setHours(0, 0, 0, 0);
  return parsed;
};

const toMinutes = (time) => {
  const [hours, minutes] = String(time || '').split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return CAL_START;
  return hours * 60 + minutes;
};

const toTime = (minutes) => {
  const hours = String(Math.floor(minutes / 60)).padStart(2, '0');
  const rest = String(minutes % 60).padStart(2, '0');
  return `${hours}:${rest}`;
};

const getMonday = (value) => {
  const parsed = value ? new Date(`${value}T00:00:00`) : new Date();
  const date = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  const offset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - offset);
  date.setHours(0, 0, 0, 0);
  return date;
};

const getWeekRange = () => {
  const monday = getMonday(weekStart.value);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  return { monday, friday };
};

// Color estable per carregador
const getChargerKey = (charger) => String(charger?._id || charger?.id || charger?.name || 'none');
const getChargerColor = (charger) => {
  const key = getChargerKey(charger);
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  const index = Math.abs(hash) % CHARGER_COLORS.length;
  return CHARGER_COLORS[index];
};

// Reparteix els torns d'un dia en carrils
const layoutDay = (shifts) => {
  const events = shifts
    .map((shift) => {
      const rawStart = toMinutes(shift.start_time);
      const rawEnd = toMinutes(shift.end_time);
      const start = Math.max(CAL_START, Math.min(rawStart, CAL_END - SLOT_MINUTES));
      const end = Math.min(CAL_END, Math.max(rawEnd, start + SLOT_MINUTES));
      return { shift, rawStart, rawEnd, start, end, lane: 0, lanes: 1 };
    })
    .filter((event) => event.rawEnd > CAL_START && event.rawStart < CAL_END)
    .sort((a, b) => a.start - b.start || a.end - b.end);

  const clusters = [];
  let cluster = [];
  let clusterEnd = -1;

  events.forEach((event) => {
    if (cluster.length === 0) {
      cluster = [event];
      clusterEnd = event.end;
      return;
    }
    if (event.start < clusterEnd) {
      cluster.push(event);
      clusterEnd = Math.max(clusterEnd, event.end);
      return;
    }
    clusters.push(cluster);
    cluster = [event];
    clusterEnd = event.end;
  });
  if (cluster.length > 0) clusters.push(cluster);

  clusters.forEach((group) => {
    const laneEnds = [];
    group.forEach((event) => {
      let lane = laneEnds.findIndex((end) => end <= event.start);
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(event.end);
      } else {
        laneEnds[lane] = Math.max(laneEnds[lane], event.end);
      }
      event.lane = lane;
    });
    group.forEach((event) => { event.lanes = laneEnds.length; });
  });

  return events;
};

const renderStatusOptions = (current) => {
  return Object.entries(STATUS).map(([value, info]) => {
    const selected = value === current ? ' selected' : '';
    return `<option value="${value}"${selected}>${info.label}</option>`;
  }).join('');
};

const renderShift = (event) => {
  const { shift, start, end, lane, lanes } = event;
  const status = STATUS[shift.status] || { label: shift.status || '—', className: 'shift--notused' };
  const student = `${shift.user_id?.firstName ?? ''} ${shift.user_id?.lastName ?? ''}`.trim() || 'Alumne';
  const chargerName = shift.charger?.name ?? 'Sense carregador';
  const chargerColor = getChargerColor(shift.charger);
  const shiftId = shift._id || '';

  const top = ((start - CAL_START) / (CAL_END - CAL_START)) * 100;
  const height = ((end - start) / (CAL_END - CAL_START)) * 100;
  const width = 100 / lanes;
  const left = lane * width;

  const tooltip = `${student} · ${shift.start_time}–${shift.end_time} · ${chargerName} · ${status.label}`;

  return `
    <article class="shift ${status.className}"
      style="top: calc(${top}% + 2px); height: calc(${height}% - 4px);
        left: calc(${left}% + 3px); width: calc(${width}% - 6px);"
      title="${escapeHtml(tooltip)}">
      <div class="shift__top">
        <strong class="shift__name">${escapeHtml(student)}</strong>
        <span class="shift__time">${escapeHtml(shift.start_time)}–${escapeHtml(shift.end_time)}</span>
      </div>
      <div class="shift__bottom">
        <span class="shift__charger" style="--charger-color: ${chargerColor};">${escapeHtml(chargerName)}</span>
        <select class="shift__status-select" data-id="${escapeHtml(shiftId)}" aria-label="Canviar estat">
          ${renderStatusOptions(shift.status)}
        </select>
      </div>
    </article>
  `;
};

const renderChargerLegend = (shifts) => {
  const map = new Map();
  shifts.forEach((shift) => {
    if (!shift.charger) return;
    const key = getChargerKey(shift.charger);
    if (!map.has(key)) map.set(key, { name: shift.charger.name || 'Carregador', color: getChargerColor(shift.charger) });
  });

  if (map.size === 0) {
    chargerLegend.innerHTML = '';
    return;
  }

  chargerLegend.innerHTML = Array.from(map.values()).map((item) => `
    <span class="charger-legend__item">
      <span class="charger-legend__dot" style="background:${item.color};"></span>
      ${escapeHtml(item.name)}
    </span>
  `).join('');
};

const renderCalendar = () => {
  if (!currentMonday) return;
  const todayKey = formatDate(new Date());
  const dayIndex = currentPage >= 0 && currentPage < DAY_LABELS.length ? currentPage : 0;
  const date = new Date(currentMonday);
  date.setDate(currentMonday.getDate() + dayIndex);
  const days = [{ date, label: DAY_LABELS[dayIndex] }];

  weekCalendar.style.setProperty('--day-count', String(days.length));
  weekCalendar.classList.toggle('week-calendar--single', days.length === 1);

  const head = `
    <div class="week-calendar__head">
      <div class="week-calendar__corner">Hora</div>
      ${days.map((day) => `
        <div class="week-calendar__day${formatDate(day.date) === todayKey ? ' is-today' : ''}">
          <strong>${day.label}</strong>
          <span>${formatShortDate(day.date)}</span>
        </div>
      `).join('')}
    </div>
  `;

  const times = [];
  for (let minutes = CAL_START; minutes < CAL_END; minutes += 60) {
    times.push(`<div class="week-calendar__time"><span>${toTime(minutes)}</span></div>`);
  }

  const columns = days.map((day) => {
    const dayKey = formatDate(day.date);
    const dayShifts = currentShifts.filter((shift) => formatDate(parseDate(shift.date)) === dayKey);
    return `
      <div class="week-calendar__col">
        ${layoutDay(dayShifts).map(renderShift).join('')}
      </div>
    `;
  }).join('');

  const friday = new Date(currentMonday);
  friday.setDate(currentMonday.getDate() + 4);
  weekLabel.textContent = `${formatShortDate(currentMonday)} – ${formatShortDate(friday)}`;

  weekCalendar.innerHTML = `
    ${head}
    <div class="week-calendar__body">
      <div class="week-calendar__times">${times.join('')}</div>
      ${columns}
      ${currentShifts.length === 0 ? '<p class="week-calendar__empty">Cap torn assignat en esta setmana.</p>' : ''}
    </div>
  `;

  renderChargerLegend(currentShifts);
  document.getElementById('listSummary').textContent =
    `${currentShifts.length} ${currentShifts.length === 1 ? 'torn' : 'torns'}`;
};

const loadWeek = async () => {
  const { monday, friday } = getWeekRange();
  currentMonday = monday;
  currentShifts = await ApiService.all(
    `/charging-schedules?from=${formatDate(monday)}&to=${formatDate(friday)}`
  );
  renderCalendar();
  document.getElementById('lastUpdated').textContent =
    `Actualitzat a les ${new Date().toLocaleTimeString('ca-ES')}`;
};

const moveWeek = (weeks) => {
  const monday = getMonday(weekStart.value);
  monday.setDate(monday.getDate() + weeks * 7);
  weekStart.value = formatDate(monday);
  loadWeek().catch(handleLoadError);
};

const setPage = (page) => {
  const next = Number(page);
  currentPage = next >= 0 && next < DAY_LABELS.length ? next : 0;
  document.querySelectorAll('.page-tab').forEach((btn) => {
    const active = Number(btn.dataset.page) === currentPage;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  renderCalendar();
};

// Crea una data ISO combinant la data del torn i una hora HH:MM
const combineDateTime = (dateValue, timeValue) => {
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return new Date().toISOString();
  const [h, m] = String(timeValue || '00:00').split(':').map(Number);
  d.setHours(Number.isFinite(h) ? h : 0, Number.isFinite(m) ? m : 0, 0, 0);
  return d.toISOString();
};

const updateShiftStatus = async (shiftId, newStatus, selectEl) => {
  const shift = currentShifts.find((item) => String(item._id) === String(shiftId));
  if (!shift) return;

  const oldStatus = shift.status;
  const body = { status: newStatus };

  // Completed necessita hores de connexió/desconnexió segons el backend
  if (newStatus === 'Completed') {
    if (!shift.connection_time) body.connection_time = combineDateTime(shift.date, shift.start_time);
    if (!shift.disconnection_time) body.disconnection_time = combineDateTime(shift.date, shift.end_time);
  }

  selectEl.disabled = true;
  try {
    const result = await ApiService.api(`/charging-schedules/${shiftId}`, {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
    // Actualitza amb les dades del servidor
    const updated = result.data || { ...shift, ...body };
    const index = currentShifts.findIndex((item) => String(item._id) === String(shiftId));
    if (index !== -1) currentShifts[index] = { ...currentShifts[index], ...updated };
    showMessage('Estat actualitzat');
    renderCalendar();
  } catch (error) {
    showMessage(error.message, false);
    selectEl.value = oldStatus;
  } finally {
    selectEl.disabled = false;
  }
};

const init = () => {
  const form = document.getElementById('generateForm');
  weekStart.value = formatDate(new Date());

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const result = await ApiService.api('/charging-schedules/generate-week', {
        method: 'POST',
        body: JSON.stringify({
          week_start: weekStart.value,
          hours: Number(document.getElementById('hours').value)
        })
      });
      showMessage(result.message);
      await loadWeek();
    } catch (error) {
      showMessage(error.message, false);
    }
  });

  document.getElementById('refresh').addEventListener('click', async () => {
    try { await loadWeek(); } catch (error) { handleLoadError(error); }
  });

  document.getElementById('prevWeek').addEventListener('click', () => moveWeek(-1));
  document.getElementById('nextWeek').addEventListener('click', () => moveWeek(1));
  weekStart.addEventListener('change', () => { loadWeek().catch(handleLoadError); });

  document.querySelectorAll('.page-tab').forEach((btn) => {
    btn.addEventListener('click', () => setPage(btn.dataset.page));
  });

  // Canvi d'estat directament des del calendari
  weekCalendar.addEventListener('change', (event) => {
    const select = event.target.closest('.shift__status-select');
    if (!select) return;
    updateShiftStatus(select.dataset.id, select.value, select);
  });

  loadWeek().catch(handleLoadError);
};

if (window.adminReady) {
  init();
}
