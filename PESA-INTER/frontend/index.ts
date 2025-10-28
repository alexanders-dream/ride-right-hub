/**
 * PESA-INTER Package - Main Frontend Entry Point
 * 
 * This file provides the main entry point for the PESA-INTER frontend package.
 * It exports all the necessary React components and types for easy integration.
 * 
 * @author PESA-INTER Package
 * @version 1.0.0
 */

// Components
export { default as PaymentForm } from './components/PaymentForm';
export { default as PaymentPage } from './pages/PaymentPage';

// Types
export * from './types';

// Re-export specific types for convenience
export type {
  PaymentFormProps,
  PaymentPageProps,
  PaymentFormData,
  PaymentRecord,
  PaymentStatus,
  PaymentMethod,
  PaymentType,
  APIResponse,
  PaymentInitializationResponse,
  PaymentStatusResponse
} from './types';

// Version information
export const VERSION = '1.0.0';
export const PACKAGE_NAME = 'PESA-INTER';

// Default export for convenience
export default {
  PaymentForm: require('./components/PaymentForm').default,
  PaymentPage: require('./pages/PaymentPage').default,
  VERSION,
  PACKAGE_NAME
};
