// PesaPal Integration Service
// Complete implementation following official PesaPal v3 API documentation
// https://developer.pesapal.com/official-extensions/documentation

import { PaymentEntity } from '@/domain/entities/payment.entity';

export interface PesaPalOrderRequest {
  id: string;
  currency: string;
  amount: number;
  description: string;
  callback_url: string;
  cancellation_url: string;
  notification_id: string;
  billing_address: {
    email_address: string;
    phone_number?: string;
    first_name: string;
    last_name: string;
    line_1: string;
    city: string;
    country: string;
  };
}

export interface PesaPalOrderResponse {
  order_tracking_id: string;
  merchant_reference: string;
  redirect_url: string;
  status: string;
  message: string;
}

export interface PesaPalPaymentStatus {
  payment_method: string;
  amount: number;
  created_date: string;
  confirmation_code?: string;
  payment_status_description: string;
  description: string;
  message: string;
  payment_account: string;
  call_back_url: string;
  status_code: number;
  merchant_reference: string;
  payment_status_code: string;
  currency: string;
  order_tracking_id: string;
  status: string;
}

export interface PesaPalIPNResponse {
  order_tracking_id: string;
  order_notification_type: string;
  order_merchant_reference: string;
}

export class PesaPalIntegrationService {
  private baseUrl: string;
  private consumerKey: string;
  private consumerSecret: string;
  private callbackUrl: string;
  private cancellationUrl: string;

  constructor() {
    this.consumerKey = process.env.PESAPAL_CONSUMER_KEY!;
    this.consumerSecret = process.env.PESAPAL_CONSUMER_SECRET!;
    this.callbackUrl = process.env.PESAPAL_CALLBACK_URL!;
    this.cancellationUrl = process.env.PESAPAL_CANCELLATION_URL!;
    
    // Validate that all required environment variables are set
    this.validateEnvironment();
    
    // Set base URL based on environment
    this.baseUrl = process.env.PESAPAL_ENVIRONMENT === 'sandbox' 
      ? 'https://cybqa.pesapal.com/pesapalv3'
      : 'https://pay.pesapal.com';
  }

  /**
   * Submit an order to PesaPal for payment processing
   * Following PesaPal v3 API: POST /api/Transactions/SubmitOrderRequest
   */
  async submitOrder(payment: PaymentEntity, customerDetails: any, billingAddress: any): Promise<PesaPalOrderResponse> {
    try {
      // Get access token first
      const accessToken = await this.getAccessToken();

      // Prepare order request
      const orderRequest: PesaPalOrderRequest = {
        id: payment.id,
        currency: payment.currency,
        amount: payment.amount,
        description: payment.listingId 
          ? `Payment for motorcycle listing ${payment.listingId}`
          : 'Payment for motorcycle purchase',
        callback_url: this.callbackUrl,
        cancellation_url: this.cancellationUrl,
        notification_id: payment.id,
        billing_address: {
          email_address: customerDetails.email,
          phone_number: customerDetails.phone,
          first_name: customerDetails.firstName,
          last_name: customerDetails.lastName,
          line_1: billingAddress.line1,
          city: billingAddress.city,
          country: billingAddress.country,
        },
      };

      console.log('📦 Submitting order to PesaPal:', {
        orderId: payment.id,
        amount: payment.amount,
        currency: payment.currency,
      });

      const response = await fetch(`${this.baseUrl}/api/Transactions/SubmitOrderRequest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(orderRequest),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ PesaPal order submission failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        });
        throw new Error(`PesaPal order submission failed: ${response.statusText}`);
      }

      const orderResponse: PesaPalOrderResponse = await response.json();
      
      console.log('✅ PesaPal order submitted successfully:', {
        orderTrackingId: orderResponse.order_tracking_id,
        redirectUrl: orderResponse.redirect_url,
        status: orderResponse.status,
      });

      return orderResponse;

    } catch (error) {
      console.error('❌ PesaPal order submission error:', error);
      throw new Error(`Failed to submit order to PesaPal: ${error.message}`);
    }
  }

  /**
   * Get payment status from PesaPal
   * Following PesaPal v3 API: GET /api/Transactions/GetTransactionStatus
   */
  async getPaymentStatus(orderTrackingId: string): Promise<PesaPalPaymentStatus> {
    try {
      const accessToken = await this.getAccessToken();

      console.log('🔍 Checking payment status for order:', orderTrackingId);

      const response = await fetch(
        `${this.baseUrl}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ PesaPal payment status check failed:', {
          orderTrackingId,
          status: response.status,
          error: errorText,
        });
        throw new Error(`PesaPal payment status check failed: ${response.statusText}`);
      }

      const paymentStatus: PesaPalPaymentStatus = await response.json();
      
      console.log('✅ PesaPal payment status retrieved:', {
        orderTrackingId,
        status: paymentStatus.status,
        paymentMethod: paymentStatus.payment_method,
        amount: paymentStatus.amount,
      });

      return paymentStatus;

    } catch (error) {
      console.error('❌ PesaPal payment status check error:', error);
      throw new Error(`Failed to check payment status: ${error.message}`);
    }
  }

  /**
   * Register IPN (Instant Payment Notification) URL
   * Following PesaPal v3 API: POST /api/URLSetup/RegisterIPN
   */
  async registerIPN(ipnUrl: string): Promise<string> {
    try {
      const accessToken = await this.getAccessToken();

      console.log('📡 Registering IPN URL:', ipnUrl);

      const response = await fetch(`${this.baseUrl}/api/URLSetup/RegisterIPN`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          url: ipnUrl,
          ipn_notification_type: 'GET',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ IPN registration failed:', {
          status: response.status,
          error: errorText,
        });
        throw new Error(`IPN registration failed: ${response.statusText}`);
      }

      const ipnResponse = await response.json();
      const ipnId = ipnResponse.ipn_id;

      console.log('✅ IPN registered successfully:', { ipnId, ipnUrl });

      return ipnId;

    } catch (error) {
      console.error('❌ IPN registration error:', error);
      throw new Error(`Failed to register IPN: ${error.message}`);
    }
  }

  /**
   * Get list of registered IPNs
   * Following PesaPal v3 API: GET /api/URLSetup/GetIpnList
   */
  async getIPNList(): Promise<any[]> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(`${this.baseUrl}/api/URLSetup/GetIpnList`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get IPN list: ${response.statusText}`);
      }

      return await response.json();

    } catch (error) {
      console.error('❌ IPN list retrieval error:', error);
      throw new Error(`Failed to get IPN list: ${error.message}`);
    }
  }

  /**
   * Get access token for PesaPal API
   * Following PesaPal v3 API: POST /api/Auth/RequestToken
   */
  private async getAccessToken(): Promise<string> {
    try {
      // Validate credentials
      if (!this.consumerKey || !this.consumerSecret) {
        throw new Error('PesaPal credentials not configured');
      }

      const response = await fetch(`${this.baseUrl}/api/Auth/RequestToken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          consumer_key: this.consumerKey,
          consumer_secret: this.consumerSecret,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ PesaPal authentication failed:', {
          status: response.status,
          error: errorText,
        });
        throw new Error(`PesaPal authentication failed: ${response.statusText}`);
      }

      const tokenData = await response.json();
      const accessToken = tokenData.token;

      if (!accessToken) {
        throw new Error('No access token received from PesaPal');
      }

      console.log('🔑 PesaPal access token obtained successfully');

      return accessToken;

    } catch (error) {
      console.error('❌ PesaPal authentication error:', error);
      throw new Error(`Failed to authenticate with PesaPal: ${error.message}`);
    }
  }

  /**
   * Handle PesaPal IPN callback
   * This method processes the IPN callback from PesaPal
   */
  async handleIPNCallback(ipnData: PesaPalIPNResponse): Promise<PesaPalPaymentStatus> {
    try {
      console.log('📨 Processing PesaPal IPN callback:', ipnData);

      const { order_tracking_id, order_notification_type, order_merchant_reference } = ipnData;

      // Get payment status to verify the transaction
      const paymentStatus = await this.getPaymentStatus(order_tracking_id);

      console.log('✅ IPN callback processed:', {
        orderTrackingId: order_tracking_id,
        notificationType: order_notification_type,
        merchantReference: order_merchant_reference,
        paymentStatus: paymentStatus.status,
      });

      // Return the payment status for further processing
      return paymentStatus;

    } catch (error) {
      console.error('❌ IPN callback processing error:', error);
      throw new Error(`Failed to process IPN callback: ${error.message}`);
    }
  }

  /**
   * Validate PesaPal payment data before submission
   * Updated to support M-Pesa STK push requirements
   */
  validatePaymentData(payment: PaymentEntity, customerDetails: any, billingAddress: any): void {
    const errors: string[] = [];

    // Validate payment amount
    if (payment.amount <= 0) {
      errors.push('Payment amount must be greater than 0');
    }

    // Validate currency
    if (!['USD', 'KES', 'EUR', 'GBP'].includes(payment.currency)) {
      errors.push('Invalid currency. Supported currencies: USD, KES, EUR, GBP');
    }

    // Validate customer details - at least email OR phone is required for PesaPal
    if (!customerDetails.email && !customerDetails.phone) {
      errors.push('Customer email or phone number is required for PesaPal payment');
    }

    if (!customerDetails.firstName || !customerDetails.lastName) {
      errors.push('Customer first name and last name are required');
    }

    // Validate billing address
    if (!billingAddress.line1 || !billingAddress.city || !billingAddress.country) {
      errors.push('Billing address line1, city, and country are required');
    }

    // Validate Kenyan phone number for M-Pesa STK push
    if (customerDetails.phone && !this.isValidKenyanPhone(customerDetails.phone)) {
      errors.push('Invalid Kenyan phone number format. Expected format: +254XXXXXXXXX');
    }

    // Special validation for M-Pesa payments
    if (payment.paymentMethod === 'mpesa' && !customerDetails.phone) {
      errors.push('Phone number is required for M-Pesa STK push payments');
    }

    if (errors.length > 0) {
      throw new Error(`Payment validation failed: ${errors.join(', ')}`);
    }
  }

  /**
   * Validate Kenyan phone number format
   */
  isValidKenyanPhone(phone: string): boolean {
    const kenyanPhoneRegex = /^\+254[17]\d{8}$/;
    return kenyanPhoneRegex.test(phone);
  }

  /**
   * Convert payment status from PesaPal to internal status
   */
  mapPesaPalStatusToInternal(pesaPalStatus: string): string {
    const statusMap: { [key: string]: string } = {
      'COMPLETED': 'completed',
      'PENDING': 'pending',
      'FAILED': 'failed',
      'INVALID': 'failed',
    };

    return statusMap[pesaPalStatus] || 'pending';
  }

  /**
   * Submit M-Pesa STK push payment specifically
   * This method optimizes for M-Pesa payments by ensuring phone number is provided
   */
  async submitMpesaSTKPayment(
    payment: PaymentEntity,
    customerDetails: { firstName: string; lastName: string; phone: string; email?: string },
    billingAddress: { line1: string; city: string; country: string; postalCode?: string }
  ): Promise<PesaPalOrderResponse> {
    try {
      // Validate M-Pesa specific requirements
      if (!customerDetails.phone) {
        throw new Error('Phone number is required for M-Pesa STK push payment');
      }

      if (!this.isValidKenyanPhone(customerDetails.phone)) {
        throw new Error('Invalid Kenyan phone number format for M-Pesa STK push');
      }

      console.log('📱 Submitting M-Pesa STK push payment:', {
        orderId: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        phone: customerDetails.phone,
      });

      // Submit order to PesaPal - they will automatically send STK push
      const orderResponse = await this.submitOrder(payment, customerDetails, billingAddress);

      console.log('✅ M-Pesa STK push initiated:', {
        orderTrackingId: orderResponse.order_tracking_id,
        phone: customerDetails.phone,
        status: orderResponse.status,
      });

      return orderResponse;

    } catch (error) {
      console.error('❌ M-Pesa STK push payment failed:', error);
      throw new Error(`M-Pesa STK push payment failed: ${error.message}`);
    }
  }

  /**
   * Get supported payment methods from PesaPal
   * Note: This is a helper method - PesaPal doesn't have a direct API for this
   */
  getSupportedPaymentMethods(): string[] {
    return [
      'M-PESA',
      'Airtel Money',
      'Credit Card',
      'Debit Card',
      'Visa',
      'MasterCard',
      'Bank Transfer',
    ];
  }

  /**
   * Check if payment method is M-Pesa
   */
  isMpesaPayment(paymentMethod: string): boolean {
    return paymentMethod.toLowerCase().includes('mpesa') || paymentMethod.toLowerCase().includes('m-pesa');
  }

  /**
   * Validate that all required environment variables are configured
   * This method fails hard if any required configuration is missing
   */
  private validateEnvironment(): void {
    const missingVars: string[] = [];

    if (!this.consumerKey || this.consumerKey === 'YOUR_PESAPAL_PRODUCTION_CONSUMER_KEY') {
      missingVars.push('PESAPAL_CONSUMER_KEY');
    }

    if (!this.consumerSecret || this.consumerSecret === 'YOUR_PESAPAL_PRODUCTION_CONSUMER_SECRET') {
      missingVars.push('PESAPAL_CONSUMER_SECRET');
    }

    if (!this.callbackUrl || this.callbackUrl === 'https://yourdomain.com/payment/callback') {
      missingVars.push('PESAPAL_CALLBACK_URL');
    }

    if (!this.cancellationUrl || this.cancellationUrl === 'https://yourdomain.com/payment/cancelled') {
      missingVars.push('PESAPAL_CANCELLATION_URL');
    }

    if (missingVars.length > 0) {
      throw new Error(
        `PesaPal configuration incomplete. Missing or using placeholder values for: ${missingVars.join(', ')}. ` +
        'Please configure your PesaPal production credentials in the .env file.'
      );
    }

    console.log('✅ PesaPal environment configuration validated successfully');
  }

  /**
   * Format phone number for M-Pesa STK push
   */
  formatPhoneForMpesa(phone: string): string {
    // Remove any spaces, dashes, or other characters
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    
    // Ensure it starts with +254
    if (cleaned.startsWith('254') && cleaned.length === 12) {
      return `+${cleaned}`;
    } else if (cleaned.startsWith('07') && cleaned.length === 10) {
      return `+254${cleaned.substring(1)}`;
    } else if (cleaned.startsWith('7') && cleaned.length === 9) {
      return `+254${cleaned}`;
    }
    
    // Return as-is if already in correct format
    return cleaned;
  }
}
