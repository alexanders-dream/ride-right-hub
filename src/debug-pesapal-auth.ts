// Debug PesaPal Authentication
import { config } from 'dotenv';
config();

async function debugPesaPalAuth() {
  console.log('🔍 Debugging PesaPal Authentication...\n');

  const consumerKey = process.env.PESAPAL_CONSUMER_KEY;
  const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;
  const environment = process.env.PESAPAL_ENVIRONMENT || 'sandbox';
  
  const baseUrl = environment === 'sandbox' 
    ? 'https://cybqa.pesapal.com/pesapalv3'
    : 'https://pay.pesapal.com';

  console.log('📋 Configuration:');
  console.log('   Consumer Key:', consumerKey ? '✅ Set' : '❌ Missing');
  console.log('   Consumer Secret:', consumerSecret ? '✅ Set' : '❌ Missing');
  console.log('   Environment:', environment);
  console.log('   Base URL:', baseUrl);

  if (!consumerKey || !consumerSecret) {
    console.log('❌ Missing credentials in .env file');
    return;
  }

  try {
    console.log('\n🔑 Attempting to get access token...');
    
    const response = await fetch(`${baseUrl}/api/Auth/RequestToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        consumer_key: consumerKey,
        consumer_secret: consumerSecret,
      }),
    });

    console.log('📡 Response Status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ API Error Response:', errorText);
      console.log('💡 Possible issues:');
      console.log('   - Invalid credentials');
      console.log('   - Network connectivity');
      console.log('   - PesaPal API maintenance');
      console.log('   - IP whitelisting required');
      return;
    }

    const responseData = await response.json();
    console.log('✅ API Response:', JSON.stringify(responseData, null, 2));
    
    if (responseData.token) {
      console.log('🎉 Access token received successfully!');
      console.log('   Token:', responseData.token.substring(0, 50) + '...');
    } else {
      console.log('❌ No token in response');
      console.log('💡 Check PesaPal account status and permissions');
    }

  } catch (error) {
    console.log('❌ Network/Connection Error:', error.message);
    console.log('💡 Check internet connectivity and firewall settings');
  }
}

debugPesaPalAuth().catch(console.error);
