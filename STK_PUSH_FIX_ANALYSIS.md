# M-Pesa STK Push Failure Analysis & Fixes

## Critical Differences Between Our Implementation and PESA-INTER

### 1. **Missing IPN Registration (MAJOR ISSUE)**
**PESA-INTER**: Automatically registers IPN URL during service initialization
**Our Implementation**: No IPN registration - this is why STK push fails!

```javascript
// PESA-INTER automatically registers IPN
async initialize() {
  if (!this.ipnId) {
    const ipnURL = `${this.config.callbackBaseURL}/api/payments/pesapal/ipn`;
    await this.registerIPNURL(ipnURL, 'POST');
  }
}
```

### 2. **Missing IPN ID in Order Submission**
**PESA-INTER**: Includes `notification_id: this.ipnId` in order request
**Our Implementation**: Uses `notification_id: payment.id` (wrong!)

```javascript
// PESA-INTER (correct)
const orderRequest = {
  // ... other fields
  notification_id: this.ipnId, // Uses registered IPN ID
};

// Our Implementation (incorrect)
const orderRequest = {
  // ... other fields
  notification_id: payment.id, // Uses payment ID instead of IPN ID
};
```

### 3. **Missing Country Code in Billing Address**
**PESA-INTER**: Includes `country_code: 'KE'` for M-Pesa
**Our Implementation**: Missing country code

```javascript
// PESA-INTER (correct)
billing_address: {
  email_address: orderData.customerEmail,
  phone_number: orderData.customerPhone,
  country_code: orderData.countryCode || 'KE', // Required for M-Pesa
  // ... other fields
}

// Our Implementation (missing country_code)
billing_address: {
  email_address: customerDetails.email,
  phone_number: customerDetails.phone,
  // Missing country_code field
}
```

### 4. **Missing Service Initialization**
**PESA-INTER**: Has `initialize()` method that sets up IPN
**Our Implementation**: No initialization - service starts without IPN setup

## Immediate Fixes Required

### Fix 1: Add IPN Registration to Service Constructor

```javascript
// Add to server/pesapal-integration.service.js constructor
constructor() {
  // ... existing code
  
  // Initialize IPN registration
  this.initializeIPN();
}

async initializeIPN() {
  try {
    const ipnUrl = `${process.env.BACKEND_URL}/api/payments/pesapal/ipn`;
    this.ipnId = await this.registerIPN(ipnUrl);
    console.log('✅ IPN registered for STK push:', this.ipnId);
  } catch (error) {
    console.error('❌ IPN registration failed:', error);
  }
}
```

### Fix 2: Update Order Request Structure

```javascript
// In submitOrder method, update orderRequest:
const orderRequest = {
  id: payment.id,
  currency: payment.currency,
  amount: payment.amount,
  description: payment.listingId 
    ? `Payment for motorcycle listing ${payment.listingId}`
    : 'Payment for motorcycle purchase',
  callback_url: this.callbackUrl,
  cancellation_url: this.cancellationUrl,
  notification_id: this.ipnId, // Use IPN ID, not payment ID
  billing_address: {
    email_address: customerDetails.email,
    phone_number: customerDetails.phone,
    country_code: 'KE', // Add country code for M-Pesa
    first_name: customerDetails.firstName,
    last_name: customerDetails.lastName,
    line_1: billingAddress.line1,
    city: billingAddress.city,
    country: billingAddress.country,
  },
};
```

### Fix 3: Update Environment Configuration

```env
# Add to .env file
CALLBACK_BASE_URL=http://localhost:3002
```

### Fix 4: Add Phone Number Formatting

```javascript
// In submitMpesaSTKPayment method, add phone formatting:
async submitMpesaSTKPayment(payment, customerDetails, billingAddress) {
  // Format phone number for M-Pesa
  const formattedPhone = this.formatPhoneForMpesa(customerDetails.phone);
  
  // Use formatted phone in billing address
  const billingWithFormattedPhone = {
    ...billingAddress,
    phone_number: formattedPhone
  };
  
  // Submit with formatted phone
  const orderResponse = await this.submitOrder(payment, {
    ...customerDetails,
    phone: formattedPhone
  }, billingWithFormattedPhone);
  
  return orderResponse;
}
```

## Why STK Push Fails Without These Fixes

1. **No IPN Registration**: PesaPal cannot send payment status updates
2. **Wrong Notification ID**: PesaPal doesn't know where to send IPN notifications
3. **Missing Country Code**: M-Pesa requires country code to identify Kenyan numbers
4. **Localhost URLs**: PesaPal cannot reach localhost for callbacks

## Testing the Fixes

### Step 1: Update Environment
```bash
# Use ngrok for public URLs during development
ngrok http 3002
```

### Step 2: Update .env with ngrok URLs
```env
PESAPAL_CALLBACK_URL=https://your-ngrok-url.ngrok.io/api/payments/pesapal/callback
PESAPAL_CANCELLATION_URL=https://your-ngrok-url.ngrok.io/api/payments/pesapal/cancelled
CALLBACK_BASE_URL=https://your-ngrok-url.ngrok.io
```

### Step 3: Test with Real PesaPal Credentials
```bash
# Get sandbox credentials from PesaPal
PESAPAL_CONSUMER_KEY=your_sandbox_consumer_key
PESAPAL_CONSUMER_SECRET=your_sandbox_consumer_secret
```

## Expected Behavior After Fixes

1. **IPN Registration**: Service automatically registers IPN on startup
2. **STK Push Trigger**: M-Pesa STK push sent to provided phone number
3. **Payment Status Updates**: IPN callbacks received and processed
4. **Payment Completion**: Payment marked as completed in database

## Verification Steps

1. Check console logs for IPN registration success
2. Verify IPN ID is included in order requests
3. Test with real Kenyan phone number (+254 format)
4. Monitor PesaPal dashboard for transaction status
5. Check IPN handler logs for payment updates

## Production Considerations

- Use production PesaPal credentials
- Ensure callback URLs are publicly accessible
- Implement proper error handling for IPN failures
- Add retry logic for failed STK push attempts
- Monitor payment status polling for stuck payments
