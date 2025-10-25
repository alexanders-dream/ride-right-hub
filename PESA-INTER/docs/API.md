# PESA-INTER API Documentation

## Overview

The PESA-INTER package provides a comprehensive REST API for PesaPal payment integration. This document covers all available endpoints, request/response formats, and usage examples.

## Base URL

```
http://localhost:3000/api/payments
```

## Authentication

Currently, the API does not require authentication for basic operations. For production use, consider implementing authentication middleware.

## Rate Limiting

- **General API**: 100 requests per 15 minutes per IP
- **Payment Initialization**: 10 requests per 15 minutes per IP

## Endpoints

### 1. Initialize Payment

Initialize a new payment with PesaPal.

**Endpoint:** `POST /initialize`

**Request Body:**
```json
{
  "amount": 100,
  "description": "Product Purchase",
  "customerPhone": "0700123456",
  "customerEmail": "customer@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "paymentType": "MERCHANDISE",
  "paymentMethod": "MPESA"
}
```

**Required Fields:**
- `amount` (number): Payment amount (minimum 1)
- `description` (string): Payment description (5-100 characters)
- Either `customerPhone` or `customerEmail` (string): Customer contact

**Optional Fields:**
- `firstName` (string): Customer first name
- `lastName` (string): Customer last name
- `paymentType` (enum): MERCHANDISE, TICKETS, MEMBERSHIP, DONATION, OTHER
- `paymentMethod` (enum): MPESA, CARD, PESAPAL, OTHER_MOBILE

**Response:**
```json
{
  "success": true,
  "message": "Payment initialized successfully",
  "data": {
    "merchantReference": "PAY-1705752069446-3WFM0S",
    "orderTrackingId": "70a28461-2b39-4b5a-b6f0-db8f412a1ca0",
    "redirectURL": "https://pay.pesapal.com/iframe/PesapalIframe3/Index?OrderTrackingId=70a28461-2b39-4b5a-b6f0-db8f412a1ca0",
    "amount": 100,
    "currency": "KES",
    "description": "Product Purchase",
    "paymentMethod": "MPESA"
  }
}
```

### 2. Get Payment Status

Retrieve the current status of a payment.

**Endpoint:** `GET /:merchantReference/status`

**Parameters:**
- `merchantReference` (string): The merchant reference from payment initialization

**Response:**
```json
{
  "success": true,
  "data": {
    "merchantReference": "PAY-1705752069446-3WFM0S",
    "orderTrackingId": "70a28461-2b39-4b5a-b6f0-db8f412a1ca0",
    "status": "COMPLETED",
    "amount": 100,
    "currency": "KES",
    "description": "Product Purchase",
    "paymentMethod": "Mpesa",
    "confirmationCode": "ABC123XYZ",
    "createdAt": "2024-01-15T10:25:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Payment Status Values:**
- `PENDING`: Payment is being processed
- `COMPLETED`: Payment was successful
- `FAILED`: Payment failed
- `INVALID`: Payment is invalid
- `REVERSED`: Payment was reversed

### 3. Get Payment Statistics

Retrieve payment statistics from file storage.

**Endpoint:** `GET /stats`

**Response:**
```json
{
  "success": true,
  "data": {
    "fileStorage": {
      "totalPayments": 25,
      "byTransactionType": {
        "mpesa": 15,
        "card": 8,
        "mobile_money": 2
      },
      "byStatus": {
        "COMPLETED": 20,
        "FAILED": 3,
        "PENDING": 2
      },
      "totalAmount": 2500,
      "currency": "KES"
    },
    "source": "file_storage"
  }
}
```

### 4. Get Payment History

Retrieve paginated payment history.

**Endpoint:** `GET /history`

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "merchantReference": "PAY-1705752069446-3WFM0S",
        "amount": 100,
        "currency": "KES",
        "description": "Product Purchase",
        "status": "COMPLETED",
        "paymentMethod": "Mpesa",
        "customer": {
          "firstName": "John",
          "lastName": "Doe",
          "phone": "0700123456"
        },
        "createdAt": "2024-01-15T10:25:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 25
    }
  }
}
```

### 5. PesaPal Callback

Handle payment callbacks from PesaPal (internal use).

**Endpoint:** `GET /pesapal/callback`

**Query Parameters:**
- `OrderTrackingId`: PesaPal order tracking ID
- `OrderMerchantReference`: Merchant reference
- `OrderNotificationType`: Notification type

This endpoint automatically redirects to your frontend with payment results.

### 6. PesaPal IPN

Handle Instant Payment Notifications from PesaPal (internal use).

**Endpoint:** `POST /pesapal/ipn`

**Request Body:**
```json
{
  "OrderTrackingId": "70a28461-2b39-4b5a-b6f0-db8f412a1ca0",
  "OrderMerchantReference": "PAY-1705752069446-3WFM0S",
  "OrderNotificationType": "IPNCHANGE"
}
```

### 7. Test Endpoint

Test PesaPal service connectivity (development only).

**Endpoint:** `GET /test`

**Response:**
```json
{
  "success": true,
  "message": "PesaPal service test successful",
  "data": {
    "authenticated": true,
    "tokenExpiry": "2024-01-15T10:35:00.000Z",
    "ipnId": "12345",
    "environment": "Sandbox",
    "baseURL": "https://cybqa.pesapal.com/pesapalv3/api"
  }
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

**Common HTTP Status Codes:**
- `400`: Bad Request - Invalid input data
- `401`: Unauthorized - Authentication failed
- `404`: Not Found - Resource not found
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error - Server error

## Webhooks

### Payment Status Updates

When payment status changes, the system automatically:

1. Updates the payment record in file storage
2. Calls your frontend callback URL with status
3. Logs the status change

### IPN Processing

PesaPal sends IPN notifications for:
- Payment completion
- Payment failure
- Payment reversal

## SDK Usage Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

// Initialize payment
const initializePayment = async (paymentData) => {
  try {
    const response = await axios.post('/api/payments/initialize', paymentData);
    return response.data;
  } catch (error) {
    console.error('Payment initialization failed:', error.response.data);
    throw error;
  }
};

// Check payment status
const checkPaymentStatus = async (merchantReference) => {
  try {
    const response = await axios.get(`/api/payments/${merchantReference}/status`);
    return response.data;
  } catch (error) {
    console.error('Status check failed:', error.response.data);
    throw error;
  }
};
```

### cURL Examples

```bash
# Initialize payment
curl -X POST http://localhost:3000/api/payments/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "description": "Test Payment",
    "customerPhone": "0700123456",
    "firstName": "John",
    "lastName": "Doe"
  }'

# Check payment status
curl -X GET http://localhost:3000/api/payments/PAY-1705752069446-3WFM0S/status

# Get payment statistics
curl -X GET http://localhost:3000/api/payments/stats

# Get payment history
curl -X GET "http://localhost:3000/api/payments/history?page=1&limit=10"
```

## Best Practices

1. **Always validate input** before sending to the API
2. **Handle errors gracefully** with proper user feedback
3. **Check payment status** after user returns from PesaPal
4. **Store merchant references** for future status checks
5. **Implement retry logic** for failed requests
6. **Use HTTPS** in production environments
7. **Monitor rate limits** to avoid blocking

## Security Considerations

1. **Input Validation**: All inputs are validated server-side
2. **Rate Limiting**: Prevents abuse and DoS attacks
3. **CORS**: Configure allowed origins properly
4. **Error Handling**: Sensitive information is not exposed
5. **Logging**: All transactions are logged for audit trails

## Support

For API support and questions:
- Check the main README.md for general setup
- Review examples in the `/examples` directory
- Open an issue on GitHub for bugs or feature requests
