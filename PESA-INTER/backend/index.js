/**
 * PESA-INTER Package - Main Backend Entry Point
 * 
 * This file provides the main entry point for the PESA-INTER backend package.
 * It exports all the necessary components for easy integration.
 * 
 * @author PESA-INTER Package
 * @version 1.0.0
 */

// Core services
const PesaPalService = require('./services/pesapalService');
const PaymentStorageService = require('./services/paymentStorageService');

// Controllers and routes
const PaymentController = require('./controllers/paymentController');
const createPaymentRoutes = require('./routes/payments');

// Utilities
const logger = require('./utils/logger');

// Export all components
module.exports = {
  // Services
  PesaPalService,
  PaymentStorageService,
  
  // Controllers
  PaymentController,
  
  // Routes
  createPaymentRoutes,
  
  // Utilities
  logger,
  
  // Convenience function to create a complete payment system
  createPaymentSystem: (config) => {
    const paymentController = new PaymentController(config);
    const paymentRoutes = createPaymentRoutes(config);
    
    return {
      controller: paymentController,
      routes: paymentRoutes,
      initialize: () => paymentController.initialize()
    };
  }
};

// Also export default for ES6 imports
module.exports.default = module.exports;
