/*
  FITXER: js/admin/reports.js
  RESPONSABILITAT:
    Mostrar l'historial global i les estadístiques de càrrega.

  ENDPOINTS:
    GET /api/charging-history
    GET /api/charging-history?user=&charger=&action=&from=&to=

  A TENIR EN COMPTE:
    - Cridar protectAdminPage() abans de res.
    - Filtres: usuari, carregador, acció i rang de dates.
    - Accions: Completed | NotUsed | Cancelled.
    - Comparar assigned_hours amb actual_hours.
    - Si es fan gràfics, calcular-los en el client amb les dades rebudes.
    - Gestionar llistats grans amb paginació (page i limit).
*/
