import { z } from 'zod';

export class SecurityValidation {
  static sanitizeInput(input: string): string {
    // Basic sanitization - remove leading/trailing whitespace
    // In a real application, you would use DOMPurify or similar
    return input.trim();
  }

  static validateEmail(email: string): boolean {
    const emailSchema = z.string().email();
    try {
      emailSchema.parse(email);
      return true;
    } catch {
      return false;
    }
  }

  static validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateListing(listingData: any) {
    const listingSchema = z.object({
      title: z.string().min(5).max(200).transform(val => this.sanitizeInput(val)),
      year: z.number().min(1900).max(new Date().getFullYear() + 1),
      make: z.string().min(1).max(50).transform(val => this.sanitizeInput(val)),
      model: z.string().min(1).max(50).transform(val => this.sanitizeInput(val)),
      price: z.number().min(0).max(10000000), // Increased from 1,000,000 to 10,000,000
      mileage: z.number().min(0).max(1000000),
      location: z.string().min(1).max(100).transform(val => this.sanitizeInput(val)),
      sellerType: z.enum(['dealer', 'private']),
      engineSize: z.number().min(50).max(3000),
      color: z.string().min(1).max(30).transform(val => this.sanitizeInput(val)),
      description: z.string().max(2000).optional().transform(val => val ? this.sanitizeInput(val) : ''),
    });

    return listingSchema.parse(listingData);
  }

  static validatePayment(paymentData: any) {
    const paymentSchema = z.object({
      cardNumber: z.string().regex(/^\d{16}$/, 'Invalid card number'),
      expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Invalid expiry date'),
      cvv: z.string().regex(/^\d{3,4}$/, 'Invalid CVV'),
      amount: z.number().min(1).max(100000),
      currency: z.enum(['USD', 'EUR', 'GBP']),
    });

    return paymentSchema.parse(paymentData);
  }
}
