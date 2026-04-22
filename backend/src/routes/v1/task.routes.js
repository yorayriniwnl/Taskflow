const express = require('express');
const router = express.Router();

const TaskController = require('../../controllers/taskController');
const { authenticate } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const {
  createTaskValidator,
  updateTaskValidator,
  taskQueryValidator,
  uuidParamValidator,
} = require('../../validators/task.validator');

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Task management (users see their own tasks; admins see all and can assign ownership)
 */

/**
 * @swagger
 * /api/v1/tasks:
 *   get:
 *     summary: Get tasks (user sees own; admin sees all)
 *     tags: [Tasks]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [todo, in_progress, done] }
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [low, medium, high] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: user_id
 *         description: Admin-only filter for assignee
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [created_at, updated_at, due_date, priority, status, title] }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [ASC, DESC] }
 *     responses:
 *       200:
 *         description: Paginated list of tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     tasks:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Task' }
 *                     total: { type: integer }
 *                     page: { type: integer }
 *                     totalPages: { type: integer }
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string, example: "Build REST API" }
 *               description: { type: string }
 *               status: { type: string, enum: [todo, in_progress, done], default: todo }
 *               priority: { type: string, enum: [low, medium, high], default: medium }
 *               due_date: { type: string, format: date, example: "2025-12-31" }
 *               tags: { type: array, items: { type: string } }
 *               user_id:
 *                 type: string
 *                 format: uuid
 *                 description: Admin-only assignee override
 *     responses:
 *       201: { description: Task created }
 *       422: { description: Validation error }
 */
router.get('/', taskQueryValidator, validate, TaskController.getAll);
router.post('/', createTaskValidator, validate, TaskController.create);

/**
 * @swagger
 * /api/v1/tasks/stats:
 *   get:
 *     summary: Get task statistics
 *     tags: [Tasks]
 *     parameters:
 *       - in: query
 *         name: user_id
 *         description: Admin-only filter for assignee statistics
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Task statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     stats: { $ref: '#/components/schemas/TaskStats' }
 */
router.get('/stats', taskQueryValidator, validate, TaskController.getStats);

/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   get:
 *     summary: Get a single task by ID
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Task found }
 *       403: { description: Access denied }
 *       404: { description: Task not found }
 *   put:
 *     summary: Update a task
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               status: { type: string, enum: [todo, in_progress, done] }
 *               priority: { type: string, enum: [low, medium, high] }
 *               due_date: { type: string, format: date }
 *               tags: { type: array, items: { type: string } }
 *               user_id:
 *                 type: string
 *                 format: uuid
 *                 description: Admin-only assignee override
 *     responses:
 *       200: { description: Task updated }
 *       403: { description: Access denied }
 *       404: { description: Task not found }
 *   delete:
 *     summary: Delete a task
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Task deleted }
 *       403: { description: Access denied }
 *       404: { description: Task not found }
 */
router.get('/:id', uuidParamValidator, validate, TaskController.getOne);
router.put('/:id', uuidParamValidator, updateTaskValidator, validate, TaskController.update);
router.delete('/:id', uuidParamValidator, validate, TaskController.delete);

module.exports = router;
