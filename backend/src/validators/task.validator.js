const { body, query, param } = require('express-validator');

const createTaskValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required.')
    .isLength({ min: 1, max: 255 }).withMessage('Title must be 1–255 characters.'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 }).withMessage('Description must not exceed 5000 characters.'),

  body('status')
    .optional()
    .isIn(['todo', 'in_progress', 'done']).withMessage('Status must be todo, in_progress, or done.'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high.'),

  body('due_date')
    .optional({ nullable: true })
    .isISO8601().withMessage('due_date must be a valid date (YYYY-MM-DD).'),

  body('tags')
    .optional()
    .isArray({ max: 10 }).withMessage('Tags must be an array with at most 10 items.')
    .custom((tags) => tags.every((t) => typeof t === 'string' && t.length <= 50))
    .withMessage('Each tag must be a string of at most 50 characters.'),

  body('user_id')
    .optional()
    .isUUID().withMessage('user_id must be a valid UUID.'),
];

const updateTaskValidator = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 }).withMessage('Title must be 1–255 characters.'),

  body('description')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 5000 }).withMessage('Description must not exceed 5000 characters.'),

  body('status')
    .optional()
    .isIn(['todo', 'in_progress', 'done']).withMessage('Status must be todo, in_progress, or done.'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high.'),

  body('due_date')
    .optional({ nullable: true })
    .isISO8601().withMessage('due_date must be a valid date (YYYY-MM-DD).'),

  body('tags')
    .optional()
    .isArray({ max: 10 }).withMessage('Tags must be an array with at most 10 items.'),

  body('user_id')
    .optional()
    .isUUID().withMessage('user_id must be a valid UUID.'),
];

const taskQueryValidator = [
  query('status').optional().isIn(['todo', 'in_progress', 'done']).withMessage('Invalid status filter.'),
  query('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority filter.'),
  query('user_id').optional().isUUID().withMessage('user_id must be a valid UUID.'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100.'),
  query('sortBy').optional().isIn(['created_at', 'updated_at', 'due_date', 'priority', 'status', 'title']).withMessage('Invalid sort field.'),
  query('sortOrder').optional().isIn(['ASC', 'DESC']).withMessage('sortOrder must be ASC or DESC.'),
];

const uuidParamValidator = [
  param('id').isUUID().withMessage('Invalid ID format. Must be a UUID.'),
];

module.exports = { createTaskValidator, updateTaskValidator, taskQueryValidator, uuidParamValidator };
