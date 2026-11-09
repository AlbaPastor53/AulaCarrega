/*
  FITXER: js/api.js
  RESPONSABILITAT:
    Centralitzar totes les crides HTTP cap al backend.
  A TENIR EN COMPTE:
    - Defineix la base: const API_URL = 'http://localhost:3000/api';
    - Llegeix el token de localStorage i afegeix sempre:
      Authorization: Bearer <token>
    - Si una resposta és 401, esborra la sessió i redirigeix a login.html.
    - Gestiona els errors del backend ({ message }) i mostra'ls a la UI.
    - Funcions suggerides: apiGet, apiPost, apiPatch, apiDelete.
*/  
export class ApiService {
  static API_URL = 'http://localhost:3000/api';

  static async api(path, options = {}) {
    const headers = new Headers(options.headers);
    const token = localStorage.getItem('token');

    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${this.API_URL}${path}`, {
      ...options,
      headers
    });
    const data = await response.json().catch(() => ({}));

    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('aulacarregaUser');
      const loginPath = window.location.pathname.includes('/admin/')
        ? '../login.html'
        : 'login.html';
      window.location.href = loginPath;
    }

    if (!response.ok) {
      throw new Error(data.message || `Error ${response.status}`);
    }

    return data;
  }
}
