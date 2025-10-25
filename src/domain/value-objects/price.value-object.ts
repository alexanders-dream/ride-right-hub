export class PriceValueObject {
  private readonly value: number;

  constructor(value: number) {
    if (value < 0) {
      throw new Error('Price cannot be negative');
    }
    
    if (value > 100000000) {
      throw new Error('Price cannot exceed KSh 100,000,000');
    }

    this.value = Math.round(value * 100) / 100; // Round to 2 decimal places
  }

  public getValue(): number {
    return this.value;
  }

  public format(): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(this.value);
  }

  public equals(other: PriceValueObject): boolean {
    return this.value === other.getValue();
  }

  public add(amount: number): PriceValueObject {
    return new PriceValueObject(this.value + amount);
  }

  public subtract(amount: number): PriceValueObject {
    return new PriceValueObject(this.value - amount);
  }

  public multiply(factor: number): PriceValueObject {
    return new PriceValueObject(this.value * factor);
  }

  public isGreaterThan(other: PriceValueObject): boolean {
    return this.value > other.getValue();
  }

  public isLessThan(other: PriceValueObject): boolean {
    return this.value < other.getValue();
  }

  public toString(): string {
    return this.value.toString();
  }
}
