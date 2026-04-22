const xss = require('xss');
const UserModel = require('../models/User');
const { generateTokens, verifyRefreshToken } = require('../utils/tokenUtils');
const AppError = require('../utils/AppError');
const { query } = require('../config/database');
const logger = require('../config/logger');
const {
  clearRefreshTokenCookie,
  getRefreshTokenFromRequest,
  setRefreshTokenCookie,
} = require('../utils/refreshCookie');

const AuthController = {
  /**
   * POST /api/v1/auth/register
   */
  async register(req, res, next) {
    try {
      const { email, name, password } = req.body;

      // Sanitize inputs
      const sanitizedName = xss(name);
      const sanitizedEmail = xss(email);

      // Check existing user
      const existing = await UserModel.findByEmail(sanitizedEmail);
      if (existing) {
        throw new AppError('An account with this email already exists.', 409);
      }

      const user = await UserModel.create({ email: sanitizedEmail, name: sanitizedName, password });
      const tokens = await generateTokens(user.id, user.role);
      setRefreshTokenCookie(res, tokens.refreshToken, tokens.refreshTokenExpiresAt);

      logger.info(`New user registered: ${user.email}`);

      res.status(201).json({
        success: true,
        message: 'Account created successfully.',
        data: {
          user: { id: user.id, email: user.email, name: user.name, role: user.role },
          accessToken: tokens.accessToken,
          expiresIn: tokens.expiresIn,
          session: {
            refreshTokenTransport: 'httpOnly-cookie',
          },
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/auth/login
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const user = await UserModel.findByEmail(email);

      // Timing-safe: always call verifyPassword even if user not found
      const dummyHash = '$2a$12$invalidhashfortimingnobodyguessesnothing000000000000000';
      const isValid = await UserModel.verifyPassword(
        password,
        user ? user.password_hash : dummyHash
      );

      if (!user || !isValid) {
        throw new AppError('Invalid email or password.', 401);
      }

      if (!user.is_active) {
        throw new AppError('Account deactivated. Contact support.', 403);
      }

      await UserModel.updateLastLogin(user.id);
      const tokens = await generateTokens(user.id, user.role);
      setRefreshTokenCookie(res, tokens.refreshToken, tokens.refreshTokenExpiresAt);

      logger.info(`User logged in: ${user.email}`);

      res.json({
        success: true,
        message: 'Logged in successfully.',
        data: {
          user: { id: user.id, email: user.email, name: user.name, role: user.role },
          accessToken: tokens.accessToken,
          expiresIn: tokens.expiresIn,
          session: {
            refreshTokenTransport: 'httpOnly-cookie',
          },
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/auth/refresh
   */
  async refresh(req, res, next) {
    try {
      const refreshToken = getRefreshTokenFromRequest(req);
      if (!refreshToken) throw new AppError('Refresh token required.', 400);

      const userId = await verifyRefreshToken(refreshToken);
      const user = await UserModel.findById(userId);

      if (!user || !user.is_active) {
        throw new AppError('User not found or deactivated.', 401);
      }

      const tokens = await generateTokens(user.id, user.role);
      setRefreshTokenCookie(res, tokens.refreshToken, tokens.refreshTokenExpiresAt);

      res.json({
        success: true,
        message: 'Tokens refreshed.',
        data: {
          accessToken: tokens.accessToken,
          expiresIn: tokens.expiresIn,
          session: {
            refreshTokenTransport: 'httpOnly-cookie',
          },
        },
      });
    } catch (err) {
      clearRefreshTokenCookie(res);
      if (/refresh token/i.test(err.message || '')) {
        return next(new AppError('Invalid or expired refresh token.', 401));
      }
      next(err);
    }
  },

  /**
   * POST /api/v1/auth/logout
   */
  async logout(req, res, next) {
    try {
      const refreshToken = getRefreshTokenFromRequest(req);
      if (refreshToken) {
        const crypto = require('crypto');
        const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        await query('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);
      }

      clearRefreshTokenCookie(res);
      logger.info(`User logged out: ${req.user?.email}`);
      res.json({ success: true, message: 'Logged out successfully.' });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/auth/me
   */
  async getMe(req, res, next) {
    try {
      const user = await UserModel.findById(req.user.id);
      res.json({ success: true, data: { user } });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/v1/auth/me
   */
  async updateMe(req, res, next) {
    try {
      const { name, email } = req.body;

      if (email) {
        const existing = await UserModel.findByEmail(email);
        if (existing && existing.id !== req.user.id) {
          throw new AppError('Email already in use.', 409);
        }
      }

      const user = await UserModel.update(req.user.id, {
        name: name ? xss(name) : undefined,
        email: email ? xss(email) : undefined,
      });

      res.json({ success: true, message: 'Profile updated.', data: { user } });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/auth/change-password
   */
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await UserModel.findByEmail(req.user.email);

      const isValid = await UserModel.verifyPassword(currentPassword, user.password_hash);
      if (!isValid) throw new AppError('Current password is incorrect.', 400);

      await UserModel.updatePassword(req.user.id, newPassword);
      // Revoke all refresh tokens
      await query('DELETE FROM refresh_tokens WHERE user_id = $1', [req.user.id]);
      clearRefreshTokenCookie(res);

      res.json({ success: true, message: 'Password changed. Please log in again.' });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = AuthController;
