const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:3000', 'http://localhost:5173'];

const splitCsv = (value = '') =>
  value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

const getAllowedOrigins = () => {
  const configuredOrigins = splitCsv(process.env.ALLOWED_ORIGINS || '');
  return configuredOrigins.length ? configuredOrigins : DEFAULT_ALLOWED_ORIGINS;
};

const validateRuntimeConfig = () => {
  const required = ['DB_PASSWORD', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
  const missing = required.filter((key) => !process.env[key]?.trim());

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if ((process.env.JWT_SECRET || '').length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long.');
  }

  if ((process.env.JWT_REFRESH_SECRET || '').length < 32) {
    throw new Error('JWT_REFRESH_SECRET must be at least 32 characters long.');
  }
};

module.exports = {
  getAllowedOrigins,
  validateRuntimeConfig,
};
