import React, { useState, useEffect } from 'react';
import PaymentForm from '../components/PaymentForm';
import { CheckCircle, XCircle, Clock, AlertCircle, ArrowLeft } from 'lucide-react';

/**
 * PaymentPage Component - PESA-INTER Package
 * Complete payment page with form and result handling
 * 
 * @author PESA-INTER Package
 * @version 1.0.0
 */

interface PaymentPageProps {
  businessName?: string;
  apiBaseUrl?: string;
  theme?: 'dark' | 'light';
  onPaymentSuccess?: (data: any) => void;
  onPaymentError?: (error: string) => void;
  onBackToHome?: () => void;
  className?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  headerContent?: React.ReactNode;
  footerContent?: React.ReactNode;
}

const PaymentPage: React.FC<PaymentPageProps> = ({
  businessName = 'Your Business',
  apiBaseUrl = '/api',
  theme = 'dark',
  onPaymentSuccess,
  onPaymentError,
  onBackToHome,
  className = '',
  showHeader = true,
  showFooter = true,
  headerContent,
  footerContent
}) => {
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isDark = theme === 'dark';
  const bgClass = isDark ? 'bg-black text-white' : 'bg-gray-50 text-gray-900';

  useEffect(() => {
    // Check for callback parameters in URL
    const urlParams = new URLSearchParams(window.location.search);
    const merchantRef = urlParams.get('ref');
    const status = urlParams.get('status');
    const orderTrackingId = urlParams.get('OrderTrackingId');
    const orderMerchantReference = urlParams.get('OrderMerchantReference');

    // Handle payment callback
    if (merchantRef || orderMerchantReference) {
      const reference = merchantRef || orderMerchantReference;
      if (reference) {
        checkPaymentStatus(reference);
      }
    }
  }, []);

  const checkPaymentStatus = async (reference: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/payments/${reference}/status`);
      const result = await response.json();
      
      if (result.success) {
        setPaymentData(result.data);
        setPaymentStatus(result.data.status);
        
        // Call success/error callbacks
        const status = result.data.status;
        if (status === 'COMPLETED' && onPaymentSuccess) {
          onPaymentSuccess(result.data);
        } else if (status === 'FAILED' && onPaymentError) {
          onPaymentError('Payment failed');
        }
      }
    } catch (error: any) {
      console.error('Error checking payment status:', error);
      if (onPaymentError) {
        onPaymentError('Could not check payment status');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = (data: any) => {
    setPaymentData(data);
    console.log('Payment Initiated', 'Please complete the payment in the popup window');
    if (onPaymentSuccess) {
      onPaymentSuccess(data);
    }
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment Error', error);
    if (onPaymentError) {
      onPaymentError(error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-16 h-16 text-green-400" />;
      case 'FAILED':
        return <XCircle className="w-16 h-16 text-red-400" />;
      case 'PENDING':
        return <Clock className="w-16 h-16 text-yellow-400" />;
      default:
        return <AlertCircle className="w-16 h-16 text-gray-400" />;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return {
          title: 'Payment Successful!',
          description: 'Your payment has been processed successfully.',
          color: 'text-green-400'
        };
      case 'FAILED':
        return {
          title: 'Payment Failed',
          description: 'Your payment could not be processed. Please try again.',
          color: 'text-red-400'
        };
      case 'PENDING':
        return {
          title: 'Payment Pending',
          description: 'Your payment is being processed. Please wait.',
          color: 'text-yellow-400'
        };
      default:
        return {
          title: 'Payment Status Unknown',
          description: 'Unable to determine payment status.',
          color: 'text-gray-400'
        };
    }
  };

  // If we have payment status, show result page
  if (paymentStatus && paymentData) {
    const statusInfo = getStatusMessage(paymentStatus);
    
    return (
      <main className={`min-h-screen ${bgClass} ${className}`}>
        {showHeader && (
          <header className="py-8">
            {headerContent || (
              <div className="container mx-auto px-6 text-center">
                <h1 className="text-3xl font-bold">{businessName}</h1>
              </div>
            )}
          </header>
        )}
        
        <section className="py-20 relative min-h-screen flex items-center">
          <div className="container mx-auto px-6">
            <div className="max-w-2xl mx-auto text-center">
              <div className="mb-8">
                <h1 className="text-4xl md:text-5xl font-bold mb-6">
                  Payment Result
                </h1>
              </div>

              <div className={`${isDark ? 'bg-gray-900/80 border-gray-700/50' : 'bg-white border-gray-200'} backdrop-blur-md rounded-lg shadow-lg`}>
                <div className="text-center p-6 border-b border-gray-700/50">
                  <div className="flex justify-center mb-4">
                    {getStatusIcon(paymentStatus)}
                  </div>
                  <h2 className={`text-2xl font-bold ${statusInfo.color}`}>
                    {statusInfo.title}
                  </h2>
                  <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} mt-2`}>
                    {statusInfo.description}
                  </p>
                </div>
                
                <div className="p-6 space-y-4">
                  {/* Payment Details */}
                  <div className={`${isDark ? 'bg-gray-800/50' : 'bg-gray-50'} rounded-lg p-4 space-y-2`}>
                    <div className="flex justify-between">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Reference:</span>
                      <span className="font-mono">{paymentData.merchantReference}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Amount:</span>
                      <span>{paymentData.currency} {paymentData.amount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Description:</span>
                      <span>{paymentData.description}</span>
                    </div>
                    {paymentData.paymentMethod && (
                      <div className="flex justify-between">
                        <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Method:</span>
                        <span>{paymentData.paymentMethod}</span>
                      </div>
                    )}
                    {paymentData.confirmationCode && (
                      <div className="flex justify-between">
                        <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Confirmation:</span>
                        <span className="font-mono">{paymentData.confirmationCode}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <button
                      onClick={onBackToHome || (() => window.location.href = '/')}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-md font-medium transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2 inline" />
                      Back to Home
                    </button>
                    
                    {paymentStatus === 'FAILED' && (
                      <button
                        onClick={() => window.location.reload()}
                        className={`flex-1 ${isDark ? 'bg-transparent border-gray-600 text-white hover:bg-gray-800/50' : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'} border py-3 px-4 rounded-md font-medium transition-colors`}
                      >
                        Try Again
                      </button>
                    )}
                    
                    {paymentStatus === 'PENDING' && (
                      <button
                        onClick={() => checkPaymentStatus(paymentData.merchantReference)}
                        disabled={isLoading}
                        className={`flex-1 ${isDark ? 'bg-transparent border-gray-600 text-white hover:bg-gray-800/50' : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'} border py-3 px-4 rounded-md font-medium transition-colors disabled:opacity-50`}
                      >
                        {isLoading ? 'Checking...' : 'Check Status'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {showFooter && (
          <footer className="py-8">
            {footerContent || (
              <div className="container mx-auto px-6 text-center">
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  Powered by PESA-INTER Package
                </p>
              </div>
            )}
          </footer>
        )}
      </main>
    );
  }

  // Default payment form page
  return (
    <main className={`min-h-screen ${bgClass} ${className}`}>
      {showHeader && (
        <header className="py-8">
          {headerContent || (
            <div className="container mx-auto px-6 text-center">
              <h1 className="text-3xl font-bold">{businessName}</h1>
            </div>
          )}
        </header>
      )}
      
      <section className="py-20 relative min-h-screen flex items-center">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Make a Payment
              </h1>
              <p className={`${isDark ? 'text-white/70' : 'text-gray-600'} text-lg max-w-2xl mx-auto`}>
                Support {businessName} with a secure payment via PesaPal. 
                Pay with M-Pesa, credit cards, and more.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              {/* Payment Form */}
              <div>
                <PaymentForm
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  defaultAmount={1}
                  defaultDescription={`Support ${businessName}`}
                  defaultPaymentType="DONATION"
                  apiBaseUrl={apiBaseUrl}
                  businessName={businessName}
                  theme={theme}
                />
              </div>

              {/* Payment Information */}
              <div className="space-y-6">
                <div className={`${isDark ? 'bg-gray-900/80 border-gray-700/50' : 'bg-white border-gray-200'} backdrop-blur-md rounded-lg shadow-lg`}>
                  <div className="p-6 border-b border-gray-700/50">
                    <h3 className="text-xl font-bold">Payment Methods</h3>
                    <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} mt-2`}>
                      We accept multiple payment methods through PesaPal
                    </p>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                        <span className="text-green-400 text-sm font-bold">M</span>
                      </div>
                      <span>M-Pesa (Safaricom)</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <span className="text-blue-400 text-sm font-bold">V</span>
                      </div>
                      <span>Visa Cards</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                        <span className="text-red-400 text-sm font-bold">M</span>
                      </div>
                      <span>Mastercard</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                        <span className="text-purple-400 text-sm font-bold">+</span>
                      </div>
                      <span>Other Mobile Money</span>
                    </div>
                  </div>
                </div>

                <div className={`${isDark ? 'bg-gray-900/80 border-gray-700/50' : 'bg-white border-gray-200'} backdrop-blur-md rounded-lg shadow-lg`}>
                  <div className="p-6 border-b border-gray-700/50">
                    <h3 className="text-xl font-bold">Security & Trust</h3>
                  </div>
                  <div className="p-6 space-y-3">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-sm">PCI DSS Compliant</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-sm">SSL Encrypted</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-sm">Instant Notifications</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-sm">24/7 Support</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {showFooter && (
        <footer className="py-8">
          {footerContent || (
            <div className="container mx-auto px-6 text-center">
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                Powered by PESA-INTER Package
              </p>
            </div>
          )}
        </footer>
      )}
    </main>
  );
};

export default PaymentPage;
export type { PaymentPageProps };
