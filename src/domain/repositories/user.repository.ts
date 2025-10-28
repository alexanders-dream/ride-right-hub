import { UserEntity } from '../entities/user.entity';

export interface UserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  save(user: UserEntity): Promise<UserEntity>;
  updateEmailVerification(userId: string, verified: boolean): Promise<void>;
  updatePassword(userId: string, passwordHash: string): Promise<void>;
  updateLastLogin(userId: string): Promise<void>;
  delete(id: string): Promise<void>;
}
