import { ApiService } from "../api.js";

let users = [];
let chargers = [];
let history = [];

const escapeHtml = (value) => {
  const symbols = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(value ?? '').replace(/[&<>"']/g, (char) => symbols[char]);
};

const showMessage = (text, ok = true) => {
  const message = document.getElementById('message');
  message.textContent = text;
  message.classList.toggle('is-error', !ok);
};

const fullName = (user) => `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Alumne';

const loadAllPages = async (path) => {
  const items = [];
  let page = 1;
  let total = 1;

  while (items.length < total && page <= 20) {
    const result = await ApiService.api(`${path}${path.includes('?') ? '&' : '?'}limit=100&page=${page}`);
    const data = Array.isArray(result.data) ? result.data : (Array.isArray(result) ? result : []);
    if (data.length === 0) break;
    items.push(...data);
    total = Number(result.total) || items.length;
    page += 1;
  }

  return items;
};

// 1. Alumnes per estudis
const renderEstudisFilter = () => {
  const select = document.getElementById('estudisFilter');
  const estudisSet = new Set(users.map((u) => u.estudis).filter(Boolean));
  const options = Array.from(estudisSet).sort((a, b) => a.localeCompare(b, 'ca'));
  select.innerHTML = '<option value="">Tots els estudis</option>' + options.map((e) =>
    `<option value="${escapeHtml(e)}">${escapeHtml(e)}</option>`
  ).join('');
};

const renderStudentsByEstudis = () => {
  const selected = document.getElementById('estudisFilter').value;
  const list = document.getElementById('studentsByEstudis');
  const filtered = users.filter((u) => u.role === 'User' && (!selected || u.estudis === selected));

  if (filtered.length === 0) {
    list.innerHTML = '<li class="muted">No hi ha alumnes.</li>';
    return;
  }

  list.innerHTML = filtered.map((u) => `
    <li>
      <div><strong>${escapeHtml(fullName(u))}</strong></div>
      <div class="muted">${escapeHtml(u.estudis || 'Sense estudis')}</div>
    </li>
  `).join('');
};

// 2. Hores per carregador
const renderHoursByCharger = () => {
  const tbody = document.getElementById('hoursByCharger');
  const totals = new Map();

  chargers.forEach((c) => {
    const id = String(c._id || c.id || c.name);
    totals.set(id, { name: c.name || 'Carregador', hours: 0 });
  });

  history.forEach((h) => {
    const charger = h.charger;
    const id = String(charger?._id || charger || 'unknown');
    const name = charger?.name || totals.get(id)?.name || 'Carregador';
    if (!totals.has(id)) totals.set(id, { name, hours: 0 });
    totals.get(id).hours += Number(h.actual_hours) || 0;
  });

  const rows = Array.from(totals.values()).sort((a, b) => a.name.localeCompare(b.name, 'ca'));
  if (rows.length === 0) {
    tbody.innerHTML = '<tr><td colspan="2" class="empty-state">No hi ha dades.</td></tr>';
    return;
  }

  tbody.innerHTML = rows.map((r) => `
    <tr>
      <td>${escapeHtml(r.name)}</td>
      <td><strong>${r.hours.toFixed(2)} h</strong></td>
    </tr>
  `).join('');
};

// 3. Alumne amb més hores
const renderTopHours = () => {
  const nameEl = document.getElementById('topHoursUserName');
  const valueEl = document.getElementById('topHoursUserValue');
  const hoursByUser = new Map();

  history.forEach((h) => {
    const user = h.user;
    const id = String(user?._id || user || '');
    if (!id) return;
    const found = users.find((u) => (u._id || u.id) === id);
    const name = user?.firstName ? fullName(user) : (found ? fullName(found) : 'Alumne');
    if (!hoursByUser.has(id)) hoursByUser.set(id, { name, hours: 0 });
    hoursByUser.get(id).hours += Number(h.actual_hours) || 0;
  });

  let top = null;
  hoursByUser.forEach((value) => {
    if (!top || value.hours > top.hours) top = value;
  });

  if (!top) {
    nameEl.textContent = '—';
    valueEl.textContent = 'Sense dades d\'ús';
    return;
  }

  nameEl.textContent = top.name;
  valueEl.textContent = `${top.hours.toFixed(2)} hores utilitzades`;
};

// 4. Alumne amb més penalitzacions
const renderTopPenalties = () => {
  const nameEl = document.getElementById('topPenaltiesUserName');
  const valueEl = document.getElementById('topPenaltiesUserValue');
  const students = users.filter((u) => u.role === 'User');

  let top = null;
  students.forEach((u) => {
    const p = Number(u.penalties) || 0;
    if (!top || p > top.penalties) top = { name: fullName(u), penalties: p };
  });

  if (!top) {
    nameEl.textContent = '—';
    valueEl.textContent = 'Sense dades d\'alumnes';
    return;
  }

  nameEl.textContent = top.name;
  valueEl.textContent = `${top.penalties} penalitzacions`;
};

const renderAll = () => {
  renderEstudisFilter();
  renderStudentsByEstudis();
  renderHoursByCharger();
  renderTopHours();
  renderTopPenalties();
};

const loadReports = async () => {
  try {
    document.getElementById('lastUpdated').textContent = 'Carregant…';
    showMessage('');

    const [usersData, chargersData, historyData] = await Promise.all([
      loadAllPages('/users'),
      loadAllPages('/chargers'),
      loadAllPages('/charging-history')
    ]);

    users = usersData;
    chargers = chargersData;
    history = historyData;
    renderAll();
    document.getElementById('lastUpdated').textContent = `Actualitzat a les ${new Date().toLocaleTimeString('ca-ES')}`;
  } catch (error) {
    showMessage(error.message, false);
    document.getElementById('lastUpdated').textContent = 'Error de connexió';
  }
};

const init = () => {
  document.getElementById('estudisFilter').addEventListener('change', renderStudentsByEstudis);
  document.getElementById('refresh').addEventListener('click', loadReports);
  loadReports();
};

if (window.adminReady) {
  init();
} else {
  window.addEventListener('load', () => {
    if (window.adminReady) init();
  });
}
