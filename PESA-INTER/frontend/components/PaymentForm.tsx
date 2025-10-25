import React, { useState } from 'react';
import { CreditCard, Phone, User, DollarSign, Loader2, Smartphone, Wallet, Building2 } from 'lucide-react';

/**
 * PaymentForm Component - PESA-INTER Package
 * Reusable payment form with PesaPal integration
 * 
 * @author PESA-INTER Package
 * @version 1.0.0
 */

interface PaymentFormData {
  amount: number;
  description: string;
  customerEmail?: string;
  customerPhone?: string;
  firstName?: string;
  lastName?: string;
  paymentType: 'MERCHANDISE' | 'TICKETS' | 'MEMBERSHIP' | 'DONATION' | 'OTHER';
  paymentMethod: 'MPESA' | 'CARD' | 'PESAPAL' | 'OTHER_MOBILE';
}

interface PaymentFormProps {
  onSuccess?: (paymentData: any) => void;
  onError?: (error: string) => void;
  defaultAmount?: number;
  defaultDescription?: string;
  defaultPaymentType?: PaymentFormData['paymentType'];
  defaultPaymentMethod?: PaymentFormData['paymentMethod'];
  apiBaseUrl?: string;
  businessName?: string;
  currency?: string;
  className?: string;
  theme?: 'dark' | 'light';
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  onSuccess,
  onError,
  defaultAmount = 1,
  defaultDescription = 'Payment',
  defaultPaymentType = 'OTHER',
  defaultPaymentMethod = 'PESAPAL',
  apiBaseUrl = '/api',
  businessName = 'Your Business',
  currency = 'KES',
  className = '',
  theme = 'dark'
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentFormData['paymentMethod']>(defaultPaymentMethod);
  const [formData, setFormData] = useState<PaymentFormData>({
    amount: defaultAmount,
    description: defaultDescription,
    paymentType: defaultPaymentType,
    paymentMethod: defaultPaymentMethod
  });

  const isDark = theme === 'dark';
  const baseClasses = isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900';
  const cardClasses = isDark ? 'bg-gray-900/80 border-gray-700/50' : 'bg-white border-gray-200';
  const inputClasses = isDark ? 'bg-gray-800/50 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900';

  const handleInputChange = (field: keyof PaymentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setPaymentUrl(null);

    try {
      // Validate required fields
      if (!formData.customerEmail && !formData.customerPhone) {
        throw new Error('Either email or phone number is required');
      }

      // Add payment method to the data
      const paymentData = {
        ...formData,
        paymentMethod: selectedMethod
      };

      // Show method-specific messages
      if (selectedMethod === 'MPESA') {
        // You can replace this with your preferred toast/notification system
        console.log('M-Pesa Payment: You will receive an STK push on your phone');
      }

      const response = await fetch(`${apiBaseUrl}/payments/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      const result = await response.json();

      if (result.success) {
        const { redirectURL, merchantReference, orderTrackingId } = result.data;
        
        setPaymentUrl(redirectURL);
        
        console.log('Payment initialized successfully!', `Reference: ${merchantReference}`);

        // Open payment URL in new window
        if (redirectURL) {
          const paymentWindow = window.open(
            redirectURL,
            'pesapal_payment',
            'width=800,height=600,scrollbars=yes,resizable=yes'
          );

          // Monitor payment window
          const checkClosed = setInterval(() => {
            if (paymentWindow?.closed) {
              clearInterval(checkClosed);
              // Check payment status after window closes
              checkPaymentStatus(merchantReference);
            }
          }, 1000);
        }

        if (onSuccess) {
          onSuccess({
            merchantReference,
            orderTrackingId,
            redirectURL,
            amount: formData.amount,
            description: formData.description
          });
        }
      } else {
        throw new Error(result.message || 'Payment initialization failed');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Payment initialization failed';
      
      console.error('Payment Error:', errorMessage);

      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const checkPaymentStatus = async (merchantReference: string) => {
    try {
      const response = await fetch(`${apiBaseUrl}/payments/${merchantReference}/status`);
      const result = await response.json();
      
      if (result.success) {
        const { status } = result.data;
        
        if (status === 'COMPLETED') {
          console.log('Payment Successful!', 'Your payment has been processed successfully.');
        } else if (status === 'FAILED') {
          console.error('Payment Failed', 'Your payment could not be processed.');
        } else if (status === 'PENDING') {
          console.log('Payment Pending', 'Your payment is being processed.');
        }
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
  };

  return (
    <div className={`w-full max-w-md mx-auto ${cardClasses} backdrop-blur-md rounded-lg shadow-lg ${className}`}>
      <div className="text-center p-6 border-b border-gray-700/50">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold">Make Payment</h2>
        <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} mt-2`}>
          Secure payment via PesaPal - M-Pesa, Cards & More
        </p>
      </div>

      <div className="p-6">
        {/* Payment Method Selection */}
        <div className="mb-6">
          <label className="text-base font-medium mb-4 block">
            Choose Payment Method
          </label>
          <div className="grid grid-cols-2 gap-3">
            {/* M-Pesa Option */}
            <button
              type="button"
              onClick={() => {
                setSelectedMethod('MPESA');
                handleInputChange('paymentMethod', 'MPESA');
              }}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                selectedMethod === 'MPESA'
                  ? 'border-green-500 bg-green-500/10'
                  : `border-gray-600 ${isDark ? 'bg-gray-800/50 hover:border-gray-500' : 'bg-gray-50 hover:border-gray-400'}`
              }`}
            >
              <div className="flex flex-col items-center space-y-2">
                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-green-400" />
                </div>
                <span className="text-sm font-medium">M-Pesa</span>
                <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-xs`}>STK Push</span>
              </div>
            </button>

            {/* Card Payment Option */}
            <button
              type="button"
              onClick={() => {
                setSelectedMethod('CARD');
                handleInputChange('paymentMethod', 'CARD');
              }}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                selectedMethod === 'CARD'
                  ? 'border-blue-500 bg-blue-500/10'
                  : `border-gray-600 ${isDark ? 'bg-gray-800/50 hover:border-gray-500' : 'bg-gray-50 hover:border-gray-400'}`
              }`}
            >
              <div className="flex flex-col items-center space-y-2">
                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-sm font-medium">Cards</span>
                <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-xs`}>Visa/Mastercard</span>
              </div>
            </button>

            {/* Other Mobile Money */}
            <button
              type="button"
              onClick={() => {
                setSelectedMethod('OTHER_MOBILE');
                handleInputChange('paymentMethod', 'OTHER_MOBILE');
              }}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                selectedMethod === 'OTHER_MOBILE'
                  ? 'border-purple-500 bg-purple-500/10'
                  : `border-gray-600 ${isDark ? 'bg-gray-800/50 hover:border-gray-500' : 'bg-gray-50 hover:border-gray-400'}`
              }`}
            >
              <div className="flex flex-col items-center space-y-2">
                <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-purple-400" />
                </div>
                <span className="text-sm font-medium">Mobile Money</span>
                <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-xs`}>Airtel, T-Kash</span>
              </div>
            </button>

            {/* All Methods (PesaPal) */}
            <button
              type="button"
              onClick={() => {
                setSelectedMethod('PESAPAL');
                handleInputChange('paymentMethod', 'PESAPAL');
              }}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                selectedMethod === 'PESAPAL'
                  ? 'border-red-500 bg-red-500/10'
                  : `border-gray-600 ${isDark ? 'bg-gray-800/50 hover:border-gray-500' : 'bg-gray-50 hover:border-gray-400'}`
              }`}
            >
              <div className="flex flex-col items-center space-y-2">
                <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-red-400" />
                </div>
                <span className="text-sm font-medium">All Methods</span>
                <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-xs`}>PesaPal Gateway</span>
              </div>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div className="space-y-2">
            <label htmlFor="amount" className="flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              Amount ({currency})
            </label>
            <input
              id="amount"
              type="number"
              min="1"
              max="1000000"
              step="0.01"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', parseFloat(e.target.value))}
              className={`w-full px-3 py-2 rounded-md ${inputClasses}`}
              placeholder="Enter amount"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={`w-full px-3 py-2 rounded-md ${inputClasses}`}
              placeholder="Payment description"
              rows={2}
              required
              minLength={5}
              maxLength={100}
            />
          </div>

          {/* Customer Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="firstName" className="flex items-center">
                <User className="w-4 h-4 mr-2" />
                First Name
              </label>
              <input
                id="firstName"
                value={formData.firstName || ''}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className={`w-full px-3 py-2 rounded-md ${inputClasses}`}
                placeholder="First name"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                value={formData.lastName || ''}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className={`w-full px-3 py-2 rounded-md ${inputClasses}`}
                placeholder="Last name"
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-2">
            <label htmlFor="customerPhone" className="flex items-center">
              <Phone className="w-4 h-4 mr-2" />
              Phone Number (M-Pesa)
            </label>
            <input
              id="customerPhone"
              type="tel"
              value={formData.customerPhone || ''}
              onChange={(e) => handleInputChange('customerPhone', e.target.value)}
              className={`w-full px-3 py-2 rounded-md ${inputClasses}`}
              placeholder="0700123456"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="customerEmail">Email Address (Optional)</label>
            <input
              id="customerEmail"
              type="email"
              value={formData.customerEmail || ''}
              onChange={(e) => handleInputChange('customerEmail', e.target.value)}
              className={`w-full px-3 py-2 rounded-md ${inputClasses}`}
              placeholder="your@email.com"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-md text-white font-medium transition-colors ${
              selectedMethod === 'MPESA' ? 'bg-green-600 hover:bg-green-700' :
              selectedMethod === 'CARD' ? 'bg-blue-600 hover:bg-blue-700' :
              selectedMethod === 'OTHER_MOBILE' ? 'bg-purple-600 hover:bg-purple-700' :
              'bg-red-600 hover:bg-red-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                Processing...
              </>
            ) : (
              <>
                {selectedMethod === 'MPESA' && <Smartphone className="w-4 h-4 mr-2 inline" />}
                {selectedMethod === 'CARD' && <CreditCard className="w-4 h-4 mr-2 inline" />}
                {selectedMethod === 'OTHER_MOBILE' && <Wallet className="w-4 h-4 mr-2 inline" />}
                {selectedMethod === 'PESAPAL' && <Building2 className="w-4 h-4 mr-2 inline" />}
                {selectedMethod === 'MPESA' && 'Pay with M-Pesa'}
                {selectedMethod === 'CARD' && 'Pay with Card'}
                {selectedMethod === 'OTHER_MOBILE' && 'Pay with Mobile Money'}
                {selectedMethod === 'PESAPAL' && 'Pay with PesaPal'}
              </>
            )}
          </button>

          {/* Payment URL Display */}
          {paymentUrl && (
            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-green-200 text-sm font-medium mb-2">
                Payment URL Generated
              </p>
              <a
                href={paymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400 hover:text-green-300 text-xs break-all underline"
              >
                {paymentUrl}
              </a>
            </div>
          )}

          {/* Security Notice */}
          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} text-center mt-4`}>
            <p>🔒 Secure payment powered by PesaPal</p>
            <p>Supports M-Pesa, Visa, Mastercard & more</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentForm;
export type { PaymentFormProps, PaymentFormData };
