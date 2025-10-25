/**
 * PESA-INTER Package - TypeScript Type Definitions
 * 
 * @author PESA-INTER Package
 * @version 1.0.0
 */

// ============================================================================
// PAYMENT TYPES
// ============================================================================

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'INVALID' | 'REVERSED';

export type PaymentType = 'MERCHANDISE' | 'TICKETS' | 'MEMBERSHIP' | 'DONATION' | 'OTHER';

export type PaymentMethod = 'MPESA' | 'CARD' | 'PESAPAL' | 'OTHER_MOBILE';

export type TransactionType = 'mpesa' | 'card' | 'mobile_money' | 'other';

export type Currency = 'KES' | 'UGX' | 'TZS' | 'RWF' | 'BIF' | 'USD';

export type Environment = 'sandbox' | 'production';

export type Theme = 'dark' | 'light';

// ============================================================================
// PAYMENT DATA INTERFACES
// ============================================================================

export interface PaymentFormData {
  amount: number;
  description: string;
  customerEmail?: string;
  customerPhone?: string;
  firstName?: string;
  lastName?: string;
  paymentType: PaymentType;
  paymentMethod: PaymentMethod;
}

export interface CustomerInfo {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  fullName?: string;
}

export interface PesaPalData {
  redirectURL?: string;
  paymentMethod?: string;
  confirmationCode?: string;
  paymentAccount?: string;
  createdDate?: Date;
  ipnId?: string;
}

export interface PaymentRecord {
  // Metadata
  savedAt: string;
  filename: string;
  businessName: string;
  
  // Payment identifiers
  merchantReference: string;
  orderTrackingId?: string;
  
  // Payment details
  amount: number;
  currency: Currency;
  description: string;
  status: PaymentStatus;
  
  // Customer information
  customer: CustomerInfo;
  
  // Payment method and transaction details
  paymentMethod: PaymentMethod;
  transactionType: TransactionType;
  
  // PesaPal data
  pesapalData: PesaPalData;
  
  // URLs
  callbackURL?: string;
  cancellationURL?: string;
  
  // Business context
  branch?: string;
  paymentType: PaymentType;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  
  // Status history
  statusHistory: PaymentStatusHistoryItem[];
  
  // IPN and callback events
  ipnNotifications: IPNNotification[];
  callbackEvents: CallbackEvent[];
  
  // Additional metadata
  metadata: Record<string, any>;
}

export interface PaymentStatusHistoryItem {
  status: PaymentStatus;
  timestamp: string;
  source: 'IPN' | 'CALLBACK' | 'MANUAL' | 'SYSTEM';
  details?: string;
}

export interface IPNNotification {
  orderTrackingId: string;
  orderMerchantReference: string;
  orderNotificationType: string;
  timestamp: string;
  processed: boolean;
}

export interface CallbackEvent {
  orderTrackingId: string;
  orderMerchantReference: string;
  orderNotificationType: string;
  timestamp: string;
  userAgent?: string;
  ip?: string;
}

// ============================================================================
// API RESPONSE INTERFACES
// ============================================================================

export interface APIResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaymentInitializationResponse {
  merchantReference: string;
  orderTrackingId: string;
  redirectURL: string;
  amount: number;
  currency: Currency;
  description: string;
  paymentMethod: PaymentMethod;
}

export interface PaymentStatusResponse {
  merchantReference: string;
  orderTrackingId: string;
  status: PaymentStatus;
  amount: number;
  currency: Currency;
  description: string;
  paymentMethod?: string;
  confirmationCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentStatsResponse {
  totalPayments: number;
  byTransactionType: Record<TransactionType, number>;
  byStatus: Record<PaymentStatus, number>;
  totalAmount: number;
  currency: Currency;
}

export interface PaymentHistoryResponse {
  payments: PaymentRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

// ============================================================================
// COMPONENT PROPS INTERFACES
// ============================================================================

export interface PaymentFormProps {
  onSuccess?: (paymentData: PaymentInitializationResponse) => void;
  onError?: (error: string) => void;
  defaultAmount?: number;
  defaultDescription?: string;
  defaultPaymentType?: PaymentType;
  defaultPaymentMethod?: PaymentMethod;
  apiBaseUrl?: string;
  businessName?: string;
  currency?: Currency;
  className?: string;
  theme?: Theme;
}

export interface PaymentPageProps {
  businessName?: string;
  apiBaseUrl?: string;
  theme?: Theme;
  onPaymentSuccess?: (data: PaymentInitializationResponse) => void;
  onPaymentError?: (error: string) => void;
  onBackToHome?: () => void;
  className?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  headerContent?: React.ReactNode;
  footerContent?: React.ReactNode;
}

// ============================================================================
// CONFIGURATION INTERFACES
// ============================================================================

export interface PesaPalServiceConfig {
  consumerKey: string;
  consumerSecret: string;
  environment: Environment;
  callbackBaseURL: string;
  businessName: string;
  logger?: Logger;
  debug?: boolean;
}

export interface PaymentStorageConfig {
  paymentDir?: string;
  logger?: Logger;
  businessName?: string;
}

export interface PaymentControllerConfig extends PesaPalServiceConfig, PaymentStorageConfig {
  frontendURL: string;
  enableFileStorage?: boolean;
  enableDatabase?: boolean;
}

export interface Logger {
  error: (message: string, meta?: any) => void;
  warn: (message: string, meta?: any) => void;
  info: (message: string, meta?: any) => void;
  http: (message: string, meta?: any) => void;
  debug: (message: string, meta?: any) => void;
}

// ============================================================================
// PESAPAL API INTERFACES
// ============================================================================

export interface PesaPalAuthResponse {
  token: string;
  expiryDate: string;
  status: string;
  message?: string;
}

export interface PesaPalOrderRequest {
  id: string;
  currency: Currency;
  amount: number;
  description: string;
  callback_url: string;
  cancellation_url: string;
  notification_id: string;
  branch: string;
  billing_address: {
    email_address?: string;
    phone_number?: string;
    country_code: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    line_1?: string;
    line_2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    zip_code?: string;
  };
}

export interface PesaPalOrderResponse {
  order_tracking_id: string;
  merchant_reference: string;
  redirect_url: string;
  status: string;
  message?: string;
}

export interface PesaPalTransactionStatus {
  paymentMethod: string;
  amount: number;
  createdDate: string;
  confirmationCode: string;
  paymentStatus: string;
  statusCode: string;
  merchantReference: string;
  currency: Currency;
  paymentAccount: string;
  description: string;
}

export interface PesaPalIPNRequest {
  url: string;
  ipn_notification_type: 'GET' | 'POST';
}

export interface PesaPalIPNResponse {
  ipn_id: string;
  url: string;
  ipn_status_description: string;
  status: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type Nullable<T> = T | null;

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface PaymentError extends Error {
  code?: string;
  status?: number;
  details?: any;
}

export interface ValidationError extends PaymentError {
  field?: string;
  value?: any;
}

export interface PesaPalError extends PaymentError {
  pesapalCode?: string;
  pesapalMessage?: string;
}

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

export * from './index';
