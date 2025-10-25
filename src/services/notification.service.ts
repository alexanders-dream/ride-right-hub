import { PaymentEntity } from '../domain/entities/payment.entity';

export interface NotificationService {
  notifyPaymentSuccess(payment: PaymentEntity): Promise<void>;
  notifyFinancingApplication(payment: PaymentEntity): Promise<void>;
  notifyPaymentRefund(payment: PaymentEntity): Promise<void>;
}
