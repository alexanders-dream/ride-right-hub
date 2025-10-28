/**
 * PESA-INTER Package - Express.js Backend Example
 * 
 * This example shows how to integrate PESA-INTER into an Express.js application
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import PESA-INTER components
const createPaymentRoutes = require('../backend/routes/payments');
const PaymentController = require('../backend/controllers/paymentController');
const logger = require('../backend/utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);

// ============================================================================
// PESA-INTER CONFIGURATION
// ============================================================================

const pesaInterConfig = {
  // Business configuration
  businessName: process.env.BUSINESS_NAME || 'My Business',
  frontendURL: process.env.FRONTEND_URL || 'http://localhost:3000',
  callbackBaseURL: process.env.CALLBACK_BASE_URL || 'http://localhost:3000',
  
  // PesaPal configuration
  consumerKey: process.env.PESAPAL_CONSUMER_KEY,
  consumerSecret: process.env.PESAPAL_CONSUMER_SECRET,
  environment: process.env.PESAPAL_ENVIRONMENT || 'sandbox',
  
  // Storage configuration
  enableFileStorage: process.env.ENABLE_FILE_STORAGE !== 'false',
  enableDatabase: process.env.ENABLE_DATABASE_STORAGE === 'true',
  paymentDir: process.env.PAYMENT_STORAGE_DIR || 'Payment',
  
  // Logging configuration
  logger: logger,
  debug: process.env.DEBUG_MODE === 'true'
};

// ============================================================================
// ROUTES
// ============================================================================

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'PESA-INTER Backend',
    version: '1.0.0'
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'PESA-INTER API',
    version: '1.0.0',
    description: 'PesaPal payment integration API',
    endpoints: {
      payments: {
        initialize: 'POST /api/payments/initialize',
        status: 'GET /api/payments/:merchantReference/status',
        stats: 'GET /api/payments/stats',
        history: 'GET /api/payments/history',
        callback: 'GET /api/payments/pesapal/callback',
        ipn: 'POST /api/payments/pesapal/ipn'
      }
    }
  });
});

// Mount payment routes with configuration
app.use('/api/payments', createPaymentRoutes(pesaInterConfig));

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use((error, req, res, next) => {
  logger.error('Global error handler:', error);
  
  res.status(error.status || 500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

async function startServer() {
  try {
    // Initialize payment controller
    const paymentController = new PaymentController(pesaInterConfig);
    await paymentController.initialize();
    
    // Start server
    app.listen(PORT, () => {
      logger.info(`🚀 PESA-INTER Backend running on port ${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`💳 Payment API: http://localhost:${PORT}/api/payments`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🏢 Business: ${pesaInterConfig.businessName}`);
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
