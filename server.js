const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const http = require('http');

// Handle uncaught exceptions
process.on('uncaughtException', err => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

const app = require('./app');
const connectDB = require('./config/database');
const { createLogger } = require('./utils/logger');

const logger = createLogger(module);

// Connect to database
connectDB();

// Create HTTP server
const server = http.createServer(app);

// Start server
const port = process.env.PORT || 3000;
server.listen(port, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${port}`);
});

// Handle unhandled rejections
process.on('unhandledRejection', err => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle SIGTERM signal
process.on('SIGTERM', () => {
  logger.info('👋 SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    logger.info('💥 Process terminated!');
  });
}); 