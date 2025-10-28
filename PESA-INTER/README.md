# PESA-INTER 💳

**Complete PesaPal Payment Integration Package for Node.js and React Applications**

A production-ready, reusable package for integrating PesaPal payments into your web applications. Supports M-Pesa, credit cards, and other mobile money services across Kenya and East Africa.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/your-username/pesa-inter)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-%3E%3D18.0.0-blue.svg)](https://reactjs.org/)

## ✨ Features

- 🚀 **Production Ready** - Battle-tested PesaPal API 3.0 integration
- 💳 **Multiple Payment Methods** - M-Pesa, Visa, Mastercard, Airtel Money, T-Kash
- 🔒 **Secure** - Built-in security headers, rate limiting, and validation
- 📱 **Mobile Optimized** - Responsive design with mobile-first approach
- 🎨 **Customizable** - Flexible theming and configuration options
- 📊 **File Storage** - Automatic payment record storage with JSON files
- 🔄 **Real-time Updates** - IPN and callback handling for status updates
- 🛠 **Developer Friendly** - TypeScript support and comprehensive documentation
- 🌍 **Framework Agnostic** - Works with any Node.js backend and React frontend

## 🚀 Quick Start

### 1. Installation

```bash
# Clone the package
git clone https://github.com/your-username/pesa-inter.git
cd pesa-inter

# Install dependencies
npm run install:all
```

### 2. Configuration

```bash
# Copy environment template
cp config/.env.example .env

# Edit your configuration
nano .env
```

**Required Environment Variables:**
```env
BUSINESS_NAME=Your Business Name
PESAPAL_CONSUMER_KEY=your_pesapal_consumer_key
PESAPAL_CONSUMER_SECRET=your_pesapal_consumer_secret
PESAPAL_ENVIRONMENT=production  # or 'sandbox' for testing
FRONTEND_URL=http://localhost:3000
CALLBACK_BASE_URL=http://localhost:3000
```

### 3. Backend Integration

```javascript
const express = require('express');
const createPaymentRoutes = require('./backend/routes/payments');

const app = express();

// Configure PESA-INTER
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
  console.log('Server running with PESA-INTER integration');
});
```

### 4. Frontend Integration

```tsx
import React from 'react';
import PaymentForm from './frontend/components/PaymentForm';

const App = () => {
  const handlePaymentSuccess = (data) => {
    console.log('Payment successful:', data);
  };

  const handlePaymentError = (error) => {
    console.error('Payment failed:', error);
  };

  return (
    <PaymentForm
      onSuccess={handlePaymentSuccess}
      onError={handlePaymentError}
      defaultAmount={100}
      defaultDescription="Product Purchase"
      businessName="My Store"
      apiBaseUrl="/api"
    />
  );
};

export default App;
```

## 📚 Documentation

### Backend API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/payments/initialize` | Initialize a new payment |
| `GET` | `/api/payments/:ref/status` | Get payment status |
| `GET` | `/api/payments/stats` | Get payment statistics |
| `GET` | `/api/payments/history` | Get payment history |
| `GET` | `/api/payments/pesapal/callback` | PesaPal callback handler |
| `POST` | `/api/payments/pesapal/ipn` | PesaPal IPN handler |

### Payment Initialization

```javascript
// POST /api/payments/initialize
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

### Response Format

```javascript
{
  "success": true,
  "message": "Payment initialized successfully",
  "data": {
    "merchantReference": "PAY-1234567890-ABC123",
    "orderTrackingId": "uuid-tracking-id",
    "redirectURL": "https://pay.pesapal.com/iframe/...",
    "amount": 100,
    "currency": "KES",
    "description": "Product Purchase"
  }
}
```

## 🎨 Frontend Components

### PaymentForm Component

```tsx
<PaymentForm
  onSuccess={(data) => console.log('Success:', data)}
  onError={(error) => console.error('Error:', error)}
  defaultAmount={100}
  defaultDescription="Payment for services"
  businessName="My Business"
  apiBaseUrl="/api"
  theme="dark" // or "light"
  currency="KES"
/>
```

### PaymentPage Component

```tsx
<PaymentPage
  businessName="My Business"
  apiBaseUrl="/api"
  theme="dark"
  onPaymentSuccess={(data) => handleSuccess(data)}
  onPaymentError={(error) => handleError(error)}
  showHeader={true}
  showFooter={true}
/>
```

## 🔧 Configuration Options

### Backend Configuration

```javascript
const config = {
  // Business settings
  businessName: 'Your Business',
  frontendURL: 'http://localhost:3000',
  callbackBaseURL: 'http://localhost:3000',
  
  // PesaPal settings
  consumerKey: 'your_consumer_key',
  consumerSecret: 'your_consumer_secret',
  environment: 'production', // or 'sandbox'
  
  // Storage settings
  enableFileStorage: true,
  enableDatabase: false,
  paymentDir: 'Payment',
  
  // Logging settings
  logger: customLogger,
  debug: false
};
```

### Frontend Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onSuccess` | `function` | - | Called when payment succeeds |
| `onError` | `function` | - | Called when payment fails |
| `defaultAmount` | `number` | `1` | Default payment amount |
| `businessName` | `string` | `'Your Business'` | Business name display |
| `apiBaseUrl` | `string` | `'/api'` | Backend API base URL |
| `theme` | `'dark' \| 'light'` | `'dark'` | UI theme |
| `currency` | `string` | `'KES'` | Payment currency |

## 💾 Payment Storage

PESA-INTER automatically stores payment records as JSON files with the naming convention:
```
[DATE]_[PAYER_NAME]_[TRANSACTION_TYPE]_[SERVICE].json
```

Example:
```
2024-01-15_john_doe_mpesa_product_purchase.json
```

### Payment Record Structure

```json
{
  "savedAt": "2024-01-15T10:30:00.000Z",
  "filename": "2024-01-15_john_doe_mpesa_product_purchase.json",
  "businessName": "My Business",
  "merchantReference": "PAY-1234567890-ABC123",
  "orderTrackingId": "uuid-tracking-id",
  "amount": 100,
  "currency": "KES",
  "description": "Product Purchase",
  "status": "COMPLETED",
  "customer": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "0700123456"
  },
  "paymentMethod": "MPESA",
  "transactionType": "mpesa",
  "pesapalData": {
    "paymentMethod": "Mpesa",
    "confirmationCode": "ABC123XYZ",
    "paymentAccount": "254700******56"
  },
  "createdAt": "2024-01-15T10:25:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

## 🔒 Security Features

- **Rate Limiting** - Prevents abuse with configurable limits
- **Input Validation** - Comprehensive validation for all inputs
- **Security Headers** - Helmet.js integration for security headers
- **CORS Protection** - Configurable CORS policies
- **Error Handling** - Secure error messages without sensitive data exposure

## 🧪 Testing

### Development Testing

```bash
# Start backend in development mode
npm run dev:backend

# Test the integration
curl -X GET http://localhost:3000/api/payments/test
```

### Live Payment Testing

1. Set up your PesaPal credentials
2. Use sandbox environment for testing
3. Test with small amounts (1 KES recommended)
4. Verify M-Pesa STK push functionality
5. Check payment status updates

## 📱 Supported Payment Methods

- **M-Pesa** - Safaricom STK Push
- **Airtel Money** - Airtel mobile money
- **T-Kash** - Telkom mobile money
- **Visa Cards** - Credit and debit cards
- **Mastercard** - Credit and debit cards
- **Other Mobile Money** - Various East African providers

## 🌍 Supported Countries

- 🇰🇪 Kenya
- 🇺🇬 Uganda
- 🇹🇿 Tanzania
- 🇷🇼 Rwanda
- 🇧🇮 Burundi

## 📋 Requirements

- **Node.js** >= 16.0.0
- **npm** >= 8.0.0
- **React** >= 18.0.0 (for frontend components)
- **PesaPal Account** with API credentials

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 Email: support@pesa-inter.com
- 📖 Documentation: [docs.pesa-inter.com](https://docs.pesa-inter.com)
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/pesa-inter/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/your-username/pesa-inter/discussions)

## 🙏 Acknowledgments

- [PesaPal](https://pesapal.com) for their payment gateway services
- [Safaricom](https://safaricom.co.ke) for M-Pesa integration
- The open-source community for inspiration and tools

---

## 🚀 Getting Started Examples

Check out the `/examples` directory for complete implementation examples:

- `backend-express.js` - Complete Express.js server setup
- `react-app.tsx` - React application integration examples
- See `/docs` for detailed API documentation

## 📁 Project Structure

```
PESA-INTER/
├── backend/                 # Backend services and API
│   ├── controllers/         # Payment controllers
│   ├── routes/             # Express routes
│   ├── services/           # PesaPal and storage services
│   ├── utils/              # Utilities and helpers
│   └── package.json        # Backend dependencies
├── frontend/               # React components
│   ├── components/         # Payment form components
│   ├── pages/             # Complete payment pages
│   ├── types/             # TypeScript definitions
│   └── package.json       # Frontend dependencies
├── config/                # Configuration templates
│   └── .env.example       # Environment variables template
├── docs/                  # Documentation
├── examples/              # Usage examples
└── README.md             # This file
```

**Made with ❤️ for the East African developer community**
