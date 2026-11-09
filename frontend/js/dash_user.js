/*
  FITXER: js/user.js
  RESPONSABILITAT:
    Carregar i pintar les dades del tauler principal.

  ENDPOINTS:
    GET /api/auth/me
    GET /api/charging-schedules/me
    GET /api/holidays

  A TENIR EN COMPTE:
    - Cridar protectPage() abans de res.
    - Mostrar nom, rol, penalitzacions i proper torn.
    - Si no hi ha torn proper, mostrar un estat buit amable.
    - Gestionar errors amb un missatge visible, no només a la consola.
    - Si role === 'Admin', mostrar l'accés al panell d'administració.
*/
