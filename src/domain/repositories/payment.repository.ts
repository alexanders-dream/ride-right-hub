import { PaymentEntity } from '../entities/payment.entity';

export interface PaymentRepository {
  save(payment: PaymentEntity): Promise<PaymentEntity>;
  findById(id: string): Promise<PaymentEntity | null>;
  findByUserId(userId: string): Promise<PaymentEntity[]>;
  findByTransactionId(transactionId: string): Promise<PaymentEntity | null>;
  findByListingId(listingId: string): Promise<PaymentEntity[]>;
  updateStatus(id: string, status: string): Promise<void>;
  delete(id: string): Promise<void>;
}
