import { Database } from 'better-sqlite3';
import { ListingRepository, ListingSearchCriteria, ListingSearchResult } from '../../domain/repositories/listing.repository';
import { ListingEntity, ListingProps, ListingStatus } from '../../domain/entities/listing.entity';
import { PriceValueObject } from '../../domain/value-objects/price.value-object';
import { MileageValueObject } from '../../domain/value-objects/mileage.value-object';
import { LocationValueObject } from '../../domain/value-objects/location.value-object';

export class SQLiteListingRepository implements ListingRepository {
  constructor(private db: Database) {}

  async findById(id: string): Promise<ListingEntity | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM listings WHERE id = ?
    `);
    
    const row = stmt.get(id) as any;
    if (!row) return null;

    return this.mapToEntity(row);
  }

  async findByUserId(userId: string): Promise<ListingEntity[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM listings WHERE user_id = ? ORDER BY created_at DESC
    `);
    
    const rows = stmt.all(userId) as any[];
    return rows.map(row => this.mapToEntity(row));
  }

  async save(listing: ListingEntity): Promise<ListingEntity> {
    const listingData = listing.toDatabase();
    
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO listings 
      (id, user_id, title, description, year, make, model, price, mileage, 
       engine_size, color, location, seller_type, status, featured, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      listingData.id,
      listingData.userId,
      listingData.title,
      listingData.description,
      listingData.year,
      listingData.make,
      listingData.model,
      listingData.price,
      listingData.mileage,
      listingData.engineSize,
      listingData.color,
      listingData.location,
      listingData.sellerType,
      listingData.status,
      listingData.featured ? 1 : 0,
      listingData.expiresAt?.toISOString()
    );

    return listing;
  }

  async search(criteria: ListingSearchCriteria): Promise<ListingEntity[]> {
    let query = `
      SELECT * FROM listings 
      WHERE status = 'active'
    `;
    const params: any[] = [];

    if (criteria.make) {
      query += ' AND make = ?';
      params.push(criteria.make);
    }

    if (criteria.model) {
      query += ' AND model = ?';
      params.push(criteria.model);
    }

    if (criteria.minPrice !== undefined) {
      query += ' AND price >= ?';
      params.push(criteria.minPrice);
    }

    if (criteria.maxPrice !== undefined) {
      query += ' AND price <= ?';
      params.push(criteria.maxPrice);
    }

    if (criteria.minYear !== undefined) {
      query += ' AND year >= ?';
      params.push(criteria.minYear);
    }

    if (criteria.maxYear !== undefined) {
      query += ' AND year <= ?';
      params.push(criteria.maxYear);
    }

    if (criteria.minMileage !== undefined) {
      query += ' AND mileage >= ?';
      params.push(criteria.minMileage);
    }

    if (criteria.maxMileage !== undefined) {
      query += ' AND mileage <= ?';
      params.push(criteria.maxMileage);
    }

    if (criteria.location) {
      query += ' AND location LIKE ?';
      params.push(`%${criteria.location}%`);
    }

    if (criteria.sellerType) {
      query += ' AND seller_type = ?';
      params.push(criteria.sellerType);
    }

    if (criteria.status) {
      query += ' AND status = ?';
      params.push(criteria.status);
    }

    // Add sorting - map domain field names to database column names
    const sortBy = criteria.sortBy || 'createdAt';
    const sortOrder = criteria.sortOrder || 'desc';
    
    // Map domain field names to database column names
    const columnMapping: Record<string, string> = {
      'createdAt': 'created_at',
      'updatedAt': 'updated_at',
      'price': 'price',
      'mileage': 'mileage',
      'year': 'year'
    };
    
    const dbColumn = columnMapping[sortBy] || 'created_at';
    query += ` ORDER BY ${dbColumn} ${sortOrder.toUpperCase()}`;

    // Add pagination
    const limit = criteria.limit || 10;
    const page = criteria.page || 1;
    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map(row => this.mapToEntity(row));
  }

  async count(criteria: ListingSearchCriteria): Promise<number> {
    let query = `
      SELECT COUNT(*) as count FROM listings 
      WHERE status = 'active'
    `;
    const params: any[] = [];

    if (criteria.make) {
      query += ' AND make = ?';
      params.push(criteria.make);
    }

    if (criteria.model) {
      query += ' AND model = ?';
      params.push(criteria.model);
    }

    if (criteria.minPrice !== undefined) {
      query += ' AND price >= ?';
      params.push(criteria.minPrice);
    }

    if (criteria.maxPrice !== undefined) {
      query += ' AND price <= ?';
      params.push(criteria.maxPrice);
    }

    if (criteria.minYear !== undefined) {
      query += ' AND year >= ?';
      params.push(criteria.minYear);
    }

    if (criteria.maxYear !== undefined) {
      query += ' AND year <= ?';
      params.push(criteria.maxYear);
    }

    if (criteria.minMileage !== undefined) {
      query += ' AND mileage >= ?';
      params.push(criteria.minMileage);
    }

    if (criteria.maxMileage !== undefined) {
      query += ' AND mileage <= ?';
      params.push(criteria.maxMileage);
    }

    if (criteria.location) {
      query += ' AND location LIKE ?';
      params.push(`%${criteria.location}%`);
    }

    if (criteria.sellerType) {
      query += ' AND seller_type = ?';
      params.push(criteria.sellerType);
    }

    if (criteria.status) {
      query += ' AND status = ?';
      params.push(criteria.status);
    }

    const stmt = this.db.prepare(query);
    const result = stmt.get(...params) as { count: number };
    return result.count;
  }

  async updateStatus(listingId: string, status: ListingStatus): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE listings 
      SET status = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      status,
      new Date().toISOString(),
      listingId
    );
  }

  async delete(id: string): Promise<void> {
    const stmt = this.db.prepare(`
      DELETE FROM listings WHERE id = ?
    `);

    stmt.run(id);
  }

  async findFeatured(): Promise<ListingEntity[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM listings 
      WHERE featured = 1 AND status = 'active'
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    const rows = stmt.all() as any[];
    return rows.map(row => this.mapToEntity(row));
  }

  async findByStatus(status: ListingStatus): Promise<ListingEntity[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM listings 
      WHERE status = ?
      ORDER BY created_at DESC
    `);
    
    const rows = stmt.all(status) as any[];
    return rows.map(row => this.mapToEntity(row));
  }

  async countByUserId(userId: string): Promise<number> {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM listings WHERE user_id = ?
    `);
    
    const result = stmt.get(userId) as { count: number };
    return result.count;
  }

  private mapToEntity(row: any): ListingEntity {
    const props: ListingProps = {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      description: row.description || undefined,
      year: row.year,
      make: row.make,
      model: row.model,
      price: new PriceValueObject(row.price),
      mileage: new MileageValueObject(row.mileage),
      engineSize: row.engine_size,
      color: row.color || undefined,
      location: new LocationValueObject(row.location),
      sellerType: row.seller_type as 'dealer' | 'private',
      status: row.status as ListingStatus,
      featured: Boolean(row.featured),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
    };

    return ListingEntity.fromDatabase(props);
  }
}
