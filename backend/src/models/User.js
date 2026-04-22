const { query } = require('../config/database');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

const UserModel = {
  /**
   * Create a new user
   */
  async create({ email, name, password, role = 'user' }) {
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await query(
      `INSERT INTO users (email, name, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, role, is_active, created_at`,
      [email.toLowerCase().trim(), name.trim(), password_hash, role]
    );
    return result.rows[0];
  },

  /**
   * Find user by email (includes password_hash for auth)
   */
  async findByEmail(email) {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );
    return result.rows[0] || null;
  },

  /**
   * Find user by ID (safe – no password)
   */
  async findById(id) {
    const result = await query(
      'SELECT id, email, name, role, is_active, last_login, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  /**
   * Get all users (admin only)
   */
  async findAll({ page = 1, limit = 20, role, search } = {}) {
    const offset = (page - 1) * limit;
    let conditions = [];
    let params = [];
    let idx = 1;

    if (role) { conditions.push(`role = $${idx++}`); params.push(role); }
    if (search) {
      conditions.push(`(name ILIKE $${idx} OR email ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [users, count] = await Promise.all([
      query(
        `SELECT id, email, name, role, is_active, last_login, created_at
         FROM users ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, limit, offset]
      ),
      query(`SELECT COUNT(*) FROM users ${where}`, params),
    ]);

    return {
      users: users.rows,
      total: parseInt(count.rows[0].count),
      page,
      totalPages: Math.ceil(parseInt(count.rows[0].count) / limit),
    };
  },

  /**
   * Update user profile
   */
  async update(id, { name, email }) {
    const fields = [];
    const params = [];
    let idx = 1;

    if (name) { fields.push(`name = $${idx++}`); params.push(name.trim()); }
    if (email) { fields.push(`email = $${idx++}`); params.push(email.toLowerCase().trim()); }

    if (fields.length === 0) return UserModel.findById(id);

    params.push(id);
    const result = await query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx}
       RETURNING id, email, name, role, is_active, created_at, updated_at`,
      params
    );
    return result.rows[0];
  },

  /**
   * Change password
   */
  async updatePassword(id, newPassword) {
    const password_hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [password_hash, id]);
  },

  /**
   * Update last login timestamp
   */
  async updateLastLogin(id) {
    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [id]);
  },

  /**
   * Soft-delete or deactivate a user
   */
  async deactivate(id) {
    const result = await query(
      'UPDATE users SET is_active = false WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0];
  },

  /**
   * Verify password against hash
   */
  async verifyPassword(plainPassword, hash) {
    return bcrypt.compare(plainPassword, hash);
  },
};

module.exports = UserModel;
