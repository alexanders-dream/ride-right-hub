# M-Pesa STK Push Setup Guide

## Overview

This guide explains how to set up and test M-Pesa STK push functionality in the Ride-Right-Hub application.

## Critical Fixes Implemented

### 1. IPN Registration
- ✅ Service now automatically registers IPN URL on startup
- ✅ IPN ID is stored and used for all payment requests
- ✅ IPN registration happens in service constructor

### 2. Order Request Structure
- ✅ Uses `notification_id: this.ipnId` instead of `payment.id`
- ✅ Added `country_code: 'KE'` to billing address for M-Pesa
- ✅ Proper phone number formatting for Kenyan numbers

### 3. Environment Configuration
- ✅ Added `CALLBACK_BASE_URL` environment variable
- ✅ Updated callback URLs to use proper base URL

## Setup Steps

### Step 1: Get PesaPal Sandbox Credentials

1. Visit [PesaPal Developer Portal](https://developer.pesapal.com/)
2. Create a developer account
3. Get sandbox consumer key and secret
4. Update your `.env` file:

```env
PESAPAL_CONSUMER_KEY=your_sandbox_consumer_key
PESAPAL_CONSUMER_SECRET=your_sandbox_consumer_secret
PESAPAL_ENVIRONMENT=sandbox
```

### Step 2: Set Up Public URLs (Development)

Since PesaPal cannot reach localhost, use ngrok:

```bash
# Install ngrok
npm install -g ngrok

# Start ngrok tunnel
ngrok http 3002
```

Update `.env` with ngrok URL:
```env
PESAPAL_CALLBACK_URL=https://your-ngrok-url.ngrok.io/api/payments/pesapal/callback
PESAPAL_CANCELLATION_URL=https://your-ngrok-url.ngrok.io/api/payments/pesapal/cancelled
CALLBACK_BASE_URL=https://your-ngrok-url.ngrok.io
```

### Step 3: Test STK Push

Run the test script:
```bash
node test-stk-push.js
```

## Expected Behavior

### Successful STK Push
1. ✅ IPN registration on service startup
2. ✅ Order submission with correct IPN ID
3. ✅ M-Pesa STK push sent to provided phone number
4. ✅ Payment status updates via IPN callbacks

### Console Output
```
✅ PesaPal service initialized
📡 IPN ID: abc123-ipn-id
📱 Testing M-Pesa STK Push Payment...
✅ STK Push Test Results:
Order Tracking ID: abc123-order-id
Redirect URL: https://pay.pesapal.com/...
Status: 200
🎉 STK Push Test Completed Successfully!
```

## Troubleshooting

### Common Issues

#### 1. IPN Registration Fails
**Symptoms**: `IPN registration failed` error
**Solution**: 
- Check `CALLBACK_BASE_URL` is set in `.env`
- Ensure ngrok is running for development
- Verify PesaPal credentials are valid

#### 2. Authentication Fails
**Symptoms**: `PesaPal authentication failed` error
**Solution**:
- Verify consumer key and secret in `.env`
- Ensure environment is set to `sandbox` for testing
- Check PesaPal API status

#### 3. STK Push Not Received
**Symptoms**: Order submitted but no STK push
**Solution**:
- Verify phone number is in Kenyan format (+254XXXXXXXXX)
- Check that `country_code: 'KE'` is included
- Ensure IPN ID is used in order request

#### 4. Localhost Callback Issues
**Symptoms**: IPN callbacks not received
**Solution**:
- Use ngrok for public URLs during development
- Ensure callback URLs are publicly accessible
- Check firewall and network settings

## Production Setup

### Environment Variables
```env
PESAPAL_CONSUMER_KEY=your_production_consumer_key
PESAPAL_CONSUMER_SECRET=your_production_consumer_secret
PESAPAL_ENVIRONMENT=production
PESAPAL_CALLBACK_URL=https://yourdomain.com/api/payments/pesapal/callback
PESAPAL_CANCELLATION_URL=https://yourdomain.com/api/payments/pesapal/cancelled
CALLBACK_BASE_URL=https://yourdomain.com
```

### Production Considerations
- Use real PesaPal production credentials
- Ensure SSL certificates are valid
- Set up proper monitoring and logging
- Implement retry logic for failed payments
- Monitor IPN callback success rates

## Testing with Real Payments

### Test Phone Numbers
Use these test numbers for M-Pesa sandbox:
- `+254708374149`
- `+254737735298`
- `+254790512364`

### Test Amounts
- Use small amounts (1-10 KES) for testing
- Ensure test accounts have sufficient balance
- Test both successful and failed payment scenarios

## Monitoring & Debugging

### Key Logs to Monitor
- IPN registration success/failure
- Order submission status
- Payment status updates
- IPN callback processing

### Debug Commands
```bash
# Check IPN registration
curl -X GET "https://cybqa.pesapal.com/pesapalv3/api/URLSetup/GetIpnList" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Check payment status
curl -X GET "https://cybqa.pesapal.com/pesapalv3/api/Transactions/GetTransactionStatus?orderTrackingId=ORDER_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Next Steps

1. **Test with real PesaPal credentials**
2. **Verify IPN callbacks are working**
3. **Test payment status polling**
4. **Implement error handling and retries**
5. **Set up production monitoring**

## Support

If issues persist:
1. Check PesaPal API documentation
2. Review server logs for detailed error messages
3. Test with the provided test script
4. Verify all environment variables are set correctly
