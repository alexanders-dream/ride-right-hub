# Local Development Setup for PesaPal Integration

## ✅ Local Domain Configuration Complete

The PesaPal integration has been successfully configured to work with localhost for development and testing. Here's what has been implemented:

## 🔧 Configuration Changes Made

### 1. Environment Variables Updated
- **PESAPAL_ENVIRONMENT**: `sandbox` (for development testing)
- **PESAPAL_CALLBACK_URL**: `http://localhost:3002/api/payments/pesapal/callback`
- **PESAPAL_CANCELLATION_URL**: `http://localhost:3002/api/payments/pesapal/cancelled`

### 2. Server Endpoints Added
- **GET `/api/payments/pesapal/callback`** - Handles user redirects after payment
- **GET `/api/payments/pesapal/cancelled`** - Handles payment cancellations
- **POST `/api/payments/pesapal/ipn`** - Handles Instant Payment Notifications

### 3. Frontend Integration
- Automatic redirects to frontend payment status pages
- Proper error handling for failed payments
- Comprehensive logging for debugging

## 🚀 How to Test Locally

### Step 1: Get PesaPal Sandbox Credentials
1. Visit: https://developer.pesapal.com/
2. Sign up for a developer account
3. Get your sandbox credentials:
   - `PESAPAL_CONSUMER_KEY`
   - `PESAPAL_CONSUMER_SECRET`

### Step 2: Update Environment Variables
Update your `.env` file with actual credentials:
```env
# PesaPal Configuration - DEVELOPMENT SETUP
PESAPAL_CONSUMER_KEY=your_actual_sandbox_consumer_key
PESAPAL_CONSUMER_SECRET=your_actual_sandbox_consumer_secret
PESAPAL_ENVIRONMENT=sandbox
PESAPAL_CALLBACK_URL=http://localhost:3002/api/payments/pesapal/callback
PESAPAL_CANCELLATION_URL=http://localhost:3002/api/payments/pesapal/cancelled
```

### Step 3: Start the Application
```bash
# Start both frontend and backend
npm run dev
```

### Step 4: Expose Local Server to Internet (Required for PesaPal)
Since PesaPal needs to call back to your server, you need to expose your local server:

**Option A: Using ngrok (Recommended)**
```bash
# Install ngrok globally
npm install -g ngrok

# Expose your local server
ngrok http 3002
```

**Option B: Using localtunnel**
```bash
# Install localtunnel globally
npm install -g localtunnel

# Expose your local server
lt --port 3002
```

### Step 5: Update Callback URLs with Public URL
After exposing your server, update the callback URLs in your `.env` file:
```env
PESAPAL_CALLBACK_URL=https://your-ngrok-url.ngrok.io/api/payments/pesapal/callback
PESAPAL_CANCELLATION_URL=https://your-ngrok-url.ngrok.io/api/payments/pesapal/cancelled
```

## 🧪 Testing the Integration

### Test Payment Flow:
1. **Browse Listings**: Navigate to motorcycle listings
2. **Select Listing**: Choose a motorcycle to purchase
3. **Checkout**: Proceed to checkout page
4. **M-Pesa Payment**: Select M-Pesa as payment method
5. **STK Push**: Enter phone number to receive STK push
6. **Payment Processing**: Complete payment on your phone
7. **Callback**: System redirects back to your application
8. **Confirmation**: See payment confirmation page

### Test Scenarios:
- ✅ Successful M-Pesa payment
- ✅ Payment cancellation
- ✅ Insufficient funds
- ✅ Network timeouts
- ✅ Invalid phone numbers

## 🔍 Debugging Tips

### Check Server Logs:
```bash
# Monitor server logs for PesaPal callbacks
tail -f server.log
```

### Test Endpoints Manually:
```bash
# Test health endpoint
curl http://localhost:3002/api/health

# Test IPN endpoint
curl -X POST http://localhost:3002/api/payments/pesapal/ipn \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### Environment Validation:
```bash
# Test environment configuration
cd server && node test-local-config.js
```

## 📋 Production Deployment

When ready for production:

1. **Update Environment**: Change `PESAPAL_ENVIRONMENT` to `production`
2. **Use Production Credentials**: Get production credentials from PesaPal
3. **Update URLs**: Use your actual domain for callback URLs
4. **SSL/TLS**: Ensure HTTPS is configured
5. **Monitoring**: Set up payment monitoring and alerts

## 🎯 Summary

The local domain configuration is now **complete and ready for testing**. The system supports:

- ✅ Localhost development with ngrok
- ✅ M-Pesa STK push payments
- ✅ Real-time payment status updates
- ✅ Comprehensive error handling
- ✅ Production-ready code structure

You can now proceed with testing using actual PesaPal sandbox credentials!
