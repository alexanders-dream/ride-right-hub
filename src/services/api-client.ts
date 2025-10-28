// Production API client for communicating with the backend server

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:3002/api';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData: any) {
    return this.request<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Listing endpoints
  async createListing(listingData: any) {
    return this.request<{ listing: any }>('/listings', {
      method: 'POST',
      body: JSON.stringify(listingData),
    });
  }

  async searchListings(criteria: any) {
    const queryParams = new URLSearchParams();
    Object.entries(criteria).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
    
    return this.request<{
      listings: any[];
      totalCount: number;
      currentPage: number;
      totalPages: number;
    }>(`/listings?${queryParams}`);
  }

  async getUserListings(userId: string) {
    return this.request<{ listings: any[] }>(`/listings/user/${userId}`);
  }

  async getListingById(listingId: string) {
    return this.request<{ listing: any }>(`/listings/${listingId}`);
  }

  async updateListing(listingId: string, updates: any) {
    return this.request<{ listing: any }>(`/listings/${listingId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteListing(listingId: string) {
    return this.request<{ message: string }>(`/listings/${listingId}`, {
      method: 'DELETE',
    });
  }

  // User endpoints
  async getUserById(userId: string) {
    return this.request<{ user: any }>(`/users/${userId}`);
  }

  // Health check
  async healthCheck() {
    return this.request<{ status: string; timestamp: string }>('/health');
  }

  // Payment endpoints
  async initiatePayment(paymentData: any) {
    return this.request<{ payment: any; redirectUrl?: string }>('/payments/initiate', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  async handlePesaPalCallback(orderTrackingId: string, status: string) {
    return this.request<{ payment: any }>('/payments/pesapal/callback', {
      method: 'POST',
      body: JSON.stringify({ orderTrackingId, status }),
    });
  }

  async checkPesaPalPaymentStatus(orderTrackingId: string) {
    return this.request<{ status: any }>(`/payments/pesapal/status/${orderTrackingId}`);
  }

  async getUserPayments(userId: string) {
    return this.request<{ payments: any[] }>(`/payments/user/${userId}`);
  }

  async getPaymentById(paymentId: string) {
    return this.request<{ payment: any }>(`/payments/${paymentId}`);
  }

  async refundPayment(paymentId: string, adminId: string) {
    return this.request<{ payment: any }>(`/payments/${paymentId}/refund`, {
      method: 'POST',
      body: JSON.stringify({ adminId }),
    });
  }
}

// Create a singleton instance
export const apiClient = new ApiClient();
