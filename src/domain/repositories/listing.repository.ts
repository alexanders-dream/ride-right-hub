import { ListingEntity, ListingStatus } from '../entities/listing.entity';

export interface ListingSearchCriteria {
  make?: string;
  model?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  minMileage?: number;
  maxMileage?: number;
  location?: string;
  sellerType?: 'dealer' | 'private';
  status?: ListingStatus;
  page?: number;
  limit?: number;
  sortBy?: 'price' | 'year' | 'mileage' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ListingSearchResult {
  listings: ListingEntity[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export interface ListingRepository {
  findById(id: string): Promise<ListingEntity | null>;
  findByUserId(userId: string): Promise<ListingEntity[]>;
  save(listing: ListingEntity): Promise<ListingEntity>;
  search(criteria: ListingSearchCriteria): Promise<ListingEntity[]>;
  count(criteria: ListingSearchCriteria): Promise<number>;
  updateStatus(listingId: string, status: ListingStatus): Promise<void>;
  delete(id: string): Promise<void>;
  findFeatured(): Promise<ListingEntity[]>;
  findByStatus(status: ListingStatus): Promise<ListingEntity[]>;
  countByUserId(userId: string): Promise<number>;
}
