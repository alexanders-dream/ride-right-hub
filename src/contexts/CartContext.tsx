import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { cartService } from '../database';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  id: number;
  image: string;
  year: number;
  make: string;
  model: string;
  price: number;
  mileage: number;
  location: string;
  sellerType: "dealer" | "private";
  engineSize: number;
  color: string;
}

interface CartContextType {
  cartItems: Array<{
    id: number;
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
  }>;
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<Array<{
    id: number;
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
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Load cart items when user changes or authenticates
  useEffect(() => {
    const loadCartItems = async () => {
      if (isAuthenticated && user) {
        try {
          const items = await cartService.getCartItems(user.id);
          setCartItems(items);
        } catch (error) {
          console.error('Error loading cart items:', error);
          // Set empty cart on error
          setCartItems([]);
        }
      } else {
        // Clear cart when user logs out
        setCartItems([]);
      }
      setIsLoading(false);
    };

    loadCartItems();
  }, [isAuthenticated, user]);

  const addToCart = async (item: CartItem) => {
    if (!isAuthenticated || !user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to add items to your cart.",
        variant: "destructive",
      });
      return;
    }

    try {
      const success = await cartService.addToCart(user.id, item.id);
      
      if (success) {
        // Refresh cart items
        const items = await cartService.getCartItems(user.id);
        setCartItems(items);
        
        toast({
          title: "Added to cart",
          description: `${item.year} ${item.make} ${item.model} added to cart.`,
        });
      } else {
        toast({
          title: "Already in cart",
          description: "This motorcycle is already in your cart.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add item to cart.",
        variant: "destructive",
      });
    }
  };

  const removeFromCart = async (id: number) => {
    if (!isAuthenticated || !user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to manage your cart.",
        variant: "destructive",
      });
      return;
    }

    try {
      const success = await cartService.removeFromCart(user.id, id);
      
      if (success) {
        // Refresh cart items
        const items = await cartService.getCartItems(user.id);
        setCartItems(items);
        
        toast({
          title: "Removed from cart",
          description: "Item removed from your cart.",
        });
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast({
        title: "Error",
        description: "Failed to remove item from cart.",
        variant: "destructive",
      });
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated || !user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to manage your cart.",
        variant: "destructive",
      });
      return;
    }

    try {
      const success = await cartService.clearCart(user.id);
      
      if (success) {
        setCartItems([]);
        toast({
          title: "Cart cleared",
          description: "All items removed from your cart.",
        });
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast({
        title: "Error",
        description: "Failed to clear cart.",
        variant: "destructive",
      });
    }
  };

  // Calculate cart total and count from database items
  const cartTotal = cartItems.reduce((sum, item) => sum + item.listing.price, 0);
  const cartCount = cartItems.length;

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    clearCart,
    cartTotal,
    cartCount,
    isLoading
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

// New hook for cart item structure
export const useCartStructured = () => {
  const { cartItems, ...rest } = useCart();
  
  // Transform database items to cart interface format
  const structuredItems = cartItems.map(item => ({
    id: item.listing.id,
    image: item.listing.images[0] || '/placeholder.svg',
    year: item.listing.year,
    make: item.listing.make,
    model: item.listing.model,
    price: item.listing.price,
    mileage: item.listing.mileage || 0,
    location: item.listing.location || '',
    sellerType: 'dealer' as const, // Would need to get from full listing data
    engineSize: 0, // Would need to get from full listing data
    color: '' // Would need to get from full listing data
  }));

  return {
    ...rest,
    cartItems: structuredItems
  };
};
