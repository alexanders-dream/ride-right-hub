import { Database } from 'better-sqlite3';
import { UserRepository } from '../../domain/repositories/user.repository';
import { UserEntity, UserProps } from '../../domain/entities/user.entity';

export class SQLiteUserRepository implements UserRepository {
  constructor(private db: Database) {}

  async findById(id: string): Promise<UserEntity | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM users WHERE id = ?
    `);
    
    const row = stmt.get(id) as any;
    if (!row) return null;

    return this.mapToEntity(row);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM users WHERE email = ?
    `);
    
    const row = stmt.get(email) as any;
    if (!row) return null;

    return this.mapToEntity(row);
  }

  async save(user: UserEntity): Promise<UserEntity> {
    const userData = user.toDatabase();
    
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO users 
      (id, email, password_hash, name, role, phone, avatar_url, email_verified, created_at, updated_at, last_login)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      userData.id,
      userData.email,
      userData.passwordHash,
      userData.name,
      userData.role,
      userData.phone,
      userData.avatarUrl,
      userData.emailVerified ? 1 : 0,
      userData.createdAt.toISOString(),
      userData.updatedAt.toISOString(),
      userData.lastLogin?.toISOString()
    );

    return user;
  }

  async updateEmailVerification(userId: string, verified: boolean): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE users 
      SET email_verified = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      verified ? 1 : 0,
      new Date().toISOString(),
      userId
    );
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE users 
      SET password_hash = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      passwordHash,
      new Date().toISOString(),
      userId
    );
  }

  async updateLastLogin(userId: string): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE users 
      SET last_login = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      new Date().toISOString(),
      new Date().toISOString(),
      userId
    );
  }

  async delete(id: string): Promise<void> {
    const stmt = this.db.prepare(`
      DELETE FROM users WHERE id = ?
    `);

    stmt.run(id);
  }

  private mapToEntity(row: any): UserEntity {
    const props: UserProps = {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      name: row.name,
      role: row.role as 'buyer' | 'seller' | 'both' | 'admin',
      phone: row.phone || undefined,
      avatarUrl: row.avatar_url || undefined,
      emailVerified: Boolean(row.email_verified),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      lastLogin: row.last_login ? new Date(row.last_login) : undefined,
    };

    return UserEntity.fromDatabase(props);
  }
}
