import { z } from 'zod';

// Validation schemas
const createListingSchema = z.object({
  title: z.string().min(10).max(200),
  description: z.string().min(50).max(2000),
  year: z.number().min(1900).max(new Date().getFullYear() + 1),
  make: z.string().min(1).max(50),
  model: z.string().min(1).max(50),
  price: z.number().min(0).max(1000000),
  mileage: z.number().min(0).max(1000000),
  engineSize: z.number().min(50).max(3000),
  color: z.string().min(1).max(30),
  location: z.string().min(1).max(100),
  sellerType: z.enum(['dealer', 'private']),
});

const searchCriteriaSchema = z.object({
  make: z.string().optional(),
  model: z.string().optional(),
  minPrice: z.number().min(0).max(1000000).optional(),
  maxPrice: z.number().min(0).max(1000000).optional(),
  minYear: z.number().min(1900).max(new Date().getFullYear() + 1).optional(),
  maxYear: z.number().min(1900).max(new Date().getFullYear() + 1).optional(),
  location: z.string().optional(),
  limit: z.number().min(1).max(100).default(10),
  page: z.number().min(1).default(1),
});

const paymentSchema = z.object({
  userId: z.string().min(1),
  listingId: z.string().optional(),
  amount: z.number().min(1).max(10000000),
  currency: z.enum(['USD', 'KES', 'EUR', 'GBP']).default('KES'),
  paymentMethod: z.enum(['pesapal', 'mpesa', 'card', 'financing']),
  customerDetails: z.object({
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
    email: z.string().email(),
    phone: z.string().optional(),
  }),
  billingAddress: z.object({
    line1: z.string().min(1).max(100),
    city: z.string().min(1).max(50),
    country: z.string().min(1).max(50),
    postalCode: z.string().optional(),
  }).optional(),
});

export class ValidationService {
  async validateListingCreation(listingData: any): Promise<any> {
    try {
      return createListingSchema.parse(listingData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        throw new Error(`Validation failed: ${errorMessages}`);
      }
      throw error;
    }
  }

  async validateSearchCriteria(criteria: any): Promise<any> {
    try {
      return searchCriteriaSchema.parse(criteria);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        throw new Error(`Search validation failed: ${errorMessages}`);
      }
      throw error;
    }
  }

  async validateRegistration(userData: any): Promise<void> {
    // Basic registration validation
    if (!userData.email || !userData.password || !userData.name) {
      throw new Error('Email, password, and name are required');
    }
    
    if (userData.password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
  }

  async validateListingUpdates(updateData: any): Promise<any> {
    // For now, use the same validation as creation
    return await this.validateListingCreation(updateData);
  }

  async validatePayment(paymentData: any): Promise<any> {
    try {
      return paymentSchema.parse(paymentData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        throw new Error(`Payment validation failed: ${errorMessages}`);
      }
      throw error;
    }
  }
}
