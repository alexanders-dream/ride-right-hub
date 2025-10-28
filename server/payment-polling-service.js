/**
 * Payment Status Polling Service
 * Automatically checks pending payment statuses and updates them
 * 
 * Features:
 * - Polls PesaPal for pending payment statuses
 * - Updates database with current status
 * - Handles retries for failed status checks
 * - Sends notifications for status changes
 */

import { PesaPalIntegrationService } from '../src/services/pesapal-integration.service.js';
import { SQLiteClient } from '../src/infrastructure/database/sqlite-client.js';
import { SQLitePaymentRepository } from '../src/infrastructure/database/sqlite-payment.repository.js';
import { PaymentService } from '../src/services/payment.service.js';
import { StubValidationService, StubNotificationService } from '../src/services/stub-services.js';
import { ListingService } from '../src/services/listing.service.js';
import { SQLiteListingRepository } from '../src/infrastructure/database/sqlite-listing.repository.js';
import { SQLiteUserRepository } from '../src/infrastructure/database/sqlite-user.repository.js';

export class PaymentPollingService {
  constructor() {
    this.pesaPalIntegration = new PesaPalIntegrationService();
    this.pollingInterval = 2 * 60 * 1000; // 2 minutes
    this.maxRetries = 3;
    this.retryDelay = 30 * 1000; // 30 seconds
    this.isRunning = false;
    this.pollingTimer = null;
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

      this.paymentRepository = paymentRepository;

      console.log('✅ Payment Polling Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Payment Polling Service:', error);
      throw error;
    }
  }

  /**
   * Start the polling service
   */
  async start() {
    if (this.isRunning) {
      console.log('⚠️  Payment Polling Service is already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting Payment Polling Service...');

    // Initial poll
    await this.pollPendingPayments();

    // Set up interval polling
    this.pollingTimer = setInterval(async () => {
      await this.pollPendingPayments();
    }, this.pollingInterval);

    console.log(`🔄 Payment Polling Service started (interval: ${this.pollingInterval / 1000}s)`);
  }

  /**
   * Stop the polling service
   */
  stop() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
    this.isRunning = false;
    console.log('🛑 Payment Polling Service stopped');
  }

  /**
   * Poll all pending payments and update their status
   */
  async pollPendingPayments() {
    try {
      console.log('🔍 Polling pending payments...');

      // Get all pending payments with transaction IDs
      const pendingPayments = await this.getPendingPayments();
      
      if (pendingPayments.length === 0) {
        console.log('ℹ️  No pending payments to poll');
        return;
      }

      console.log(`📊 Found ${pendingPayments.length} pending payments to check`);

      // Process each payment
      const results = await Promise.allSettled(
        pendingPayments.map(payment => this.checkAndUpdatePaymentStatus(payment))
      );

      // Log results
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      console.log(`📊 Payment polling completed: ${successful} successful, ${failed} failed`);

    } catch (error) {
      console.error('❌ Payment polling failed:', error);
    }
  }

  /**
   * Get all pending payments that have transaction IDs
   */
  async getPendingPayments() {
    try {
      // Get all payments with status 'pending' and transactionId
      const allPayments = await this.paymentRepository.findAll();
      
      return allPayments.filter(payment => 
        payment.status === 'pending' && 
        payment.transactionId && 
        payment.transactionId.trim() !== ''
      );
    } catch (error) {
      console.error('❌ Failed to get pending payments:', error);
      return [];
    }
  }

  /**
   * Check and update status for a single payment
   */
  async checkAndUpdatePaymentStatus(payment) {
    try {
      console.log(`🔍 Checking payment status: ${payment.id} (${payment.transactionId})`);

      // Get status from PesaPal
      const paymentStatus = await this.pesaPalIntegration.getPaymentStatus(payment.transactionId);
      
      console.log(`📊 Payment ${payment.id} status: ${paymentStatus.status}`);

      // Update payment if status changed
      if (paymentStatus.status !== this.mapInternalStatusToPesaPal(payment.status)) {
        await this.updatePaymentStatus(payment, paymentStatus);
      } else {
        console.log(`ℹ️  Payment ${payment.id} status unchanged: ${paymentStatus.status}`);
      }

      return { paymentId: payment.id, status: paymentStatus.status, updated: true };

    } catch (error) {
      console.error(`❌ Failed to check payment ${payment.id}:`, error.message);
      
      // Handle retry logic
      await this.handlePaymentCheckError(payment, error);
      
      return { paymentId: payment.id, status: 'error', updated: false, error: error.message };
    }
  }

  /**
   * Update payment status based on PesaPal response
   */
  async updatePaymentStatus(payment, paymentStatus) {
    try {
      const internalStatus = this.pesaPalIntegration.mapPesaPalStatusToInternal(paymentStatus.status);
      
      console.log(`🔄 Updating payment ${payment.id}: ${payment.status} → ${internalStatus}`);

      if (internalStatus === 'completed') {
        payment.markAsCompleted(payment.transactionId);
      } else if (internalStatus === 'failed') {
        payment.markAsFailed(`PesaPal status: ${paymentStatus.status}`);
      } else {
        payment.updateStatus(internalStatus);
      }

      const updatedPayment = await this.paymentRepository.save(payment);

      // Handle post-update actions
      if (internalStatus === 'completed') {
        await this.handleSuccessfulPayment(updatedPayment);
      } else if (internalStatus === 'failed') {
        await this.handleFailedPayment(updatedPayment, paymentStatus);
      }

      console.log(`✅ Payment ${payment.id} updated to: ${internalStatus}`);

    } catch (error) {
      console.error(`❌ Failed to update payment ${payment.id}:`, error);
      throw error;
    }
  }

  /**
   * Handle successful payment
   */
  async handleSuccessfulPayment(payment) {
    try {
      console.log(`💰 Payment ${payment.id} completed successfully`);

      // Send confirmation notifications
      await this.sendPaymentConfirmation(payment);
      
      // Update business entities
      await this.updateBusinessEntities(payment);

    } catch (error) {
      console.error(`❌ Failed to handle successful payment ${payment.id}:`, error);
    }
  }

  /**
   * Handle failed payment
   */
  async handleFailedPayment(payment, paymentStatus) {
    try {
      console.log(`❌ Payment ${payment.id} failed: ${paymentStatus.payment_status_description}`);

      // Send failure notification
      await this.sendPaymentFailureNotification(payment, paymentStatus);

    } catch (error) {
      console.error(`❌ Failed to handle failed payment ${payment.id}:`, error);
    }
  }

  /**
   * Handle payment check errors with retry logic
   */
  async handlePaymentCheckError(payment, error) {
    try {
      // Increment retry count
      const retryCount = (payment.retryCount || 0) + 1;
      payment.retryCount = retryCount;
      
      if (retryCount >= this.maxRetries) {
        console.log(`🛑 Payment ${payment.id} exceeded max retries, marking as failed`);
        payment.markAsFailed(`Max retries exceeded: ${error.message}`);
        await this.paymentRepository.save(payment);
      } else {
        console.log(`🔄 Payment ${payment.id} will retry (${retryCount}/${this.maxRetries})`);
        await this.paymentRepository.save(payment);
        
        // Schedule retry
        setTimeout(async () => {
          await this.checkAndUpdatePaymentStatus(payment);
        }, this.retryDelay);
      }

    } catch (updateError) {
      console.error(`❌ Failed to handle payment check error for ${payment.id}:`, updateError);
    }
  }

  /**
   * Send payment confirmation
   */
  async sendPaymentConfirmation(payment) {
    try {
      console.log(`📧 Sending payment confirmation for: ${payment.id}`);
      // Implementation would send email/SMS notifications
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`❌ Failed to send payment confirmation for ${payment.id}:`, error);
    }
  }

  /**
   * Send payment failure notification
   */
  async sendPaymentFailureNotification(payment, paymentStatus) {
    try {
      console.log(`📧 Sending payment failure notification for: ${payment.id}`);
      // Implementation would send failure notifications
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`❌ Failed to send payment failure notification for ${payment.id}:`, error);
    }
  }

  /**
   * Update related business entities
   */
  async updateBusinessEntities(payment) {
    try {
      if (payment.listingId) {
        console.log(`🔄 Updating listing status for payment: ${payment.listingId}`);
        // Implementation would update listing status to "sold"
      }
    } catch (error) {
      console.error(`❌ Failed to update business entities for payment ${payment.id}:`, error);
    }
  }

  /**
   * Map internal status to PesaPal status for comparison
   */
  mapInternalStatusToPesaPal(internalStatus) {
    const statusMap = {
      'pending': 'PENDING',
      'completed': 'COMPLETED', 
      'failed': 'FAILED',
      'refunded': 'REFUNDED'
    };
    
    return statusMap[internalStatus] || 'PENDING';
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      pollingInterval: this.pollingInterval,
      maxRetries: this.maxRetries,
      lastPollTime: this.lastPollTime
    };
  }
}

// Stub services for polling service
class StubImageService {
  async uploadImage() { return 'image-url'; }
  async deleteImage() { return true; }
}
