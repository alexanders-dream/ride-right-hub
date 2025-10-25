# Getting Real PesaPal Credentials for STK Push

## Problem
The current implementation is using placeholder PesaPal credentials, which means:
- ✅ The code is working correctly
- ✅ API calls are being made to PesaPal
- ❌ **No real STK push is sent** because PesaPal rejects the placeholder credentials

## Solution: Get Real PesaPal Credentials

### Step 1: Register for PesaPal Developer Account

1. **Visit PesaPal Developer Portal**
   - Go to: https://developer.pesapal.com/
   - Click "Sign Up" if you don't have an account

2. **Create Developer Account**
   - Fill in your business details
   - Verify your email address
   - Complete the registration process

### Step 2: Get Sandbox Credentials

1. **Access Sandbox Environment**
   - Log into PesaPal Developer Portal
   - Navigate to "Sandbox" section
   - Create a new application or use the default test application

2. **Get Consumer Key & Secret**
   - Copy the **Consumer Key** and **Consumer Secret**
   - These are your sandbox credentials for testing

### Step 3: Update Environment Variables

Replace the placeholder values in your `.env` file:

```env
# PesaPal Configuration - REAL SANDBOX CREDENTIALS
PESAPAL_CONSUMER_KEY=your_actual_sandbox_consumer_key_here
PESAPAL_CONSUMER_SECRET=your_actual_sandbox_consumer_secret_here
PESAPAL_ENVIRONMENT=sandbox
PESAPAL_CALLBACK_URL=http://localhost:3002/api/payments/pesapal/callback
PESAPAL_CANCELLATION_URL=http://localhost:3002/api/payments/pesapal/cancelled
```

### Step 4: Test with Real Credentials

Once you have real credentials:

1. **Update the .env file** with your actual sandbox credentials
2. **Restart the server** to load the new credentials
3. **Test the payment flow** - you should now receive real STK push notifications

## Testing M-Pesa STK Push

### What to Expect with Real Credentials

1. **Real STK Push**: When you initiate payment with M-Pesa, PesaPal will send an actual STK push to the phone number you provide
2. **Phone Prompt**: You'll receive a prompt on your phone asking to enter your M-Pesa PIN
3. **Payment Processing**: After entering PIN, the payment will be processed through PesaPal
4. **Status Updates**: Your application will receive real-time status updates via IPN callbacks

### Test Phone Numbers for Sandbox

For sandbox testing, you can use test M-Pesa numbers provided by PesaPal. Check the PesaPal developer documentation for available test numbers.

## Production Setup

For production deployment:

1. **Apply for Production Credentials** through PesaPal
2. **Update environment variables** to use production credentials
3. **Configure proper callback URLs** with your production domain
4. **Enable HTTPS** for all callback URLs

## Troubleshooting

### Common Issues

1. **"Invalid credentials" error**
   - Check that your Consumer Key and Secret are correct
   - Ensure you're using sandbox credentials for sandbox environment

2. **No STK push received**
   - Verify the phone number is in correct Kenyan format (+254XXXXXXXXX)
   - Check that the phone number is registered with M-Pesa
   - Ensure PesaPal account has sufficient test funds

3. **Callback URL issues**
   - Make sure your server is accessible from the internet (use ngrok for local testing)
   - Verify callback URLs are correctly configured

## Next Steps

1. **Get your PesaPal sandbox credentials**
2. **Update the .env file** with real credentials
3. **Test the complete payment flow** with real STK push
4. **Proceed to Phase 2** for production testing and optimization

## Important Notes

- **Sandbox vs Production**: Use sandbox for testing, production for live transactions
- **Phone Number**: Must be a real Kenyan M-Pesa registered number for STK push to work
- **Callback URLs**: Must be publicly accessible for IPN callbacks to work
- **Security**: Never commit real credentials to version control
