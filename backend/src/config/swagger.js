const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TaskFlow API',
      version: '1.0.0',
      description: `
Scalable REST API for secure task orchestration with JWT auth, refresh-token rotation, and role-based access control.

Authentication model:
- Short-lived access token returned in the JSON response
- Refresh token stored in an HttpOnly cookie
- Refresh token hashes persisted in PostgreSQL and rotated on every refresh

Roles:
- user: can manage only their own tasks
- admin: can see all tasks, assign ownership, and manage users
      `,
      contact: { name: 'TaskFlow API Support', email: 'support@taskflow.dev' },
      license: { name: 'MIT' },
    },
    servers: [
      { url: 'http://localhost:5000', description: 'Development server' },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token from /api/v1/auth/login.',
        },
        RefreshTokenCookie: {
          type: 'apiKey',
          in: 'cookie',
          name: process.env.REFRESH_COOKIE_NAME || 'taskflow_refresh_token',
          description: 'HttpOnly refresh-token cookie issued after login or register.',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            role: { type: 'string', enum: ['user', 'admin'] },
            is_active: { type: 'boolean' },
            last_login: { type: 'string', format: 'date-time', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Task: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            user_id: { type: 'string', format: 'uuid' },
            user_name: { type: 'string' },
            user_email: { type: 'string', format: 'email' },
            title: { type: 'string' },
            description: { type: 'string', nullable: true },
            status: { type: 'string', enum: ['todo', 'in_progress', 'done'] },
            priority: { type: 'string', enum: ['low', 'medium', 'high'] },
            due_date: { type: 'string', format: 'date', nullable: true },
            tags: { type: 'array', items: { type: 'string' } },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        SessionInfo: {
          type: 'object',
          properties: {
            refreshTokenTransport: {
              type: 'string',
              example: 'httpOnly-cookie',
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            user: { $ref: '#/components/schemas/User' },
            accessToken: { type: 'string' },
            expiresIn: { type: 'string', example: '15m' },
            session: { $ref: '#/components/schemas/SessionInfo' },
          },
        },
        TaskStats: {
          type: 'object',
          properties: {
            todo: { type: 'integer' },
            in_progress: { type: 'integer' },
            done: { type: 'integer' },
            high_priority_pending: { type: 'integer' },
            overdue: { type: 'integer' },
            total: { type: 'integer' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            requestId: { type: 'string', format: 'uuid' },
            message: { type: 'string' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                  value: {},
                },
              },
            },
          },
        },
      },
    },
    security: [{ BearerAuth: [] }],
  },
  apis: ['./src/routes/v1/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { background-color: #1a1a2e; }',
    customSiteTitle: 'TaskFlow API Docs',
  }));

  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};

module.exports = { setupSwagger };
