import Database from 'better-sqlite3';
import { PaymentEntity } from '@/domain/entities/payment.entity';
import { PaymentRepository } from '@/domain/repositories/payment.repository';

export class SQLitePaymentRepository implements PaymentRepository {
  constructor(private db: Database.Database) {}

  async save(payment: PaymentEntity): Promise<PaymentEntity> {
    const paymentData = payment.toDatabase();
    
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO payments 
      (id, user_id, listing_id, amount, currency, status, payment_method, transaction_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      paymentData.id,
      paymentData.user_id,
      paymentData.listing_id,
      paymentData.amount,
      paymentData.currency,
      paymentData.status,
      paymentData.payment_method,
      paymentData.transaction_id,
      paymentData.created_at,
      paymentData.updated_at
    );

    return payment;
  }

  async findById(id: string): Promise<PaymentEntity | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM payments WHERE id = ?
    `);
    
    const row = stmt.get(id) as any;
    if (!row) return null;

    return PaymentEntity.fromDatabase(row);
  }

  async findByUserId(userId: string): Promise<PaymentEntity[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC
    `);
    
    const rows = stmt.all(userId) as any[];
    return rows.map(row => PaymentEntity.fromDatabase(row));
  }

  async findByTransactionId(transactionId: string): Promise<PaymentEntity | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM payments WHERE transaction_id = ?
    `);
    
    const row = stmt.get(transactionId) as any;
    if (!row) return null;

    return PaymentEntity.fromDatabase(row);
  }

  async findByListingId(listingId: string): Promise<PaymentEntity[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM payments WHERE listing_id = ? ORDER BY created_at DESC
    `);
    
    const rows = stmt.all(listingId) as any[];
    return rows.map(row => PaymentEntity.fromDatabase(row));
  }

  async updateStatus(id: string, status: string): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE payments SET status = ?, updated_at = ? WHERE id = ?
    `);
    
    stmt.run(status, new Date().toISOString(), id);
  }

  async delete(id: string): Promise<void> {
    const stmt = this.db.prepare(`
      DELETE FROM payments WHERE id = ?
    `);
    
    stmt.run(id);
  }

  async getPaymentStats(userId?: string): Promise<{
    totalPayments: number;
    totalAmount: number;
    successfulPayments: number;
    pendingPayments: number;
  }> {
    let query = `
      SELECT 
        COUNT(*) as total_payments,
        SUM(amount) as total_amount,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful_payments,
        SUM(CASE WHEN status IN ('pending', 'pending_financing') THEN 1 ELSE 0 END) as pending_payments
      FROM payments
    `;
    
    const params: any[] = [];
    
    if (userId) {
      query += ' WHERE user_id = ?';
      params.push(userId);
    }

    const stmt = this.db.prepare(query);
    const result = stmt.get(...params) as any;

    return {
      totalPayments: result.total_payments || 0,
      totalAmount: result.total_amount || 0,
      successfulPayments: result.successful_payments || 0,
      pendingPayments: result.pending_payments || 0,
    };
  }

  async getRecentPayments(limit: number = 10): Promise<PaymentEntity[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM payments 
      ORDER BY created_at DESC 
      LIMIT ?
    `);
    
    const rows = stmt.all(limit) as any[];
    return rows.map(row => PaymentEntity.fromDatabase(row));
  }
}
