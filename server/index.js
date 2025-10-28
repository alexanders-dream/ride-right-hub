import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Initialize SQLite database
const dbPath = path.join(process.cwd(), 'ride-right-hub.db');
const db = new Database(dbPath);

// Enable foreign keys and WAL mode
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

console.log('✅ Database initialized successfully');

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Authentication endpoints
app.post('/api/auth/register', (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    
    // Validate required fields
    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if user already exists
    const checkStmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const existingUser = checkStmt.get(email);
    
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Create user (in a real app, you'd hash the password)
    const stmt = db.prepare(`
      INSERT INTO users 
      (id, email, password_hash, name, role, email_verified, created_at, updated_at)
      VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    
    const result = stmt.run(email, password, name, role);
    
    // Get the created user
    const getStmt = db.prepare('SELECT id, email, name, role FROM users WHERE rowid = ?');
    const user = getStmt.get(result.lastInsertRowid);
    
    console.log('User registered successfully:', user.email);
    res.json({ 
      user,
      token: 'jwt-token-placeholder' // In a real app, generate JWT token
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Find user and verify password
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const user = stmt.get(email);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // In a real app, you'd verify the hashed password
    // For now, we'll do a simple comparison
    if (user.password_hash !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Update last login
    const updateStmt = db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?');
    updateStmt.run(user.id);
    
    // Return user without password
    const { password_hash, ...userWithoutPassword } = user;
    
    console.log('User logged in successfully:', user.email);
    res.json({ 
      user: userWithoutPassword,
      token: 'jwt-token-placeholder' // In a real app, generate JWT token
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Get user listings
app.get('/api/listings/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const stmt = db.prepare('SELECT * FROM listings WHERE user_id = ? ORDER BY created_at DESC');
    const listings = stmt.all(userId);
    
    res.json({ listings });
  } catch (error) {
    console.error('Error fetching user listings:', error);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

// Create listing
app.post('/api/listings', (req, res) => {
  try {
    const { userId, title, description, year, make, model, price, mileage, engineSize, color, location, sellerType } = req.body;
    
    // Validate required fields
    if (!userId || !title || !description || !year || !make || !model || 
        price === undefined || mileage === undefined || engineSize === undefined || 
        !location || !sellerType) {
      console.error('Missing required fields:', { 
        userId: !!userId, 
        title: !!title, 
        description: !!description, 
        year: !!year, 
        make: !!make, 
        model: !!model, 
        price: price !== undefined, 
        mileage: mileage !== undefined, 
        engineSize: engineSize !== undefined, 
        color: !!color, 
        location: !!location, 
        sellerType: !!sellerType 
      });
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Validate data types
    if (isNaN(parseInt(year)) || isNaN(parseFloat(price)) || 
        isNaN(parseInt(mileage)) || isNaN(parseInt(engineSize))) {
      console.error('Invalid data types:', { year, price, mileage, engineSize });
      return res.status(400).json({ error: 'Invalid data types' });
    }
    
    const stmt = db.prepare(`
      INSERT INTO listings 
      (id, user_id, title, description, year, make, model, price, mileage, engine_size, color, location, seller_type, status, created_at, updated_at)
      VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    
    const result = stmt.run(
      userId, 
      title, 
      description, 
      parseInt(year), 
      make, 
      model, 
      parseFloat(price), 
      parseInt(mileage), 
      parseInt(engineSize), 
      color || null, 
      location, 
      sellerType
    );
    
    // Get the created listing
    const getStmt = db.prepare('SELECT * FROM listings WHERE rowid = ?');
    const listing = getStmt.get(result.lastInsertRowid);
    
    console.log('Listing created successfully:', listing.id);
    res.json({ listing });
  } catch (error) {
    console.error('Error creating listing:', error);
    res.status(500).json({ error: 'Failed to create listing', details: error.message });
  }
});

// Delete listing
app.delete('/api/listings/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM listings WHERE id = ?');
    stmt.run(id);
    
    res.json({ message: 'Listing deleted successfully' });
  } catch (error) {
    console.error('Error deleting listing:', error);
    res.status(500).json({ error: 'Failed to delete listing' });
  }
});

// Search listings
app.get('/api/listings', (req, res) => {
  try {
    const { make, minPrice, maxPrice, page = 1, limit = 10 } = req.query;
    
    let query = "SELECT * FROM listings WHERE status = 'active'";
    const params = [];
    
    if (make) {
      query += ' AND make = ?';
      params.push(make);
    }
    
    if (minPrice) {
      query += ' AND price >= ?';
      params.push(parseFloat(minPrice));
    }
    
    if (maxPrice) {
      query += ' AND price <= ?';
      params.push(parseFloat(maxPrice));
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit), offset);
    
    const stmt = db.prepare(query);
    const listings = stmt.all(...params);
    
    // Count total for pagination
    let countQuery = "SELECT COUNT(*) as count FROM listings WHERE status = 'active'";
    const countParams = [];
    
    if (make) {
      countQuery += ' AND make = ?';
      countParams.push(make);
    }
    
    if (minPrice) {
      countQuery += ' AND price >= ?';
      countParams.push(parseFloat(minPrice));
    }
    
    if (maxPrice) {
      countQuery += ' AND price <= ?';
      countParams.push(parseFloat(maxPrice));
    }
    
    const countStmt = db.prepare(countQuery);
    const totalResult = countStmt.get(...countParams);
    const totalCount = totalResult.count;
    
    res.json({
      listings,
      totalCount,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / parseInt(limit))
    });
  } catch (error) {
    console.error('Error searching listings:', error);
    res.status(500).json({ error: 'Failed to search listings' });
  }
});

// Get listing by ID
app.get('/api/listings/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('SELECT * FROM listings WHERE id = ?');
    const listing = stmt.get(id);
    
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    
    res.json({ listing });
  } catch (error) {
    console.error('Error fetching listing:', error);
    res.status(500).json({ error: 'Failed to fetch listing' });
  }
});

// Payment endpoints
app.post('/api/payments/initiate', async (req, res) => {
  try {
    const { userId, amount, currency, paymentMethod, customerDetails, billingAddress } = req.body;
    
    // Validate required fields
    if (!userId || !amount || !currency || !paymentMethod || !customerDetails) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // For M-Pesa payments, validate phone number
    if (paymentMethod === 'mpesa' && (!customerDetails.phone || !customerDetails.phone.startsWith('+254'))) {
      return res.status(400).json({ error: 'Valid Kenyan phone number (+254XXXXXXXXX) is required for M-Pesa payments' });
    }
    
    // Check if user exists (for foreign key constraint)
    const userCheckStmt = db.prepare('SELECT id FROM users WHERE id = ?');
    const user = userCheckStmt.get(userId);
    
    if (!user) {
      return res.status(400).json({ error: 'User not found. Please log in again.' });
    }
    
    // Generate a payment ID
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create payment record in database
    const stmt = db.prepare(`
      INSERT INTO payments 
      (id, user_id, amount, currency, status, payment_method, transaction_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'pending', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    
    const transactionId = `pesapal_${Date.now()}`;
    stmt.run(paymentId, userId, amount, currency, paymentMethod, transactionId);
    
    let redirectUrl = null;
    let paymentStatus = 'pending';
    
    // Handle different payment methods
    if (paymentMethod === 'mpesa' || paymentMethod === 'pesapal') {
      try {
        // For now, simulate successful payment initiation
        // In production, this would call the actual PesaPal API
        console.log(`Simulating payment initiation: ${paymentId}, Amount: ${amount} ${currency}, Method: ${paymentMethod}`);
        
        if (paymentMethod === 'mpesa') {
          console.log(`✅ M-Pesa STK push would be sent to: ${customerDetails.phone}`);
          paymentStatus = 'stk_push_sent';
        } else {
          redirectUrl = 'https://sandbox.pesapal.com/payment-url-placeholder';
          console.log(`✅ PesaPal payment initiated: ${paymentId}, Redirect URL: ${redirectUrl}`);
        }
        
      } catch (paymentError) {
        console.error('Payment initiation error:', paymentError);
        return res.status(500).json({ error: 'Failed to initiate payment with payment provider' });
      }
    }
    
    console.log(`Payment initiated: ${paymentId}, Amount: ${amount} ${currency}, Method: ${paymentMethod}, Status: ${paymentStatus}`);
    
    res.json({
      payment: {
        id: paymentId,
        userId,
        amount,
        currency,
        status: paymentStatus,
        paymentMethod,
        transactionId
      },
      redirectUrl
    });
  } catch (error) {
    console.error('Error initiating payment:', error);
    res.status(500).json({ error: error.message || 'Failed to initiate payment' });
  }
});

// PesaPal callback endpoints
app.get('/api/payments/pesapal/callback', (req, res) => {
  try {
    const { OrderTrackingId, OrderMerchantReference, OrderNotificationType } = req.query;
    
    console.log('🔄 PesaPal callback received:', {
      OrderTrackingId,
      OrderMerchantReference,
      OrderNotificationType
    });

    // Update payment status in database
    if (OrderMerchantReference) {
      const updateStmt = db.prepare('UPDATE payments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
      updateStmt.run('completed', OrderMerchantReference);
    }

    // Redirect to frontend with payment status
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    const redirectUrl = `${frontendUrl}/payment/status?orderTrackingId=${OrderTrackingId}&merchantReference=${OrderMerchantReference}`;
    
    console.log('🔀 Redirecting to frontend:', redirectUrl);
    res.redirect(redirectUrl);
    
  } catch (error) {
    console.error('❌ PesaPal callback error:', error);
    
    // Fallback redirect on error
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    res.redirect(`${frontendUrl}/payment/error`);
  }
});

// PesaPal cancellation endpoint
app.get('/api/payments/pesapal/cancelled', (req, res) => {
  try {
    const { OrderTrackingId, OrderMerchantReference } = req.query;
    
    console.log('❌ Payment cancelled by user:', {
      OrderTrackingId,
      OrderMerchantReference
    });

    // Update payment status to cancelled
    if (OrderMerchantReference) {
      const updateStmt = db.prepare('UPDATE payments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
      updateStmt.run('cancelled', OrderMerchantReference);
    }

    // Redirect to frontend cancellation page
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    const redirectUrl = `${frontendUrl}/payment/cancelled?orderTrackingId=${OrderTrackingId}&merchantReference=${OrderMerchantReference}`;
    
    console.log('🔀 Redirecting to cancellation page:', redirectUrl);
    res.redirect(redirectUrl);
    
  } catch (error) {
    console.error('❌ PesaPal cancellation error:', error);
    
    // Fallback redirect on error
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    res.redirect(`${frontendUrl}/payment/cancelled`);
  }
});

// PesaPal IPN callback endpoint
app.post('/api/payments/pesapal/ipn', (req, res) => {
  try {
    console.log('📨 Received PesaPal IPN callback');
    
    // PesaPal sends IPN data as form-urlencoded
    const ipnData = req.body;
    
    console.log('IPN Data:', ipnData);
    
    // Process the IPN callback
    // In production, you would validate the IPN and update payment status
    
    // Always return 200 OK to PesaPal, even if processing fails
    res.status(200).json({ 
      status: 'success', 
      message: 'IPN received successfully'
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

// Get payment status
app.get('/api/payments/pesapal/status/:orderTrackingId', (req, res) => {
  try {
    const { orderTrackingId } = req.params;
    
    const stmt = db.prepare('SELECT * FROM payments WHERE transaction_id = ?');
    const payment = stmt.get(orderTrackingId);
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    res.json({ 
      status: {
        order_tracking_id: payment.transaction_id,
        payment_method: payment.payment_method,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        created_at: payment.created_at
      }
    });
  } catch (error) {
    console.error('Error fetching payment status:', error);
    res.status(500).json({ error: 'Failed to fetch payment status' });
  }
});

// Get user payments
app.get('/api/payments/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const stmt = db.prepare('SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC');
    const payments = stmt.all(userId);
    
    res.json({ payments });
  } catch (error) {
    console.error('Error fetching user payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
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
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  db.close();
  process.exit(0);
});
