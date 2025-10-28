const PesaPalService = require('../services/pesapalService');
const PaymentStorageService = require('../services/paymentStorageService');
const logger = require('../utils/logger');

/**
 * Payment Controller for PesaPal integration - Reusable Package
 * Handles all payment-related operations
 * 
 * @author PESA-INTER Package
 * @version 1.0.0
 */
class PaymentController {
  constructor(config = {}) {
    this.config = {
      businessName: config.businessName || process.env.BUSINESS_NAME || 'Your Business',
      frontendURL: config.frontendURL || process.env.FRONTEND_URL || 'http://localhost:3000',
      callbackBaseURL: config.callbackBaseURL || process.env.CALLBACK_BASE_URL || 'http://localhost:3000',
      logger: config.logger || logger,
      enableFileStorage: config.enableFileStorage !== false,
      enableDatabase: config.enableDatabase || false,
      ...config
    };

    // Initialize services
    this.pesapalService = new PesaPalService({
      ...config,
      logger: this.config.logger
    });

    if (this.config.enableFileStorage) {
      this.paymentStorageService = new PaymentStorageService({
        ...config,
        logger: this.config.logger
      });
    }

    // Bind methods to preserve context
    this.initializePayment = this.initializePayment.bind(this);
    this.handleCallback = this.handleCallback.bind(this);
    this.handleIPN = this.handleIPN.bind(this);
    this.getPaymentStatus = this.getPaymentStatus.bind(this);
    this.getPaymentStats = this.getPaymentStats.bind(this);
    this.getPaymentHistory = this.getPaymentHistory.bind(this);
  }

  /**
   * Initialize a new payment
   * POST /api/payments/initialize
   */
  async initializePayment(req, res) {
    try {
      // Validate request (you may want to add express-validator)
      const {
        amount,
        description,
        customerEmail,
        customerPhone,
        firstName,
        lastName,
        paymentType = 'OTHER',
        paymentMethod = 'PESAPAL',
        metadata = {}
      } = req.body;

      // Basic validation
      if (!amount || !description) {
        return res.status(400).json({
          success: false,
          message: 'Amount and description are required'
        });
      }

      if (!customerEmail && !customerPhone) {
        return res.status(400).json({
          success: false,
          message: 'Either customer email or phone number is required'
        });
      }

      // Generate unique merchant reference
      const merchantReference = this.pesapalService.generateMerchantReference('PAY');
      
      // Prepare callback URLs
      const callbackURL = `${this.config.frontendURL}/payment/callback?ref=${merchantReference}`;
      const cancellationURL = `${this.config.frontendURL}/payment/cancelled?ref=${merchantReference}`;

      // Create payment record
      const payment = {
        merchantReference,
        amount: parseFloat(amount),
        currency: 'KES',
        description,
        customer: {
          email: customerEmail,
          phone: customerPhone,
          firstName,
          lastName
        },
        callbackURL,
        cancellationURL,
        paymentType,
        paymentMethod,
        metadata,
        status: 'PENDING',
        pesapalData: {},
        createdAt: new Date().toISOString()
      };

      // Prepare order data for PesaPal
      const orderData = {
        merchantReference,
        amount,
        description,
        callbackURL,
        cancellationURL,
        customerEmail,
        customerPhone,
        firstName,
        lastName,
        branch: this.config.businessName
      };

      // Submit order to PesaPal
      const pesapalResponse = await this.pesapalService.submitOrderRequest(orderData);

      // Update payment with PesaPal data
      payment.orderTrackingId = pesapalResponse.orderTrackingId;
      payment.pesapalData.redirectURL = pesapalResponse.redirectURL;
      payment.pesapalData.ipnId = this.pesapalService.ipnId;

      // Save payment to file storage
      if (this.config.enableFileStorage && this.paymentStorageService) {
        try {
          await this.paymentStorageService.savePayment(payment);
        } catch (storageError) {
          this.config.logger.warn('Failed to save payment to file storage:', storageError);
          // Don't fail the payment if file storage fails
        }
      }

      this.config.logger.info('Payment initialized successfully', {
        merchantReference,
        orderTrackingId: pesapalResponse.orderTrackingId,
        amount: `KES ${amount}`,
        paymentMethod
      });

      res.json({
        success: true,
        message: 'Payment initialized successfully',
        data: {
          merchantReference,
          orderTrackingId: pesapalResponse.orderTrackingId,
          redirectURL: pesapalResponse.redirectURL,
          amount: parseFloat(amount),
          currency: 'KES',
          description,
          paymentMethod
        }
      });

    } catch (error) {
      this.config.logger.error('Payment initialization failed:', error);
      res.status(500).json({
        success: false,
        message: 'Payment initialization failed',
        error: error.message
      });
    }
  }

  /**
   * Handle payment callback from PesaPal
   * GET /api/payments/pesapal/callback
   */
  async handleCallback(req, res) {
    try {
      const { OrderTrackingId, OrderMerchantReference, OrderNotificationType } = req.query;

      if (!OrderTrackingId || !OrderMerchantReference) {
        return res.status(400).json({
          success: false,
          message: 'Missing required callback parameters'
        });
      }

      // Find payment record in file storage
      let payment = null;
      if (this.config.enableFileStorage && this.paymentStorageService) {
        try {
          const filePayment = await this.paymentStorageService.findPaymentByReference(OrderMerchantReference);
          if (filePayment) {
            payment = filePayment.payment;
            payment.filename = filePayment.filename;
          }
        } catch (fileError) {
          this.config.logger.warn('Failed to find payment in file storage:', fileError);
        }
      }

      if (!payment) {
        this.config.logger.error('Payment not found for callback', { OrderMerchantReference });
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      // Get transaction status from PesaPal
      const transactionStatus = await this.pesapalService.getTransactionStatus(OrderTrackingId);
      
      // Update payment status
      const statusMap = {
        'Completed': 'COMPLETED',
        'Failed': 'FAILED',
        'Invalid': 'INVALID',
        'Reversed': 'REVERSED'
      };

      const newStatus = statusMap[transactionStatus.paymentStatus] || 'PENDING';
      
      if (newStatus !== payment.status) {
        payment.status = newStatus;
        payment.updatedAt = new Date().toISOString();
        
        // Update PesaPal data
        payment.pesapalData = {
          ...payment.pesapalData,
          paymentMethod: transactionStatus.paymentMethod,
          confirmationCode: transactionStatus.confirmationCode,
          paymentAccount: transactionStatus.paymentAccount,
          createdDate: new Date(transactionStatus.createdDate)
        };

        // Update file storage
        if (this.config.enableFileStorage && this.paymentStorageService && payment.filename) {
          try {
            await this.paymentStorageService.updatePayment(payment.filename, payment);
          } catch (updateError) {
            this.config.logger.warn('Failed to update payment in file storage:', updateError);
          }
        }
      }

      this.config.logger.info('Payment callback processed', {
        merchantReference: OrderMerchantReference,
        status: newStatus,
        paymentMethod: transactionStatus.paymentMethod
      });

      // Redirect to frontend with payment status
      const redirectURL = `${this.config.frontendURL}/payment/result?ref=${OrderMerchantReference}&status=${newStatus.toLowerCase()}`;
      res.redirect(redirectURL);

    } catch (error) {
      this.config.logger.error('Callback processing failed:', error);
      const redirectURL = `${this.config.frontendURL}/payment/error`;
      res.redirect(redirectURL);
    }
  }

  /**
   * Handle IPN notifications from PesaPal
   * POST /api/payments/pesapal/ipn
   */
  async handleIPN(req, res) {
    try {
      const { OrderTrackingId, OrderMerchantReference, OrderNotificationType } = req.body;

      if (!OrderTrackingId || !OrderMerchantReference || OrderNotificationType !== 'IPNCHANGE') {
        return res.status(400).json({
          orderNotificationType: "IPNCHANGE",
          orderTrackingId: OrderTrackingId,
          orderMerchantReference: OrderMerchantReference,
          status: 400
        });
      }

      // Find payment record
      let payment = null;
      if (this.config.enableFileStorage && this.paymentStorageService) {
        try {
          const filePayment = await this.paymentStorageService.findPaymentByReference(OrderMerchantReference);
          if (filePayment) {
            payment = filePayment.payment;
            payment.filename = filePayment.filename;
          }
        } catch (fileError) {
          this.config.logger.warn('Failed to find payment in file storage:', fileError);
        }
      }

      if (!payment) {
        this.config.logger.error('Payment not found for IPN', { OrderMerchantReference });
        return res.status(404).json({
          orderNotificationType: "IPNCHANGE",
          orderTrackingId: OrderTrackingId,
          orderMerchantReference: OrderMerchantReference,
          status: 404
        });
      }

      try {
        // Get transaction status from PesaPal
        const transactionStatus = await this.pesapalService.getTransactionStatus(OrderTrackingId);
        
        // Update payment status
        const statusMap = {
          'Completed': 'COMPLETED',
          'Failed': 'FAILED',
          'Invalid': 'INVALID',
          'Reversed': 'REVERSED'
        };

        const newStatus = statusMap[transactionStatus.paymentStatus] || 'PENDING';
        
        if (newStatus !== payment.status) {
          payment.status = newStatus;
          payment.updatedAt = new Date().toISOString();
          
          // Update PesaPal data
          payment.pesapalData = {
            ...payment.pesapalData,
            paymentMethod: transactionStatus.paymentMethod,
            confirmationCode: transactionStatus.confirmationCode,
            paymentAccount: transactionStatus.paymentAccount,
            createdDate: new Date(transactionStatus.createdDate)
          };

          // Update file storage
          if (this.config.enableFileStorage && this.paymentStorageService && payment.filename) {
            try {
              await this.paymentStorageService.updatePayment(payment.filename, payment);
            } catch (updateError) {
              this.config.logger.warn('Failed to update payment in file storage:', updateError);
            }
          }
        }

        this.config.logger.info('IPN processed successfully', {
          merchantReference: OrderMerchantReference,
          status: newStatus,
          paymentMethod: transactionStatus.paymentMethod
        });

        // Respond to PesaPal
        res.json({
          orderNotificationType: "IPNCHANGE",
          orderTrackingId: OrderTrackingId,
          orderMerchantReference: OrderMerchantReference,
          status: 200
        });

      } catch (statusError) {
        this.config.logger.error('IPN status check failed:', statusError);
        
        res.status(500).json({
          orderNotificationType: "IPNCHANGE",
          orderTrackingId: OrderTrackingId,
          orderMerchantReference: OrderMerchantReference,
          status: 500
        });
      }

    } catch (error) {
      this.config.logger.error('IPN processing failed:', error);
      res.status(500).json({
        orderNotificationType: "IPNCHANGE",
        orderTrackingId: req.body.OrderTrackingId,
        orderMerchantReference: req.body.OrderMerchantReference,
        status: 500
      });
    }
  }

  /**
   * Get payment status
   * GET /api/payments/:merchantReference/status
   */
  async getPaymentStatus(req, res) {
    try {
      const { merchantReference } = req.params;
      
      let payment = null;
      if (this.config.enableFileStorage && this.paymentStorageService) {
        try {
          const filePayment = await this.paymentStorageService.findPaymentByReference(merchantReference);
          if (filePayment) {
            payment = filePayment.payment;
          }
        } catch (fileError) {
          this.config.logger.warn('Failed to find payment in file storage:', fileError);
        }
      }

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      // If payment is still pending and has an order tracking ID, check with PesaPal
      if (payment.status === 'PENDING' && payment.orderTrackingId) {
        try {
          const transactionStatus = await this.pesapalService.getTransactionStatus(payment.orderTrackingId);
          
          const statusMap = {
            'Completed': 'COMPLETED',
            'Failed': 'FAILED',
            'Invalid': 'INVALID',
            'Reversed': 'REVERSED'
          };

          const newStatus = statusMap[transactionStatus.paymentStatus] || 'PENDING';
          
          if (newStatus !== payment.status) {
            payment.status = newStatus;
            payment.updatedAt = new Date().toISOString();
            
            payment.pesapalData = {
              ...payment.pesapalData,
              paymentMethod: transactionStatus.paymentMethod,
              confirmationCode: transactionStatus.confirmationCode,
              paymentAccount: transactionStatus.paymentAccount,
              createdDate: new Date(transactionStatus.createdDate)
            };

            // Update file storage
            if (this.config.enableFileStorage && this.paymentStorageService) {
              try {
                const filePayment = await this.paymentStorageService.findPaymentByReference(merchantReference);
                if (filePayment) {
                  await this.paymentStorageService.updatePayment(filePayment.filename, payment);
                }
              } catch (updateError) {
                this.config.logger.warn('Failed to update payment status in file storage:', updateError);
              }
            }
          }
        } catch (statusError) {
          this.config.logger.warn('Failed to check payment status with PesaPal:', statusError);
        }
      }

      res.json({
        success: true,
        data: {
          merchantReference: payment.merchantReference,
          orderTrackingId: payment.orderTrackingId,
          status: payment.status,
          amount: payment.amount,
          currency: payment.currency,
          description: payment.description,
          paymentMethod: payment.pesapalData?.paymentMethod,
          confirmationCode: payment.pesapalData?.confirmationCode,
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt
        }
      });

    } catch (error) {
      this.config.logger.error('Get payment status failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get payment status',
        error: error.message
      });
    }
  }

  /**
   * Get payment statistics
   * GET /api/payments/stats
   */
  async getPaymentStats(req, res) {
    try {
      let stats = null;

      if (this.config.enableFileStorage && this.paymentStorageService) {
        stats = await this.paymentStorageService.getPaymentStats();
      }

      res.json({
        success: true,
        data: {
          fileStorage: stats,
          source: 'file_storage'
        }
      });

    } catch (error) {
      this.config.logger.error('Get payment stats failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get payment statistics',
        error: error.message
      });
    }
  }

  /**
   * Get payment history
   * GET /api/payments/history
   */
  async getPaymentHistory(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      
      let payments = [];
      
      if (this.config.enableFileStorage && this.paymentStorageService) {
        const files = await this.paymentStorageService.listPayments();
        
        // Load payments from files
        for (const file of files) {
          try {
            const payment = await this.paymentStorageService.loadPayment(file);
            payments.push(payment);
          } catch (fileError) {
            this.config.logger.warn('Failed to load payment file:', file, fileError);
          }
        }
        
        // Sort by creation date (newest first)
        payments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // Apply pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        payments = payments.slice(startIndex, endIndex);
      }

      res.json({
        success: true,
        data: {
          payments,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: payments.length
          }
        }
      });

    } catch (error) {
      this.config.logger.error('Get payment history failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get payment history',
        error: error.message
      });
    }
  }
}

  /**
   * Initialize PesaPal service
   */
  async initialize() {
    try {
      await this.pesapalService.initialize();
      this.config.logger.info('Payment controller initialized successfully');
      return true;
    } catch (error) {
      this.config.logger.error('Payment controller initialization failed:', error);
      throw error;
    }
  }
}

module.exports = PaymentController;
