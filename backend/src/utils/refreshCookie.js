const DEFAULT_COOKIE_NAME = 'taskflow_refresh_token';

const getCookieName = () => process.env.REFRESH_COOKIE_NAME || DEFAULT_COOKIE_NAME;

const parseCookieHeader = (cookieHeader = '') =>
  cookieHeader
    .split(';')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce((cookies, entry) => {
      const separatorIndex = entry.indexOf('=');
      if (separatorIndex === -1) return cookies;

      const key = entry.slice(0, separatorIndex).trim();
      const value = entry.slice(separatorIndex + 1).trim();
      cookies[key] = decodeURIComponent(value);
      return cookies;
    }, {});

const baseCookieOptions = () => ({
  httpOnly: true,
  sameSite: 'strict',
  secure: process.env.NODE_ENV === 'production',
  path: '/api/v1/auth',
});

const setRefreshTokenCookie = (res, refreshToken, expiresAt) => {
  const maxAge = Math.max(0, new Date(expiresAt).getTime() - Date.now());
  res.cookie(getCookieName(), refreshToken, { ...baseCookieOptions(), maxAge });
};

const clearRefreshTokenCookie = (res) => {
  res.clearCookie(getCookieName(), baseCookieOptions());
};

const getRefreshTokenFromRequest = (req) => {
  const cookies = parseCookieHeader(req.headers.cookie);
  return cookies[getCookieName()] || req.body?.refreshToken || null;
};

module.exports = {
  clearRefreshTokenCookie,
  getCookieName,
  getRefreshTokenFromRequest,
  setRefreshTokenCookie,
};
