import { ListingEntity, ListingStatus } from '../domain/entities/listing.entity';
import { ListingRepository } from '../domain/repositories/listing.repository';
import { UserRepository } from '../domain/repositories/user.repository';
import { PriceValueObject } from '../domain/value-objects/price.value-object';
import { MileageValueObject } from '../domain/value-objects/mileage.value-object';
import { LocationValueObject } from '../domain/value-objects/location.value-object';

export interface CreateListingDto {
  title: string;
  description?: string;
  year: number;
  make: string;
  model: string;
  price: number;
  mileage: number;
  engineSize: number;
  color?: string;
  location: string;
  sellerType: 'dealer' | 'private';
  images?: File[];
}

export interface ListingSearchResult {
  listings: ListingEntity[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export interface ValidationService {
  validateListingCreation(listingData: any): Promise<any>;
  validateSearchCriteria(criteria: any): Promise<any>;
  validateListingUpdates(updates: any): Promise<any>;
}

export interface ImageService {
  processListingImages(listingId: string, images: File[]): Promise<void>;
}

export interface NotificationService {
  notifyAdminForListingApproval(listing: ListingEntity): Promise<void>;
  notifyListingStatusChange(listing: ListingEntity): Promise<void>;
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ListingService {
  constructor(
    private listingRepository: ListingRepository,
    private userRepository: UserRepository,
    private validationService: ValidationService,
    private imageService: ImageService,
    private notificationService: NotificationService
  ) {}

  async createListing(userId: string, listingData: CreateListingDto): Promise<ListingEntity> {
    // Validate user can create listings
    const user = await this.userRepository.findById(userId);
    if (!user || !user.canCreateListing()) {
      throw new AuthorizationError('User cannot create listings');
    }

    // Validate listing data
    const validatedData = await this.validationService.validateListingCreation(listingData);

    // Create value objects
    const price = new PriceValueObject(validatedData.price);
    const mileage = new MileageValueObject(validatedData.mileage);
    const location = new LocationValueObject(validatedData.location);

    // Create listing entity
    const listing = ListingEntity.create({
      userId,
      title: validatedData.title,
      description: validatedData.description,
      year: validatedData.year,
      make: validatedData.make,
      model: validatedData.model,
      price,
      mileage,
      engineSize: validatedData.engineSize,
      color: validatedData.color,
      location,
      sellerType: validatedData.sellerType,
    });

    // Save listing
    const savedListing = await this.listingRepository.save(listing);

    // Handle image uploads
    if (listingData.images && listingData.images.length > 0) {
      await this.imageService.processListingImages(savedListing.id, listingData.images);
    }

    // Notify admin for approval if needed
    await this.notificationService.notifyAdminForListingApproval(savedListing);

    return savedListing;
  }

  async searchListings(criteria: any): Promise<ListingSearchResult> {
    // Apply search filters and pagination
    const validatedCriteria = await this.validationService.validateSearchCriteria(criteria);
    
    const [listings, totalCount] = await Promise.all([
      this.listingRepository.search(validatedCriteria),
      this.listingRepository.count(validatedCriteria),
    ]);

    return {
      listings,
      totalCount,
      currentPage: validatedCriteria.page || 1,
      totalPages: Math.ceil(totalCount / (validatedCriteria.limit || 10)),
    };
  }

  async updateListingStatus(listingId: string, status: ListingStatus, adminId?: string): Promise<ListingEntity> {
    const listing = await this.listingRepository.findById(listingId);
    if (!listing) {
      throw new NotFoundError('Listing not found');
    }

    // Check permissions
    if (adminId) {
      const admin = await this.userRepository.findById(adminId);
      if (!admin || !admin.canManageListings()) {
        throw new AuthorizationError('User cannot manage listings');
      }
    }

    listing.updateStatus(status);
    const updatedListing = await this.listingRepository.save(listing);

    // Notify user of status change
    await this.notificationService.notifyListingStatusChange(updatedListing);

    return updatedListing;
  }

  async updateListingStatusForPayment(listingId: string, status: ListingStatus): Promise<ListingEntity> {
    const listing = await this.listingRepository.findById(listingId);
    if (!listing) {
      throw new NotFoundError('Listing not found');
    }

    // For payment-related status updates, we don't require user permissions
    // since the payment system itself should be able to update listing status
    listing.updateStatus(status);
    const updatedListing = await this.listingRepository.save(listing);

    // Notify user of status change
    await this.notificationService.notifyListingStatusChange(updatedListing);

    return updatedListing;
  }

  async getUserListings(userId: string): Promise<ListingEntity[]> {
    return await this.listingRepository.findByUserId(userId);
  }

  async getListingById(listingId: string): Promise<ListingEntity | null> {
    return await this.listingRepository.findById(listingId);
  }

  async updateListing(userId: string, listingId: string, updates: Partial<CreateListingDto>): Promise<ListingEntity> {
    const listing = await this.listingRepository.findById(listingId);
    if (!listing) {
      throw new NotFoundError('Listing not found');
    }

    // Check ownership
    if (listing.userId !== userId) {
      throw new AuthorizationError('User does not own this listing');
    }

    // Check if listing can be edited
    if (!listing.canBeEdited()) {
      throw new AuthorizationError('Listing cannot be edited');
    }

    // Validate updates
    const validatedUpdates = await this.validationService.validateListingUpdates(updates);

    // Update listing details
    const updateData: any = {};
    if (validatedUpdates.title) updateData.title = validatedUpdates.title;
    if (validatedUpdates.description !== undefined) updateData.description = validatedUpdates.description;
    if (validatedUpdates.price) updateData.price = new PriceValueObject(validatedUpdates.price);
    if (validatedUpdates.mileage) updateData.mileage = new MileageValueObject(validatedUpdates.mileage);
    if (validatedUpdates.color !== undefined) updateData.color = validatedUpdates.color;
    if (validatedUpdates.location) updateData.location = new LocationValueObject(validatedUpdates.location);

    listing.updateDetails(updateData);
    const updatedListing = await this.listingRepository.save(listing);

    return updatedListing;
  }

  async deleteListing(userId: string, listingId: string): Promise<void> {
    const listing = await this.listingRepository.findById(listingId);
    if (!listing) {
      throw new NotFoundError('Listing not found');
    }

    // Check ownership
    if (listing.userId !== userId) {
      throw new AuthorizationError('User does not own this listing');
    }

    // Check if listing can be deleted
    if (!listing.canBeDeleted()) {
      throw new AuthorizationError('Listing cannot be deleted');
    }

    await this.listingRepository.delete(listingId);
  }

  async getFeaturedListings(): Promise<ListingEntity[]> {
    return await this.listingRepository.findFeatured();
  }

  async renewListing(userId: string, listingId: string): Promise<ListingEntity> {
    const listing = await this.listingRepository.findById(listingId);
    if (!listing) {
      throw new NotFoundError('Listing not found');
    }

    // Check ownership
    if (listing.userId !== userId) {
      throw new AuthorizationError('User does not own this listing');
    }

    listing.renew();
    const renewedListing = await this.listingRepository.save(listing);

    return renewedListing;
  }
}
