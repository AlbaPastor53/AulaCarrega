import { ApiService } from "../api.js";

const tableBody = document.getElementById('holidaysTable');
const message = document.getElementById('message');
const form = document.getElementById('holidayForm');

let holidays = [];
let editingId = null;

const showMessage = (text, ok = true) => {
  message.textContent = text;
  message.classList.toggle('is-error', !ok);
};

const escapeHtml = (value) => {
  const symbols = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(value ?? '').replace(/[&<>"']/g, (char) => symbols[char]);
};

const getStart = (h) => h.start_date || h.startDate || h.start || h.from;
const getEnd = (h) => h.end_date || h.endDate || h.end || h.to;

const toDateInput = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('ca-ES');
};

const resetForm = () => {
  editingId = null;
  form.reset();
  document.getElementById('holidayId').value = '';
  document.getElementById('endDate').min = '';
  document.getElementById('formTitle').textContent = 'Afegir dia / període';
  document.getElementById('submitBtn').textContent = 'Afegir';
  document.getElementById('cancelEditBtn').style.display = 'none';
};

const startEdit = (holiday) => {
  editingId = holiday._id || holiday.id;
  document.getElementById('holidayId').value = editingId || '';
  document.getElementById('name').value = holiday.name || '';
  document.getElementById('type').value = holiday.type || 'Holiday';
  const start = getStart(holiday);
  const end = getEnd(holiday);
  document.getElementById('startDate').value = toDateInput(start);
  document.getElementById('endDate').value = toDateInput(end);
  document.getElementById('endDate').min = toDateInput(start);
  document.getElementById('description').value = holiday.description || '';
  document.getElementById('formTitle').textContent = 'Editar període';
  document.getElementById('submitBtn').textContent = 'Desar canvis';
  document.getElementById('cancelEditBtn').style.display = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const renderHolidays = (data) => {
  if (!data.length) {
    tableBody.innerHTML = '<tr><td colspan="6" class="empty-state">No hi ha períodes registrats.</td></tr>';
    return;
  }

  tableBody.innerHTML = data.map((h) => {
    const id = h._id || h.id || '';
    return `
    <tr>
      <td>${escapeHtml(h.name)}</td>
      <td>${escapeHtml(h.type)}</td>
      <td>${escapeHtml(formatDate(getStart(h)))}</td>
      <td>${escapeHtml(formatDate(getEnd(h)))}</td>
      <td>${escapeHtml(h.description)}</td>
      <td>
        <div class="actions">
          <button class="btn btn--secondary btn--sm" data-action="edit" data-id="${escapeHtml(id)}">Editar</button>
          <button class="btn btn--secondary btn--sm" data-action="delete" data-id="${escapeHtml(id)}">Eliminar</button>
        </div>
      </td>
    </tr>
  `;
  }).join('');
};

const loadHolidays = async () => {
  try {
    document.getElementById('lastUpdated').textContent = 'Carregant…';
    const result = await ApiService.api('/holidays?limit=200');
    holidays = Array.isArray(result?.data) ? result.data : (Array.isArray(result) ? result : []);
    renderHolidays(holidays);
    document.getElementById('lastUpdated').textContent = `Actualitzat a les ${new Date().toLocaleTimeString('ca-ES')}`;
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="6" class="empty-state">${escapeHtml(error.message)}</td></tr>`;
    document.getElementById('lastUpdated').textContent = 'Error de connexió';
  }
};

const init = () => {
  document.getElementById('startDate').addEventListener('change', (e) => {
    document.getElementById('endDate').min = e.target.value;
  });

  document.getElementById('cancelEditBtn').addEventListener('click', () => {
    resetForm();
    showMessage('');
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const payload = {
      name: document.getElementById('name').value.trim(),
      type: document.getElementById('type').value,
      start_date: document.getElementById('startDate').value,
      end_date: document.getElementById('endDate').value,
      description: document.getElementById('description').value.trim()
    };

    if (payload.end_date < payload.start_date) {
      showMessage('La data de fi ha de ser igual o posterior a la d\'inici.', false);
      return;
    }

    try {
      if (editingId) {
        await ApiService.api(`/holidays/${editingId}`, { method: 'PATCH', body: JSON.stringify(payload) });
        showMessage('Període actualitzat correctament.');
      } else {
        await ApiService.api('/holidays', { method: 'POST', body: JSON.stringify(payload) });
        showMessage('Període afegit correctament.');
      }
      resetForm();
      await loadHolidays();
    } catch (error) {
      showMessage(error.message, false);
    }
  });

  tableBody.addEventListener('click', async (event) => {
    const btn = event.target.closest('button[data-action]');
    if (!btn) return;
    const holiday = holidays.find((h) => (h._id || h.id) === btn.dataset.id);

    if (btn.dataset.action === 'edit' && holiday) {
      startEdit(holiday);
      return;
    }

    if (btn.dataset.action === 'delete') {
      try {
        await ApiService.api(`/holidays/${btn.dataset.id}`, { method: 'DELETE' });
        if (editingId === btn.dataset.id) resetForm();
        showMessage('Període eliminat.');
        await loadHolidays();
      } catch (error) {
        showMessage(error.message, false);
      }
    }
  });

  document.getElementById('refresh').addEventListener('click', loadHolidays);
  loadHolidays();
};

if (window.adminReady) {
  init();
} else {
  window.addEventListener('load', () => {
    if (window.adminReady) init();
  });
}
