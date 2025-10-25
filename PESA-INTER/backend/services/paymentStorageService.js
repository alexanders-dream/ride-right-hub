const fs = require('fs').promises;
const path = require('path');

/**
 * File-based Payment Storage Service - Reusable Integration Package
 * Stores payment records as JSON files with specified naming convention
 * Format: [DATE]_[PAYER_NAME]_[TRANSACTION_TYPE]_[SERVICE_PAID_FOR].json
 * 
 * @author PESA-INTER Package
 * @version 1.0.0
 */
class PaymentStorageService {
  constructor(config = {}) {
    this.config = {
      paymentDir: config.paymentDir || path.join(process.cwd(), 'Payment'),
      logger: config.logger || console,
      businessName: config.businessName || process.env.BUSINESS_NAME || 'Your Business',
      ...config
    };
    
    this.ensureDirectoryExists();
  }

  /**
   * Ensure the Payment directory exists
   */
  async ensureDirectoryExists() {
    try {
      await fs.access(this.config.paymentDir);
    } catch (error) {
      // Directory doesn't exist, create it
      try {
        await fs.mkdir(this.config.paymentDir, { recursive: true });
        this.config.logger.info('Payment directory created:', this.config.paymentDir);
      } catch (createError) {
        this.config.logger.error('Failed to create Payment directory:', createError);
        throw createError;
      }
    }
  }

  /**
   * Generate filename based on payment data
   * Format: [DATE]_[PAYER_NAME]_[TRANSACTION_TYPE]_[SERVICE_PAID_FOR].json
   */
  generateFilename(paymentData) {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Clean payer name
    const payerName = this.cleanString(
      paymentData.customer?.firstName && paymentData.customer?.lastName
        ? `${paymentData.customer.firstName}_${paymentData.customer.lastName}`
        : paymentData.customer?.firstName || paymentData.customer?.lastName || 'Unknown'
    );
    
    // Determine transaction type based on payment method
    const transactionType = this.getTransactionType(paymentData);
    
    // Clean service description
    const servicePaidFor = this.cleanString(paymentData.description || 'General_Payment');
    
    return `${date}_${payerName}_${transactionType}_${servicePaidFor}.json`;
  }

  /**
   * Get transaction type based on payment method and data
   */
  getTransactionType(paymentData) {
    if (paymentData.paymentMethod === 'MPESA' || 
        paymentData.pesapalData?.paymentMethod?.toLowerCase().includes('mpesa')) {
      return 'mpesa';
    }
    
    if (paymentData.paymentMethod === 'CARD' || 
        paymentData.pesapalData?.paymentMethod?.toLowerCase().includes('card') ||
        paymentData.pesapalData?.paymentMethod?.toLowerCase().includes('visa') ||
        paymentData.pesapalData?.paymentMethod?.toLowerCase().includes('mastercard')) {
      return 'card';
    }
    
    if (paymentData.paymentMethod === 'OTHER_MOBILE' ||
        paymentData.pesapalData?.paymentMethod?.toLowerCase().includes('airtel') ||
        paymentData.pesapalData?.paymentMethod?.toLowerCase().includes('tkash')) {
      return 'mobile_money';
    }
    
    return 'other';
  }

  /**
   * Clean string for filename (remove special characters, spaces, etc.)
   */
  cleanString(str) {
    return str
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 50) // Limit length
      .toLowerCase();
  }

  /**
   * Save payment data to file
   */
  async savePayment(paymentData) {
    try {
      await this.ensureDirectoryExists();
      
      const filename = this.generateFilename(paymentData);
      const filepath = path.join(this.config.paymentDir, filename);
      
      // Prepare payment record
      const paymentRecord = {
        // Metadata
        savedAt: new Date().toISOString(),
        filename,
        businessName: this.config.businessName,
        
        // Payment identifiers
        merchantReference: paymentData.merchantReference,
        orderTrackingId: paymentData.orderTrackingId,
        
        // Payment details
        amount: paymentData.amount,
        currency: paymentData.currency || 'KES',
        description: paymentData.description,
        status: paymentData.status,
        
        // Customer information
        customer: {
          firstName: paymentData.customer?.firstName,
          lastName: paymentData.customer?.lastName,
          email: paymentData.customer?.email,
          phone: paymentData.customer?.phone,
          fullName: paymentData.customerFullName || 
                   `${paymentData.customer?.firstName || ''} ${paymentData.customer?.lastName || ''}`.trim()
        },
        
        // Payment method and transaction details
        paymentMethod: paymentData.paymentMethod,
        transactionType: this.getTransactionType(paymentData),
        
        // PesaPal data
        pesapalData: {
          redirectURL: paymentData.pesapalData?.redirectURL,
          paymentMethod: paymentData.pesapalData?.paymentMethod,
          confirmationCode: paymentData.pesapalData?.confirmationCode,
          paymentAccount: paymentData.pesapalData?.paymentAccount,
          createdDate: paymentData.pesapalData?.createdDate,
          ipnId: paymentData.pesapalData?.ipnId
        },
        
        // URLs
        callbackURL: paymentData.callbackURL,
        cancellationURL: paymentData.cancellationURL,
        
        // Business context
        branch: paymentData.branch || this.config.businessName,
        paymentType: paymentData.paymentType,
        
        // Timestamps
        createdAt: paymentData.createdAt || new Date().toISOString(),
        updatedAt: paymentData.updatedAt || new Date().toISOString(),
        
        // Status history
        statusHistory: paymentData.statusHistory || [],
        
        // IPN and callback events
        ipnNotifications: paymentData.ipnNotifications || [],
        callbackEvents: paymentData.callbackEvents || [],
        
        // Additional metadata
        metadata: paymentData.metadata || {}
      };
      
      // Write to file
      await fs.writeFile(filepath, JSON.stringify(paymentRecord, null, 2), 'utf8');
      
      this.config.logger.info('Payment record saved to file:', {
        filename,
        merchantReference: paymentData.merchantReference,
        amount: `${paymentRecord.currency} ${paymentRecord.amount}`,
        status: paymentRecord.status
      });
      
      return {
        success: true,
        filename,
        filepath,
        paymentRecord
      };
      
    } catch (error) {
      this.config.logger.error('Failed to save payment to file:', error);
      throw new Error(`Payment file storage failed: ${error.message}`);
    }
  }

  /**
   * Load payment data from file
   */
  async loadPayment(filename) {
    try {
      const filepath = path.join(this.config.paymentDir, filename);
      const data = await fs.readFile(filepath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      this.config.logger.error('Failed to load payment from file:', error);
      throw new Error(`Payment file loading failed: ${error.message}`);
    }
  }

  /**
   * Update existing payment file
   */
  async updatePayment(filename, updateData) {
    try {
      const existingData = await this.loadPayment(filename);
      
      const updatedData = {
        ...existingData,
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      
      const filepath = path.join(this.config.paymentDir, filename);
      await fs.writeFile(filepath, JSON.stringify(updatedData, null, 2), 'utf8');
      
      this.config.logger.info('Payment record updated:', {
        filename,
        merchantReference: updatedData.merchantReference
      });
      
      return updatedData;
    } catch (error) {
      this.config.logger.error('Failed to update payment file:', error);
      throw new Error(`Payment file update failed: ${error.message}`);
    }
  }

  /**
   * List all payment files
   */
  async listPayments() {
    try {
      await this.ensureDirectoryExists();
      const files = await fs.readdir(this.config.paymentDir);
      return files.filter(file => file.endsWith('.json'));
    } catch (error) {
      this.config.logger.error('Failed to list payment files:', error);
      throw new Error(`Payment file listing failed: ${error.message}`);
    }
  }

  /**
   * Get payment statistics
   */
  async getPaymentStats() {
    try {
      const files = await this.listPayments();
      const stats = {
        totalPayments: files.length,
        byTransactionType: {},
        byStatus: {},
        totalAmount: 0,
        currency: 'KES'
      };
      
      for (const file of files) {
        try {
          const payment = await this.loadPayment(file);
          
          // Count by transaction type
          const transactionType = payment.transactionType || 'unknown';
          stats.byTransactionType[transactionType] = (stats.byTransactionType[transactionType] || 0) + 1;
          
          // Count by status
          const status = payment.status || 'unknown';
          stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
          
          // Sum amounts (only for completed payments)
          if (payment.status === 'COMPLETED' && payment.amount) {
            stats.totalAmount += parseFloat(payment.amount);
          }
        } catch (fileError) {
          this.config.logger.warn('Failed to process payment file for stats:', file, fileError);
        }
      }
      
      return stats;
    } catch (error) {
      this.config.logger.error('Failed to get payment statistics:', error);
      throw new Error(`Payment statistics failed: ${error.message}`);
    }
  }

  /**
   * Find payment by merchant reference
   */
  async findPaymentByReference(merchantReference) {
    try {
      const files = await this.listPayments();
      
      for (const file of files) {
        try {
          const payment = await this.loadPayment(file);
          if (payment.merchantReference === merchantReference) {
            return { filename: file, payment };
          }
        } catch (fileError) {
          this.config.logger.warn('Failed to check payment file:', file, fileError);
        }
      }
      
      return null;
    } catch (error) {
      this.config.logger.error('Failed to find payment by reference:', error);
      throw new Error(`Payment search failed: ${error.message}`);
    }
  }
}

module.exports = PaymentStorageService;
