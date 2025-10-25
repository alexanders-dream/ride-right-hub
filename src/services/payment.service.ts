import { PaymentEntity } from '@/domain/entities/payment.entity';
import { PaymentRepository } from '@/domain/repositories/payment.repository';
import { ValidationService } from './validation.service';
import { NotificationService } from './notification.service';
import { EmailService } from './email.service';
import { ListingService } from './listing.service';
import { PesaPalIntegrationService } from './pesapal-integration.service';

export interface PesaPalPaymentRequest {
  amount: number;
  currency: string;
  description: string;
  callback_url: string;
  cancellation_url: string;
  notification_id: string;
  billing_address?: {
    email_address: string;
    phone_number?: string;
    first_name: string;
    last_name: string;
    line_1: string;
    city: string;
    country: string;
  };
}

export interface PesaPalPaymentResponse {
  order_tracking_id: string;
  merchant_reference: string;
  redirect_url: string;
  status: string;
  message: string;
}

export interface PesaPalPaymentStatus {
  order_tracking_id: string;
  payment_method: string;
  amount: number;
  currency: string;
  status: string;
  created_date: string;
  confirmation_code?: string;
}

export interface InitiatePaymentDto {
  userId: string;
  listingId?: string;
  amount: number;
  currency?: string;
  paymentMethod: 'pesapal' | 'mpesa' | 'card' | 'financing';
  customerDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  billingAddress?: {
    line1: string;
    city: string;
    country: string;
    postalCode?: string;
  };
}

export class PaymentService {
  private pesaPalIntegration: PesaPalIntegrationService;

  constructor(
    private paymentRepository: PaymentRepository,
    private validationService: ValidationService,
    private notificationService: NotificationService,
    private emailService: EmailService,
    private listingService: ListingService
  ) {
    this.pesaPalIntegration = new PesaPalIntegrationService();
  }

  async initiatePayment(paymentData: InitiatePaymentDto): Promise<{ payment: PaymentEntity; redirectUrl?: string }> {
    // Validate payment data
    await this.validationService.validatePayment(paymentData);

    // Create payment entity
    const payment = PaymentEntity.create({
      userId: paymentData.userId,
      listingId: paymentData.listingId,
      amount: paymentData.amount,
      currency: paymentData.currency || 'KES',
      status: 'pending',
      paymentMethod: paymentData.paymentMethod,
    });

    // Save payment
    const savedPayment = await this.paymentRepository.save(payment);

    // Process payment based on method
    if (paymentData.paymentMethod === 'pesapal' || paymentData.paymentMethod === 'mpesa') {
      const pesaPalResponse = await this.processPesaPalPayment(savedPayment, paymentData);
      return {
        payment: savedPayment,
        redirectUrl: pesaPalResponse.redirect_url,
      };
    } else if (paymentData.paymentMethod === 'card') {
      // For card payments, we'll handle them directly
      const cardPayment = await this.processCardPayment(savedPayment, paymentData);
      return {
        payment: cardPayment,
      };
    } else {
      // For financing, we'll create a financing application
      const financingPayment = await this.processFinancingPayment(savedPayment, paymentData);
      return {
        payment: financingPayment,
      };
    }
  }

  private async processPesaPalPayment(
    payment: PaymentEntity,
    paymentData: InitiatePaymentDto
  ): Promise<PesaPalPaymentResponse> {
    try {
      // Use the comprehensive PesaPal integration service
      let response;
      
      if (paymentData.paymentMethod === 'mpesa') {
        // Use M-Pesa specific STK push method
        response = await this.pesaPalIntegration.submitMpesaSTKPayment(
          payment,
          {
            firstName: paymentData.customerDetails.firstName,
            lastName: paymentData.customerDetails.lastName,
            phone: paymentData.customerDetails.phone!,
            email: paymentData.customerDetails.email,
          },
          paymentData.billingAddress || {
            line1: 'Nairobi, Kenya',
            city: 'Nairobi',
            country: 'Kenya',
          }
        );
      } else {
        // Use general PesaPal order submission
        response = await this.pesaPalIntegration.submitOrder(
          payment,
          paymentData.customerDetails,
          paymentData.billingAddress || {
            line1: 'Nairobi, Kenya',
            city: 'Nairobi',
            country: 'Kenya',
          }
        );
      }
      
      // Update payment with PesaPal tracking ID
      payment.updateTransactionId(response.order_tracking_id);
      await this.paymentRepository.save(payment);

      return response;
    } catch (error) {
      payment.markAsFailed('PesaPal API error');
      await this.paymentRepository.save(payment);
      throw new Error(`PesaPal payment initiation failed: ${error.message}`);
    }
  }

  private async processCardPayment(
    payment: PaymentEntity,
    paymentData: InitiatePaymentDto
  ): Promise<PaymentEntity> {
    // For demo purposes, we'll simulate card payment processing
    // In production, integrate with a real payment processor like Stripe
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo, assume payment is successful
      payment.markAsCompleted(`CARD-${Date.now()}`);
      const updatedPayment = await this.paymentRepository.save(payment);
      
      // Handle successful payment
      await this.handleSuccessfulPayment(updatedPayment);
      
      return updatedPayment;
    } catch (error) {
      payment.markAsFailed('Card payment processing failed');
      await this.paymentRepository.save(payment);
      throw new Error(`Card payment failed: ${error.message}`);
    }
  }

  private async processFinancingPayment(
    payment: PaymentEntity,
    paymentData: InitiatePaymentDto
  ): Promise<PaymentEntity> {
    // Create financing application
    payment.updateStatus('pending_financing');
    const updatedPayment = await this.paymentRepository.save(payment);
    
    // Send financing application notification
    await this.notificationService.notifyFinancingApplication(updatedPayment);
    
    return updatedPayment;
  }

  async handlePesaPalCallback(orderTrackingId: string, status: string): Promise<PaymentEntity> {
    const payment = await this.paymentRepository.findByTransactionId(orderTrackingId);
    
    if (!payment) {
      throw new Error('Payment not found');
    }

    if (status === 'COMPLETED') {
      payment.markAsCompleted(orderTrackingId);
      const updatedPayment = await this.paymentRepository.save(payment);
      await this.handleSuccessfulPayment(updatedPayment);
      return updatedPayment;
    } else if (status === 'FAILED') {
      payment.markAsFailed('Payment failed via PesaPal');
      return await this.paymentRepository.save(payment);
    }

    return payment;
  }

  async checkPesaPalPaymentStatus(orderTrackingId: string): Promise<PesaPalPaymentStatus> {
    try {
      const response = await this.makePesaPalApiCall(`/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`);
      return response;
    } catch (error) {
      throw new Error(`Failed to check PesaPal payment status: ${error.message}`);
    }
  }

  private async handleSuccessfulPayment(payment: PaymentEntity): Promise<void> {
    // Update listing status to sold if applicable
    if (payment.listingId) {
      // For payment-related status updates, we don't require user permissions
      // since the payment system itself should be able to update listing status
      try {
        await this.listingService.updateListingStatusForPayment(
          payment.listingId,
          'sold'
        );
      } catch (error) {
        console.warn(`Failed to update listing status for payment ${payment.id}:`, error.message);
        // Continue with other payment success actions even if listing update fails
      }
    }

    // Send confirmation email
    await this.emailService.sendPaymentConfirmation(payment);

    // Send notification
    await this.notificationService.notifyPaymentSuccess(payment);

    // Log transaction
    console.log(`Payment ${payment.id} completed successfully`);
  }

  private async makePesaPalApiCall(endpoint: string, data?: any): Promise<any> {
    const baseUrl = process.env.PESAPAL_ENVIRONMENT === 'sandbox' 
      ? 'https://cybqa.pesapal.com/pesapalv3'
      : 'https://pay.pesapal.com';

    const consumerKey = process.env.PESAPAL_CONSUMER_KEY;
    const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;

    if (!consumerKey || !consumerSecret) {
      throw new Error('PesaPal credentials not configured');
    }

    // First, get access token
    const tokenResponse = await fetch(`${baseUrl}/api/Auth/RequestToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        consumer_key: consumerKey,
        consumer_secret: consumerSecret,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to get PesaPal access token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.token;

    // Make the actual API call
    const apiResponse = await fetch(`${baseUrl}${endpoint}`, {
      method: data ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!apiResponse.ok) {
      throw new Error(`PesaPal API error: ${apiResponse.statusText}`);
    }

    return await apiResponse.json();
  }

  async getUserPayments(userId: string): Promise<PaymentEntity[]> {
    return await this.paymentRepository.findByUserId(userId);
  }

  async getPaymentById(paymentId: string): Promise<PaymentEntity | null> {
    return await this.paymentRepository.findById(paymentId);
  }

  async refundPayment(paymentId: string, adminId: string): Promise<PaymentEntity> {
    const payment = await this.paymentRepository.findById(paymentId);
    
    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== 'completed') {
      throw new Error('Only completed payments can be refunded');
    }

    payment.updateStatus('refunded');
    const updatedPayment = await this.paymentRepository.save(payment);

    // Send refund notification
    await this.notificationService.notifyPaymentRefund(updatedPayment);

    return updatedPayment;
  }
}
