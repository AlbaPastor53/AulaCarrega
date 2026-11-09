/*
  FITXER: js/admin.js
  RESPONSABILITAT:
    Part comuna del panell d'administració: comprovar la sessió,
    mostrar el perfil de l'usuari i tancar la sessió.
*/

const adminUser = JSON.parse(localStorage.getItem('aulacarregaUser') || 'null');
const adminToken = localStorage.getItem('token');

// Des de /pages/admin/ cal pujar un nivell per arribar a login.html
const loginPath = window.location.pathname.includes('/admin/')
  ? '../login.html'
  : 'login.html';

if (!adminUser || adminUser.role !== 'Admin' || !adminToken) {
  window.location.href = loginPath;
} else {
  // Les pàgines filles poden carregar la seua lògica quan hi ha sessió
  window.adminReady = true;

  document.getElementById('profileName').textContent =
    `${adminUser.firstName} ${adminUser.lastName}`;
  document.getElementById('profileRole').textContent = adminUser.role;
  document.getElementById('profileAvatar').textContent =
    (adminUser.firstName?.[0] || '') + (adminUser.lastName?.[0] || '');

  document.getElementById('logout').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('aulacarregaUser');
    window.location.href = loginPath;
  });
}
