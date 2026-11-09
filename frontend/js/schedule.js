/*
  FITXER: js/schedule.js
  RESPONSABILITAT:
    Carregar, editar i guardar l'horari setmanal de classes.

  ENDPOINTS:
    GET /api/class-schedules/me
    PUT /api/class-schedules/me

  A TENIR EN COMPTE:
    - Cridar protectPage() abans de res.
    - Dies permesos: Dilluns, Dimarts, Dimecres, Dijous i Divendres.
    - Cada dia: { day, enabled, blocks: [{ start, end, type }] }.
    - type només pot ser 'Class' o 'Break'.
    - Validar hores (format HH:MM) i que start < end abans d'enviar.
    - Enviar sempre { week: [...] }.
    - Permetre afegir i eliminar blocs visualment.
*/
