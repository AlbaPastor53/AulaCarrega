/*
  FITXER: js/admin/reservations.js
  RESPONSABILITAT:
    Gestionar els torns de càrrega de tots els usuaris.

  ENDPOINTS:
    GET    /api/charging-schedules
    POST   /api/charging-schedules
    PATCH  /api/charging-schedules/:id
    POST   /api/charging-schedules/:id/connect
    POST   /api/charging-schedules/:id/disconnect
    POST   /api/charging-schedules/:id/cancel
    DELETE /api/charging-schedules/:id

  A TENIR EN COMPTE:
    - Cridar protectAdminPage() abans de res.
    - Carregar la llista d'usuaris i de carregadors per als desplegables.
    - Filtres: date, from, to, user, charger i status.
    - En crear: user_id, charger, date, start_time, end_time, assigned_hours.
    - El backend rebutja solapaments i torns sense connexió/desconnexió.
    - Refrescar la taula després de connectar, desconnectar o cancel·lar.
*/
