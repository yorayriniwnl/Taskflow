const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query } = require('../config/database');

/**
 * Generate access + refresh token pair
 */
const generateTokens = async (userId, role) => {
  const accessToken = jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m', issuer: 'taskflow-api' }
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d', issuer: 'taskflow-api' }
  );

  // Store hashed refresh token in DB
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const refreshPayload = jwt.decode(refreshToken);
  const expiresAt = new Date(refreshPayload.exp * 1000);

  await query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [userId, tokenHash, expiresAt]
  );

  // Cleanup old tokens for this user (keep last 5)
  await query(`
    DELETE FROM refresh_tokens WHERE user_id = $1
    AND id NOT IN (
      SELECT id FROM refresh_tokens WHERE user_id = $1
      ORDER BY created_at DESC LIMIT 5
    )
  `, [userId]);

  return {
    accessToken,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshToken,
    refreshTokenExpiresAt: expiresAt.toISOString(),
  };
};

/**
 * Verify refresh token and return userId
 */
const verifyRefreshToken = async (refreshToken) => {
  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  if (decoded.type !== 'refresh') {
    throw new Error('Invalid refresh token type');
  }

  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

  const result = await query(
    'SELECT * FROM refresh_tokens WHERE token_hash = $1 AND expires_at > NOW()',
    [tokenHash]
  );

  if (result.rows.length === 0) {
    throw new Error('Refresh token not found or expired');
  }

  // Rotate: delete old refresh token
  await query('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);

  return decoded.userId;
};

module.exports = { generateTokens, verifyRefreshToken };
