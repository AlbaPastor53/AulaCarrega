const adminUser = JSON.parse(localStorage.getItem('aulacarregaUser') || 'null');
const adminToken = localStorage.getItem('token');

const loginPath = window.location.pathname.includes('/admin/')
  ? '../login.html'
  : 'login.html';

if (!adminUser || adminUser.role !== 'Admin' || !adminToken) {
  window.location.href = loginPath;
} else {
  // Les pàgines filles poden carregar la seua lògica quan hi ha sessió
  window.adminReady = true;

  const { firstName = '', lastName = '', role } = adminUser;
  document.getElementById('profileName').textContent = `${firstName} ${lastName}`.trim();
  document.getElementById('profileRole').textContent = role;
  document.getElementById('profileAvatar').textContent =
    (firstName?.[0] || '') + (lastName?.[0] || '');

  document.getElementById('logout').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('aulacarregaUser');
    window.location.href = loginPath;
  });
}
