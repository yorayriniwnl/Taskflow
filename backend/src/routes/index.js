const express = require('express');
const router = express.Router();

const authRoutes = require('./v1/auth.routes');
const taskRoutes = require('./v1/task.routes');
const adminRoutes = require('./v1/admin.routes');

// ── API v1 ────────────────────────────────────────────────────────────────────
router.use('/v1/auth', authRoutes);
router.use('/v1/tasks', taskRoutes);
router.use('/v1/admin', adminRoutes);

// ── Version info ──────────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'TaskFlow API',
    versions: {
      v1: '/api/v1',
    },
    docs: '/api-docs',
    health: '/health',
  });
});

module.exports = router;
