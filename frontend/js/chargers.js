import { ApiService } from "./api.js";

const STATUS = {
  Available: { label: 'Operatiu', badge: 'badge--success' },
  Maintenance: { label: 'Manteniment', badge: 'badge--warning' },
  Broken: { label: 'Averiat', badge: 'badge--danger' }
};

let chargers = [];

const user = JSON.parse(localStorage.getItem('aulacarregaUser') || 'null');
const isAdmin = user && user.role === 'Admin';

// Converteix caràcters especials per poder mostrar-los sense problemes a la taula.
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

const showMessage = (text, ok = true) => {
  const message = document.getElementById('message');
  message.textContent = text;
  message.classList.toggle('is-error', !ok);
};

const showChargerModalMessage = (text, ok = true) => {
  const message = document.getElementById('chargerModalMessage');
  message.textContent = text;
  message.classList.toggle('is-error', !ok);
};

const render = () => {
  const search = document.getElementById('search').value.trim().toLowerCase();
  const status = document.getElementById('filterStatus').value;

  document.getElementById('statTotal').textContent = chargers.length;
  document.getElementById('statAvailable').textContent = chargers.filter((charger) => charger.status === 'Available').length;
  document.getElementById('statMaintenance').textContent = chargers.filter((charger) => charger.status === 'Maintenance').length;
  document.getElementById('statBroken').textContent = chargers.filter((charger) => charger.status === 'Broken').length;

  const visibleChargers = chargers.filter((charger) => {
    const matchesName = charger.name.toLowerCase().includes(search);
    const matchesStatus = status === '' || charger.status === status;

    return matchesName && matchesStatus;
  });

  document.getElementById('listSummary').textContent =
    `${visibleChargers.length} carregador${visibleChargers.length === 1 ? '' : 's'}`;

  if (visibleChargers.length === 0) {
    document.getElementById('chargersTable').innerHTML =
      '<tr><td colspan="4" class="empty-state">No hi ha carregadors disponibles.</td></tr>';
    return;
  }

  document.getElementById('chargersTable').innerHTML = visibleChargers.map((charger) => {
    const statusInfo = STATUS[charger.status] || STATUS.Available;

    let actions = 'Només consulta';

if (isAdmin) {
  const options = Object.keys(STATUS).map((value) => {
    const selected = value === charger.status ? 'selected' : '';
    return `<option value="${value}" ${selected}>${STATUS[value].label}</option>`;
  }).join('');

    actions = `
      <select data-action="status" data-id="${charger._id}">
        ${options}
      </select>

      <button class="btn btn--secondary btn--sm" data-action="toggle" data-id="${charger._id}">
        ${charger.isActive ? 'Desactivar' : 'Activar'}
      </button>

      <button class="btn btn--secondary btn--sm" data-action="delete" data-id="${charger._id}">
        Eliminar
      </button>
    `;
  }

    return `
      <tr>
        <td>
          <div class="point">
            <span class="point__icon" aria-hidden="true">ϟ</span>
            ${escapeHtml(charger.name)}
          </div>
        </td>
        <td><span class="badge ${statusInfo.badge}">${statusInfo.label}</span></td>
        <td>${charger.isActive ? 'Sí' : 'No'}</td>
        <td>
          <div class="actions">
            ${actions}
          </div>
        </td>
      </tr>
    `;
  }).join('');
};

const loadChargers = async () => {
  try {
    document.getElementById('lastUpdated').textContent = 'Carregant…';

    const response = await ApiService.api('/chargers?limit=100');
    chargers = response.data || [];

    render();
    document.getElementById('lastUpdated').textContent =
      `Actualitzat a les ${new Date().toLocaleTimeString('ca-ES')}`;
  } catch (error) {
    document.getElementById('chargersTable').innerHTML =
      `<tr><td colspan="4" class="empty-state">${escapeHtml(error.message)}</td></tr>`;
    document.getElementById('lastUpdated').textContent = 'Error de connexió';
  }
};

const init = () => {
  // Els usuaris normals no poden crear carregadors.
  if (!isAdmin) {
    document.getElementById('openChargerModal').hidden = true;
  }
   // Accions disponibles només per a administradors.
  if (isAdmin) {

    // Obrir la finestra de creació.
    document.getElementById('openChargerModal').addEventListener('click', () => {
      document.getElementById('chargerForm').reset();
      showChargerModalMessage('');
      document.getElementById('chargerModal').showModal();
    });

    // Tancar la finestra.
    document.getElementById('cancelChargerModal').addEventListener('click', () => {
      document.getElementById('chargerModal').close();
    });

    // Crear un carregador.
    document.getElementById('chargerForm').addEventListener('submit', async (event) => {
      event.preventDefault();

      try {
        await ApiService.api('/chargers', {
          method: 'POST',
          body: JSON.stringify({
            name: document.getElementById('name').value.trim(),
            status: document.getElementById('newStatus').value,
            isActive: document.getElementById('newActive').checked
          })
        });

        document.getElementById('chargerModal').close();
        document.getElementById('chargerForm').reset();

        showMessage('Carregador creat correctament.');
        await loadChargers();

      } catch (error) {
        showChargerModalMessage(error.message, false);
      }
    });

    // Activar, desactivar o eliminar.
    document.getElementById('chargersTable').addEventListener('click', async (event) => {
      const button = event.target.closest('button[data-action]');
      if (!button) return;

      const charger = chargers.find((item) => item._id === button.dataset.id);
      if (!charger) return;

      try {
        if (button.dataset.action === 'toggle') {
          await ApiService.api(`/chargers/${charger._id}`, {
            method: 'PATCH',
            body: JSON.stringify({ isActive: !charger.isActive })
          });
        }

        if (button.dataset.action === 'delete') {
          if (!confirm(`Segur que vols eliminar el carregador "${charger.name}"?`)) return;

          await ApiService.api(`/chargers/${charger._id}`, {
            method: 'DELETE'
          });
        }

        showMessage('Canvis guardats.');
        await loadChargers();

      } catch (error) {
        showMessage(error.message, false);
      }
    });

    // Canviar l'estat.
    document.getElementById('chargersTable').addEventListener('change', async (event) => {
      const select = event.target.closest('select[data-action="status"]');
      if (!select) return;

      try {
        await ApiService.api(`/chargers/${select.dataset.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: select.value })
        });

        showMessage('Estat actualitzat.');
        await loadChargers();

      } catch (error) {
        showMessage(error.message, false);
      }
    });

  }

  document.getElementById('refresh').addEventListener('click', loadChargers);
  document.getElementById('search').addEventListener('input', render);
  document.getElementById('filterStatus').addEventListener('change', render);

  loadChargers();
};

// Només arranquem si dash_shell.js ha confirmat que hi ha sessió.
if (window.userReady) {
  init();
}

