/*
  FITXER: js/auth.js
  RESPONSABILITAT:
    Gestionar la sessió de l'usuari al navegador i protegir les pàgines.

  A TENIR EN COMPTE:
    - Desa el token i les dades de l'usuari a localStorage després del login.
    - Funcions suggerides:
        saveSession(token, user), getToken(), getUser(),
        isLoggedIn(), isAdmin(), logout().
    - protectPage(): si no hi ha sessió, redirigeix a pages/login.html.
    - protectAdminPage(): a més, comprova que role === 'Admin'.
    - No desar mai la contrasenya.
    - logout() ha d'esborrar token i usuari i tornar al login.
*/

// Obtenir les dades de l'usuari connectat.
function getUser() {
    return JSON.parse(localStorage.getItem('aulacarregaUser') || 'null');
}

// Comprovar si hi ha una sessió iniciada.
function isLoggedIn() {
    return !!localStorage.getItem('token') && !!getUser();
}

// Comprovar si l'usuari és administrador.
function isAdmin() {
    const user = getUser();
    return user && user.role === 'Admin';
}

// Protegir les pàgines que necessiten iniciar sessió.
function protectPage() {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
    }
}

// Protegir les pàgines exclusives d'administració.
function protectAdminPage() {
    if (!isLoggedIn() || !isAdmin()) {
        window.location.href = '../dash_user.html';
    }
}

// Tancar sessió.
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('aulacarregaUser');
    window.location.href = 'login.html';
}