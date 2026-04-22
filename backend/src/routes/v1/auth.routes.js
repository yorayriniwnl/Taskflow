const express = require('express');
const router = express.Router();

const AuthController = require('../../controllers/authController');
const { authenticate, optionalAuth } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const {
  registerValidator,
  loginValidator,
  updateProfileValidator,
  changePasswordValidator,
} = require('../../validators/auth.validator');

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User registration, login, token management
 */

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     security: []
 *     description: Creates a user, returns an access token, and sets the refresh token in an HttpOnly cookie.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, name, password]
 *             properties:
 *               email: { type: string, format: email, example: "john@example.com" }
 *               name: { type: string, example: "John Doe" }
 *               password: { type: string, example: "Secret@123" }
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/AuthResponse' }
 *       409: { description: Email already exists }
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/register', registerValidator, validate, AuthController.register);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login and get JWT tokens
 *     tags: [Authentication]
 *     security: []
 *     description: Returns an access token and sets the refresh token in an HttpOnly cookie.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email, example: "admin@taskflow.dev" }
 *               password: { type: string, example: "Admin@123456" }
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/AuthResponse' }
 *       401: { description: Invalid credentials }
 */
router.post('/login', loginValidator, validate, AuthController.login);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     security: []
 *     description: Uses the HttpOnly refresh-token cookie. A request body refreshToken is also accepted for API clients.
 *     responses:
 *       200:
 *         description: New access token issued and refresh cookie rotated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken: { type: string }
 *                     expiresIn: { type: string }
 *                     session: { $ref: '#/components/schemas/SessionInfo' }
 *       401: { description: Invalid or expired refresh token }
 */
router.post('/refresh', AuthController.refresh);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout and invalidate refresh token
 *     tags: [Authentication]
 *     description: Revokes the current refresh session and clears the refresh cookie.
 *     responses:
 *       200: { description: Logged out successfully }
 */
router.post('/logout', optionalAuth, AuthController.logout);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user: { $ref: '#/components/schemas/User' }
 *   patch:
 *     summary: Update current user profile
 *     tags: [Authentication]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *     responses:
 *       200: { description: Profile updated }
 */
router.get('/me', authenticate, AuthController.getMe);
router.patch('/me', authenticate, updateProfileValidator, validate, AuthController.updateMe);

/**
 * @swagger
 * /api/v1/auth/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [Authentication]
 *     description: Changes the password and revokes all refresh sessions for the user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string }
 *     responses:
 *       200: { description: Password changed }
 *       400: { description: Current password incorrect }
 */
router.post('/change-password', authenticate, changePasswordValidator, validate, AuthController.changePassword);

module.exports = router;
