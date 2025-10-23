// Database Models TypeScript Interfaces

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'BUYER' | 'SELLER' | 'BOTH' | 'ADMIN';
  created_at: string;
}

export interface Listing {
  id: number;
  title: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  price: number;
  vin?: string;
  location: string;
  engine_size: number;
  color: string;
  transmission: 'Manual' | 'Automatic' | 'Semi-Automatic';
  description?: string;
  images: string[];
  status: 'active' | 'pending' | 'sold' | 'draft';
  seller_id: number;
  seller_type: 'dealer' | 'private';
  created_at: string;
  updated_at: string;
  views: number;
}

export interface CartItem {
  id: number;
  user_id: number;
  listing_id: number;
  listing: {
    id: number;
    title: string;
    make: string;
    model: string;
    year: number;
    price: number;
    mileage: number;
    location: string;
    images: string[];
  };
  added_at: string;
}

export interface Favorite {
  id: number;
  user_id: number;
  listing_id: number;
  listing?: Listing;
  created_at: string;
}

export interface BlogPost {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  author: string;
  category: 'Buying Guide' | 'Selling Tips' | 'Maintenance' | 'News' | 'Market Analysis';
  image: string;
  readTime: string;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
  published_at?: string;
}

export interface SavedSearch {
  id: number;
  user_id: number;
  name: string;
  filters: {
    searchQuery?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    minMileage?: number;
    maxMileage?: number;
    minYear?: number;
    maxYear?: number;
    make?: string;
    model?: string;
    location?: string;
    sellerType?: 'dealer' | 'private';
  };
  created_at: string;
}

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  listing_id?: number;
  subject: string;
  content: string;
  status: 'unread' | 'read' | 'replied';
  created_at: string;
  updated_at: string;
}

// API Response Types
export interface AuthResponse {
  user: User;
  token: string;
  success: boolean;
  message?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: 'BUYER' | 'SELLER' | 'BOTH' | 'ADMIN';
}

export interface CreateListingData {
  title: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  price: number;
  vin?: string;
  location: string;
  engine_size: number;
  color: string;
  transmission: 'Manual' | 'Automatic' | 'Semi-Automatic';
  description?: string;
  images: string[];
  seller_id: number;
  seller_type: 'dealer' | 'private';
}

// JWT Payload
export interface JWTPayload {
  userId: number;
  email: string;
  role: string;
  iat: number;
  exp: number;
}