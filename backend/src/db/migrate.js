const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { query, connectDB } = require('../config/database');
const logger = require('../config/logger');

const migrate = async () => {
  try {
    await connectDB();
    logger.info('Running database migrations...');

    await query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email         VARCHAR(255) UNIQUE NOT NULL,
        name          VARCHAR(100) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role          VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
        is_active     BOOLEAN NOT NULL DEFAULT true,
        last_login    TIMESTAMPTZ,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title       VARCHAR(255) NOT NULL,
        description TEXT,
        status      VARCHAR(20) NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
        priority    VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
        due_date    DATE,
        tags        TEXT[],
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`);

    await query(`
      CREATE OR REPLACE FUNCTION update_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
      $$ LANGUAGE plpgsql;
    `);

    for (const table of ['users', 'tasks']) {
      await query(`
        DROP TRIGGER IF EXISTS set_updated_at ON ${table};
        CREATE TRIGGER set_updated_at
          BEFORE UPDATE ON ${table}
          FOR EACH ROW EXECUTE FUNCTION update_updated_at();
      `);
    }

    const bcrypt = require('bcryptjs');
    const adminExists = await query(`SELECT id FROM users WHERE email = 'admin@taskflow.dev'`);

    if (adminExists.rows.length === 0) {
      const hash = await bcrypt.hash('Admin@123456', 12);
      await query(
        `INSERT INTO users (email, name, password_hash, role)
         VALUES ($1, $2, $3, 'admin')`,
        ['admin@taskflow.dev', 'Admin User', hash]
      );
      logger.info('Seed admin user created: admin@taskflow.dev / Admin@123456');
    }

    logger.info('All migrations completed successfully');
    process.exit(0);
  } catch (err) {
    logger.error('Migration failed:', err);
    process.exit(1);
  }
};

migrate();
