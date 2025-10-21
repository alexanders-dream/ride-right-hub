import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Lock, Loader2 } from 'lucide-react';
import { cartService } from '../database';

const Checkout = () => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'financing'>('card');
  const [dbCartItems, setDbCartItems] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    if (!user) return;

    setProcessing(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Clear cart from database
      cartService.clearCart(user.id);
      
      // Clear cart from context
      clearCart();
      
      setProcessing(false);
      toast({
        title: "Payment Successful!",
        description: "Your order has been confirmed. Check your email for details.",
      });
      navigate('/dashboard');
    } catch (error) {
      console.error('Payment failed:', error);
      setProcessing(false);
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const currentItems: any[] = isAuthenticated && user ? dbCartItems : cartItems;
  const currentTotal = currentItems.reduce((sum: number, item: any) => {
    const price = item.listing?.price || item.price || 0;
    return sum + Number(price);
  }, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading checkout...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (currentItems.length === 0) {
    navigate('/cart');
    return null;
  }

  const total = currentTotal + 99;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" defaultValue={user?.name.split(' ')[0]} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" defaultValue={user?.name.split(' ')[1]} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue={user?.email} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" required />
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      type="button"
                      variant={paymentMethod === 'card' ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod('card')}
                      className="h-20"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <CreditCard className="h-6 w-6" />
                        <span>Credit Card</span>
                      </div>
                    </Button>
                    <Button
                      type="button"
                      variant={paymentMethod === 'financing' ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod('financing')}
                      className="h-20"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Lock className="h-6 w-6" />
                        <span>Financing</span>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Details */}
              {paymentMethod === 'card' ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="h-5 w-5" />
                      Secure Payment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input id="cardNumber" placeholder="1234 5678 9012 3456" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expiry">Expiry Date</Label>
                        <Input id="expiry" placeholder="MM/YY" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cvv">CVV</Label>
                        <Input id="cvv" placeholder="123" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billingZip">Billing ZIP Code</Label>
                      <Input id="billingZip" placeholder="12345" required />
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Financing Options</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                      Apply for financing and get approved in minutes. Rates starting as low as 4.99% APR.
                    </p>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="font-semibold mb-2">Estimated Monthly Payment</p>
                      <p className="text-3xl font-bold text-primary">
                        ${Math.round((total * 1.05) / 60).toLocaleString()}/mo
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Based on 60 months at 4.99% APR
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button 
                type="submit" 
                size="lg" 
                className="w-full"
                disabled={processing}
              >
                {processing ? 'Processing...' : `Pay $${total.toLocaleString()}`}
              </Button>
            </form>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentItems.map((item: any) => (
                  <div key={item.id} className="flex gap-4">
                    <img
                      src={item.listing?.images?.[0] || item.images?.[0] || item.image || "/placeholder.svg"}
                      alt={`${item.listing?.year || item.year} ${item.listing?.make || item.make} ${item.listing?.model || item.model}`}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">
                        {item.listing?.year || item.year} {item.listing?.make || item.make} {item.listing?.model || item.model}
                      </p>
                      <p className="text-lg font-bold text-primary">
                        ${(item.listing?.price || item.price || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold">${currentTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Processing Fee</span>
                    <span className="font-semibold">$99</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-xl">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-primary">${total.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Checkout;
