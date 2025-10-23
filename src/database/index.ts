// Database service that connects to the PostgreSQL backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

interface AuthResponse {
  token: string;
  user: User;
}

interface ListingResponse {
  listing: Listing;
}

interface ListingsResponse {
  listings: Listing[];
}

interface User {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'SELLER' | 'BUYER' | 'BOTH';
  created_at: string;
  updated_at?: string;
}

interface Listing {
  id: number;
  title: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  price: number;
  vin: string;
  location: string;
  engine_size: number;
  color: string;
  transmission: string;
  description: string;
  images: string[];
  seller_id: number;
  seller_type: 'private' | 'dealer';
  status: 'active' | 'sold' | 'pending' | 'draft';
  created_at: string;
  updated_at?: string;
  views: number;
}

interface BlogPost {
  id: number;
  title: string;
  content: string;
  author_id: number;
  status: 'published' | 'draft';
  category: string;
  created_at: string;
  updated_at?: string;
  views: number;
}

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  subject: string;
  content: string;
  read: boolean;
  created_at: string;
}

// Helper function for API calls
// Rate limiting implementation
const rateLimitMap = new Map<string, { count: number, lastRequest: number }>();
const RATE_LIMIT = 100; // Max requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute window

async function apiCall<T>(
  endpoint: string,
  method?: string,
  requireAdmin?: boolean
): Promise<T>;
async function apiCall<T>(
  endpoint: string,
  options?: RequestInit,
  requireAdmin?: boolean
): Promise<T>;
async function apiCall<T>(
  endpoint: string,
  methodOrOptions?: string | RequestInit,
  requireAdmin: boolean = false
): Promise<T> {
  // Rate limiting check
  const ip = 'user-ip'; // In production, this would come from request headers
  const now = Date.now();
  const rateLimitData = rateLimitMap.get(ip) || { count: 0, lastRequest: 0 };

  if (now - rateLimitData.lastRequest > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, lastRequest: now });
  } else if (rateLimitData.count >= RATE_LIMIT) {
    throw new Error('Rate limit exceeded. Please try again later.');
  } else {
    rateLimitMap.set(ip, { 
      count: rateLimitData.count + 1, 
      lastRequest: now 
    });
  }

  // Handle both overloads
  const options: RequestInit = typeof methodOrOptions === 'string' 
    ? { method: methodOrOptions } 
    : methodOrOptions || {};
  const isAdminRequired = typeof methodOrOptions === 'string' ? requireAdmin : requireAdmin;

  // Audit logging for admin actions
  if (isAdminRequired) {
    console.log(`[ADMIN ACTION] ${options.method || 'GET'} ${endpoint}`, {
      timestamp: new Date().toISOString(),
      user: localStorage.getItem('userId'),
      action: `${options.method || 'GET'} ${endpoint}`,
      payload: options.body
    });
  }
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication required');
  }

  // Verify token contains admin role if required
  if (isAdminRequired) {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.role !== 'ADMIN') {
      throw new Error('Admin privileges required');
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || 'API request failed');
  }

  return response.json();
}

// User management functions
export const userService = {
  async createUser(email: string, password: string, firstName: string, lastName: string, role: string = 'BUYER') {
    try {
      const response = await apiCall<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          username: email.split('@')[0],
          role
        })
      });

      if (response.token) {
        localStorage.setItem('token', response.token);
      }

      return response.user;
    } catch (error) {
      console.error('User creation error:', error);
      throw error;
    }
  },

  async authenticateUser(email: string, password: string) {
    try {
      const response = await apiCall<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (response.token) {
        localStorage.setItem('token', response.token);
      }

      return response.user;
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  },

  generateToken(user: any): string {
    return localStorage.getItem('token') || '';
  },

  verifyToken(token: string): { userId: number; email: string; role: string } {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        userId: payload.userId,
        email: payload.email,
        role: payload.role
      };
    } catch {
      throw new Error('Invalid token');
    }
  },

  async getUserById(id: number): Promise<User | null> {
    try {
      return await apiCall<User>(`/users/${id}`, 'GET');
    } catch (error) {
      console.error(`Failed to fetch user ${id}:`, error);
      throw new Error(`Failed to fetch user ${id}`);
    }
  },

  async getAllUsers(): Promise<User[]> {
    try {
      const response = await apiCall<User[]>('/users', 'GET');
      if (!Array.isArray(response)) {
        throw new Error('Invalid response format for users');
      }
      return response;
    } catch (error) {
      console.error('Failed to fetch users:', error);
      throw new Error('Failed to fetch users');
    }
  },

  async deleteUser(id: number): Promise<boolean> {
    try {
      return await apiCall<boolean>(`/users/${id}`, 'DELETE');
    } catch (error) {
      console.error(`Failed to delete user ${id}:`, error);
      throw new Error(`Failed to delete user ${id}`);
    }
  }
};

// Listings management functions
// Audit logging decorator
function withAuditLog<T extends (...args: any[]) => Promise<any>>(
  serviceName: string,
  fn: T
): T {
  return (async (...args: any[]) => {
    try {
      const result = await fn(...args);
      console.log(`[AUDIT] ${serviceName}.${fn.name} success`, {
        timestamp: new Date().toISOString(),
        args,
        result
      });
      return result;
    } catch (error) {
      console.error(`[AUDIT] ${serviceName}.${fn.name} failed`, {
        timestamp: new Date().toISOString(),
        args,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }) as T;
}

export const listingService = {
  async createListing(listingData: any) {
    try {
      const response = await apiCall<ListingResponse>('/listings', {
        method: 'POST',
        body: JSON.stringify(listingData)
      });
      return response.listing;
    } catch (error) {
      console.error('Listing creation error:', error);
      throw new Error('Failed to create listing');
    }
  },

  async getAllListings(): Promise<Listing[]> {
    try {
      const response = await apiCall<Listing[]>('/listings', 'GET');
      if (!Array.isArray(response)) {
        throw new Error('Invalid response format for listings');
      }
      return response;
    } catch (error) {
      console.error('Listings fetch error:', error);
      throw new Error('Failed to fetch listings');
    }
  },

  async getListingById(id: string): Promise<Listing | null> {
    try {
      return await apiCall<Listing>(`/listings/${id}`, 'GET');
    } catch (error) {
      console.error(`Failed to fetch listing ${id}:`, error);
      throw new Error(`Failed to fetch listing ${id}`);
    }
  },

  async getListingsBySeller(sellerId: number): Promise<Listing[]> {
    try {
      const response = await apiCall<Listing[]>(`/listings?sellerId=${sellerId}`, 'GET');
      if (!Array.isArray(response)) {
        console.warn(`Invalid response format for seller listings: expected array, got ${typeof response}`, response);
        return [];
      }
      return response;
    } catch (error) {
      console.error(`Failed to fetch listings for seller ${sellerId}:`, error);
      return [];
    }
  },

  async deleteListing(id: number): Promise<boolean> {
    try {
      return await apiCall<boolean>(`/listings/${id}`, 'DELETE');
    } catch (error) {
      console.error(`Failed to delete listing ${id}:`, error);
      throw new Error(`Failed to delete listing ${id}`);
    }
  },

  async updateListingViews(id: number): Promise<boolean> {
    try {
      // Views are automatically updated when fetching a listing, so this is redundant
      // Keeping the function for compatibility but making it a no-op
      return true;
    } catch (error) {
      console.error(`Failed to update views for listing ${id}:`, error);
      throw new Error(`Failed to update views for listing ${id}`);
    }
  }
};

// Cart management functions
export const cartService = {
    async getCartItems() {
        try {
            const response = await apiCall('/cart');
            return response;
        } catch (error) {
            console.error('Cart items fetch error:', error);
            return [];
        }
    },

    async addToCart(listingId: string) {
        try {
            await apiCall('/cart', {
                method: 'POST',
                body: JSON.stringify({ listingId }),
            });
            return true;
        } catch (error) {
            console.error('Add to cart error:', error);
            return false;
        }
    },

    async removeFromCart(listingId: string) {
        try {
            await apiCall(`/cart/${listingId}`, {
                method: 'DELETE',
            });
            return true;
        } catch (error) {
            console.error('Remove from cart error:', error);
            return false;
        }
    },

    async clearCart() {
        try {
            await apiCall('/cart', {
                method: 'DELETE',
            });
            return true;
        } catch (error) {
            console.error('Clear cart error:', error);
            return false;
        }
    },
};


// Favorites management functions
export const favoriteService = {
  async addToFavorites(userId: number, listingId: string) {
    try {
      const response = await apiCall(`/favorites/${listingId}`, {
        method: 'POST'
      });
      return true;
    } catch (error) {
      console.error('Add to favorites error:', error);
      return false;
    }
  },

  async removeFromFavorites(userId: number, listingId: string) {
    try {
      await apiCall(`/favorites/${listingId}`, {
        method: 'DELETE'
      });
      return true;
    } catch (error) {
      console.error('Remove from favorites error:', error);
      return false;
    }
  },

  async getFavorites() {
    try {
      const response = await apiCall('/favorites');
      return response;
    } catch (error) {
      console.error('Favorites fetch error:', error);
      return [];
    }
  },

  async getUserFavorites() {
    return this.getFavorites();
  },

  async isFavorite(userId: number, listingId: string) {
    try {
      const favorites = await this.getFavorites(userId);
      return favorites.some((fav: any) => fav.listingId === listingId);
    } catch (error) {
      console.error('Check favorite error:', error);
      return false;
    }
  }
};

// Saved Searches management functions
export const savedSearchService = {
    async createSavedSearch(searchName: string, filters: any) {
        try {
            const response = await apiCall('/saved-searches', {
                method: 'POST',
                body: JSON.stringify({ name: searchName, filters }),
            });
            return response;
        } catch (error) {
            console.error('Create saved search error:', error);
            return null;
        }
    },

    async getSavedSearches() {
        try {
            const response = await apiCall('/saved-searches');
            return response;
        } catch (error) {
            console.error('Saved searches fetch error:', error);
            return [];
        }
    },

    async deleteSavedSearch(id: string) {
        try {
            await apiCall(`/saved-searches/${id}`, {
                method: 'DELETE',
            });
            return true;
        } catch (error) {
            console.error('Delete saved search error:', error);
            return false;
        }
    },
};

// Messages management functions
export const messageService = {
    async sendMessage(receiverId: number, listingId: string | null, subject: string, content: string) {
        try {
            const response = await apiCall('/messages', {
                method: 'POST',
                body: JSON.stringify({ receiverId, listingId, subject, content }),
            });
            return response;
        } catch (error) {
            console.error('Send message error:', error);
            return null;
        }
    },

    async getMessages() {
        try {
            const response = await apiCall('/messages');
            return response;
        } catch (error) {
            console.error('Messages fetch error:', error);
            return [];
        }
    },

    async markAsRead(messageId: string) {
        try {
            await apiCall(`/messages/${messageId}/read`, {
                method: 'PATCH',
            });
            return true;
        } catch (error) {
            console.error('Mark as read error:', error);
            return false;
        }
    },

    async deleteMessage(messageId: string) {
        try {
            await apiCall(`/messages/${messageId}`, {
                method: 'DELETE',
            });
            return true;
        } catch (error) {
            console.error('Delete message error:', error);
            return false;
        }
    },

    async getUserMessages() {
        try {
            const response = await apiCall('/messages');
            return response;
        } catch (error) {
            console.error('User messages fetch error:', error);
            return [];
        }
    },
};

// Blog management functions
export const blogService = {
    async createBlogPost(postData: any, status: 'draft' | 'published' = 'draft') {
        try {
            const response = await apiCall('/blog', {
                method: 'POST',
                body: JSON.stringify({ ...postData, status }),
            });
            return response;
        } catch (error) {
            console.error('Blog post creation error:', error);
            return null;
        }
    },

    async getAllBlogPosts() {
        try {
            const response = await apiCall('/blog');
            return response;
        } catch (error) {
            console.error('Blog posts fetch error:', error);
            return [];
        }
    },

    async updateBlogPost(id: string, updateData: any) {
        try {
            await apiCall(`/blog/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(updateData),
            });
            return true;
        } catch (error) {
            console.error('Blog post update error:', error);
            return false;
        }
    },

    async deleteBlogPost(id: string) {
        try {
            await apiCall(`/blog/${id}`, {
                method: 'DELETE',
            });
            return true;
        } catch (error) {
            console.error('Blog post deletion error:', error);
            return false;
        }
    },

    async getBlogPostById(id: string) {
        try {
            const response = await apiCall(`/blog/${id}`);
            return response;
        } catch (error) {
            console.error('Blog post fetch error:', error);
            return null;
        }
    },

    async getPublishedBlogPosts() {
        try {
            const response = await apiCall('/blog/published');
            return response;
        } catch (error) {
            console.error('Published blog posts fetch error', error);
            return [];
        }
    },

    async getBlogPostsByCategory(category: string) {
        try {
            const response = await apiCall(`/blog/category/${category}`);
            return response;
        } catch (error) {
            console.error('Blog posts by category fetch error:', error);
            return [];
        }
    },
};


// Initialize function - now just sets up the API connection
export async function initializeDatabase() {
  try {
    // Test API connection
    const response = await apiCall('/health');
    console.log('Database (API) connection established:', response);
    return true;
  } catch (error) {
    console.error('Database (API) connection failed:', error);
    return false;
  }
}