const { validationResult } = require('express-validator');

const AppError = require('../utils/AppError');

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formatted = errors.array().map((error) => ({
      field: error.path,
      message: error.msg,
      value: error.value,
    }));

    const err = new AppError('Validation failed. Please check your input.', 422);
    err.errors = formatted;
    return next(err);
  }

  next();
};

module.exports = validate;
