/*
  FITXER: js/dash_shell.js
  RESPONSABILITAT:
    Part comuna del panell per a qualsevol usuari autenticat (User o Admin):
    comprova la sessió, mostra el perfil i tanca la sessió.

  A TENIR EN COMPTE:
    - Si no hi ha token o usuari, redirigeix a login.html.
    - Marca window.userReady = true perquè el mòdul de la pàgina arranqui.
    - Mostra només els elements del rol: [data-admin-only] per a admins
      i [data-user-only] per a usuaris normals.
*/

const shellUser = JSON.parse(localStorage.getItem('aulacarregaUser') || 'null');
const shellToken = localStorage.getItem('token');
const shellIsAdmin = !!(shellUser && shellUser.role === 'Admin');

// Des de /pages/admin/ cal pujar un nivell per arribar a login.html
const shellLoginPath = window.location.pathname.includes('/admin/')
  ? '../login.html'
  : 'login.html';

if (!shellUser || !shellToken) {
  window.location.href = shellLoginPath;
} else {
  window.userReady = true;

  const nameEl = document.getElementById('profileName');
  const roleEl = document.getElementById('profileRole');
  const avatarEl = document.getElementById('profileAvatar');

  if (nameEl) {
    nameEl.textContent = `${shellUser.firstName || ''} ${shellUser.lastName || ''}`.trim();
  }
  if (roleEl) {
    roleEl.textContent = shellIsAdmin ? 'Administrador' : 'Usuari';
  }
  if (avatarEl) {
    avatarEl.textContent = (shellUser.firstName?.[0] || '') + (shellUser.lastName?.[0] || '');
  }

  // El logotip porta al tauler que corresponga segons el rol.
  const brandLink = document.querySelector('a.brand');
  if (brandLink) {
    const prefix = window.location.pathname.includes('/admin/') ? '../' : '';
    brandLink.href = prefix + (shellIsAdmin ? 'dash_admin.html' : 'dash_user.html');
  }

  const brandSubtitle = document.querySelector('.brand__tagline');
  if (brandSubtitle) {
    brandSubtitle.textContent = shellIsAdmin ? "PANEL D'ADMINISTRACIÓ" : 'ÀREA PERSONAL';
  }

  // Mostrem només els elements que corresponen al rol de l'usuari.
  document.querySelectorAll('[data-admin-only]').forEach((element) => {
    element.hidden = !shellIsAdmin;
  });
  document.querySelectorAll('[data-user-only]').forEach((element) => {
    element.hidden = shellIsAdmin;
  });

  const logoutButton = document.getElementById('logout');
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('aulacarregaUser');
      window.location.href = shellLoginPath;
    });
  }
}
