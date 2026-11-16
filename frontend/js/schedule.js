/*
  FITXER: js/schedule.js
  RESPONSABILITAT:
    Carregar, editar i guardar l'horari setmanal de classes.

  ENDPOINTS:
    GET /api/class-schedules/me
    PUT /api/class-schedules/me

  A TENIR EN COMPTE:
    - Dies permesos: Dilluns, Dimarts, Dimecres, Dijous i Divendres.
    - Cada dia: { day, enabled, blocks: [{ start, end, type }] }.
    - type només pot ser 'Class' o 'Break'.
    - La graella (Mati/Vesprada) es tradueix a blocs amb hora d'inici i fi.
    - En desar s'envia sempre { week: [...] }.
*/

import { ApiService } from "./api.js";

// Dies lectius en l'ordre que espera el backend.
const DAYS = [
  { key: 'dilluns', label: 'Dilluns' },
  { key: 'dimarts', label: 'Dimarts' },
  { key: 'dimecres', label: 'Dimecres' },
  { key: 'dijous', label: 'Dijous' },
  { key: 'divendres', label: 'Divendres' }
];

// Franges fixes de la graella. L'índex del bloc 1..6 es tradueix a hores.
const SLOTS = {
  mati: {
    times: [
      { start: '08:00', end: '08:55' },
      { start: '08:55', end: '09:50' },
      { start: '09:50', end: '10:45' },
      { start: '11:15', end: '12:10' },
      { start: '12:10', end: '13:05' },
      { start: '13:05', end: '14:00' }
    ],
    pause: { start: '10:45', end: '11:15', after: 3 }
  },
  vesprada: {
    times: [
      { start: '15:10', end: '16:05' },
      { start: '16:05', end: '17:00' },
      { start: '17:00', end: '17:55' },
      { start: '18:15', end: '19:10' },
      { start: '19:10', end: '20:05' },
      { start: '20:05', end: '21:00' }
    ],
    pause: { start: '17:55', end: '18:15', after: 3 }
  }
};

const select = document.getElementById('horari');
const tables = document.querySelectorAll('.schedule');
const message = document.getElementById('message');
const saveButton = document.getElementById('saveScheduleButton');
const lastUpdated = document.getElementById('lastUpdated');

// Cel·les marcades per l'usuari: "mati-dilluns-1", "vesprada-divendres-4"...
const selected = new Set();
let saving = false;

// L'usuari ve de la sessió que ha carregat dash_shell.js.
const user = JSON.parse(localStorage.getItem('aulacarregaUser') || 'null');
const curs = document.getElementById('curs');
if (curs) {
  curs.textContent = user?.estudis ?? '';
}

const showMessage = (text, ok = true) => {
  message.textContent = text;
  message.classList.toggle('is-error', !ok);
};

const showTable = (slot) => {
  tables.forEach((table) => table.classList.toggle('is-active', table.id === slot));
};

const cellId = (slot, day, index) => `${slot}-${day}-${index}`;

const paintCell = (id, isSelected) => {
  const button = document.querySelector(`.schedule__slot[data-cell="${id}"]`);
  if (!button) return;

  button.classList.toggle('is-selected', isSelected);
  button.setAttribute('aria-pressed', String(isSelected));
};

const setSelected = (id, isSelected) => {
  if (isSelected) {
    selected.add(id);
  } else {
    selected.delete(id);
  }

  paintCell(id, isSelected);
};

// Crea un botó dins de cada cel·la editable (les files de PATI no tenen id).
const setupCells = () => {
  document.querySelectorAll('.schedule td[id]').forEach((cell) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'schedule__slot';
    button.dataset.cell = cell.id;
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-label', `Marcar ${cell.id}`);

    button.addEventListener('click', () => {
      setSelected(cell.id, !selected.has(cell.id));
    });

    cell.appendChild(button);
  });
};

// Pinta a la graella l'horari que arriba del backend.
const applySchedule = (schedule) => {
  selected.clear();
  document.querySelectorAll('.schedule__slot').forEach((button) => {
    paintCell(button.dataset.cell, false);
  });

  const week = Array.isArray(schedule?.week) ? schedule.week : [];

  week.forEach((day) => {
    const dayKey = String(day.day || '').toLowerCase();

    (day.blocks || [])
      .filter((block) => block.type === 'Class')
      .forEach((block) => {
        Object.entries(SLOTS).forEach(([slotKey, slot]) => {
          const index = slot.times.findIndex(
            (time) => time.start === block.start && time.end === block.end
          );

          if (index >= 0) {
            setSelected(cellId(slotKey, dayKey, index + 1), true);
          }
        });
      });
  });
};

// Construeix els blocs d'un dia i torn a partir de les cel·les marcades.
const buildBlocks = (slotKey, dayKey) => {
  const slot = SLOTS[slotKey];
  const blocks = [];
  let classBeforePause = false;
  let classAfterPause = false;

  slot.times.forEach((time, index) => {
    if (!selected.has(cellId(slotKey, dayKey, index + 1))) return;

    blocks.push({ start: time.start, end: time.end, type: 'Class' });

    if (index < slot.pause.after) {
      classBeforePause = true;
    } else {
      classAfterPause = true;
    }
  });

  // El pati només forma part de l'horari si hi ha classe abans i després.
  if (classBeforePause && classAfterPause) {
    blocks.push({ start: slot.pause.start, end: slot.pause.end, type: 'Break' });
  }

  return blocks;
};

const buildWeek = () => DAYS.map(({ key, label }) => {
  const blocks = [
    ...buildBlocks('mati', key),
    ...buildBlocks('vesprada', key)
  ].sort((a, b) => a.start.localeCompare(b.start));

  return { day: label, enabled: blocks.length > 0, blocks };
});

const loadSchedule = async () => {
  try {
    lastUpdated.textContent = 'Carregant…';

    const response = await ApiService.api('/class-schedules/me');
    applySchedule(response.data);

    lastUpdated.textContent =
      `Actualitzat a les ${new Date().toLocaleTimeString('ca-ES')}`;
  } catch (error) {
    showMessage(error.message, false);
    lastUpdated.textContent = 'Error de connexió';
  }
};

const saveSchedule = async () => {
  if (saving) return;

  saving = true;
  saveButton.disabled = true;
  showMessage('');

  try {
    const response = await ApiService.api('/class-schedules/me', {
      method: 'PUT',
      body: JSON.stringify({ week: buildWeek() })
    });

    showMessage(response.message || 'Horari guardat correctament.');
    lastUpdated.textContent =
      `Actualitzat a les ${new Date().toLocaleTimeString('ca-ES')}`;
  } catch (error) {
    showMessage(error.message, false);
  } finally {
    saving = false;
    saveButton.disabled = false;
  }
};

const init = () => {
  setupCells();

  // La franja visible és només una preferència de la interfície.
  const savedView = localStorage.getItem('horari');
  select.value = SLOTS[savedView] ? savedView : 'mati';
  showTable(select.value);

  select.addEventListener('change', () => {
    showTable(select.value);
    localStorage.setItem('horari', select.value);
  });

  saveButton.addEventListener('click', saveSchedule);

  // Elimina dades antigues que es guardaven només al navegador.
  localStorage.removeItem('guardats');

  if (window.userReady) {
    loadSchedule();
  }
};

init();
