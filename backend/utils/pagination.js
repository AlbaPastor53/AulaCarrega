// Retorna la pàgina, el límit i quants documents cal saltar.
// S'usa a tots els llistats: ?page=2&limit=10
const getPagination = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));

  return {
    page,
    limit,
    skip: (page - 1) * limit
  };
};

module.exports = { getPagination };
