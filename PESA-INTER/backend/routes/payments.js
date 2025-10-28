const express = require('express');
const PaymentController = require('../controllers/paymentController');

/**
 * Payment Routes - PESA-INTER Package
 * Configurable payment routes for PesaPal integration
 * 
 * @author PESA-INTER Package
 * @version 1.0.0
 */

/**
 * Create payment routes with configuration
 * @param {Object} config - Configuration object
 * @returns {express.Router} - Configured router
 */
function createPaymentRoutes(config = {}) {
  const router = express.Router();
  
  // Initialize payment controller with config
  const paymentController = new PaymentController(config);

  // ============================================================================
  // MIDDLEWARE
  // ============================================================================

  // Request logging middleware
  const logRequest = (req, res, next) => {
    const logger = config.logger || console;
    logger.info('Payment API request', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    next();
  };

  // Security headers for payment endpoints
  const securityHeaders = (req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    });
    next();
  };

  // Basic validation middleware
  const validatePaymentInit = (req, res, next) => {
    const { amount, description } = req.body;
    
    if (!amount || !description) {
      return res.status(400).json({
        success: false,
        message: 'Amount and description are required'
      });
    }

    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number'
      });
    }

    if (description.length < 5 || description.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Description must be between 5 and 100 characters'
      });
    }

    next();
  };

  // Apply general middleware to all routes
  router.use(logRequest);
  router.use(securityHeaders);

  // ============================================================================
  // ROUTES
  // ============================================================================

  /**
   * @route   POST /api/payments/initialize
   * @desc    Initialize a new payment with PesaPal
   * @access  Public
   */
  router.post('/initialize', validatePaymentInit, paymentController.initializePayment);

  /**
   * @route   GET /api/payments/pesapal/callback
   * @desc    Handle payment callback from PesaPal
   * @access  Public (PesaPal callback)
   */
  router.get('/pesapal/callback', paymentController.handleCallback);

  /**
   * @route   POST /api/payments/pesapal/ipn
   * @desc    Handle IPN notifications from PesaPal
   * @access  Public (PesaPal IPN)
   */
  router.post('/pesapal/ipn', paymentController.handleIPN);

  /**
   * @route   GET /api/payments/:merchantReference/status
   * @desc    Get payment status by merchant reference
   * @access  Public
   */
  router.get('/:merchantReference/status', paymentController.getPaymentStatus);

  /**
   * @route   GET /api/payments/stats
   * @desc    Get payment statistics
   * @access  Public (consider adding authentication for production)
   */
  router.get('/stats', paymentController.getPaymentStats);

  /**
   * @route   GET /api/payments/history
   * @desc    Get payment history with pagination
   * @access  Public (consider adding authentication for production)
   */
  router.get('/history', paymentController.getPaymentHistory);

  /**
   * @route   GET /api/payments/test
   * @desc    Test endpoint to verify PesaPal service
   * @access  Public (development only)
   */
  router.get('/test', async (req, res) => {
    try {
      if (process.env.NODE_ENV === 'production') {
        return res.status(404).json({
          success: false,
          message: 'Test endpoint not available in production'
        });
      }

      // Test authentication
      const token = await paymentController.pesapalService.authenticate();
      
      res.json({
        success: true,
        message: 'PesaPal service test successful',
        data: {
          authenticated: !!token,
          tokenExpiry: paymentController.pesapalService.tokenExpiry,
          ipnId: paymentController.pesapalService.ipnId,
          environment: paymentController.pesapalService.isProduction ? 'Production' : 'Sandbox',
          baseURL: paymentController.pesapalService.baseURL
        }
      });
      
    } catch (error) {
      const logger = config.logger || console;
      logger.error('PesaPal test failed:', error);
      res.status(500).json({
        success: false,
        message: 'PesaPal service test failed',
        error: error.message
      });
    }
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  // 404 handler for payment routes
  router.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: 'Payment endpoint not found',
      path: req.originalUrl
    });
  });

  // Payment-specific error handler
  router.use((error, req, res, next) => {
    const logger = config.logger || console;
    logger.error('Payment route error:', error);
    
    // PesaPal service errors
    if (error.message.includes('Authentication failed')) {
      return res.status(401).json({
        success: false,
        message: 'Payment service authentication failed',
        error: 'Please try again later'
      });
    }
    
    if (error.message.includes('Order submission failed')) {
      return res.status(400).json({
        success: false,
        message: 'Payment initialization failed',
        error: 'Please check your payment details and try again'
      });
    }
    
    // Network/timeout errors
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return res.status(503).json({
        success: false,
        message: 'Payment service temporarily unavailable',
        error: 'Please try again in a few moments'
      });
    }
    
    // Default error
    res.status(error.status || 500).json({
      success: false,
      message: 'Payment processing error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  });

  return router;
}

// Export the route factory function
module.exports = createPaymentRoutes;

// Also export a default router for simple usage
module.exports.defaultRouter = createPaymentRoutes();
