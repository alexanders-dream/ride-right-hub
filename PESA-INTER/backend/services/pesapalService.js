const axios = require('axios');
const crypto = require('crypto');

/**
 * PesaPal API 3.0 Service - Reusable Integration Package
 * Production-ready implementation following official PesaPal documentation
 * https://developer.pesapal.com/how-to-integrate/e-commerce/api-30-json/
 * 
 * @author PESA-INTER Package
 * @version 1.0.0
 */
class PesaPalService {
  constructor(config = {}) {
    // Configuration with defaults
    this.config = {
      consumerKey: config.consumerKey || process.env.PESAPAL_CONSUMER_KEY,
      consumerSecret: config.consumerSecret || process.env.PESAPAL_CONSUMER_SECRET,
      environment: config.environment || process.env.PESAPAL_ENVIRONMENT || 'sandbox',
      callbackBaseURL: config.callbackBaseURL || process.env.CALLBACK_BASE_URL || 'http://localhost:3000',
      businessName: config.businessName || process.env.BUSINESS_NAME || 'Your Business',
      logger: config.logger || console,
      ...config
    };

    // Validate required configuration
    if (!this.config.consumerKey || !this.config.consumerSecret) {
      throw new Error('PesaPal consumer key and secret are required');
    }

    // Environment URLs
    this.isProduction = this.config.environment === 'production' || 
                       this.config.consumerKey === 'pSfoDU9I/jp6mKNLULgPHNwhjOgKSjlN';
    this.baseURL = this.isProduction 
      ? 'https://pay.pesapal.com/v3/api' 
      : 'https://cybqa.pesapal.com/pesapalv3/api';
    
    // Token management
    this.accessToken = null;
    this.tokenExpiry = null;
    this.tokenRefreshPromise = null;
    
    // IPN configuration
    this.ipnId = null;
    
    // Initialize axios instance
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    // Request/Response interceptors for logging and error handling
    this.setupInterceptors();
    
    this.config.logger.info(`PesaPal Service initialized - Environment: ${this.isProduction ? 'Production' : 'Sandbox'}`);
  }

  /**
   * Setup axios interceptors for logging and error handling
   */
  setupInterceptors() {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        if (this.config.debug) {
          this.config.logger.debug(`PesaPal API Request: ${config.method?.toUpperCase()} ${config.url}`);
        }
        return config;
      },
      (error) => {
        this.config.logger.error('PesaPal API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => {
        if (this.config.debug) {
          this.config.logger.debug(`PesaPal API Response: ${response.status} ${response.config.url}`);
        }
        return response;
      },
      (error) => {
        this.config.logger.error('PesaPal API Response Error:', {
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Authenticate with PesaPal API and get access token
   * Tokens are valid for 5 minutes
   */
  async authenticate() {
    try {
      // If we already have a valid token, return it
      if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
        return this.accessToken;
      }

      // If there's already a refresh in progress, wait for it
      if (this.tokenRefreshPromise) {
        return await this.tokenRefreshPromise;
      }

      // Start token refresh
      this.tokenRefreshPromise = this._performAuthentication();
      const token = await this.tokenRefreshPromise;
      this.tokenRefreshPromise = null;
      
      return token;
    } catch (error) {
      this.tokenRefreshPromise = null;
      this.config.logger.error('PesaPal authentication failed:', error);
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Perform the actual authentication request
   */
  async _performAuthentication() {
    const authData = {
      consumer_key: this.config.consumerKey,
      consumer_secret: this.config.consumerSecret
    };

    const response = await this.api.post('/Auth/RequestToken', authData);
    
    if (this.config.debug) {
      this.config.logger.debug('PesaPal authentication response:', response.data);
    }
    
    if (response.data.status !== '200') {
      throw new Error(`Authentication failed: ${response.data.message || response.data.error?.message || 'Unknown error'}`);
    }

    this.accessToken = response.data.token;
    this.tokenExpiry = new Date(response.data.expiryDate);
    
    this.config.logger.info('PesaPal authentication successful', {
      expiryDate: this.tokenExpiry.toISOString()
    });

    return this.accessToken;
  }

  /**
   * Get authenticated API instance with Bearer token
   */
  async getAuthenticatedAPI() {
    const token = await this.authenticate();
    
    return axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
  }

  /**
   * Register IPN URL with PesaPal
   * This is required before submitting any payment requests
   */
  async registerIPNURL(ipnURL, notificationType = 'POST') {
    try {
      const api = await this.getAuthenticatedAPI();
      
      const ipnData = {
        url: ipnURL,
        ipn_notification_type: notificationType
      };

      const response = await api.post('/URLSetup/RegisterIPN', ipnData);
      
      if (response.data.status !== '200') {
        throw new Error(`IPN registration failed: ${response.data.message || 'Unknown error'}`);
      }

      this.ipnId = response.data.ipn_id;
      
      this.config.logger.info('IPN URL registered successfully', {
        ipnId: this.ipnId,
        url: ipnURL,
        notificationType
      });

      return {
        ipnId: this.ipnId,
        url: response.data.url,
        status: response.data.ipn_status_description
      };
    } catch (error) {
      this.config.logger.error('IPN URL registration failed:', error);
      throw new Error(`IPN registration failed: ${error.message}`);
    }
  }

  /**
   * Get list of registered IPN URLs
   */
  async getRegisteredIPNs() {
    try {
      const api = await this.getAuthenticatedAPI();
      const response = await api.get('/URLSetup/GetIpnList');
      
      if (this.config.debug) {
        this.config.logger.debug('IPN List response:', response.data);
      }
      
      if (response.data.status !== '200') {
        throw new Error(`Failed to get IPN list: ${response.data.message || response.data.error?.message || 'Unknown error'}`);
      }

      return response.data;
    } catch (error) {
      this.config.logger.error('Failed to get IPN list:', error);
      throw new Error(`Failed to get IPN list: ${error.message}`);
    }
  }

  /**
   * Submit order request to PesaPal
   * This initiates the payment process
   */
  async submitOrderRequest(orderData) {
    try {
      // Validate required fields
      this.validateOrderData(orderData);
      
      // Ensure we have an IPN ID
      if (!this.ipnId) {
        throw new Error('IPN URL must be registered before submitting orders');
      }

      const api = await this.getAuthenticatedAPI();
      
      // Prepare order request
      const orderRequest = {
        id: orderData.merchantReference,
        currency: orderData.currency || 'KES',
        amount: parseFloat(orderData.amount),
        description: orderData.description,
        callback_url: orderData.callbackURL,
        cancellation_url: orderData.cancellationURL,
        notification_id: this.ipnId,
        branch: orderData.branch || this.config.businessName,
        billing_address: {
          email_address: orderData.customerEmail,
          phone_number: orderData.customerPhone,
          country_code: orderData.countryCode || 'KE',
          first_name: orderData.firstName || '',
          middle_name: orderData.middleName || '',
          last_name: orderData.lastName || '',
          line_1: orderData.address || '',
          line_2: orderData.address2 || '',
          city: orderData.city || '',
          state: orderData.state || '',
          postal_code: orderData.postalCode || '',
          zip_code: orderData.zipCode || ''
        }
      };

      const response = await api.post('/Transactions/SubmitOrderRequest', orderRequest);
      
      if (this.config.debug) {
        this.config.logger.debug('PesaPal SubmitOrderRequest response:', JSON.stringify(response.data, null, 2));
      }
      
      if (response.data.status !== '200') {
        throw new Error(`Order submission failed: ${response.data.message || response.data.error?.message || 'Unknown error'}`);
      }

      this.config.logger.info('Order submitted successfully', {
        orderTrackingId: response.data.order_tracking_id,
        merchantReference: response.data.merchant_reference
      });

      return {
        orderTrackingId: response.data.order_tracking_id,
        merchantReference: response.data.merchant_reference,
        redirectURL: response.data.redirect_url,
        status: response.data.status
      };
    } catch (error) {
      this.config.logger.error('Order submission failed:', error);
      throw new Error(`Order submission failed: ${error.message}`);
    }
  }

  /**
   * Get transaction status from PesaPal
   */
  async getTransactionStatus(orderTrackingId) {
    try {
      const api = await this.getAuthenticatedAPI();
      const response = await api.get(`/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`);
      
      if (response.data.status !== '200') {
        throw new Error(`Failed to get transaction status: ${response.data.message || 'Unknown error'}`);
      }

      this.config.logger.info('Transaction status retrieved', {
        orderTrackingId,
        status: response.data.payment_status_description
      });

      return {
        paymentMethod: response.data.payment_method,
        amount: response.data.amount,
        createdDate: response.data.created_date,
        confirmationCode: response.data.confirmation_code,
        paymentStatus: response.data.payment_status_description,
        statusCode: response.data.status_code,
        merchantReference: response.data.merchant_reference,
        currency: response.data.currency,
        paymentAccount: response.data.payment_account,
        description: response.data.description
      };
    } catch (error) {
      this.config.logger.error('Failed to get transaction status:', error);
      throw new Error(`Failed to get transaction status: ${error.message}`);
    }
  }

  /**
   * Validate order data before submission
   */
  validateOrderData(orderData) {
    const required = ['merchantReference', 'amount', 'description', 'callbackURL'];
    const missing = required.filter(field => !orderData[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    // Validate customer contact info
    if (!orderData.customerEmail && !orderData.customerPhone) {
      throw new Error('Either customer email or phone number is required');
    }

    // Validate amount
    if (isNaN(parseFloat(orderData.amount)) || parseFloat(orderData.amount) <= 0) {
      throw new Error('Amount must be a positive number');
    }

    // Validate merchant reference format
    if (orderData.merchantReference.length > 50) {
      throw new Error('Merchant reference must be 50 characters or less');
    }

    // Validate description length
    if (orderData.description.length > 100) {
      throw new Error('Description must be 100 characters or less');
    }
  }

  /**
   * Generate unique merchant reference
   */
  generateMerchantReference(prefix = 'PAY') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Initialize PesaPal service with IPN registration
   */
  async initialize() {
    try {
      // Register IPN URL if not already registered
      if (!this.ipnId) {
        const ipnURL = `${this.config.callbackBaseURL}/api/payments/pesapal/ipn`;
        await this.registerIPNURL(ipnURL, 'POST');
      }
      
      this.config.logger.info('PesaPal service initialized successfully');
      return true;
    } catch (error) {
      this.config.logger.error('PesaPal service initialization failed:', error);
      throw error;
    }
  }
}

module.exports = PesaPalService;
