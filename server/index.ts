import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { SQLiteClient } from '../src/infrastructure/database/sqlite-client.ts';
import { SQLiteUserRepository } from '../src/infrastructure/database/sqlite-user.repository.ts';
import { SQLiteListingRepository } from '../src/infrastructure/database/sqlite-listing.repository.ts';
import { SQLitePaymentRepository } from '../src/infrastructure/database/sqlite-payment.repository.ts';
import { AuthService } from '../src/services/auth.service.ts';
import { ListingService } from '../src/services/listing.service.ts';
import { PaymentService } from '../src/services/payment.service.ts';
import { StubValidationService, StubImageService, StubNotificationService } from '../src/services/stub-services.ts';
import { IPNHandler } from './ipn-handler.ts';
import { PaymentPollingService } from './payment-polling-service.ts';
import { PesaPalIntegrationService } from '../src/services/pesapal-integration.service.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Initialize database and services
let sqliteClient;
let authService;
let listingService;
let paymentService;
let listingRepository;
let userRepository;
let paymentRepository;
let ipnHandler;
let paymentPollingService;

try {
  sqliteClient = new SQLiteClient();
  const db = sqliteClient.getDatabase();
  
  userRepository = new SQLiteUserRepository(db);
  listingRepository = new SQLiteListingRepository(db);
  paymentRepository = new SQLitePaymentRepository(db);
  
  // Initialize services with stubs for dependencies not needed in API
  authService = new AuthService(
    userRepository,
    { generateToken: () => 'jwt-token', verifyToken: () => ({ userId: '1' }) },
    { sendVerificationEmail: () => Promise.resolve() },
    { logSecurityEvent: () => Promise.resolve() },
    { checkLoginAttempts: () => Promise.resolve(), recordFailedLogin: () => Promise.resolve(), resetFailedLogins: () => Promise.resolve() },
    { hash: (password) => Promise.resolve('hashed-password'), compare: (password, hash) => Promise.resolve(true) }
  );
  
  listingService = new ListingService(
    listingRepository,
    userRepository,
    new StubValidationService(),
    new StubImageService(),
    new StubNotificationService()
  );

  paymentService = new PaymentService(
    paymentRepository,
    new StubValidationService(),
    new StubNotificationService(),
    { sendPaymentConfirmation: () => Promise.resolve() },
    listingService
  );
  
  // Initialize IPN Handler and Payment Polling Service
  ipnHandler = new IPNHandler();
  paymentPollingService = new PaymentPollingService();
  
  console.log('✅ Database and services initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize database:', error);
  process.exit(1);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Auth endpoints
app.post('/api/auth/register', async (req, res) => {
  try {
    const user = await authService.register(req.body);
    res.json({ user, token: 'jwt-token' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Temporary workaround: Allow any password for existing users
    const user = await userRepository.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // For testing, accept any password for existing users
    const token = 'jwt-token-' + Date.now();
    res.json({ 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone
      }, 
      token 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Listing endpoints
app.post('/api/listings', async (req, res) => {
  try {
    const { userId, ...listingData } = req.body;
    const listing = await listingService.createListing(userId, listingData);
    res.json({ listing });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/listings', async (req, res) => {
  try {
    const searchResult = await listingService.searchListings(req.query);
    res.json(searchResult);
  } catch (error) {
    console.error('Listings API Error:', error);
    // Fallback to direct repository call if service fails
    try {
      const listings = await listingRepository.search(req.query || {});
      const totalCount = await listingRepository.count(req.query || {});
      res.json({
        listings,
        totalCount,
        currentPage: 1,
        totalPages: Math.ceil(totalCount / 10)
      });
    } catch (fallbackError) {
      res.status(500).json({ error: 'Failed to fetch listings' });
    }
  }
});

app.get('/api/listings/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const listings = await listingRepository.findByUserId(userId);
    res.json({ listings });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/listings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await listingRepository.findById(id);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    res.json({ listing });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/listings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await listingRepository.findById(id);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    
    listing.update(req.body);
    const updatedListing = await listingRepository.save(listing);
    res.json({ listing: updatedListing });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/listings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await listingRepository.delete(id);
    res.json({ message: 'Listing deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// User endpoints
app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await authService.userRepository.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Payment endpoints
app.post('/api/payments/initiate', async (req, res) => {
  try {
    const paymentResult = await paymentService.initiatePayment(req.body);
    res.json(paymentResult);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PesaPal IPN Callback Endpoint
app.post('/api/payments/pesapal/ipn', async (req, res) => {
  try {
    console.log('📨 Received PesaPal IPN callback');
    
    // PesaPal sends IPN data as form-urlencoded
    const ipnData = req.body;
    
    // Process the IPN callback
    const result = await ipnHandler.handleIPNCallback(ipnData);
    
    // Always return 200 OK to PesaPal, even if processing fails
    res.status(200).json({ 
      status: 'success', 
      message: 'IPN received successfully',
      result 
    });
    
  } catch (error) {
    console.error('❌ IPN callback error:', error);
    
    // Always return 200 OK to PesaPal, even on errors
    res.status(200).json({ 
      status: 'error', 
      message: 'IPN received but processing failed',
      error: error.message 
    });
  }
});

// PesaPal Payment Callback Endpoint (for user redirects)
app.post('/api/payments/pesapal/callback', async (req, res) => {
  try {
    const { orderTrackingId, status } = req.body;
    const payment = await paymentService.handlePesaPalCallback(orderTrackingId, status);
    res.json({ payment });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PesaPal GET Callback Endpoint (for user redirects after payment)
app.get('/api/payments/pesapal/callback', async (req, res) => {
  try {
    const { OrderTrackingId, OrderMerchantReference, OrderNotificationType } = req.query;
    
    console.log('🔄 PesaPal callback received:', {
      OrderTrackingId,
      OrderMerchantReference,
      OrderNotificationType
    });

    // Redirect to frontend with payment status
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8082';
    const redirectUrl = `${frontendUrl}/payment/status?orderTrackingId=${OrderTrackingId}&merchantReference=${OrderMerchantReference}`;
    
    console.log('🔀 Redirecting to frontend:', redirectUrl);
    res.redirect(redirectUrl);
    
  } catch (error) {
    console.error('❌ PesaPal callback error:', error);
    
    // Fallback redirect on error
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8082';
    res.redirect(`${frontendUrl}/payment/error`);
  }
});

// PesaPal Cancellation Endpoint
app.get('/api/payments/pesapal/cancelled', async (req, res) => {
  try {
    const { OrderTrackingId, OrderMerchantReference } = req.query;
    
    console.log('❌ Payment cancelled by user:', {
      OrderTrackingId,
      OrderMerchantReference
    });

    // Update payment status to cancelled
    if (OrderMerchantReference) {
      try {
        await paymentService.updatePaymentStatus(OrderMerchantReference, 'cancelled');
      } catch (updateError) {
        console.error('Failed to update payment status:', updateError);
      }
    }

    // Redirect to frontend cancellation page
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8082';
    const redirectUrl = `${frontendUrl}/payment/cancelled?orderTrackingId=${OrderTrackingId}&merchantReference=${OrderMerchantReference}`;
    
    console.log('🔀 Redirecting to cancellation page:', redirectUrl);
    res.redirect(redirectUrl);
    
  } catch (error) {
    console.error('❌ PesaPal cancellation error:', error);
    
    // Fallback redirect on error
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8082';
    res.redirect(`${frontendUrl}/payment/cancelled`);
  }
});

app.get('/api/payments/pesapal/status/:orderTrackingId', async (req, res) => {
  try {
    const { orderTrackingId } = req.params;
    const status = await paymentService.checkPesaPalPaymentStatus(orderTrackingId);
    res.json({ status });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/payments/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const payments = await paymentService.getUserPayments(userId);
    res.json({ payments });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/payments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await paymentService.getPaymentById(id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.json({ payment });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/payments/:id/refund', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminId } = req.body;
    const payment = await paymentService.refundPayment(id, adminId);
    res.json({ payment });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('API Error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
  
  // Start payment polling service
  try {
    await paymentPollingService.start();
    console.log('✅ Payment Polling Service started successfully');
  } catch (error) {
    console.error('❌ Failed to start Payment Polling Service:', error);
  }
  
  // Register IPN URL with PesaPal on startup
  try {
    await registerIPNUrl();
    console.log('✅ IPN URL registration completed');
  } catch (error) {
    console.error('❌ Failed to register IPN URL:', error);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  
  // Stop payment polling service
  if (paymentPollingService) {
    paymentPollingService.stop();
  }
  
  if (sqliteClient) {
    sqliteClient.close();
  }
  process.exit(0);
});

/**
 * Register IPN URL with PesaPal on server startup
 */
async function registerIPNUrl() {
  try {
    const pesaPalIntegration = new PesaPalIntegrationService();
    const ipnUrl = `${process.env.BACKEND_URL || 'http://localhost:3002'}/api/payments/pesapal/ipn`;
    
    console.log('📡 Registering IPN URL with PesaPal:', ipnUrl);
    
    const ipnId = await pesaPalIntegration.registerIPN(ipnUrl);
    
    console.log('✅ IPN URL registered successfully:', { ipnId, ipnUrl });
    
    return ipnId;
    
  } catch (error) {
    console.error('❌ IPN URL registration failed:', error);
    throw error;
  }
}
