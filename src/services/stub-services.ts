import { z } from 'zod';
import { ListingEntity } from '../domain/entities/listing.entity';
import { PaymentEntity } from '../domain/entities/payment.entity';
import { SecurityValidation } from '../utils/security-validation';
import { ValidationService, ImageService } from './listing.service';
import { NotificationService } from './notification.service';

// Stub implementations for dependencies
export class StubValidationService implements ValidationService {
  async validateListingCreation(listingData: any): Promise<any> {
    return SecurityValidation.validateListing(listingData);
  }

  async validateSearchCriteria(criteria: any): Promise<any> {
    // Basic validation for search criteria
    const validated = { ...criteria };
    
    if (validated.page && validated.page < 1) validated.page = 1;
    if (validated.limit && validated.limit > 100) validated.limit = 100;
    if (validated.limit && validated.limit < 1) validated.limit = 10;
    
    return validated;
  }

  async validateListingUpdates(updates: any): Promise<any> {
    // Only validate fields that are present in updates
    const schemaFields: any = {};
    
    if (updates.title !== undefined) {
      schemaFields.title = z.string().min(5).max(200);
    }
    
    if (updates.description !== undefined) {
      schemaFields.description = z.string().max(2000).optional();
    }
    
    if (updates.price !== undefined) {
      schemaFields.price = z.number().min(0).max(1000000);
    }
    
    if (updates.mileage !== undefined) {
      schemaFields.mileage = z.number().min(0).max(1000000);
    }
    
    if (updates.color !== undefined) {
      schemaFields.color = z.string().max(30).optional();
    }
    
    if (updates.location !== undefined) {
      schemaFields.location = z.string().min(1).max(100);
    }
    
    const updateSchema = z.object(schemaFields);
    return updateSchema.parse(updates);
  }

  async validatePayment(paymentData: any): Promise<any> {
    const paymentSchema = z.object({
      userId: z.string().min(1),
      amount: z.number().min(1).max(1000000),
      currency: z.enum(['USD', 'KES']),
      paymentMethod: z.enum(['pesapal', 'mpesa', 'card', 'financing']),
      customerDetails: z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email(),
        phone: z.string().min(1),
      }),
      billingAddress: z.object({
        line1: z.string().min(1),
        city: z.string().min(1),
        country: z.string().min(1),
        postalCode: z.string().optional(),
      }),
    });

    return paymentSchema.parse(paymentData);
  }

  async validateRegistration(userData: any): Promise<any> {
    const registrationSchema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().min(2),
      role: z.enum(['buyer', 'seller', 'both', 'admin']),
      phone: z.string().optional(),
    });

    return registrationSchema.parse(userData);
  }

  async validateLogin(credentials: any): Promise<any> {
    const loginSchema = z.object({
      email: z.string().email(),
      password: z.string().min(1),
    });

    return loginSchema.parse(credentials);
  }
}

export class StubImageService implements ImageService {
  async processListingImages(listingId: string, images: File[]): Promise<void> {
    // Implementation would handle image upload and processing
    console.log(`Processing ${images.length} images for listing ${listingId}`);
  }
}

export class StubNotificationService implements NotificationService {
  async notifyAdminForListingApproval(listing: ListingEntity): Promise<void> {
    // Implementation would notify admin about new listing
    console.log(`Admin notified about new listing: ${listing.title}`);
  }

  async notifyListingStatusChange(listing: ListingEntity): Promise<void> {
    // Implementation would notify user about status change
    console.log(`User notified about listing status change: ${listing.title}`);
  }

  async notifyPaymentSuccess(payment: any): Promise<void> {
    // Implementation would notify about successful payment
    console.log(`Payment success notification sent for payment: ${payment.id}`);
  }

  async notifyFinancingApplication(payment: any): Promise<void> {
    // Implementation would notify about financing application
    console.log(`Financing application notification sent for payment: ${payment.id}`);
  }

  async notifyPaymentRefund(payment: any): Promise<void> {
    // Implementation would notify about payment refund
    console.log(`Payment refund notification sent for payment: ${payment.id}`);
  }
}

export class StubEmailService {
  async sendVerificationEmail(user: any): Promise<void> {
    console.log(`Verification email sent to: ${user.email}`);
  }

  async sendPasswordResetEmail(user: any, resetToken: string): Promise<void> {
    console.log(`Password reset email sent to: ${user.email}`);
  }

  async sendPaymentConfirmation(payment: any): Promise<void> {
    console.log(`Payment confirmation email sent for payment: ${payment.id}`);
  }

  async sendPasswordChangedNotification(user: any): Promise<void> {
    console.log(`Password changed notification sent to: ${user.email}`);
  }
}

export class StubTokenService {
  async generateEmailVerificationToken(userId: string): Promise<string> {
    return `verification-token-${userId}-${Date.now()}`;
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    return false;
  }

  async blacklistToken(token: string, reason?: string): Promise<void> {
    console.log(`Token blacklisted: ${token} - ${reason}`);
  }

  async verifyEmailToken(token: string): Promise<string> {
    // Extract userId from token (simplified)
    const userId = token.split('-')[2];
    return userId;
  }

  async generatePasswordResetToken(userId: string): Promise<string> {
    return `reset-token-${userId}-${Date.now()}`;
  }
}

export class StubAuditService {
  async logSecurityEvent(event: any): Promise<void> {
    console.log('Security event logged:', event);
  }
}

export class StubRateLimitService {
  async checkLoginAttempts(email: string): Promise<void> {
    // Implementation would check rate limits
  }

  async recordFailedLogin(email: string): Promise<void> {
    // Implementation would record failed login attempts
  }

  async resetFailedLogins(email: string): Promise<void> {
    // Implementation would reset failed login attempts
  }
}
