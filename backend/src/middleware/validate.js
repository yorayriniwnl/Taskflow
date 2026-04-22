const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

/**
 * Runs after express-validator chains – returns 422 if any errors found
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({
      field: e.path,
      message: e.msg,
      value: e.value,
    }));

    const err = new AppError('Validation failed. Please check your input.', 422);
    err.errors = formatted;
    return next(err);
  }

  next();
};

module.exports = validate;
