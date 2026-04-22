const express = require('express');
const router = express.Router();

const TaskController = require('../../controllers/taskController');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/roleCheck');
const validate = require('../../middleware/validate');
const { uuidParamValidator } = require('../../validators/task.validator');

router.use(authenticate, authorize('admin'));

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin-only endpoints
 */

/**
 * @swagger
 * /api/v1/admin/users:
 *   get:
 *     summary: "[Admin] List all users"
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [user, admin] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200: { description: Paginated list of users }
 *       403: { description: Admin only }
 */
router.get('/users', TaskController.adminGetUsers);

/**
 * @swagger
 * /api/v1/admin/users/{id}/deactivate:
 *   patch:
 *     summary: "[Admin] Deactivate a user"
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: User deactivated }
 *       400: { description: Cannot deactivate yourself }
 *       404: { description: User not found }
 */
router.patch('/users/:id/deactivate', uuidParamValidator, validate, TaskController.adminDeactivateUser);

module.exports = router;
