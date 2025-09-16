import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Import backend routers
import identityRouter from './backend/identity';
import daoRouter from './backend/dao';
import watermarkRouter from './backend/watermark';
import analyticsRouter from './backend/analytics';
import crossChainRouter from './backend/crossChain';
import aiDetectionRouter from './backend/aiDetection';

// Import services
import { initializeBlockchainConnection } from './utils/blockchain';
import { initializeDatabase } from './utils/database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
app.use('/api/identity', identityRouter);
app.use('/api/dao', daoRouter);
app.use('/api/watermark', watermarkRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/cross-chain', crossChainRouter);
app.use('/api/ai', aiDetectionRouter);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Initialize services and start server
async function startServer() {
  try {
    // Initialize blockchain connection
    await initializeBlockchainConnection();

    // Initialize database connection (if needed)
    await initializeDatabase();

    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 OUI Backend Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`📋 API Documentation: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();