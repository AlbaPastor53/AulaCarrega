/*
  FITXER: js/admin/holidays.js
  RESPONSABILITAT:
    Gestionar festius, vacances i dies no lectius.

  ENDPOINTS:
    GET    /api/holidays
    POST   /api/holidays
    PATCH  /api/holidays/:id
    DELETE /api/holidays/:id

  A TENIR EN COMPTE:
    - Cridar protectAdminPage() abans de res.
    - Camps: name, type, start_date, end_date i description.
    - type: Holiday | Vacation | NonSchoolDay.
    - Validar que la data de fi sigui igual o posterior a la d'inici.
    - Enviar les dates en format ISO (YYYY-MM-DD).
    - Refrescar el llistat després de cada canvi.
*/
