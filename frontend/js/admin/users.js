import { ApiService } from "../api.js";

let users = [];

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
  message.style.color = ok ? 'var(--accent)' : '#ff9aa2';
};

const showUserModalMessage = (text, ok = true) => {
  const message = document.getElementById('userModalMessage');
  message.textContent = text;
  message.style.color = ok ? 'var(--accent)' : '#ff9aa2';
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
  document.getElementById('newEstudis').innerHTML =
    '<option value="">Selecciona els estudis</option>';
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
      '<tr><td colspan="5" class="empty-state">No hi ha usuaris disponibles.</td></tr>';
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
            <button class="button button--secondary" data-action="toggle" data-id="${user._id}">
              ${user.isActive ? 'Desactivar' : 'Activar'}
            </button>
          </div>
        </td>
        <td>
          <div class="actions">
            <input class="penalties-input" type="number" min="0" step="1"
              value="${Number(user.penalties) || 0}"
              data-action="penalties" data-id="${user._id}"
              aria-label="Penalitzacions">
            <button class="button button--secondary" data-action="save-penalties" data-id="${user._id}">
              Guardar
            </button>
          </div>
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
      `<tr><td colspan="5" class="empty-state">${escapeHtml(error.message)}</td></tr>`;
    document.getElementById('lastUpdated').textContent = 'Error de connexió';
  }
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

  // Obrir i tancar la finestra de creació.
  document.getElementById('openUserModal').addEventListener('click', () => {
    resetUserForm();
    document.getElementById('userModal').showModal();
  });

  document.getElementById('cancelUserModal').addEventListener('click', () => {
    document.getElementById('userModal').close();
  });

  document.getElementById('newCourse').addEventListener('change', omplirEstudis);

  // Crear un usuari.
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
      await ApiService.api('/users', {
        method: 'POST',
        body: JSON.stringify(userData)
      });

      document.getElementById('userModal').close();
      resetUserForm();
      showMessage('Usuari creat correctament.');
      await loadUsers();
    } catch (error) {
      showUserModalMessage(error.message, false);
    }
  });

  // Canviar el rol d'un usuari.
  document.getElementById('usersTable').addEventListener('change', async (event) => {
    const select = event.target.closest('select[data-action="role"]');
    if (!select) return;

    const user = users.find((item) => item._id === select.dataset.id);
    if (!user || select.value === user.role) return;

    try {
      await ApiService.api(`/users/${user._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ role: select.value })
      });

      showMessage('Rol actualitzat.');
      await loadUsers();
    } catch (error) {
      select.value = user.role;
      showMessage(error.message, false);
    }
  });

  // Activar, desactivar o guardar penalitzacions.
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
        const input = document.querySelector(
          `input[data-action="penalties"][data-id="${user._id}"]`
        );
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
    } catch (error) {
      showMessage(error.message, false);
    }
  });

  loadUsers();
};

if (window.adminReady) {
  init();
}
