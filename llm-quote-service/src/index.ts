import express, { Application } from 'express';
import cors from 'cors';
import { config, validateConfig } from './config/index.js';
import { router, redisService } from './routes/index.js';
import { logger } from './utils/logger.js';

// Validate configuration
try {
  validateConfig();
} catch (error) {
  logger.error('Configuration validation failed', { error });
  process.exit(1);
}

const app: Application = express();

// Middleware
app.use(cors({
  origin: config.server.corsOrigins,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Routes
app.use('/api/v1', router);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'llm-quote-service',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/v1/health',
      conversations: '/api/v1/conversations',
      documentation: '/api/docs'
    }
  });
});

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err, path: req.path });

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: config.server.env === 'development' ? err.message : 'An error occurred'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Start server
async function startServer() {
  try {
    // Connect to Redis
    logger.info('Connecting to Redis...');
    await redisService.connect();
    logger.info('Redis connected successfully');

    // Start HTTP server
    app.listen(config.server.port, () => {
      logger.info(`🚀 LLM Quote Service started on port ${config.server.port}`);
      logger.info(`📖 Health Check: http://localhost:${config.server.port}/api/v1/health`);
      logger.info(`🌍 Environment: ${config.server.env}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await redisService.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await redisService.disconnect();
  process.exit(0);
});

// Start the server
startServer();
