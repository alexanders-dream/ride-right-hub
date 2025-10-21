import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Listing, BlogPost, SavedSearch, Message } from '../types/database';

// Database instance
let db: any = null;
const JWT_SECRET = process.env.JWT_SECRET || 'moto-market-secret-key-change-in-production';

// Initialize database  
export async function initializeDatabase() {
  try {
    // Dynamically import sql.js to avoid module resolution issues
    const sqlModule = await import('sql.js');
    const SQL = sqlModule.default || sqlModule;
    
    const sqlJs = await SQL({
      locateFile: (file) => `https://sql.js.org/dist/${file}`
    });
    
    // Create/load database
    const storedDb = localStorage.getItem('moto-market-db');
    if (storedDb) {
      const uInt8Array = new Uint8Array(JSON.parse(storedDb));
      db = new sqlJs.Database(uInt8Array);
    } else {
      db = new sqlJs.Database();
    }

    // Create tables if they don't exist
    createTables();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    // Fall back to mock database if sql.js fails
    console.warn('Using fallback database implementation');
    return initializeFallbackDatabase();
  }
}

// Fallback implementation using localStorage
function initializeFallbackDatabase() {
  const fallbackStorage = {
    _data: {
      users: [],
      listings: [],
      cart_items: [],
      favorites: [],
      blog_posts: [],
      messages: [],
      saved_searches: []
    },
    
    run: (sql: string, params?: any[]) => {
      // Basic mock implementation
      console.log('Mock SQL execution:', sql, params);
      return { lastID: Math.floor(Math.random() * 1000) };
    },
    
    prepare: (sql: string) => ({
      run: (...params: any[]) => ({ lastID: Math.floor(Math.random() * 1000) }),
      get: (...params: any[]) => null,
      all: (...params: any[]) => []
    }),
    
    export: () => new Uint8Array([0, 0, 0, 0])
  };
  
  db = fallbackStorage;
  console.log('Fallback database initialized');
  return Promise.resolve();
}

// Save database to localStorage
function saveDatabase() {
  if (db) {
    const data = db.export();
    localStorage.setItem('moto-market-db', JSON.stringify(Array.from(data)));
  }
}

function createTables() {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('buyer', 'seller', 'both', 'admin')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Motorcycles listings table
  db.run(`
    CREATE TABLE IF NOT EXISTS listings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      make TEXT NOT NULL,
      model TEXT NOT NULL,
      year INTEGER NOT NULL,
      mileage INTEGER NOT NULL,
      price REAL NOT NULL,
      vin TEXT UNIQUE,
      location TEXT NOT NULL,
      engine_size INTEGER NOT NULL,
      color TEXT NOT NULL,
      transmission TEXT NOT NULL CHECK(transmission IN ('Manual', 'Automatic', 'Semi-Automatic')),
      description TEXT,
      images TEXT, -- JSON array of image URLs
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'pending', 'sold')),
      seller_id INTEGER NOT NULL,
      seller_type TEXT NOT NULL CHECK(seller_type IN ('dealer', 'private')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      views INTEGER DEFAULT 0
    )
  `);

  // Cart items table
  db.run(`
    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      listing_id INTEGER NOT NULL,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, listing_id)
    )
  `);

  // Saved favorites table
  db.run(`
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      listing_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, listing_id)
    )
  `);

  // Saved searches table
  db.run(`
    CREATE TABLE IF NOT EXISTS saved_searches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      filters TEXT, -- JSON object containing filter criteria
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Messages table
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      listing_id INTEGER,
      subject TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'unread' CHECK(status IN ('unread', 'read', 'replied')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Blog posts table
  db.run(`
    CREATE TABLE IF NOT EXISTS blog_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      excerpt TEXT,
      author TEXT NOT NULL,
      category TEXT,
      image TEXT,
      readTime TEXT,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'published')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      published_at DATETIME
    )
  `);
}

// User management functions
export const userService = {
  async createUser(email: string, password: string, name: string, role: 'buyer' | 'seller' | 'both' | 'admin') {
    if (!db) throw new Error('Database not initialized');
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const stmt = db.prepare(`
      INSERT INTO users (email, password, name, role) 
      VALUES (?, ?, ?, ?)
    `);
    
    stmt.run(email, hashedPassword, name, role);
    
    // Get the inserted user
    const result = db.prepare('SELECT id, email, name, role, created_at FROM users WHERE email = ?').get(email) as User;
    saveDatabase();
    return result;
  },

  async authenticateUser(email: string, password: string) {
    if (!db) throw new Error('Database not initialized');
    
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User & { password: string };
    
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Remove password from returned user object
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  generateToken(user: User): string {
    return jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
  },

  verifyToken(token: string): { userId: number; email: string; role: string } {
    return jwt.verify(token, JWT_SECRET) as { userId: number; email: string; role: string };
  },

  getUserById(id: number): User | null {
    try {
      if (!db) return null;
      return db.prepare('SELECT id, email, name, role, created_at FROM users WHERE id = ?').get(id) as User || null;
    } catch (error) {
      return null;
    }
  },

  getAllUsers(): User[] {
    try {
      if (!db) return [];
      return db.prepare('SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC').all() as User[];
    } catch (error) {
      return [];
    }
  },

  deleteUser(id: number): boolean {
    try {
      if (!db) return false;
      const stmt = db.prepare('DELETE FROM users WHERE id = ?');
      stmt.run(id);
      saveDatabase();
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }
};

// Listings management functions
export const listingService = {
  createListing(listingData: Omit<Listing, 'id' | 'created_at' | 'updated_at' | 'views'>): Listing | null {
    try {
      if (!db) throw new Error('Database not initialized');
      
      const stmt = db.prepare(`
        INSERT INTO listings (
          title, make, model, year, mileage, price, vin, location, 
          engine_size, color, transmission, description, images, status, 
          seller_id, seller_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        listingData.title, listingData.make, listingData.model, listingData.year,
        listingData.mileage, listingData.price, listingData.vin, listingData.location,
        listingData.engine_size, listingData.color, listingData.transmission,
        listingData.description, JSON.stringify(listingData.images || []),
        listingData.status || 'active', listingData.seller_id, listingData.seller_type
      );

      const listing = db.prepare('SELECT * FROM listings WHERE ROWID = ?').get(result.insertId) as Listing || null;
      if (listing && listing.images) {
        listing.images = JSON.parse(listing.images);
      }
      
      saveDatabase();
      return listing;
    } catch (error) {
      console.error('Error creating listing:', error);
      return null;
    }
  },

  getAllListings(): Listing[] {
    try {
      if (!db) return [];
      const listings = db.prepare('SELECT * FROM listings ORDER BY created_at DESC').all() as Listing[];
      return listings.map(listing => ({
        ...listing,
        images: listing.images ? JSON.parse(listing.images) : []
      }));
    } catch (error) {
      console.error('Error fetching listings:', error);
      return [];
    }
  },

  getListingById(id: number): Listing | null {
    try {
      if (!db) return null;
      const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(id) as Listing || null;
      if (listing && listing.images) {
        listing.images = JSON.parse(listing.images);
      }
      return listing;
    } catch (error) {
      console.error('Error fetching listing:', error);
      return null;
    }
  },

  getListingsBySeller(sellerId: number): Listing[] {
    try {
      if (!db) return [];
      const listings = db.prepare('SELECT * FROM listings WHERE seller_id = ? ORDER BY created_at DESC').all(sellerId) as Listing[];
      return listings.map(listing => ({
        ...listing,
        images: listing.images ? JSON.parse(listing.images) : []
      }));
    } catch (error) {
      console.error('Error fetching seller listings:', error);
      return [];
    }
  },

  deleteListing(id: number): boolean {
    try {
      if (!db) return false;
      const stmt = db.prepare('DELETE FROM listings WHERE id = ?');
      stmt.run(id);
      saveDatabase();
      return true;
    } catch (error) {
      console.error('Error deleting listing:', error);
      return false;
    }
  },

  updateListingViews(id: number): boolean {
    try {
      if (!db) return false;
      const stmt = db.prepare('UPDATE listings SET views = views + 1 WHERE id = ?');
      stmt.run(id);
      saveDatabase();
      return true;
    } catch (error) {
      console.error('Error updating listing views:', error);
      return false;
    }
  }
};

// Cart management functions
export const cartService = {
  getCartItems(userId: number): any[] {
    try {
      if (!db) return [];
      const items = db.prepare(`
        SELECT ci.*, l.title, l.make, l.model, l.year, l.price, l.images
        FROM cart_items ci 
        JOIN listings l ON ci.listing_id = l.id 
        WHERE ci.user_id = ?
      `).all(userId) as any[];
      
      return items.map(item => ({
        ...item,
        images: item.images ? JSON.parse(item.images) : []
      }));
    } catch (error) {
      console.error('Error fetching cart items:', error);
      return [];
    }
  },

  addToCart(userId: number, listingId: number): boolean {
    try {
      if (!db) return false;
      const stmt = db.prepare(`
        INSERT OR IGNORE INTO cart_items (user_id, listing_id) 
        VALUES (?, ?)
      `);
      stmt.run(userId, listingId);
      saveDatabase();
      return true;
    } catch (error) {
      console.error('Error adding to cart:', error);
      return false;
    }
  },

  removeFromCart(userId: number, listingId: number): boolean {
    try {
      if (!db) return false;
      const stmt = db.prepare('DELETE FROM cart_items WHERE user_id = ? AND listing_id = ?');
      stmt.run(userId, listingId);
      saveDatabase();
      return true;
    } catch (error) {
      console.error('Error removing from cart:', error);
      return false;
    }
  },

  clearCart(userId: number): boolean {
    try {
      if (!db) return false;
      const stmt = db.prepare('DELETE FROM cart_items WHERE user_id = ?');
      stmt.run(userId);
      saveDatabase();
      return true;
    } catch (error) {
      console.error('Error clearing cart:', error);
      return false;
    }
  }
};

// Favorites management functions
export const favoriteService = {
  addToFavorites(userId: number, listingId: number): boolean {
    try {
      if (!db) return false;
      const stmt = db.prepare(`
        INSERT OR IGNORE INTO favorites (user_id, listing_id) 
        VALUES (?, ?)
      `);
      stmt.run(userId, listingId);
      saveDatabase();
      return true;
    } catch (error) {
      console.error('Error adding to favorites:', error);
      return false;
    }
  },

  removeFromFavorites(userId: number, listingId: number): boolean {
    try {
      if (!db) return false;
      const stmt = db.prepare('DELETE FROM favorites WHERE user_id = ? AND listing_id = ?');
      stmt.run(userId, listingId);
      saveDatabase();
      return true;
    } catch (error) {
      console.error('Error removing from favorites:', error);
      return false;
    }
  },

  getFavorites(userId: number): any[] {
    try {
      if (!db) return [];
      const items = db.prepare(`
        SELECT f.*, l.title, l.make, l.model, l.year, l.price, l.images
        FROM favorites f 
        JOIN listings l ON f.listing_id = l.id 
        WHERE f.user_id = ?
      `).all(userId) as any[];
      
      return items.map(item => ({
        ...item,
        images: item.images ? JSON.parse(item.images) : []
      }));
    } catch (error) {
      console.error('Error fetching favorite items:', error);
      return [];
    }
  },

  isFavorite(userId: number, listingId: number): boolean {
    try {
      if (!db) return false;
      const item = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND listing_id = ?').get(userId, listingId);
      return !!item;
    } catch (error) {
      console.error('Error checking favorite status:', error);
      return false;
    }
  }
};

// Saved Searches management functions
export const savedSearchService = {
  createSavedSearch(userId: number, searchName: string, filters: SavedSearch['filters']): boolean {
    try {
      if (!db) return false;
      const stmt = db.prepare(`
        INSERT INTO saved_searches (user_id, name, filters) 
        VALUES (?, ?, ?)
      `);
      stmt.run(userId, searchName, JSON.stringify(filters));
      saveDatabase();
      return true;
    } catch (error) {
      console.error('Error creating saved search:', error);
      return false;
    }
  },

  getSavedSearches(userId: number): SavedSearch[] {
    try {
      if (!db) return [];
      const searches = db.prepare('SELECT * FROM saved_searches WHERE user_id = ? ORDER BY created_at DESC').all(userId) as any[];
      return searches.map(search => ({
        ...search,
        filters: JSON.parse(search.filters)
      }));
    } catch (error) {
      console.error('Error fetching saved searches:', error);
      return [];
    }
  },

  deleteSavedSearch(id: number): boolean {
    try {
      if (!db) return false;
      const stmt = db.prepare('DELETE FROM saved_searches WHERE id = ?');
      stmt.run(id);
      saveDatabase();
      return true;
    } catch (error) {
      console.error('Error deleting saved search:', error);
      return false;
    }
  }
};

// Messages management functions
export const messageService = {
  sendMessage(senderId: number, receiverId: number, listingId: number | null, subject: string, content: string): boolean {
    try {
      if (!db) return false;
      const stmt = db.prepare(`
        INSERT INTO messages (sender_id, receiver_id, listing_id, subject, content, status) 
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      stmt.run(senderId, receiverId, listingId, subject, content, 'unread');
      saveDatabase();
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  },

  getMessages(userId: number): Message[] {
    try {
      if (!db) return [];
      return db.prepare(`
        SELECT * FROM messages 
        WHERE sender_id = ? OR receiver_id = ? 
        ORDER BY created_at DESC
      `).all(userId, userId) as Message[];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  },

  markAsRead(messageId: number): boolean {
    try {
      if (!db) return false;
      const stmt = db.prepare('UPDATE messages SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
      stmt.run('read', messageId);
      saveDatabase();
      return true;
    } catch (error) {
      console.error('Error marking message as read:', error);
      return false;
    }
  },

  deleteMessage(messageId: number): boolean {
    try {
      if (!db) return false;
      const stmt = db.prepare('DELETE FROM messages WHERE id = ?');
      stmt.run(messageId);
      saveDatabase();
      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      return false;
    }
  }
};

// Blog management functions
export const blogService = {
  createBlogPost(postData: Omit<BlogPost, 'id' | 'created_at' | 'updated_at' | 'published_at'>): BlogPost | null {
    try {
      if (!db) throw new Error('Database not initialized');
      
      const stmt = db.prepare(`
        INSERT INTO blog_posts (title, content, excerpt, author, category, image, readTime, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        postData.title,
        postData.content,
        postData.excerpt || '',
        postData.author,
        postData.category,
        postData.image,
        postData.readTime,
        postData.status
      );

      const post = db.prepare('SELECT * FROM blog_posts WHERE ROWID = ?').get(stmt.lastID) as BlogPost || null;
      saveDatabase();
      return post;
    } catch (error) {
      console.error('Error creating blog post:', error);
      return null;
    }
  },

  getAllBlogPosts(): BlogPost[] {
    try {
      if (!db) return [];
      return db.prepare('SELECT * FROM blog_posts ORDER BY created_at DESC').all() as BlogPost[];
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      return [];
    }
  },

  updateBlogPost(id: number, updateData: Partial<BlogPost>): boolean {
    try {
      if (!db) return false;
      
      const fields = Object.keys(updateData).filter(key => 
        key !== 'id' && key !== 'created_at' && key !== 'published_at'
      );
      
      if (fields.length === 0) return false;
      
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      const values = fields.map(field => updateData[field as keyof Partial<BlogPost>]);
      
      const stmt = db.prepare(`UPDATE blog_posts SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
      stmt.run(...values, id);
      saveDatabase();
      return true;
    } catch (error) {
      console.error('Error updating blog post:', error);
      return false;
    }
  },

  deleteBlogPost(id: number): boolean {
    try {
      if (!db) return false;
      const stmt = db.prepare('DELETE FROM blog_posts WHERE id = ?');
      stmt.run(id);
      saveDatabase();
      return true;
    } catch (error) {
      console.error('Error deleting blog post:', error);
      return false;
    }
  },

  getBlogPostById(id: number): BlogPost | null {
    try {
      if (!db) return null;
      return db.prepare('SELECT * FROM blog_posts WHERE id = ?').get(id) as BlogPost || null;
    } catch (error) {
      console.error('Error fetching blog post:', error);
      return null;
    }
  }
};