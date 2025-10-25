# PESA-INTER Setup Guide

This guide will walk you through setting up PESA-INTER in your project from scratch.

## Prerequisites

Before you begin, ensure you have:

- **Node.js** >= 16.0.0
- **npm** >= 8.0.0
- **PesaPal Account** with API credentials
- **React** >= 18.0.0 (for frontend components)

## Step 1: Get PesaPal Credentials

### For Testing (Sandbox)

1. Visit [PesaPal Developer Portal](https://developer.pesapal.com)
2. Create a developer account
3. Get sandbox credentials:
   - Consumer Key: `qkio1BGGYAXTu2JOfm7XSXNjRrK5NPlJ`
   - Consumer Secret: `osGQ364R49cXKeOYSpaOnT++rHs=`

### For Production

1. Contact PesaPal sales team
2. Complete business verification
3. Receive production credentials
4. Configure your business settings

## Step 2: Download PESA-INTER

```bash
# Option 1: Clone from GitHub
git clone https://github.com/your-username/pesa-inter.git
cd pesa-inter

# Option 2: Download as ZIP
# Extract to your desired location
```

## Step 3: Install Dependencies

```bash
# Install all dependencies
npm run install:all

# Or install separately
npm run install:backend
npm run install:frontend
```

## Step 4: Environment Configuration

```bash
# Copy environment template
cp config/.env.example .env

# Edit configuration
nano .env
```

### Required Environment Variables

```env
# Business Information
BUSINESS_NAME=Your Business Name
FRONTEND_URL=http://localhost:3000
CALLBACK_BASE_URL=http://localhost:3000

# PesaPal Credentials
PESAPAL_CONSUMER_KEY=your_consumer_key_here
PESAPAL_CONSUMER_SECRET=your_consumer_secret_here
PESAPAL_ENVIRONMENT=sandbox  # or 'production'

# Server Configuration
NODE_ENV=development
PORT=3000
LOG_LEVEL=info
```

### Optional Configuration

```env
# Payment Storage
PAYMENT_STORAGE_DIR=Payment
ENABLE_FILE_STORAGE=true

# Security
SESSION_SECRET=your_session_secret_here
CORS_ORIGINS=http://localhost:3000,http://localhost:8080

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
PAYMENT_INIT_RATE_LIMIT=10
```

## Step 5: Backend Integration

### Option A: Standalone Server

```javascript
// server.js
const express = require('express');
const createPaymentRoutes = require('./PESA-INTER/backend/routes/payments');
require('dotenv').config();

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// PESA-INTER configuration
const pesaInterConfig = {
  businessName: process.env.BUSINESS_NAME,
  consumerKey: process.env.PESAPAL_CONSUMER_KEY,
  consumerSecret: process.env.PESAPAL_CONSUMER_SECRET,
  environment: process.env.PESAPAL_ENVIRONMENT,
  frontendURL: process.env.FRONTEND_URL,
  callbackBaseURL: process.env.CALLBACK_BASE_URL
};

// Mount payment routes
app.use('/api/payments', createPaymentRoutes(pesaInterConfig));

app.listen(3000, () => {
  console.log('Server running with PESA-INTER');
});
```

### Option B: Existing Express App

```javascript
// In your existing Express app
const createPaymentRoutes = require('./PESA-INTER/backend/routes/payments');

// Configure PESA-INTER
const pesaInterConfig = {
  businessName: process.env.BUSINESS_NAME,
  consumerKey: process.env.PESAPAL_CONSUMER_KEY,
  consumerSecret: process.env.PESAPAL_CONSUMER_SECRET,
  environment: process.env.PESAPAL_ENVIRONMENT,
  frontendURL: process.env.FRONTEND_URL,
  callbackBaseURL: process.env.CALLBACK_BASE_URL
};

// Add to your existing routes
app.use('/api/payments', createPaymentRoutes(pesaInterConfig));
```

## Step 6: Frontend Integration

### Option A: React Component

```tsx
// PaymentComponent.tsx
import React from 'react';
import PaymentForm from './PESA-INTER/frontend/components/PaymentForm';

const PaymentComponent = () => {
  const handleSuccess = (data) => {
    console.log('Payment successful:', data);
    // Handle success (redirect, show message, etc.)
  };

  const handleError = (error) => {
    console.error('Payment failed:', error);
    // Handle error (show message, retry option, etc.)
  };

  return (
    <div className="payment-container">
      <PaymentForm
        onSuccess={handleSuccess}
        onError={handleError}
        defaultAmount={100}
        defaultDescription="Product Purchase"
        businessName="My Store"
        apiBaseUrl="/api"
        theme="dark"
      />
    </div>
  );
};

export default PaymentComponent;
```

### Option B: Full Payment Page

```tsx
// PaymentPage.tsx
import React from 'react';
import PaymentPage from './PESA-INTER/frontend/pages/PaymentPage';

const MyPaymentPage = () => {
  return (
    <PaymentPage
      businessName="My Business"
      apiBaseUrl="/api"
      theme="dark"
      onPaymentSuccess={(data) => {
        // Handle successful payment
        window.location.href = '/success';
      }}
      onPaymentError={(error) => {
        // Handle payment error
        console.error('Payment failed:', error);
      }}
      onBackToHome={() => {
        window.location.href = '/';
      }}
    />
  );
};

export default MyPaymentPage;
```

## Step 7: Testing

### 1. Start the Backend

```bash
# Development mode
npm run dev:backend

# Production mode
npm run start:backend
```

### 2. Test API Connectivity

```bash
# Test PesaPal connection
curl http://localhost:3000/api/payments/test

# Expected response:
{
  "success": true,
  "message": "PesaPal service test successful",
  "data": {
    "authenticated": true,
    "environment": "Sandbox"
  }
}
```

### 3. Test Payment Initialization

```bash
curl -X POST http://localhost:3000/api/payments/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1,
    "description": "Test Payment",
    "customerPhone": "0700123456",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### 4. Frontend Testing

1. Start your React development server
2. Navigate to your payment component
3. Fill out the payment form
4. Test with small amounts (1 KES recommended)
5. Verify M-Pesa STK push (if using M-Pesa)

## Step 8: Production Deployment

### 1. Update Environment

```env
NODE_ENV=production
PESAPAL_ENVIRONMENT=production
PESAPAL_CONSUMER_KEY=your_production_key
PESAPAL_CONSUMER_SECRET=your_production_secret
FRONTEND_URL=https://yourdomain.com
CALLBACK_BASE_URL=https://yourdomain.com
```

### 2. Security Checklist

- [ ] Use HTTPS for all endpoints
- [ ] Set strong session secrets
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Set up monitoring and logging
- [ ] Test with real payments (small amounts)

### 3. Deployment Options

#### Option A: Traditional Server

```bash
# Build the application
npm run build:all

# Start production server
npm run start:backend
```

#### Option B: Docker

```dockerfile
# Dockerfile
FROM node:16-alpine

WORKDIR /app
COPY . .

RUN npm run install:all
RUN npm run build:all

EXPOSE 3000
CMD ["npm", "run", "start:backend"]
```

#### Option C: Cloud Platforms

- **Heroku**: Use the provided Procfile
- **Vercel**: Deploy as serverless functions
- **AWS**: Use Elastic Beanstalk or EC2
- **DigitalOcean**: Use App Platform

## Step 9: Monitoring and Maintenance

### 1. Payment File Storage

Monitor the `Payment/` directory for payment records:

```bash
# Check payment files
ls -la Payment/

# View recent payments
tail -f Payment/*.json
```

### 2. Log Monitoring

```bash
# Monitor application logs
tail -f logs/app.log

# Check for errors
grep "ERROR" logs/app.log
```

### 3. Health Checks

Set up monitoring for:
- `/health` endpoint
- Payment success rates
- API response times
- PesaPal connectivity

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Check PesaPal credentials
   - Verify environment (sandbox vs production)
   - Check network connectivity

2. **Payment Initialization Fails**
   - Validate input data
   - Check required fields
   - Verify customer contact information

3. **M-Pesa STK Push Not Working**
   - Ensure phone number format (0700123456)
   - Check if phone is M-Pesa registered
   - Verify PesaPal M-Pesa configuration

4. **Callback Not Working**
   - Check callback URL accessibility
   - Verify CORS configuration
   - Check firewall settings

### Debug Mode

Enable debug logging:

```env
DEBUG_MODE=true
LOG_LEVEL=debug
```

### Support

If you encounter issues:

1. Check the logs for error messages
2. Verify your configuration
3. Test with sandbox credentials
4. Review the API documentation
5. Open an issue on GitHub

## Next Steps

After successful setup:

1. Customize the UI components to match your brand
2. Implement additional payment types
3. Set up email notifications
4. Add analytics and reporting
5. Configure backup and monitoring
6. Plan for scaling and load balancing

## Security Best Practices

1. **Never commit** `.env` files to version control
2. **Rotate credentials** regularly
3. **Monitor** payment transactions
4. **Validate** all user inputs
5. **Use HTTPS** in production
6. **Implement** proper error handling
7. **Set up** rate limiting
8. **Enable** security headers

Congratulations! You now have a fully functional PesaPal payment integration.
