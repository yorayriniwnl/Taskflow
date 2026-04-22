const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { setupSwagger } = require('./config/swagger');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const requestContext = require('./middleware/requestContext');
const logger = require('./config/logger');

const app = express();

// ─── Security Middleware ─────────────────────────────────────────────────────
app.use(helmet());                          // Set secure HTTP headers
app.use(cors({
  origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ─── Rate Limiting ───────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many authentication attempts. Please try again in 15 minutes.' },
});

app.use('/api/', limiter);
app.use('/api/v1/auth', authLimiter);

// ─── General Middleware ──────────────────────────────────────────────────────
app.use(compression());
app.use(requestContext);
app.use(express.json({ limit: '10kb' }));   // Limit body size
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// HTTP request logging
morgan.token('request-id', (req) => req.id);

app.use(morgan(':method :url :status :res[content-length] - :response-time ms reqId=:request-id', {
  stream: { write: (message) => logger.http(message.trim()) },
}));

// ─── API Documentation ───────────────────────────────────────────────────────
setupSwagger(app);

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api', routes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV,
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
