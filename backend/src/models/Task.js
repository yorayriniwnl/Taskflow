const { query } = require('../config/database');
const { buildPaginationMeta, parseDatabaseInt } = require('../utils/pagination');

const TaskModel = {
  /**
   * Create a task
   */
  async create({ userId, title, description, status, priority, due_date, tags }) {
    const result = await query(
      `INSERT INTO tasks (user_id, title, description, status, priority, due_date, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [userId, title.trim(), description?.trim() || null, status || 'todo', priority || 'medium', due_date || null, tags || []]
    );
    return TaskModel.findById(result.rows[0].id);
  },

  /**
   * Find tasks with filters and pagination
   * @param {string|null} userId - null means admin fetching all
   */
  async findAll({
    userId = null,
    assignedUserId,
    status,
    priority,
    search,
    page = 1,
    limit = 20,
    sortBy = 'created_at',
    sortOrder = 'DESC',
  } = {}) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];
    let idx = 1;

    if (userId) { conditions.push(`t.user_id = $${idx++}`); params.push(userId); }
    if (assignedUserId) { conditions.push(`t.user_id = $${idx++}`); params.push(assignedUserId); }
    if (status) { conditions.push(`t.status = $${idx++}`); params.push(status); }
    if (priority) { conditions.push(`t.priority = $${idx++}`); params.push(priority); }
    if (search) {
      conditions.push(`(
        t.title ILIKE $${idx}
        OR t.description ILIKE $${idx}
        OR u.name ILIKE $${idx}
        OR u.email ILIKE $${idx}
      )`);
      params.push(`%${search}%`);
      idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const validSortCols = ['created_at', 'updated_at', 'due_date', 'priority', 'status', 'title'];
    const col = validSortCols.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const [tasks, count] = await Promise.all([
      query(
        `SELECT t.*, u.name as user_name, u.email as user_email
         FROM tasks t
         JOIN users u ON t.user_id = u.id
         ${where}
        ORDER BY t.${col} ${order}
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, limit, offset]
      ),
      query(
        `SELECT COUNT(*)
         FROM tasks t
         JOIN users u ON t.user_id = u.id
         ${where}`,
        params
      ),
    ]);

    const total = parseDatabaseInt(count.rows[0].count);

    return {
      tasks: tasks.rows,
      ...buildPaginationMeta(total, page, limit),
    };
  },

  /**
   * Find single task by ID
   */
  async findById(id) {
    const result = await query(
      `SELECT t.*, u.name as user_name, u.email as user_email
       FROM tasks t JOIN users u ON t.user_id = u.id
       WHERE t.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  /**
   * Update a task
   */
  async update(id, { title, description, status, priority, due_date, tags, user_id }) {
    const fields = [];
    const params = [];
    let idx = 1;

    if (title !== undefined)       { fields.push(`title = $${idx++}`);       params.push(title.trim()); }
    if (description !== undefined) { fields.push(`description = $${idx++}`); params.push(description?.trim() || null); }
    if (status !== undefined)      { fields.push(`status = $${idx++}`);      params.push(status); }
    if (priority !== undefined)    { fields.push(`priority = $${idx++}`);    params.push(priority); }
    if (due_date !== undefined)    { fields.push(`due_date = $${idx++}`);    params.push(due_date || null); }
    if (tags !== undefined)        { fields.push(`tags = $${idx++}`);        params.push(tags); }
    if (user_id !== undefined)     { fields.push(`user_id = $${idx++}`);     params.push(user_id); }

    if (fields.length === 0) return TaskModel.findById(id);

    params.push(id);
    const result = await query(
      `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id`,
      params
    );
    return TaskModel.findById(result.rows[0].id);
  },

  /**
   * Delete a task
   */
  async delete(id) {
    const result = await query('DELETE FROM tasks WHERE id = $1 RETURNING id', [id]);
    return result.rows[0] || null;
  },

  /**
   * Get task statistics for a user (or all tasks for admin)
   */
  async getStats(userId = null) {
    const where = userId ? 'WHERE user_id = $1' : '';
    const params = userId ? [userId] : [];

    const result = await query(
      `SELECT
        COUNT(*) FILTER (WHERE status = 'todo') as todo,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'done') as done,
        COUNT(*) FILTER (WHERE priority = 'high' AND status != 'done') as high_priority_pending,
        COUNT(*) FILTER (WHERE due_date < NOW() AND status != 'done') as overdue,
        COUNT(*) as total
       FROM tasks ${where}`,
      params
    );
    const stats = result.rows[0];

    return {
      todo: parseDatabaseInt(stats.todo),
      in_progress: parseDatabaseInt(stats.in_progress),
      done: parseDatabaseInt(stats.done),
      high_priority_pending: parseDatabaseInt(stats.high_priority_pending),
      overdue: parseDatabaseInt(stats.overdue),
      total: parseDatabaseInt(stats.total),
    };
  },
};

module.exports = TaskModel;
