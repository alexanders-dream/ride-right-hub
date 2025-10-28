export interface UserProps {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'buyer' | 'seller' | 'both' | 'admin';
  phone?: string;
  avatarUrl?: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

export class UserEntity {
  private props: UserProps;

  private constructor(props: UserProps) {
    this.props = props;
  }

  public static create(props: Omit<UserProps, 'id' | 'createdAt' | 'updatedAt' | 'emailVerified'>): UserEntity {
    const now = new Date();
    return new UserEntity({
      ...props,
      id: this.generateId(),
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static fromDatabase(props: UserProps): UserEntity {
    return new UserEntity(props);
  }

  private static generateId(): string {
    return crypto.randomUUID();
  }

  // Getters
  public get id(): string {
    return this.props.id;
  }

  public get email(): string {
    return this.props.email;
  }

  public get passwordHash(): string {
    return this.props.passwordHash;
  }

  public get name(): string {
    return this.props.name;
  }

  public get role(): string {
    return this.props.role;
  }

  public get phone(): string | undefined {
    return this.props.phone;
  }

  public get avatarUrl(): string | undefined {
    return this.props.avatarUrl;
  }

  public get emailVerified(): boolean {
    return this.props.emailVerified;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public get lastLogin(): Date | undefined {
    return this.props.lastLogin;
  }

  // Business logic methods
  public canCreateListing(): boolean {
    return ['seller', 'both', 'admin'].includes(this.props.role);
  }

  public canManageListings(): boolean {
    return this.props.role === 'admin';
  }

  public canManageContent(): boolean {
    return this.props.role === 'admin';
  }

  public verifyEmail(): void {
    this.props.emailVerified = true;
    this.props.updatedAt = new Date();
  }

  public updateLastLogin(): void {
    this.props.lastLogin = new Date();
    this.props.updatedAt = new Date();
  }

  public updateProfile(updates: Partial<Pick<UserProps, 'name' | 'phone' | 'avatarUrl'>>): void {
    this.props.name = updates.name ?? this.props.name;
    this.props.phone = updates.phone ?? this.props.phone;
    this.props.avatarUrl = updates.avatarUrl ?? this.props.avatarUrl;
    this.props.updatedAt = new Date();
  }

  public changePassword(newPasswordHash: string): void {
    this.props.passwordHash = newPasswordHash;
    this.props.updatedAt = new Date();
  }

  // Validation methods
  public isValid(): boolean {
    return this.validateEmail() && this.validateName();
  }

  private validateEmail(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this.props.email);
  }

  private validateName(): boolean {
    return this.props.name.trim().length >= 2 && this.props.name.trim().length <= 100;
  }

  // Serialization
  public toJSON(): Omit<UserProps, 'passwordHash'> {
    const { passwordHash, ...userWithoutPassword } = this.props;
    return userWithoutPassword;
  }

  public toDatabase(): UserProps {
    return { ...this.props };
  }
}
