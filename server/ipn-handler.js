/**
 * PesaPal IPN (Instant Payment Notification) Handler
 * Handles payment status updates from PesaPal
 * 
 * IPN Callback Format:
 * POST /api/payments/pesapal/ipn
 * Content-Type: application/x-www-form-urlencoded
 * 
 * Parameters:
 * - pesapal_merchant_reference: The order ID
 * - pesapal_transaction_tracking_id: PesaPal tracking ID
 * - pesapal_notification_type: "CHANGE" for status changes
 */

import { PesaPalIntegrationService } from '../src/services/pesapal-integration.service.js';
import { SQLiteClient } from '../src/infrastructure/database/sqlite-client.js';
import { SQLitePaymentRepository } from '../src/infrastructure/database/sqlite-payment.repository.js';
import { PaymentService } from '../src/services/payment.service.js';
import { StubValidationService, StubNotificationService } from '../src/services/stub-services.js';
import { ListingService } from '../src/services/listing.service.js';
import { SQLiteListingRepository } from '../src/infrastructure/database/sqlite-listing.repository.js';
import { SQLiteUserRepository } from '../src/infrastructure/database/sqlite-user.repository.js';

export class IPNHandler {
  constructor() {
    this.pesaPalIntegration = new PesaPalIntegrationService();
    this.initializeServices();
  }

  async initializeServices() {
    try {
      const sqliteClient = new SQLiteClient();
      const db = sqliteClient.getDatabase();
      
      const paymentRepository = new SQLitePaymentRepository(db);
      const listingRepository = new SQLiteListingRepository(db);
      const userRepository = new SQLiteUserRepository(db);
      
      const listingService = new ListingService(
        listingRepository,
        userRepository,
        new StubValidationService(),
        new StubImageService(),
        new StubNotificationService()
      );

      this.paymentService = new PaymentService(
        paymentRepository,
        new StubValidationService(),
        new StubNotificationService(),
        { sendPaymentConfirmation: () => Promise.resolve() },
        listingService
      );

      console.log('✅ IPN Handler services initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize IPN Handler services:', error);
      throw error;
    }
  }

  /**
   * Handle IPN callback from PesaPal
   * @param {Object} ipnData - IPN callback data
   * @returns {Promise<Object>} Processing result
   */
  async handleIPNCallback(ipnData) {
    try {
      console.log('📨 Received IPN callback:', ipnData);

      const {
        pesapal_merchant_reference: orderId,
        pesapal_transaction_tracking_id: trackingId,
        pesapal_notification_type: notificationType
      } = ipnData;

      // Validate required fields
      if (!orderId || !trackingId || !notificationType) {
        throw new Error('Missing required IPN parameters');
      }

      if (notificationType !== 'CHANGE') {
        console.log('ℹ️  Ignoring non-CHANGE IPN notification:', notificationType);
        return { status: 'ignored', reason: 'Non-CHANGE notification' };
      }

      // Get payment status from PesaPal
      const paymentStatus = await this.pesaPalIntegration.getPaymentStatus(trackingId);
      
      console.log('🔍 Payment status from PesaPal:', {
        trackingId,
        status: paymentStatus.status,
        paymentMethod: paymentStatus.payment_method,
        amount: paymentStatus.amount
      });

      // Update payment in database
      const updatedPayment = await this.paymentService.handlePesaPalCallback(
        trackingId,
        paymentStatus.status
      );

      // Handle additional business logic based on payment status
      await this.handlePostPaymentActions(updatedPayment, paymentStatus);

      console.log('✅ IPN callback processed successfully:', {
        orderId,
        trackingId,
        paymentStatus: paymentStatus.status,
        internalStatus: updatedPayment.status
      });

      return {
        status: 'processed',
        paymentId: updatedPayment.id,
        trackingId,
        paymentStatus: paymentStatus.status
      };

    } catch (error) {
      console.error('❌ IPN callback processing failed:', error);
      
      // Log detailed error for debugging
      console.error('IPN Error Details:', {
        ipnData,
        error: error.message,
        stack: error.stack
      });

      throw new Error(`IPN processing failed: ${error.message}`);
    }
  }

  /**
   * Handle post-payment business logic
   */
  async handlePostPaymentActions(payment, paymentStatus) {
    try {
      if (paymentStatus.status === 'COMPLETED') {
        console.log('💰 Payment completed successfully:', {
          paymentId: payment.id,
          amount: payment.amount,
          currency: payment.currency
        });

        // Additional business logic for completed payments
        await this.handleSuccessfulPayment(payment);
        
      } else if (paymentStatus.status === 'FAILED') {
        console.log('❌ Payment failed:', {
          paymentId: payment.id,
          reason: paymentStatus.payment_status_description
        });

        // Handle failed payment logic
        await this.handleFailedPayment(payment, paymentStatus);
      }

    } catch (error) {
      console.error('❌ Post-payment action failed:', error);
      // Don't throw here - we don't want to fail the entire IPN callback
    }
  }

  /**
   * Handle successful payment business logic
   */
  async handleSuccessfulPayment(payment) {
    try {
      // Send confirmation notifications
      await this.sendPaymentConfirmation(payment);
      
      // Update any related business entities
      await this.updateBusinessEntities(payment);
      
      // Log successful transaction
      console.log('📊 Payment transaction completed:', {
        paymentId: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Successful payment handling failed:', error);
    }
  }

  /**
   * Handle failed payment business logic
   */
  async handleFailedPayment(payment, paymentStatus) {
    try {
      // Send failure notification
      await this.sendPaymentFailureNotification(payment, paymentStatus);
      
      // Log failed transaction
      console.log('📊 Payment transaction failed:', {
        paymentId: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        reason: paymentStatus.payment_status_description,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Failed payment handling failed:', error);
    }
  }

  /**
   * Send payment confirmation
   */
  async sendPaymentConfirmation(payment) {
    try {
      // In production, this would send email/SMS notifications
      console.log('📧 Payment confirmation sent for:', payment.id);
      
      // Simulate sending confirmation
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error('❌ Failed to send payment confirmation:', error);
    }
  }

  /**
   * Send payment failure notification
   */
  async sendPaymentFailureNotification(payment, paymentStatus) {
    try {
      // In production, this would send failure notifications
      console.log('📧 Payment failure notification sent for:', payment.id);
      
      // Simulate sending notification
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error('❌ Failed to send payment failure notification:', error);
    }
  }

  /**
   * Update related business entities
   */
  async updateBusinessEntities(payment) {
    try {
      // Update listing status, inventory, etc.
      if (payment.listingId) {
        console.log('🔄 Updating listing status for payment:', payment.listingId);
        // Implementation would update the listing status to "sold"
      }
      
    } catch (error) {
      console.error('❌ Failed to update business entities:', error);
    }
  }

  /**
   * Validate IPN request signature (if PesaPal provides one)
   * Note: PesaPal v3 doesn't typically sign IPN callbacks, but we validate the data
   */
  validateIPNRequest(ipnData) {
    const requiredFields = [
      'pesapal_merchant_reference',
      'pesapal_transaction_tracking_id', 
      'pesapal_notification_type'
    ];

    const missingFields = requiredFields.filter(field => !ipnData[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required IPN fields: ${missingFields.join(', ')}`);
    }

    return true;
  }
}

// Stub services for IPN handler
class StubImageService {
  async uploadImage() { return 'image-url'; }
  async deleteImage() { return true; }
}
