/**
 * Test script for M-Pesa STK Push functionality
 * This script tests the PesaPal integration with STK push
 */

import { PesaPalIntegrationService } from './server/pesapal-integration.service.js';

async function testSTKPush() {
  console.log('🧪 Testing M-Pesa STK Push Integration...\n');

  try {
    // Create PesaPal service instance
    const pesaPalService = new PesaPalIntegrationService();
    
    // Wait a moment for IPN registration
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('✅ PesaPal service initialized');
    console.log('📡 IPN ID:', pesaPalService.ipnId);
    
    // Test payment data
    const testPayment = {
      id: `TEST-${Date.now()}`,
      amount: 1, // 1 KES for testing
      currency: 'KES',
      listingId: 'test-listing-123'
    };
    
    const customerDetails = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      phone: '+254712345678' // Test Kenyan phone number
    };
    
    const billingAddress = {
      line1: 'Test Street',
      city: 'Nairobi',
      country: 'Kenya'
    };
    
    console.log('\n📱 Testing M-Pesa STK Push Payment...');
    console.log('Payment Details:', {
      amount: testPayment.amount,
      currency: testPayment.currency,
      phone: customerDetails.phone
    });
    
    // Test M-Pesa STK push
    const result = await pesaPalService.submitMpesaSTKPayment(
      testPayment,
      customerDetails,
      billingAddress
    );
    
    console.log('\n✅ STK Push Test Results:');
    console.log('Order Tracking ID:', result.order_tracking_id);
    console.log('Redirect URL:', result.redirect_url);
    console.log('Status:', result.status);
    
    console.log('\n🎉 STK Push Test Completed Successfully!');
    console.log('An M-Pesa STK push should be sent to:', customerDetails.phone);
    
  } catch (error) {
    console.error('\n❌ STK Push Test Failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('IPN registration')) {
      console.log('\n💡 Solution: Make sure CALLBACK_BASE_URL is set in .env file');
      console.log('For development, use ngrok to get a public URL:');
      console.log('ngrok http 3002');
      console.log('Then update .env with:');
      console.log('CALLBACK_BASE_URL=https://your-ngrok-url.ngrok.io');
    }
    
    if (error.message.includes('authentication')) {
      console.log('\n💡 Solution: Get real PesaPal sandbox credentials from:');
      console.log('https://developer.pesapal.com/');
    }
  }
}

// Run the test
testSTKPush();
