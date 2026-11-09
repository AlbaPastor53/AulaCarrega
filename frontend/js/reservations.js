/*
  FITXER: js/reservations.js
  RESPONSABILITAT:
    Mostrar els torns de càrrega i l'historial de l'usuari.

  ENDPOINTS:
    GET /api/charging-schedules/me
    GET /api/charging-history/me

  A TENIR EN COMPTE:
    - Cridar protectPage() abans de res.
    - Ordenar els torns per data i hora d'inici.
    - Diferenciar visualment els estats:
      Pending, InProgress, Completed, Cancelled, NotUsed.
    - L'historial no es pot modificar.
    - Formatar les dates i les hores en català.
    - Mostrar un estat buit si l'usuari encara no té torns.
*/
