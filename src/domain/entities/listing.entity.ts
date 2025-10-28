import { PriceValueObject } from '../value-objects/price.value-object';
import { MileageValueObject } from '../value-objects/mileage.value-object';
import { LocationValueObject } from '../value-objects/location.value-object';

export type ListingStatus = 'active' | 'sold' | 'pending' | 'expired';
export type SellerType = 'dealer' | 'private';

export interface ListingProps {
  id: string;
  userId: string;
  title: string;
  description?: string;
  year: number;
  make: string;
  model: string;
  price: PriceValueObject;
  mileage: MileageValueObject;
  engineSize: number;
  color?: string;
  location: LocationValueObject;
  sellerType: SellerType;
  status: ListingStatus;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

export class ListingEntity {
  private props: ListingProps;

  private constructor(props: ListingProps) {
    this.props = props;
  }

  public static create(props: Omit<ListingProps, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'featured'>): ListingEntity {
    const now = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiration

    return new ListingEntity({
      ...props,
      id: this.generateId(),
      status: 'active',
      featured: false,
      createdAt: now,
      updatedAt: now,
      expiresAt,
    });
  }

  public static fromDatabase(props: ListingProps): ListingEntity {
    return new ListingEntity(props);
  }

  private static generateId(): string {
    return crypto.randomUUID();
  }

  // Getters
  public get id(): string {
    return this.props.id;
  }

  public get userId(): string {
    return this.props.userId;
  }

  public get title(): string {
    return this.props.title;
  }

  public get description(): string | undefined {
    return this.props.description;
  }

  public get year(): number {
    return this.props.year;
  }

  public get make(): string {
    return this.props.make;
  }

  public get model(): string {
    return this.props.model;
  }

  public get price(): PriceValueObject {
    return this.props.price;
  }

  public get mileage(): MileageValueObject {
    return this.props.mileage;
  }

  public get engineSize(): number {
    return this.props.engineSize;
  }

  public get color(): string | undefined {
    return this.props.color;
  }

  public get location(): LocationValueObject {
    return this.props.location;
  }

  public get sellerType(): SellerType {
    return this.props.sellerType;
  }

  public get status(): ListingStatus {
    return this.props.status;
  }

  public get featured(): boolean {
    return this.props.featured;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public get expiresAt(): Date | undefined {
    return this.props.expiresAt;
  }

  // Business logic methods
  public updateStatus(status: ListingStatus): void {
    this.props.status = status;
    this.props.updatedAt = new Date();
  }

  public markAsFeatured(featured: boolean): void {
    this.props.featured = featured;
    this.props.updatedAt = new Date();
  }

  public updateDetails(updates: Partial<Pick<ListingProps, 'title' | 'description' | 'price' | 'mileage' | 'color' | 'location'>>): void {
    this.props.title = updates.title ?? this.props.title;
    this.props.description = updates.description ?? this.props.description;
    this.props.price = updates.price ?? this.props.price;
    this.props.mileage = updates.mileage ?? this.props.mileage;
    this.props.color = updates.color ?? this.props.color;
    this.props.location = updates.location ?? this.props.location;
    this.props.updatedAt = new Date();
  }

  public isExpired(): boolean {
    return this.props.expiresAt ? new Date() > this.props.expiresAt : false;
  }

  public canBeEdited(): boolean {
    return this.props.status === 'active' && !this.isExpired();
  }

  public canBeDeleted(): boolean {
    return this.props.status !== 'sold';
  }

  public renew(): void {
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 30);
    this.props.expiresAt = newExpiresAt;
    this.props.status = 'active';
    this.props.updatedAt = new Date();
  }

  // Validation methods
  public isValid(): boolean {
    return this.validateTitle() && 
           this.validateYear() && 
           this.validateMake() && 
           this.validateModel() &&
           this.validateEngineSize();
  }

  private validateTitle(): boolean {
    return this.props.title.trim().length >= 5 && this.props.title.trim().length <= 200;
  }

  private validateYear(): boolean {
    const currentYear = new Date().getFullYear();
    return this.props.year >= 1900 && this.props.year <= currentYear + 1;
  }

  private validateMake(): boolean {
    return this.props.make.trim().length >= 1 && this.props.make.trim().length <= 50;
  }

  private validateModel(): boolean {
    return this.props.model.trim().length >= 1 && this.props.model.trim().length <= 50;
  }

  private validateEngineSize(): boolean {
    return this.props.engineSize >= 50 && this.props.engineSize <= 3000;
  }

  // Serialization
  public toJSON(): Omit<ListingProps, 'price' | 'mileage' | 'location'> & {
    price: number;
    mileage: number;
    location: string;
  } {
    return {
      ...this.props,
      price: this.props.price.getValue(),
      mileage: this.props.mileage.getValue(),
      location: this.props.location.getValue(),
    };
  }

  public toDatabase(): Omit<ListingProps, 'price' | 'mileage' | 'location'> & {
    price: number;
    mileage: number;
    location: string;
  } {
    return {
      id: this.props.id,
      userId: this.props.userId,
      title: this.props.title,
      description: this.props.description,
      year: this.props.year,
      make: this.props.make,
      model: this.props.model,
      engineSize: this.props.engineSize,
      color: this.props.color,
      sellerType: this.props.sellerType,
      status: this.props.status,
      featured: this.props.featured,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
      expiresAt: this.props.expiresAt,
      price: this.props.price.getValue(),
      mileage: this.props.mileage.getValue(),
      location: this.props.location.getValue(),
    };
  }
}
