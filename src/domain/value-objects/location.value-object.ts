export class LocationValueObject {
  private readonly value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Location cannot be empty');
    }
    
    if (value.length > 100) {
      throw new Error('Location cannot exceed 100 characters');
    }

    this.value = value.trim();
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: LocationValueObject): boolean {
    return this.value.toLowerCase() === other.getValue().toLowerCase();
  }

  public getCity(): string {
    const parts = this.value.split(',');
    return parts[0]?.trim() || this.value;
  }

  public getState(): string | null {
    const parts = this.value.split(',');
    return parts[1]?.trim() || null;
  }

  public getZipCode(): string | null {
    const parts = this.value.split(',');
    const lastPart = parts[parts.length - 1]?.trim();
    
    // Simple zip code extraction (5 digits)
    const zipMatch = lastPart?.match(/\b\d{5}\b/);
    return zipMatch ? zipMatch[0] : null;
  }

  public isWithinRadius(otherLocation: LocationValueObject, radiusMiles: number): boolean {
    // This is a simplified implementation
    // In a real application, you would use geocoding and distance calculation
    return this.value.toLowerCase() === otherLocation.getValue().toLowerCase();
  }

  public toString(): string {
    return this.value;
  }

  public format(): string {
    return this.value;
  }
}
