import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import enrollmentRoutes from './routes/enrollment.routes.v2.js';
import agentRoutes from './routes/agent.routes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import pool from './config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Trust proxy for rate limiting and IP detection
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  })
);

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'yadmanx Enrollment Service',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    documentation: '/api/docs/',
  });
});

// Health check endpoint
app.get('/api/v1/health', async (req, res) => {
  try {
    // Check database connection
    await pool.query('SELECT 1');

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message,
    });
  }
});

// API Documentation
app.get('/api/docs/', (req, res) => {
  try {
    const docsPath = path.join(__dirname, 'docs', 'api.html');
    if (fs.existsSync(docsPath)) {
      const docsContent = fs.readFileSync(docsPath, 'utf8');
      res.set('Content-Type', 'text/html');
      res.send(docsContent);
    } else {
      res.status(404).json({
        error: 'Documentation not found',
        message: 'API documentation is being prepared',
      });
    }
  } catch (error) {
    console.error('Error serving documentation:', error);
    res.status(500).json({ error: 'Error loading documentation' });
  }
});

// API routes
app.use('/api/v1', agentRoutes);
app.use('/api/v1', enrollmentRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);

  try {
    await pool.end();
    console.log('Database connections closed');
  } catch (error) {
    console.error('Error closing database connections:', error);
  }

  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await pool.query('SELECT 1');
    console.log('✅ Database connected');

    const server = app.listen(PORT, () => {
      console.log(`🚀 Enrollment Service started on port ${PORT}`);
      console.log(`📖 API Documentation: http://localhost:${PORT}/api/docs/`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/api/v1/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
      } else {
        console.error('Server error:', error);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

export default app;