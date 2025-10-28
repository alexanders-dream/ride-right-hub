export class MileageValueObject {
  private readonly value: number;

  constructor(value: number) {
    if (value < 0) {
      throw new Error('Mileage cannot be negative');
    }
    
    if (value > 1000000) {
      throw new Error('Mileage cannot exceed 1,000,000 miles');
    }

    this.value = Math.round(value);
  }

  public getValue(): number {
    return this.value;
  }

  public format(): string {
    return new Intl.NumberFormat('en-US').format(this.value) + ' miles';
  }

  public equals(other: MileageValueObject): boolean {
    return this.value === other.getValue();
  }

  public isLowMileage(): boolean {
    return this.value < 10000;
  }

  public isHighMileage(): boolean {
    return this.value > 50000;
  }

  public toString(): string {
    return this.value.toString();
  }
}
