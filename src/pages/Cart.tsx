import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, ShoppingCart, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cartService } from '../database';

const Cart = () => {
  const { cartItems, removeFromCart, cartTotal, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dbCartItems, setDbCartItems] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    const loadCartItems = async () => {
      if (!isAuthenticated || !user) {
        // For unauthenticated users, show the context cart
        setDbCartItems(cartItems);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const items = cartService.getCartItems(user.id);
        setDbCartItems(items);
      } catch (error) {
        console.error('Failed to load cart items:', error);
        toast({
          title: "Error",
          description: "Failed to load cart items",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadCartItems();
  }, [user, isAuthenticated, cartItems, toast]);

  const handleRemoveItem = (itemId: number, listingId: number) => {
    if (user) {
      const success = cartService.removeFromCart(user.id, listingId);
      if (success) {
        setDbCartItems(prev => prev.filter(item => item.id !== itemId));
      } else {
        toast({
          title: "Error",
          description: "Failed to remove item from cart",
          variant: "destructive",
        });
      }
    } else {
      removeFromCart(listingId);
    }
  };

  const currentItems = isAuthenticated && user ? dbCartItems : cartItems;
  const currentTotal = currentItems.reduce((sum, item) => sum + item.price, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading your cart...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Shopping Cart</h1>

        {currentItems.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
              <p className="text-muted-foreground mb-6">Start browsing to add motorcycles to your cart</p>
              <Button onClick={() => navigate('/listings')}>Browse Motorcycles</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {currentItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-6">
                    <div className="flex gap-6">
                      <img
                        src={item.images?.[0] || item.image || "/placeholder.svg"}
                        alt={`${item.year} ${item.make} ${item.model}`}
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2">
                          {item.year} {item.make} {item.model}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {item.mileage?.toLocaleString() || 'N/A'} mi • {item.engineSize || item.images ? 'Available' : 'N/A'}cc • {item.color || 'N/A'}
                        </p>
                        <p className="text-2xl font-bold text-primary">
                          ${item.price.toLocaleString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(item.id, item.listing_id || item.id)}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-4">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-6">Order Summary</h2>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-lg">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-semibold">${currentTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-lg">
                      <span className="text-muted-foreground">Processing Fee</span>
                      <span className="font-semibold">$99</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-xl">
                      <span className="font-semibold">Total</span>
                      <span className="font-bold text-primary">${(currentTotal + 99).toLocaleString()}</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full mb-4" 
                    size="lg"
                    onClick={() => navigate('/checkout')}
                  >
                    Proceed to Checkout
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate('/listings')}
                  >
                    Continue Shopping
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Cart;
