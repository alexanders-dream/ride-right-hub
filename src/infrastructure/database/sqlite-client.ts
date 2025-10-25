import Database from 'better-sqlite3';
import path from 'path';

export class SQLiteClient {
  private db: Database.Database;

  constructor() {
    const dbPath = process.env.NODE_ENV === 'production' 
      ? '/data/ride-right-hub.db'
      : path.join(process.cwd(), 'ride-right-hub.db');
    
    this.db = new Database(dbPath);
    this.setupPragmas();
    this.setupTables();
  }

  private setupPragmas(): void {
    // Enable foreign keys
    this.db.pragma('foreign_keys = ON');
    
    // Enable WAL mode for better concurrency
    this.db.pragma('journal_mode = WAL');
    
    // Enable synchronous mode for data integrity
    this.db.pragma('synchronous = NORMAL');
    
    // Set cache size
    this.db.pragma('cache_size = -64000'); // 64MB cache
  }

  private setupTables(): void {
    // Run all table creation scripts
    const schema = this.getSchema();
    this.db.exec(schema);
  }

  private getSchema(): string {
    return `
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('buyer', 'seller', 'both', 'admin')),
        phone TEXT,
        avatar_url TEXT,
        email_verified INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME
      );

      -- Listings table
      CREATE TABLE IF NOT EXISTS listings (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        year INTEGER NOT NULL,
        make TEXT NOT NULL,
        model TEXT NOT NULL,
        price REAL NOT NULL,
        mileage INTEGER NOT NULL,
        engine_size INTEGER NOT NULL,
        color TEXT,
        location TEXT NOT NULL,
        seller_type TEXT CHECK (seller_type IN ('dealer', 'private')),
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'pending', 'expired')),
        featured INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      -- Listing images table
      CREATE TABLE IF NOT EXISTS listing_images (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        listing_id TEXT NOT NULL,
        image_url TEXT NOT NULL,
        is_primary INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
      );

      -- Saved listings (wishlist)
      CREATE TABLE IF NOT EXISTS saved_listings (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        user_id TEXT NOT NULL,
        listing_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, listing_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
      );

      -- Messages table
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        sender_id TEXT NOT NULL,
        receiver_id TEXT NOT NULL,
        listing_id TEXT,
        content TEXT NOT NULL,
        read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE SET NULL
      );

      -- Reviews table
      CREATE TABLE IF NOT EXISTS reviews (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        reviewer_id TEXT NOT NULL,
        reviewed_user_id TEXT NOT NULL,
        listing_id TEXT,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (reviewed_user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE SET NULL
      );

      -- Payments table
      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        user_id TEXT NOT NULL,
        listing_id TEXT,
        amount REAL NOT NULL,
        currency TEXT DEFAULT 'KES',
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'pending_financing')),
        payment_method TEXT CHECK (payment_method IN ('pesapal', 'card', 'financing')),
        transaction_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE SET NULL
      );

      -- Blog posts table
      CREATE TABLE IF NOT EXISTS blog_posts (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        author_id TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        excerpt TEXT,
        featured_image TEXT,
        status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
        published_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
      );

      -- Categories table
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT,
        image_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Cart items table
      CREATE TABLE IF NOT EXISTS cart_items (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        user_id TEXT NOT NULL,
        listing_id TEXT NOT NULL,
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, listing_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
      );

      -- Financing applications table
      CREATE TABLE IF NOT EXISTS financing_applications (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        user_id TEXT NOT NULL,
        listing_id TEXT,
        amount REAL NOT NULL,
        term_months INTEGER NOT NULL,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE SET NULL
      );

      -- Security events table
      CREATE TABLE IF NOT EXISTS security_events (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        action TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Blacklisted tokens table
      CREATE TABLE IF NOT EXISTS blacklisted_tokens (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        token TEXT UNIQUE NOT NULL,
        reason TEXT,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Password reset tokens table
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token TEXT UNIQUE NOT NULL,
        expires_at DATETIME NOT NULL,
        used INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Performance indexes
      CREATE INDEX IF NOT EXISTS idx_listings_user_id ON listings(user_id);
      CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
      CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price);
      CREATE INDEX IF NOT EXISTS idx_listings_make_model ON listings(make, model);
      CREATE INDEX IF NOT EXISTS idx_listings_location ON listings(location);
      CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at);
      CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id);
      CREATE INDEX IF NOT EXISTS idx_messages_listing_id ON messages(listing_id);
      CREATE INDEX IF NOT EXISTS idx_saved_listings_user_id ON saved_listings(user_id);
      CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_user ON reviews(reviewed_user_id);
      CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
      CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
      CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at);
      CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
      CREATE INDEX IF NOT EXISTS idx_financing_applications_user_id ON financing_applications(user_id);
      CREATE INDEX IF NOT EXISTS idx_financing_applications_status ON financing_applications(status);
      CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON blog_posts(author_id);
      CREATE INDEX IF NOT EXISTS idx_listing_images_listing_id ON listing_images(listing_id);
      CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
      CREATE INDEX IF NOT EXISTS idx_security_events_action ON security_events(action);
      CREATE INDEX IF NOT EXISTS idx_blacklisted_tokens_expires_at ON blacklisted_tokens(expires_at);
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
    `;
  }

  getDatabase(): Database.Database {
    return this.db;
  }

  close(): void {
    this.db.close();
  }
}
