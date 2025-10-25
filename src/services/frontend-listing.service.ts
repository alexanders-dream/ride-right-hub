import { ListingEntity } from '../domain/entities/listing.entity';
import { apiClient, API_ENDPOINTS } from './api-client';
import { CreateListingDto, ListingSearchResult } from './listing.service';

// Frontend service that uses API calls instead of direct database access
export class FrontendListingService {
  async createListing(userId: string, listingData: CreateListingDto): Promise<ListingEntity> {
    const response = await apiClient.post<{ listing: any }>(API_ENDPOINTS.LISTINGS, {
      ...listingData,
      userId,
    });
    
    // Convert the API response back to a ListingEntity
    return this.mapApiResponseToEntity(response.listing);
  }

  async searchListings(criteria: any): Promise<ListingSearchResult> {
    const response = await apiClient.post<{
      listings: any[];
      totalCount: number;
      currentPage: number;
      totalPages: number;
    }>(API_ENDPOINTS.LISTINGS_SEARCH, criteria);
    
    return {
      listings: response.listings.map(listing => this.mapApiResponseToEntity(listing)),
      totalCount: response.totalCount,
      currentPage: response.currentPage,
      totalPages: response.totalPages,
    };
  }

  async getUserListings(userId: string): Promise<ListingEntity[]> {
    const response = await apiClient.get<{ listings: any[] }>(`${API_ENDPOINTS.LISTINGS_USER}/${userId}`);
    return response.listings.map(listing => this.mapApiResponseToEntity(listing));
  }

  async getListingById(listingId: string): Promise<ListingEntity | null> {
    try {
      const response = await apiClient.get<{ listing: any }>(`${API_ENDPOINTS.LISTINGS}/${listingId}`);
      return this.mapApiResponseToEntity(response.listing);
    } catch (error) {
      return null;
    }
  }

  async updateListing(userId: string, listingId: string, updates: Partial<CreateListingDto>): Promise<ListingEntity> {
    const response = await apiClient.put<{ listing: any }>(`${API_ENDPOINTS.LISTINGS}/${listingId}`, {
      ...updates,
      userId,
    });
    
    return this.mapApiResponseToEntity(response.listing);
  }

  async deleteListing(userId: string, listingId: string): Promise<void> {
    await apiClient.delete(`${API_ENDPOINTS.LISTINGS}/${listingId}`);
  }

  async getFeaturedListings(): Promise<ListingEntity[]> {
    const response = await apiClient.get<{ listings: any[] }>(API_ENDPOINTS.LISTINGS_FEATURED);
    return response.listings.map(listing => this.mapApiResponseToEntity(listing));
  }

  async renewListing(userId: string, listingId: string): Promise<ListingEntity> {
    const response = await apiClient.post<{ listing: any }>(`${API_ENDPOINTS.LISTINGS}/${listingId}/renew`);
    return this.mapApiResponseToEntity(response.listing);
  }

  private mapApiResponseToEntity(apiData: any): ListingEntity {
    // This would need to convert the API response back to a ListingEntity
    // For now, we'll create a simple mapping
    return {
      id: apiData.id,
      userId: apiData.userId,
      title: apiData.title,
      description: apiData.description,
      year: apiData.year,
      make: apiData.make,
      model: apiData.model,
      price: { getValue: () => apiData.price },
      mileage: { getValue: () => apiData.mileage },
      engineSize: apiData.engineSize,
      color: apiData.color,
      location: { getValue: () => apiData.location },
      sellerType: apiData.sellerType,
      status: apiData.status,
      featured: apiData.featured,
      createdAt: new Date(apiData.createdAt),
      updatedAt: new Date(apiData.updatedAt),
      expiresAt: apiData.expiresAt ? new Date(apiData.expiresAt) : undefined,
      
      // Entity methods
      updateStatus: function(status: string) { this.status = status; },
      updateDetails: function(details: any) { Object.assign(this, details); },
      canBeEdited: function() { return this.status === 'active'; },
      canBeDeleted: function() { return this.status === 'active'; },
      renew: function() { 
        const newExpiry = new Date();
        newExpiry.setDate(newExpiry.getDate() + 30);
        this.expiresAt = newExpiry;
      },
    } as ListingEntity;
  }
}

// Create a singleton instance for use in components
export const frontendListingService = new FrontendListingService();
