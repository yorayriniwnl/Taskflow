const parsePositiveInt = (value, fallback = 1) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const parsePage = (value, fallback = 1) => parsePositiveInt(value, fallback);

const parseLimit = (value, fallback = 20, max = 100) =>
  Math.min(parsePositiveInt(value, fallback), max);

const parseDatabaseInt = (value, fallback = 0) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const buildPaginationMeta = (total, page, limit) => ({
  total,
  page,
  totalPages: Math.max(1, Math.ceil(total / limit)),
});

module.exports = {
  buildPaginationMeta,
  parseDatabaseInt,
  parseLimit,
  parsePage,
};
