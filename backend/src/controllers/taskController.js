const xss = require('xss');
const TaskModel = require('../models/Task');
const UserModel = require('../models/User');
const AppError = require('../utils/AppError');

const TaskController = {
  /**
   * GET /api/v1/tasks
   * Users see their own; admins see all
   */
  async getAll(req, res, next) {
    try {
      const { status, priority, search, page = 1, limit = 20, sortBy, sortOrder, user_id } = req.query;
      const isAdmin = req.user.role === 'admin';
      const assignedUserId = isAdmin ? user_id || null : req.user.id;

      const result = await TaskModel.findAll({
        userId: isAdmin ? null : req.user.id,
        assignedUserId: isAdmin ? assignedUserId : null,
        status,
        priority,
        search,
        page: parseInt(page),
        limit: Math.min(parseInt(limit), 100),
        sortBy,
        sortOrder,
      });

      res.json({
        success: true,
        data: result,
        meta: {
          page: result.page,
          totalPages: result.totalPages,
          total: result.total,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/tasks/stats
   */
  async getStats(req, res, next) {
    try {
      const isAdmin = req.user.role === 'admin';
      const targetUserId = isAdmin ? req.query.user_id || null : req.user.id;
      const stats = await TaskModel.getStats(targetUserId);
      res.json({ success: true, data: { stats } });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/tasks/:id
   */
  async getOne(req, res, next) {
    try {
      const task = await TaskModel.findById(req.params.id);

      if (!task) throw new AppError('Task not found.', 404);

      // Non-admins can only see their own tasks
      if (req.user.role !== 'admin' && task.user_id !== req.user.id) {
        throw new AppError('Access denied.', 403);
      }

      res.json({ success: true, data: { task } });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/tasks
   */
  async create(req, res, next) {
    try {
      const { title, description, status, priority, due_date, tags } = req.body;
      const isAdmin = req.user.role === 'admin';

      if (req.body.user_id && !isAdmin) {
        throw new AppError('Only admins can assign tasks to other users.', 403);
      }

      const userId = isAdmin && req.body.user_id ? req.body.user_id : req.user.id;
      const taskOwner = await UserModel.findById(userId);
      if (!taskOwner || !taskOwner.is_active) {
        throw new AppError('Assigned user not found or inactive.', 404);
      }

      const task = await TaskModel.create({
        userId,
        title: xss(title),
        description: description ? xss(description) : undefined,
        status,
        priority,
        due_date,
        tags: tags?.map((t) => xss(t)),
      });

      res.status(201).json({
        success: true,
        message: 'Task created successfully.',
        data: { task },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/v1/tasks/:id
   */
  async update(req, res, next) {
    try {
      const task = await TaskModel.findById(req.params.id);
      if (!task) throw new AppError('Task not found.', 404);
      const isAdmin = req.user.role === 'admin';

      if (!isAdmin && task.user_id !== req.user.id) {
        throw new AppError('Access denied.', 403);
      }

      const { title, description, status, priority, due_date, tags, user_id } = req.body;

      if (user_id && !isAdmin) {
        throw new AppError('Only admins can reassign tasks.', 403);
      }

      if (user_id) {
        const nextOwner = await UserModel.findById(user_id);
        if (!nextOwner || !nextOwner.is_active) {
          throw new AppError('Assigned user not found or inactive.', 404);
        }
      }

      const updated = await TaskModel.update(req.params.id, {
        title: title ? xss(title) : undefined,
        description: description !== undefined ? xss(description) : undefined,
        status,
        priority,
        due_date,
        tags: tags?.map((t) => xss(t)),
        user_id: isAdmin ? user_id : undefined,
      });

      res.json({
        success: true,
        message: 'Task updated successfully.',
        data: { task: updated },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/v1/tasks/:id
   */
  async delete(req, res, next) {
    try {
      const task = await TaskModel.findById(req.params.id);
      if (!task) throw new AppError('Task not found.', 404);

      if (req.user.role !== 'admin' && task.user_id !== req.user.id) {
        throw new AppError('Access denied.', 403);
      }

      await TaskModel.delete(req.params.id);

      res.json({ success: true, message: 'Task deleted successfully.' });
    } catch (err) {
      next(err);
    }
  },

  // ─── Admin-only ─────────────────────────────────────────────────────────────

  /**
   * GET /api/v1/admin/users
   */
  async adminGetUsers(req, res, next) {
    try {
      const { page = 1, limit = 20, role, search } = req.query;
      const result = await UserModel.findAll({
        page: parseInt(page),
        limit: Math.min(parseInt(limit), 100),
        role,
        search,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/v1/admin/users/:id/deactivate
   */
  async adminDeactivateUser(req, res, next) {
    try {
      if (req.params.id === req.user.id) {
        throw new AppError('You cannot deactivate your own account.', 400);
      }
      const user = await UserModel.deactivate(req.params.id);
      if (!user) throw new AppError('User not found.', 404);
      res.json({ success: true, message: 'User deactivated.' });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = TaskController;
