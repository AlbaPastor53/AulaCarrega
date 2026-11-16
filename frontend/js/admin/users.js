import { ApiService } from "../api.js";
import { escapeHtml } from "../utils.js";

let users = [];
let scheduleUserId = null;

const DAYS = ['Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres'];

// Opcions d'estudis segons el tipus de curs.
const ESTUDIS = {
  batxillerat: [
    'Ciències i Tecnologia',
    'Humanitats i Ciències Socials',
    'Arts',
    'General'
  ],
  fp_basica: [
    'Servicis Administratius (presencial)'
  ],
  mitja: [
    'Sistemes Microinformàtics i Xarxes (presencial)',
    'Gestió Administrativa (presencial)',
    'Gestió Administrativa (semipresencial)',
    'Activitats Comercials (presencial)'
  ],
  superior: [
    'DAW: Desenvolupament d\'Aplicacions Web (semipresencial)',
    'DAM: Desenvolupament d\'Aplicacions Multiplataforma (presencial)',
    'Comerç Internacional (presencial)',
    'Administració i Finances (presencial)',
    'Transport i Logística (presencial)'
  ]
};

const showMessage = (text, ok = true) => {
  const message = document.getElementById('message');
  message.textContent = text;
  message.classList.toggle('is-error', !ok);
};

const showUserModalMessage = (text, ok = true) => {
  const message = document.getElementById('userModalMessage');
  message.textContent = text;
  message.classList.toggle('is-error', !ok);
};

const showScheduleModalMessage = (text, ok = true) => {
  const message = document.getElementById('scheduleModalMessage');
  message.textContent = text;
  message.classList.toggle('is-error', !ok);
};

const omplirEstudis = () => {
  const course = document.getElementById('newCourse').value;
  const estudis = document.getElementById('newEstudis');
  const options = ESTUDIS[course] || [];
  estudis.innerHTML = '<option value="">Selecciona els estudis</option>';
  options.forEach((nom) => {
    const option = document.createElement('option');
    option.value = nom;
    option.textContent = nom;
    estudis.appendChild(option);
  });
};

const resetUserForm = () => {
  document.getElementById('userForm').reset();
  document.getElementById('newEstudis').innerHTML = '<option value="">Selecciona els estudis</option>';
  showUserModalMessage('');
};

const render = () => {
  const search = document.getElementById('search').value.trim().toLowerCase();
  const role = document.getElementById('filterRole').value;
  const active = document.getElementById('filterActive').value;

  const visibleUsers = users.filter((user) => {
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    const matchesSearch = `${fullName} ${user.email || ''}`.toLowerCase().includes(search);
    const matchesRole = role === '' || user.role === role;
    const matchesActive = active === '' || (active === 'active' ? user.isActive : !user.isActive);
    return matchesSearch && matchesRole && matchesActive;
  });

  document.getElementById('listSummary').textContent =
    `${visibleUsers.length} usuari${visibleUsers.length === 1 ? '' : 's'} de ${users.length}`;

  if (visibleUsers.length === 0) {
    document.getElementById('usersTable').innerHTML =
      '<tr><td colspan="6" class="empty-state">No hi ha usuaris disponibles.</td></tr>';
    return;
  }

  document.getElementById('usersTable').innerHTML = visibleUsers.map((user) => {
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return `
      <tr>
        <td>${escapeHtml(fullName)}</td>
        <td>${escapeHtml(user.email)}</td>
        <td>
          <select data-action="role" data-id="${user._id}" aria-label="Canviar rol">
            <option value="User" ${user.role === 'User' ? 'selected' : ''}>Usuari</option>
            <option value="Admin" ${user.role === 'Admin' ? 'selected' : ''}>Administrador</option>
          </select>
        </td>
        <td>
          <div class="actions">
            <span>${user.isActive ? 'Actiu' : 'Inactiu'}</span>
            <button class="btn btn--secondary btn--sm" data-action="toggle" data-id="${user._id}">
              ${user.isActive ? 'Desactivar' : 'Activar'}
            </button>
          </div>
        </td>
        <td>
          <div class="actions">
            <input class="input--xs" type="number" min="0" step="1"
              value="${Number(user.penalties) || 0}"
              data-action="penalties" data-id="${user._id}"
              aria-label="Penalitzacions">
            <button class="btn btn--secondary btn--sm" data-action="save-penalties" data-id="${user._id}">
              Guardar
            </button>
          </div>
        </td>
        <td>
          <button class="btn btn--secondary btn--sm" data-action="schedule" data-id="${user._id}">
            Veure / Editar
          </button>
        </td>
      </tr>
    `;
  }).join('');
};

const loadUsers = async () => {
  try {
    document.getElementById('lastUpdated').textContent = 'Carregant…';
    const response = await ApiService.api('/users?limit=100');
    users = response.data || [];
    render();
    document.getElementById('lastUpdated').textContent =
      `Actualitzat a les ${new Date().toLocaleTimeString('ca-ES')}`;
  } catch (error) {
    document.getElementById('usersTable').innerHTML =
      `<tr><td colspan="6" class="empty-state">${escapeHtml(error.message)}</td></tr>`;
    document.getElementById('lastUpdated').textContent = 'Error de connexió';
  }
};

/* ===== Horari de l'usuari ===== */

const renderBlockRow = (block = {}) => {
  const start = block.start || '08:00';
  const end = block.end || '09:00';
  const type = block.type || 'Class';
  return `
    <div class="schedule-block">
      <input type="time" class="block-start" value="${escapeHtml(start)}">
      <span>-</span>
      <input type="time" class="block-end" value="${escapeHtml(end)}">
      <select class="block-type">
        <option value="Class" ${type === 'Class' ? 'selected' : ''}>Classe</option>
        <option value="Break" ${type === 'Break' ? 'selected' : ''}>Pati</option>
      </select>
      <button type="button" class="btn btn--secondary btn--sm remove-block">Eliminar</button>
    </div>
  `;
};

const renderScheduleEditor = (week = []) => {
  const editor = document.getElementById('scheduleEditor');
  editor.innerHTML = DAYS.map((dayName) => {
    const dayData = week.find((d) => d.day === dayName) || { day: dayName, enabled: false, blocks: [] };
    const blocks = Array.isArray(dayData.blocks) ? dayData.blocks : [];
    return `
      <section class="schedule-day" data-day="${escapeHtml(dayName)}">
        <div class="schedule-day__header">
          <strong>${escapeHtml(dayName)}</strong>
          <button type="button" class="btn btn--secondary btn--sm add-block">+ Afegir bloc</button>
        </div>
        <div class="schedule-day__blocks">
          ${blocks.map(renderBlockRow).join('')}
        </div>
      </section>
    `;
  }).join('');
};

const openScheduleModal = async (user) => {
  scheduleUserId = user._id;
  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  document.getElementById('scheduleTitle').textContent = `Horari de ${fullName || 'l\'usuari'}`;
  showScheduleModalMessage('');

  try {
    const response = await ApiService.api(`/class-schedules/${user._id}`);
    const week = response.data?.week || [];
    renderScheduleEditor(week);
    document.getElementById('scheduleModal').showModal();
  } catch (error) {
    showMessage(error.message, false);
  }
};

const buildWeekFromEditor = () => {
  return DAYS.map((dayName) => {
    const dayEl = document.querySelector(`.schedule-day[data-day="${dayName}"]`);
    const rows = dayEl ? Array.from(dayEl.querySelectorAll('.schedule-block')) : [];
    const blocks = rows.map((row) => ({
      start: row.querySelector('.block-start').value,
      end: row.querySelector('.block-end').value,
      type: row.querySelector('.block-type').value
    }));
    return { day: dayName, enabled: blocks.length > 0, blocks };
  });
};

const init = () => {
  document.getElementById('filtersForm').addEventListener('submit', (event) => {
    event.preventDefault();
    render();
  });

  document.getElementById('search').addEventListener('input', render);
  document.getElementById('filterRole').addEventListener('change', render);
  document.getElementById('filterActive').addEventListener('change', render);
  document.getElementById('refresh').addEventListener('click', loadUsers);

  // Crear usuari
  document.getElementById('openUserModal').addEventListener('click', () => {
    resetUserForm();
    document.getElementById('userModal').showModal();
  });
  document.getElementById('cancelUserModal').addEventListener('click', () => {
    document.getElementById('userModal').close();
  });
  document.getElementById('newCourse').addEventListener('change', omplirEstudis);

  document.getElementById('userForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const userData = {
      firstName: document.getElementById('newFirstName').value.trim(),
      lastName: document.getElementById('newLastName').value.trim(),
      email: document.getElementById('newEmail').value.trim(),
      course: document.getElementById('newCourse').value,
      estudis: document.getElementById('newEstudis').value,
      nia: document.getElementById('newNia').value.trim(),
      car: document.getElementById('newCar').value.trim(),
      password: document.getElementById('newPassword').value,
      role: document.getElementById('newRole').value,
      isActive: document.getElementById('newUserActive').checked
    };
    if (!userData.estudis) {
      showUserModalMessage('Selecciona els estudis concrets.', false);
      return;
    }
    try {
      await ApiService.api('/users', { method: 'POST', body: JSON.stringify(userData) });
      document.getElementById('userModal').close();
      resetUserForm();
      showMessage('Usuari creat correctament.');
      await loadUsers();
    } catch (error) {
      showUserModalMessage(error.message, false);
    }
  });

  // Canviar rol
  document.getElementById('usersTable').addEventListener('change', async (event) => {
    const select = event.target.closest('select[data-action="role"]');
    if (!select) return;
    const user = users.find((item) => item._id === select.dataset.id);
    if (!user || select.value === user.role) return;
    try {
      await ApiService.api(`/users/${user._id}`, { method: 'PATCH', body: JSON.stringify({ role: select.value }) });
      showMessage('Rol actualitzat.');
      await loadUsers();
    } catch (error) {
      select.value = user.role;
      showMessage(error.message, false);
    }
  });

  // Accions de la taula
  document.getElementById('usersTable').addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const user = users.find((item) => item._id === button.dataset.id);
    if (!user) return;

    try {
      if (button.dataset.action === 'toggle') {
        await ApiService.api(`/users/${user._id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ isActive: !user.isActive })
        });
        showMessage('Estat actualitzat.');
        await loadUsers();
      }

      if (button.dataset.action === 'save-penalties') {
        const input = document.querySelector(`input[data-action="penalties"][data-id="${user._id}"]`);
        const penalties = Number(input.value);
        if (!Number.isInteger(penalties) || penalties < 0) {
          showMessage('Les penalitzacions han de ser un enter igual o superior a 0.', false);
          return;
        }
        await ApiService.api(`/users/${user._id}/penalties`, {
          method: 'PATCH',
          body: JSON.stringify({ penalties })
        });
        showMessage('Penalitzacions actualitzades.');
        await loadUsers();
      }

      if (button.dataset.action === 'schedule') {
        await openScheduleModal(user);
      }
    } catch (error) {
      showMessage(error.message, false);
    }
  });

  // Editor d'horari
  document.getElementById('cancelScheduleModal').addEventListener('click', () => {
    document.getElementById('scheduleModal').close();
  });

  document.getElementById('scheduleEditor').addEventListener('click', (event) => {
    const addBtn = event.target.closest('.add-block');
    if (addBtn) {
      const blocks = addBtn.closest('.schedule-day').querySelector('.schedule-day__blocks');
      blocks.insertAdjacentHTML('beforeend', renderBlockRow());
      return;
    }
    const removeBtn = event.target.closest('.remove-block');
    if (removeBtn) {
      removeBtn.closest('.schedule-block').remove();
    }
  });

  document.getElementById('scheduleForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!scheduleUserId) return;
    try {
      const week = buildWeekFromEditor();
      await ApiService.api(`/class-schedules/${scheduleUserId}`, {
        method: 'PUT',
        body: JSON.stringify({ week })
      });
      showScheduleModalMessage('');
      document.getElementById('scheduleModal').close();
      showMessage('Horari guardat correctament.');
    } catch (error) {
      showScheduleModalMessage(error.message, false);
    }
  });

  loadUsers();
};

if (window.adminReady) {
  init();
}
