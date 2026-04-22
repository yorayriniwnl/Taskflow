require('dotenv').config();

const app = require('./src/app');
const { pool, connectDB } = require('./src/config/database');
const { validateRuntimeConfig } = require('./src/config/env');
const logger = require('./src/config/logger');

const PORT = process.env.PORT || 5000;
let server;

const shutdown = async (signal, exitCode = 0) => {
  logger.info(`${signal} received. Shutting down gracefully.`);

  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    }

    await pool.end();
    process.exit(exitCode);
  } catch (error) {
    logger.error(error.stack || error.message || String(error));
    process.exit(1);
  }
};

const startServer = async () => {
  try {
    validateRuntimeConfig();
    await connectDB();
    logger.info('Database connected successfully.');

    server = app.listen(PORT, () => {
      logger.info(`TaskFlow API running on port ${PORT}.`);
      logger.info(`Swagger docs available at http://localhost:${PORT}/api-docs.`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}.`);
    });
  } catch (error) {
    logger.error(error.stack || error.message || String(error));
    process.exit(1);
  }
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('unhandledRejection', (error) => {
  logger.error(`Unhandled promise rejection: ${error.stack || error.message || error}`);
  void shutdown('unhandledRejection', 1);
});
process.on('uncaughtException', (error) => {
  logger.error(`Uncaught exception: ${error.stack || error.message || error}`);
  void shutdown('uncaughtException', 1);
});

startServer();
