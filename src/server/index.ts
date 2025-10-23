import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'moto-market-secret-key-change-in-production';

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || ['http://localhost:5173', 'http://localhost:8080'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Authentication middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  phone: z.string().optional(),
  role: z.enum(['BUYER', 'SELLER', 'DEALER', 'ADMIN', 'BOTH']).optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

const listingSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  price: z.number().positive(),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  make: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
  mileage: z.number().int().min(0),
  engineSize: z.number().int().min(0).optional(),
  transmission: z.enum(['MANUAL', 'AUTOMATIC', 'SEMI_AUTOMATIC', 'CVT']).optional(),
  fuelType: z.enum(['GASOLINE', 'DIESEL', 'ELECTRIC', 'HYBRID']).optional(),
  color: z.string().max(50).optional(),
  condition: z.string().min(1).max(100),
  vin: z.string().max(17).optional(),
  location: z.string().min(1).max(200),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional()
});

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Authentication routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validatedData.email },
          { username: validatedData.username }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: 'User with this email or username already exists' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        username: validatedData.username,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        phone: validatedData.phone,
        role: validatedData.role === 'BOTH' ? 'DEALER' : validatedData.role || 'BUYER'
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        isVerified: true,
        createdAt: true
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user,
      token
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(validatedData.password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isVerified: user.isVerified
      },
      token
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User routes
app.get('/api/users/profile', authenticateToken, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            listings: true,
            favorites: true,
            cartItems: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Listing routes
app.get('/api/listings', async (req, res) => {
  try {
    const {
      page = '1',
      limit = '12',
      search,
      make,
      model,
      minPrice,
      maxPrice,
      minYear,
      maxYear,
      minMileage,
      maxMileage,
      transmission,
      fuelType,
      location,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = { status: 'ACTIVE' };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { make: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (make) where.make = { contains: make, mode: 'insensitive' };
    if (model) where.model = { contains: model, mode: 'insensitive' };
    if (transmission) where.transmission = transmission;
    if (fuelType) where.fuelType = fuelType;
    if (location) where.location = { contains: location, mode: 'insensitive' };

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice as string);
      if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
    }

    if (minYear || maxYear) {
      where.year = {};
      if (minYear) where.year.gte = parseInt(minYear as string);
      if (maxYear) where.year.lte = parseInt(maxYear as string);
    }

    if (minMileage || maxMileage) {
      where.mileage = {};
      if (minMileage) where.mileage.gte = parseInt(minMileage as string);
      if (maxMileage) where.mileage.lte = parseInt(maxMileage as string);
    }

    // Build order by
    const orderBy: any = {};
    orderBy[sortBy as string] = sortOrder as 'asc' | 'desc';

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
        include: {
          seller: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              role: true,
              isVerified: true
            }
          },
          _count: {
            select: {
              favorites: true
            }
          }
        }
      }),
      prisma.listing.count({ where })
    ]);

    res.json({
      listings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Listings fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/api/listings/:id/views', async (req, res) => {
  try {
    const { id } = req.params;
    
    // This is now a no-op since views are automatically updated when fetching a listing
    // We still return success to maintain API compatibility
    res.json({ message: 'View count updated' });
  } catch (error) {
    console.error('Views update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/listings/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            role: true,
            isVerified: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            favorites: true
          }
        }
      }
    });

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    // Increment view count
    await prisma.listing.update({
      where: { id },
      data: { views: { increment: 1 } }
    });

    res.json(listing);
  } catch (error) {
    console.error('Listing fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/listings', authenticateToken, upload.array('images', 10), async (req: any, res) => {
  try {
    const validatedData = listingSchema.parse(JSON.parse(req.body.data || '{}'));
    
    // Check user role
    if (!['SELLER', 'DEALER', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only sellers, dealers, and admins can create listings' });
    }

    // Process uploaded images
    const images = req.files ? (req.files as Express.Multer.File[]).map(file => 
      `/uploads/${file.filename}`
    ) : [];

    const listing = await prisma.listing.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        price: validatedData.price,
        year: validatedData.year,
        make: validatedData.make,
        model: validatedData.model,
        mileage: validatedData.mileage,
        engineSize: validatedData.engineSize,
        transmission: validatedData.transmission,
        fuelType: validatedData.fuelType,
        color: validatedData.color,
        condition: validatedData.condition,
        vin: validatedData.vin,
        location: validatedData.location,
        latitude: validatedData.latitude,
        longitude: validatedData.longitude,
        sellerId: req.user.userId as string,
        images,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            role: true,
            isVerified: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Listing created successfully',
      listing
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Listing creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Favorites routes
app.get('/api/favorites', authenticateToken, async (req: any, res) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user.userId },
      include: {
        listing: {
          include: {
            seller: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                role: true,
                isVerified: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(favorites);
  } catch (error) {
    console.error('Favorites fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/favorites/:listingId', authenticateToken, async (req: any, res) => {
  try {
    const { listingId } = req.params;

    // Check if listing exists
    const listing = await prisma.listing.findUnique({
      where: { id: listingId }
    });

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    // Check if already favorited
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_listingId: {
          userId: req.user.userId,
          listingId
        }
      }
    });

    if (existingFavorite) {
      return res.status(400).json({ error: 'Listing already in favorites' });
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId: req.user.userId,
        listingId
      }
    });

    res.status(201).json({ message: 'Added to favorites', favorite });
  } catch (error) {
    console.error('Favorite creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/favorites/:listingId', authenticateToken, async (req: any, res) => {
  try {
    const { listingId } = req.params;

    await prisma.favorite.delete({
      where: {
        userId_listingId: {
          userId: req.user.userId,
          listingId
        }
      }
    });

    res.json({ message: 'Removed from favorites' });
  } catch (error) {
    console.error('Favorite deletion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cart routes
app.get('/api/cart', authenticateToken, async (req: any, res) => {
  try {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: req.user.userId },
      include: {
        listing: {
          include: {
            seller: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                role: true,
                isVerified: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(cartItems);
  } catch (error) {
    console.error('Cart fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cart routes
app.post('/api/cart', authenticateToken, async (req: any, res) => {
  try {
    const { listingId } = req.body;

    if (!listingId) {
      return res.status(400).json({ error: 'Listing ID is required' });
    }

    // Check if listing exists and is active
    const listing = await prisma.listing.findUnique({
      where: { id: listingId }
    });

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Listing is not active' });
    }

    // Check if already in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        userId_listingId: {
          userId: req.user.userId,
          listingId
        }
      }
    });

    if (existingItem) {
      return res.status(400).json({ error: 'Item already in cart' });
    }

    const cartItem = await prisma.cartItem.create({
      data: {
        userId: req.user.userId,
        listingId
      },
      include: {
        listing: {
          include: {
            seller: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                role: true,
                isVerified: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({ message: 'Added to cart', cartItem });
  } catch (error) {
    console.error('Cart addition error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/cart/:listingId', authenticateToken, async (req: any, res) => {
  try {
    const { listingId } = req.params;

    await prisma.cartItem.delete({
      where: {
        userId_listingId: {
          userId: req.user.userId,
          listingId
        }
      }
    });

    res.json({ message: 'Removed from cart' });
  } catch (error) {
    console.error('Cart removal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/cart', authenticateToken, async (req: any, res) => {
  try {
    await prisma.cartItem.deleteMany({
      where: { userId: req.user.userId }
    });

    res.json({ message: 'Cart cleared' });
  } catch (error) {
    console.error('Cart clear error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Message routes
app.get('/api/messages', authenticateToken, async (req: any, res) => {
  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: req.user.userId },
          { receiverId: req.user.userId }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            role: true,
            isVerified: true
          }
        },
        receiver: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            role: true,
            isVerified: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(messages);
  } catch (error) {
    console.error('Messages fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/messages', authenticateToken, async (req: any, res) => {
  try {
    const { receiverId, listingId, subject, content } = req.body;

    if (!receiverId || !subject || !content) {
      return res.status(400).json({ error: 'Receiver ID, subject, and content are required' });
    }

    // Verify receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId }
    });

    if (!receiver) {
      return res.status(404).json({ error: 'Receiver not found' });
    }

    // If listingId is provided, verify listing exists
    if (listingId) {
      const listing = await prisma.listing.findUnique({
        where: { id: listingId }
      });

      if (!listing) {
        return res.status(404).json({ error: 'Listing not found' });
      }
    }

    const message = await prisma.message.create({
      data: {
        senderId: req.user.userId,
        receiverId,
        listingId,
        subject,
        content,
        status: 'UNREAD'
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            role: true,
            isVerified: true
          }
        },
        receiver: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            role: true,
            isVerified: true
          }
        }
      }
    });

    res.status(201).json({ message: 'Message sent', data: message });
  } catch (error) {
    console.error('Message creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/api/messages/:id/read', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;

    // Verify message exists and user is the receiver
    const message = await prisma.message.findUnique({
      where: { id }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.receiverId !== req.user.userId) {
      return res.status(403).json({ error: 'You can only mark your own messages as read' });
    }

    const updatedMessage = await prisma.message.update({
      where: { id },
      data: { 
        status: 'READ'
      }
    });

    res.json({ message: 'Message marked as read', data: updatedMessage });
  } catch (error) {
    console.error('Message read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/messages/:id', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;

    // Verify message exists and user is either sender or receiver
    const message = await prisma.message.findUnique({
      where: { id }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.senderId !== req.user.userId && message.receiverId !== req.user.userId) {
      return res.status(403).json({ error: 'You can only delete your own messages' });
    }

    await prisma.message.delete({
      where: { id }
    });

    res.json({ message: 'Message deleted' });
  } catch (error) {
    console.error('Message deletion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Blog routes
app.get('/api/blog', async (req, res) => {
  try {
    const blogPosts = await prisma.blogPost.findMany({
      orderBy: { createdAt: 'desc' }
    });

    res.json(blogPosts);
  } catch (error) {
    console.error('Blog posts fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/blog/published', async (req, res) => {
  try {
    const blogPosts = await prisma.blogPost.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json(blogPosts);
  } catch (error) {
    console.error('Published blog posts fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/blog/category/:category', async (req, res) => {
  try {
    const { category } = req.params;

    const blogPosts = await prisma.blogPost.findMany({
      where: { 
        tags: { has: category },
        isPublished: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(blogPosts);
  } catch (error) {
    console.error('Blog posts by category fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/blog/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const blogPost = await prisma.blogPost.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            role: true,
            isVerified: true
          }
        }
      }
    });

    if (!blogPost) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    res.json(blogPost);
  } catch (error) {
    console.error('Blog post fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/blog', authenticateToken, async (req: any, res) => {
  try {
    const { title, content, excerpt, tags, isPublished = false } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    const blogPost = await prisma.blogPost.create({
      data: {
        title,
        slug,
        content,
        excerpt: excerpt || content.substring(0, 200),
        tags: tags || [],
        isPublished,
        authorId: req.user.userId
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            role: true,
            isVerified: true
          }
        }
      }
    });

    res.status(201).json({ message: 'Blog post created', blogPost });
  } catch (error) {
    console.error('Blog post creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/api/blog/:id', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { title, content, excerpt, tags, isPublished } = req.body;

    // Check if user is author or admin
    const existingPost = await prisma.blogPost.findUnique({
      where: { id }
    });

    if (!existingPost) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    if (existingPost.authorId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'You can only edit your own blog posts' });
    }

    const updatedPost = await prisma.blogPost.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(excerpt && { excerpt }),
        ...(tags && { tags }),
        ...(isPublished !== undefined && { isPublished }),
        updatedAt: new Date()
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            role: true,
            isVerified: true
          }
        }
      }
    });

    res.json({ message: 'Blog post updated', blogPost: updatedPost });
  } catch (error) {
    console.error('Blog post update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/blog/:id', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;

    // Check if user is author or admin
    const existingPost = await prisma.blogPost.findUnique({
      where: { id }
    });

    if (!existingPost) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    if (existingPost.authorId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'You can only delete your own blog posts' });
    }

    await prisma.blogPost.delete({
      where: { id }
    });

    res.json({ message: 'Blog post deleted' });
  } catch (error) {
    console.error('Blog post deletion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Saved searches routes
app.get('/api/saved-searches', authenticateToken, async (req: any, res) => {
  try {
    const savedSearches = await prisma.savedSearch.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(savedSearches);
  } catch (error) {
    console.error('Saved searches fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/saved-searches', authenticateToken, async (req: any, res) => {
  try {
    const { name, filters } = req.body;

    if (!name || !filters) {
      return res.status(400).json({ error: 'Name and filters are required' });
    }

    const savedSearch = await prisma.savedSearch.create({
      data: {
        userId: req.user.userId,
        name,
        filters: JSON.stringify(filters),
      }
    });

    res.status(201).json({ message: 'Saved search created', savedSearch });
  } catch (error) {
    console.error('Saved search creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/saved-searches/:id', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;

    await prisma.savedSearch.delete({
      where: { 
        id,
        userId: req.user.userId
      }
    });

    res.json({ message: 'Saved search deleted' });
  } catch (error) {
    console.error('Saved search deletion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({ 
      status: 'unhealthy', 
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: 'Database connection failed'
    });
  }
});

// Error handling middleware
app.use((error: any, req: any, res: any, next: any) => {
  console.error(error.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Prisma Studio: http://localhost:5555`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;