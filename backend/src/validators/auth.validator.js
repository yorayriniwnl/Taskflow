const { body } = require('express-validator');

const registerValidator = [
  body('email')
    .trim()
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail()
    .isLength({ max: 255 }).withMessage('Email must not exceed 255 characters.'),

  body('name')
    .trim()
    .notEmpty().withMessage('Name is required.')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters.')
    .matches(/^[a-zA-Z\s'-]+$/).withMessage('Name may only contain letters, spaces, hyphens, and apostrophes.'),

  body('password')
    .isLength({ min: 8, max: 72 }).withMessage('Password must be 8–72 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain at least one number.')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one special character.'),
];

const loginValidator = [
  body('email').trim().isEmail().withMessage('Invalid email address.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
];

const updateProfileValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters.')
    .matches(/^[a-zA-Z\s'-]+$/).withMessage('Invalid name format.'),

  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Invalid email address.')
    .normalizeEmail(),
];

const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required.'),
  body('newPassword')
    .isLength({ min: 8, max: 72 }).withMessage('New password must be 8–72 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain at least one number.')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one special character.')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from current password.');
      }
      return true;
    }),
];

module.exports = { registerValidator, loginValidator, updateProfileValidator, changePasswordValidator };
