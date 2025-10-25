/**
 * PESA-INTER Package - React Application Example
 * 
 * This example shows how to integrate PESA-INTER components into a React application
 */

import React, { useState } from 'react';
import PaymentForm from '../frontend/components/PaymentForm';
import PaymentPage from '../frontend/pages/PaymentPage';

// Example 1: Simple Payment Form Integration
const SimplePaymentExample: React.FC = () => {
  const [paymentResult, setPaymentResult] = useState<any>(null);

  const handlePaymentSuccess = (data: any) => {
    console.log('Payment successful:', data);
    setPaymentResult({ success: true, data });
    // You can redirect, show success message, etc.
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment failed:', error);
    setPaymentResult({ success: false, error });
    // You can show error message, retry option, etc.
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-center mb-8">Simple Payment Example</h1>
        
        <PaymentForm
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          defaultAmount={100}
          defaultDescription="Product Purchase"
          businessName="My Store"
          apiBaseUrl="/api"
          theme="light"
        />

        {paymentResult && (
          <div className={`mt-6 p-4 rounded-lg ${
            paymentResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {paymentResult.success ? (
              <div>
                <h3 className="font-bold">Payment Successful!</h3>
                <p>Reference: {paymentResult.data.merchantReference}</p>
              </div>
            ) : (
              <div>
                <h3 className="font-bold">Payment Failed</h3>
                <p>{paymentResult.error}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Example 2: Full Payment Page Integration
const FullPagePaymentExample: React.FC = () => {
  const handlePaymentSuccess = (data: any) => {
    console.log('Payment successful:', data);
    // Handle successful payment
    // You might want to redirect to a success page or update your app state
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment failed:', error);
    // Handle payment error
    // You might want to show an error message or redirect to an error page
  };

  const handleBackToHome = () => {
    // Handle navigation back to home
    window.location.href = '/';
  };

  return (
    <PaymentPage
      businessName="My Business"
      apiBaseUrl="/api"
      theme="dark"
      onPaymentSuccess={handlePaymentSuccess}
      onPaymentError={handlePaymentError}
      onBackToHome={handleBackToHome}
      showHeader={true}
      showFooter={true}
      headerContent={
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-3xl font-bold text-white">My Business</h1>
          <p className="text-gray-300 mt-2">Secure payments powered by PesaPal</p>
        </div>
      }
      footerContent={
        <div className="container mx-auto px-6 text-center">
          <p className="text-gray-400">© 2024 My Business. All rights reserved.</p>
        </div>
      }
    />
  );
};

// Example 3: Custom Payment Integration with Hooks
const CustomPaymentExample: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);

  const initializePayment = async (paymentDetails: any) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentDetails),
      });

      const result = await response.json();
      
      if (result.success) {
        setPaymentData(result.data);
        // Open payment URL
        window.open(result.data.redirectURL, '_blank');
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Payment initialization failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkPaymentStatus = async (merchantReference: string) => {
    try {
      const response = await fetch(`/api/payments/${merchantReference}/status`);
      const result = await response.json();
      
      if (result.success) {
        console.log('Payment status:', result.data.status);
        return result.data;
      }
    } catch (error) {
      console.error('Status check failed:', error);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-xl font-bold mb-4">Custom Payment Integration</h2>
      
      <button
        onClick={() => initializePayment({
          amount: 50,
          description: 'Custom Payment',
          customerPhone: '0700000000',
          firstName: 'John',
          lastName: 'Doe'
        })}
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg disabled:opacity-50"
      >
        {isLoading ? 'Processing...' : 'Pay KES 50'}
      </button>

      {paymentData && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <p><strong>Reference:</strong> {paymentData.merchantReference}</p>
          <p><strong>Amount:</strong> {paymentData.currency} {paymentData.amount}</p>
          <button
            onClick={() => checkPaymentStatus(paymentData.merchantReference)}
            className="mt-2 bg-green-600 text-white py-1 px-3 rounded"
          >
            Check Status
          </button>
        </div>
      )}
    </div>
  );
};

// Main App Component
const App: React.FC = () => {
  const [currentExample, setCurrentExample] = useState<'simple' | 'full' | 'custom'>('simple');

  return (
    <div>
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">PESA-INTER Examples</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentExample('simple')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentExample === 'simple' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Simple Form
              </button>
              <button
                onClick={() => setCurrentExample('full')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentExample === 'full' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Full Page
              </button>
              <button
                onClick={() => setCurrentExample('custom')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentExample === 'custom' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Custom
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      {currentExample === 'simple' && <SimplePaymentExample />}
      {currentExample === 'full' && <FullPagePaymentExample />}
      {currentExample === 'custom' && <CustomPaymentExample />}
    </div>
  );
};

export default App;
