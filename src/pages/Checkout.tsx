import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Lock, Wallet, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/services/api-client';

const Checkout = () => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'pesapal' | 'card' | 'financing'>('mpesa');
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    setProcessing(true);

    try {
      // Get form data
      const formData = new FormData(e.target as HTMLFormElement);
      const firstName = formData.get('firstName') as string;
      const lastName = formData.get('lastName') as string;
      const email = formData.get('email') as string;
      const phone = formData.get('phone') as string;

      // Prepare payment data
      const paymentData = {
        userId: user!.id,
        amount: total,
        currency: 'KES',
        paymentMethod: paymentMethod,
        customerDetails: {
          firstName,
          lastName,
          email,
          phone,
        },
        billingAddress: {
          line1: 'Nairobi, Kenya', // Default for demo
          city: 'Nairobi',
          country: 'Kenya',
        },
      };

      // Initiate payment
      const result = await apiClient.initiatePayment(paymentData);

      if (paymentMethod === 'mpesa') {
        // Simulate M-Pesa STK push process
        // In a real implementation, this would trigger an actual STK push
        setTimeout(() => {
          clearCart();
          setProcessing(false);
          toast({
            title: "M-Pesa STK Push Sent!",
            description: `An STK push has been sent to ${phone}. Please check your phone to complete the payment of KSh ${total.toLocaleString()}.`,
          });
          navigate('/dashboard');
        }, 2000);
      } else if (paymentMethod === 'pesapal' && result.redirectUrl) {
        // Redirect to PesaPal for payment
        window.location.href = result.redirectUrl;
      } else {
        // For card and financing, show success immediately
        clearCart();
        setProcessing(false);
        toast({
          title: "Payment Successful!",
          description: "Your order has been confirmed. Check your email for details.",
        });
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setProcessing(false);
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (cartItems.length === 0) {
    navigate('/cart');
    return null;
  }

  const total = cartTotal + 99;

  // Validate Kenyan phone number format
  const isValidKenyanPhone = (phone: string): boolean => {
    const kenyanPhoneRegex = /^\+254[17]\d{8}$/;
    return kenyanPhoneRegex.test(phone);
  };

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
                    <Label htmlFor="phone">
                      Phone Number
                      {paymentMethod === 'mpesa' && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </Label>
                    <Input 
                      id="phone" 
                      name="phone"
                      type="tel" 
                      placeholder={paymentMethod === 'mpesa' ? "+254712345678" : "+1 (555) 000-0000"} 
                      required={paymentMethod === 'mpesa'}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className={paymentMethod === 'mpesa' && !isValidKenyanPhone(phoneNumber) && phoneNumber ? 'border-red-500' : ''}
                    />
                    {paymentMethod === 'mpesa' && (
                      <p className="text-sm text-muted-foreground">
                        Enter your M-Pesa registered phone number (Kenyan format: +254XXXXXXXXX)
                      </p>
                    )}
                    {paymentMethod === 'mpesa' && phoneNumber && !isValidKenyanPhone(phoneNumber) && (
                      <p className="text-sm text-red-500">
                        Please enter a valid Kenyan phone number (e.g., +254712345678)
                      </p>
                    )}
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
                      variant={paymentMethod === 'mpesa' ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod('mpesa')}
                      className="h-20"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Smartphone className="h-6 w-6" />
                        <span>M-Pesa</span>
                      </div>
                    </Button>
                    <Button
                      type="button"
                      variant={paymentMethod === 'pesapal' ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod('pesapal')}
                      className="h-20"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Wallet className="h-6 w-6" />
                        <span>PesaPal</span>
                      </div>
                    </Button>
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

              {/* Payment Method Description */}
              {paymentMethod === 'mpesa' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Smartphone className="h-5 w-5" />
                      M-Pesa STK Push Payment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-muted-foreground">
                        Pay instantly with M-Pesa STK Push - Kenya's most popular mobile money service. 
                        An STK push will be sent directly to your phone number to complete the payment.
                      </p>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="font-semibold text-green-800 mb-2">How M-Pesa STK Push works:</h4>
                        <ol className="text-sm text-green-700 space-y-1">
                          <li>1. Click "Pay Now" to initiate payment</li>
                          <li>2. An STK push notification will be sent to your phone</li>
                          <li>3. Open the notification and enter your M-Pesa PIN</li>
                          <li>4. Confirm the payment amount: <strong>KSh {total.toLocaleString()}</strong></li>
                          <li>5. Receive confirmation SMS from M-Pesa</li>
                        </ol>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-800 mb-2">Important Notes:</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          <li>• The phone number you provide must be registered with M-Pesa</li>
                          <li>• Ensure your M-Pesa account has sufficient funds</li>
                          <li>• Keep your phone nearby to receive the STK push</li>
                          <li>• The STK push will expire after a few minutes if not completed</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {paymentMethod === 'pesapal' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="h-5 w-5" />
                      PesaPal Payment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      You will be redirected to PesaPal to complete your payment securely. 
                      PesaPal supports M-Pesa, Airtel Money, credit cards, and bank transfers.
                    </p>
                  </CardContent>
                </Card>
              )}

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
                        KSh {Math.round((total * 1.05) / 60).toLocaleString()}/mo
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
                {processing ? 'Processing...' : `Pay KSh ${total.toLocaleString()}`}
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
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <img
                      src={item.image}
                      alt={`${item.year} ${item.make} ${item.model}`}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">
                        {item.year} {item.make} {item.model}
                      </p>
                      <p className="text-lg font-bold text-primary">
                        KSh {item.price.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold">KSh {cartTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Processing Fee</span>
                    <span className="font-semibold">KSh 99</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-xl">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-primary">KSh {total.toLocaleString()}</span>
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
