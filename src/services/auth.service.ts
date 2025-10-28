import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserEntity } from '../domain/entities/user.entity';
import { UserRepository } from '../domain/repositories/user.repository';
import { SecurityValidation } from '../utils/security-validation';

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  role: 'buyer' | 'seller' | 'both' | 'admin';
  phone?: string;
  avatarUrl?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface LoginDto {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class AuthService {
  private readonly bcryptRounds = 12;
  private readonly jwtSecret = process.env.JWT_SECRET || 'ride-right-hub-secret-key';
  private readonly jwtExpiry = '7d';

  constructor(
    private userRepository: UserRepository,
    private tokenService: TokenService,
    private emailService: EmailService,
    private auditService: AuditService,
    private rateLimitService: RateLimitService
  ) {}

  async register(userData: RegisterDto): Promise<UserEntity> {
    // Input validation
    if (!SecurityValidation.validateEmail(userData.email)) {
      throw new ValidationError('Invalid email format');
    }

    const passwordValidation = SecurityValidation.validatePassword(userData.password);
    if (!passwordValidation.isValid) {
      throw new ValidationError(passwordValidation.errors.join(', '));
    }

    // Check for existing user
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new ValidationError('User already exists');
    }
    
    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(userData.password, this.bcryptRounds);
    
    // Create user entity
    const user = UserEntity.create({
      email: SecurityValidation.sanitizeInput(userData.email),
      passwordHash,
      name: SecurityValidation.sanitizeInput(userData.name),
      role: userData.role,
      phone: userData.phone ? SecurityValidation.sanitizeInput(userData.phone) : undefined,
      avatarUrl: userData.avatarUrl,
    });
    
    // Save user
    const savedUser = await this.userRepository.save(user);
    
    // Generate verification token
    const verificationToken = await this.tokenService.generateEmailVerificationToken(savedUser.id);
    
    // Send verification email
    await this.emailService.sendVerificationEmail(savedUser, verificationToken);
    
    // Log security event
    await this.auditService.logSecurityEvent({
      userId: savedUser.id,
      action: 'user_registered',
      ipAddress: userData.ipAddress,
      userAgent: userData.userAgent,
    });
    
    return savedUser;
  }

  async login(credentials: LoginDto): Promise<{ user: UserEntity; token: string }> {
    // Rate limiting check
    await this.rateLimitService.checkLoginAttempts(credentials.email);
    
    // Find user
    const user = await this.userRepository.findByEmail(credentials.email);
    if (!user) {
      // Simulate password check to prevent timing attacks
      await bcrypt.compare('dummy_password', '$2b$12$dummyhash');
      throw new AuthenticationError('Invalid credentials');
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(credentials.password, user.passwordHash);
    if (!isValidPassword) {
      await this.rateLimitService.recordFailedLogin(credentials.email);
      throw new AuthenticationError('Invalid credentials');
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: user.role,
        iss: 'ride-right-hub',
        aud: 'ride-right-hub-users'
      },
      this.jwtSecret,
      { expiresIn: this.jwtExpiry }
    );
    
    // Update last login
    await this.userRepository.updateLastLogin(user.id);
    
    // Reset failed login attempts
    await this.rateLimitService.resetFailedLogins(credentials.email);
    
    // Log security event
    await this.auditService.logSecurityEvent({
      userId: user.id,
      action: 'user_logged_in',
      ipAddress: credentials.ipAddress,
      userAgent: credentials.userAgent,
    });
    
    return { user, token };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    // Verify current password
    const isValidCurrentPassword = await bcrypt.compare(
      changePasswordDto.currentPassword, 
      user.passwordHash
    );
    
    if (!isValidCurrentPassword) {
      throw new AuthenticationError('Current password is incorrect');
    }
    
    // Validate new password
    const passwordValidation = SecurityValidation.validatePassword(changePasswordDto.newPassword);
    if (!passwordValidation.isValid) {
      throw new ValidationError(passwordValidation.errors.join(', '));
    }
    
    // Hash new password
    const newPasswordHash = await bcrypt.hash(changePasswordDto.newPassword, this.bcryptRounds);
    
    // Update password
    await this.userRepository.updatePassword(userId, newPasswordHash);
    
    // Log security event
    await this.auditService.logSecurityEvent({
      userId,
      action: 'password_changed',
    });
    
    // Send notification email
    await this.emailService.sendPasswordChangedNotification(user);
  }

  async verifyToken(token: string): Promise<UserEntity | null> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      
      // Check if token is blacklisted
      const isBlacklisted = await this.tokenService.isTokenBlacklisted(token);
      if (isBlacklisted) {
        return null;
      }
      
      const user = await this.userRepository.findById(decoded.userId);
      return user || null;
    } catch (error) {
      return null;
    }
  }

  async logout(token: string): Promise<void> {
    await this.tokenService.blacklistToken(token);
  }
}

// Stub implementations for dependencies (to be implemented later)
export class TokenService {
  async generateEmailVerificationToken(userId: string): Promise<string> {
    return jwt.sign({ userId }, process.env.JWT_SECRET || 'ride-right-hub-secret-key', { expiresIn: '24h' });
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    // Implementation would check against a blacklist database
    return false;
  }

  async blacklistToken(token: string): Promise<void> {
    // Implementation would add token to blacklist database
  }
}

export class EmailService {
  async sendVerificationEmail(user: UserEntity, token: string): Promise<void> {
    // Implementation would send verification email
    console.log(`Verification email sent to ${user.email} with token: ${token}`);
  }

  async sendPasswordChangedNotification(user: UserEntity): Promise<void> {
    // Implementation would send password change notification
    console.log(`Password change notification sent to ${user.email}`);
  }
}

export class AuditService {
  async logSecurityEvent(event: any): Promise<void> {
    // Implementation would log security events to database
    console.log('Security event logged:', event);
  }
}

export class RateLimitService {
  async checkLoginAttempts(email: string): Promise<void> {
    // Implementation would check rate limits
  }

  async recordFailedLogin(email: string): Promise<void> {
    // Implementation would record failed login attempts
  }

  async resetFailedLogins(email: string): Promise<void> {
    // Implementation would reset failed login attempts
  }
}
