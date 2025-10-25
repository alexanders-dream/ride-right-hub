export interface PaymentProps {
  id?: string;
  userId: string;
  listingId?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'pending_financing';
  paymentMethod: 'pesapal' | 'mpesa' | 'card' | 'financing';
  transactionId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class PaymentEntity {
  private readonly _id: string;
  private readonly _userId: string;
  private readonly _listingId?: string;
  private readonly _amount: number;
  private readonly _currency: string;
  private _status: 'pending' | 'completed' | 'failed' | 'refunded' | 'pending_financing';
  private readonly _paymentMethod: 'pesapal' | 'mpesa' | 'card' | 'financing';
  private _transactionId?: string;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: PaymentProps) {
    this._id = props.id || this.generateId();
    this._userId = props.userId;
    this._listingId = props.listingId;
    this._amount = props.amount;
    this._currency = props.currency;
    this._status = props.status || 'pending';
    this._paymentMethod = props.paymentMethod;
    this._transactionId = props.transactionId;
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
  }

  static create(props: PaymentProps): PaymentEntity {
    return new PaymentEntity(props);
  }

  private generateId(): string {
    return `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get userId(): string {
    return this._userId;
  }

  get listingId(): string | undefined {
    return this._listingId;
  }

  get amount(): number {
    return this._amount;
  }

  get currency(): string {
    return this._currency;
  }

  get status(): string {
    return this._status;
  }

  get paymentMethod(): string {
    return this._paymentMethod;
  }

  get transactionId(): string | undefined {
    return this._transactionId;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Business logic methods
  markAsCompleted(transactionId: string): void {
    if (this._status === 'completed') {
      throw new Error('Payment is already completed');
    }
    
    this._status = 'completed';
    this._transactionId = transactionId;
    this._updatedAt = new Date();
  }

  markAsFailed(reason?: string): void {
    this._status = 'failed';
    this._updatedAt = new Date();
  }

  updateStatus(status: 'pending' | 'completed' | 'failed' | 'refunded' | 'pending_financing'): void {
    this._status = status;
    this._updatedAt = new Date();
  }

  updateTransactionId(transactionId: string): void {
    this._transactionId = transactionId;
    this._updatedAt = new Date();
  }

  canBeRefunded(): boolean {
    return this._status === 'completed';
  }

  isSuccessful(): boolean {
    return this._status === 'completed';
  }

  isPending(): boolean {
    return this._status === 'pending' || this._status === 'pending_financing';
  }

  // Serialization methods
  toJSON(): object {
    return {
      id: this._id,
      userId: this._userId,
      listingId: this._listingId,
      amount: this._amount,
      currency: this._currency,
      status: this._status,
      paymentMethod: this._paymentMethod,
      transactionId: this._transactionId,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
    };
  }

  toDatabase(): {
    id: string;
    user_id: string;
    listing_id?: string;
    amount: number;
    currency: string;
    status: string;
    payment_method: string;
    transaction_id?: string;
    created_at: string;
    updated_at: string;
  } {
    return {
      id: this._id,
      user_id: this._userId,
      listing_id: this._listingId,
      amount: this._amount,
      currency: this._currency,
      status: this._status,
      payment_method: this._paymentMethod,
      transaction_id: this._transactionId,
      created_at: this._createdAt.toISOString(),
      updated_at: this._updatedAt.toISOString(),
    };
  }

  static fromDatabase(data: any): PaymentEntity {
    return new PaymentEntity({
      id: data.id,
      userId: data.user_id,
      listingId: data.listing_id,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      paymentMethod: data.payment_method,
      transactionId: data.transaction_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    });
  }
}
