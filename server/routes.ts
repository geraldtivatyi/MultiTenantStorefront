import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { tenantMiddleware, adminBypass, type TenantRequest } from "./middleware/tenant";
import { paystackService, type PaystackWebhookEvent } from "./services/paystack";
import { 
  AuthService, 
  authMiddleware, 
  requireAuth, 
  requireAdmin, 
  setSessionCookie, 
  clearSessionCookie,
  type AuthenticatedRequest 
} from "./auth";
import { 
  insertTenantSchema, 
  insertProductSchema, 
  insertCartItemSchema,
  insertOrderSchema,
  insertOrderItemSchema,
  insertUserSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply authentication middleware to all routes
  app.use(authMiddleware);
  
  // Apply tenant middleware to all API routes except admin and webhooks
  app.use('/api/storefront', tenantMiddleware());
  app.use('/api/cart', tenantMiddleware());
  app.use('/api/orders', tenantMiddleware());
  
  // Admin routes (no tenant middleware)
  app.use('/api/admin', adminBypass());

  // Authentication routes
  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
  });

  const registerSchema = z.object({
    username: z.string().min(3).max(50),
    email: z.string().email(),
    password: z.string().min(6),
    firstName: z.string().max(50).optional(),
    lastName: z.string().max(50).optional(),
    phone: z.string().optional(),
  });

  // Register new user
  app.post('/api/auth/register', async (req: AuthenticatedRequest, res) => {
    try {
      const data = registerSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ 
          error: 'User already exists',
          code: 'USER_EXISTS'
        });
      }

      const existingUsername = await storage.getUserByUsername(data.username);
      if (existingUsername) {
        return res.status(400).json({ 
          error: 'Username already taken',
          code: 'USERNAME_TAKEN'
        });
      }

      // Hash password
      const hashedPassword = await AuthService.hashPassword(data.password);

      // Create user
      const user = await storage.createUser({
        username: data.username,
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        tenantId: null, // Users can be global or assigned to specific tenants
        isAdmin: false,
        emailVerified: false,
        isActive: true,
      });

      // Create session
      const sessionId = await AuthService.createSession(user.id);
      setSessionCookie(res, sessionId);

      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.status(201).json({ 
        user: userWithoutPassword,
        message: 'Registration successful'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: error.errors 
        });
      }
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  // Login user
  app.post('/api/auth/login', async (req: AuthenticatedRequest, res) => {
    try {
      const data = loginSchema.parse(req.body);

      // Find user
      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        return res.status(401).json({ 
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({ 
          error: 'Account is disabled',
          code: 'ACCOUNT_DISABLED'
        });
      }

      // Verify password
      const isValidPassword = await AuthService.verifyPassword(data.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ 
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Create session
      const sessionId = await AuthService.createSession(user.id);
      setSessionCookie(res, sessionId);

      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.json({ 
        user: userWithoutPassword,
        message: 'Login successful'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: error.errors 
        });
      }
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // Logout user
  app.post('/api/auth/logout', async (req: AuthenticatedRequest, res) => {
    try {
      if (req.sessionId) {
        await AuthService.deleteSession(req.sessionId);
      }
      clearSessionCookie(res);
      res.json({ message: 'Logout successful' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  });

  // Get current user
  app.get('/api/auth/user', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Return user without password
      const { password, ...userWithoutPassword } = req.user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Failed to get user' });
    }
  });

  // Check authentication status
  app.get('/api/auth/status', async (req: AuthenticatedRequest, res) => {
    res.json({ 
      authenticated: !!req.user,
      user: req.user ? { 
        id: req.user.id, 
        username: req.user.username, 
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        isAdmin: req.user.isAdmin
      } : null 
    });
  });

  // Create demo user (for testing - remove in production)
  app.post('/api/auth/create-demo-user', async (req, res) => {
    try {
      // Check if demo user already exists
      const existingUser = await storage.getUserByEmail('demo@creativecrafts.co.za');
      if (existingUser) {
        return res.json({ message: 'Demo user already exists' });
      }

      // Create demo user
      const hashedPassword = await AuthService.hashPassword('demo123');
      const user = await storage.createUser({
        username: 'demo',
        email: 'demo@creativecrafts.co.za',
        password: hashedPassword,
        firstName: 'Demo',
        lastName: 'User',
        phone: '+27 12 345 6789',
        tenantId: null,
        isAdmin: false,
        emailVerified: true,
        isActive: true,
      });

      res.json({ 
        message: 'Demo user created successfully',
        user: { id: user.id, email: user.email, username: user.username }
      });
    } catch (error) {
      console.error('Create demo user error:', error);
      res.status(500).json({ error: 'Failed to create demo user' });
    }
  });

  // Get tenant information
  app.get('/api/storefront/tenant', async (req: TenantRequest, res) => {
    try {
      if (!req.tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      res.json({
        id: req.tenant.id,
        name: req.tenant.name,
        subdomain: req.tenant.subdomain,
        heroTitle: req.tenant.heroTitle || `Welcome to ${req.tenant.name}`,
        heroSubtitle: req.tenant.heroSubtitle || 'Discover amazing products',
      });
    } catch (error) {
      console.error('Get tenant error:', error);
      res.status(500).json({ error: 'Failed to get tenant information' });
    }
  });

  // Get products for a tenant
  app.get('/api/storefront/products', async (req: TenantRequest, res) => {
    try {
      if (!req.tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      const products = await storage.getProductsByTenant(req.tenant.id);
      res.json(products);
    } catch (error) {
      console.error('Get products error:', error);
      res.status(500).json({ error: 'Failed to get products' });
    }
  });

  // Get single product
  app.get('/api/storefront/products/:id', async (req: TenantRequest, res) => {
    try {
      if (!req.tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId, req.tenant.id);
      
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.json(product);
    } catch (error) {
      console.error('Get product error:', error);
      res.status(500).json({ error: 'Failed to get product' });
    }
  });

  // Cart routes
  app.get('/api/cart', async (req: TenantRequest, res) => {
    try {
      if (!req.tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      const sessionId = req.headers['x-session-id'] as string || 'anonymous';
      const cartItems = await storage.getCartItems(sessionId, req.tenant.id);
      res.json(cartItems);
    } catch (error) {
      console.error('Get cart error:', error);
      res.status(500).json({ error: 'Failed to get cart items' });
    }
  });

  app.post('/api/cart', async (req: TenantRequest, res) => {
    try {
      if (!req.tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      const sessionId = req.headers['x-session-id'] as string || 'anonymous';
      const cartItemData = insertCartItemSchema.parse({
        ...req.body,
        sessionId,
      });

      // Verify product belongs to tenant
      const product = await storage.getProduct(cartItemData.productId, req.tenant.id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const cartItem = await storage.addToCart(cartItemData);
      res.status(201).json(cartItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid cart item data', details: error.errors });
      }
      console.error('Add to cart error:', error);
      res.status(500).json({ error: 'Failed to add item to cart' });
    }
  });

  app.put('/api/cart/:id', async (req: TenantRequest, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const { quantity } = req.body;

      if (!quantity || quantity < 1) {
        return res.status(400).json({ error: 'Invalid quantity' });
      }

      const updatedItem = await storage.updateCartItem(itemId, quantity);
      if (!updatedItem) {
        return res.status(404).json({ error: 'Cart item not found' });
      }

      res.json(updatedItem);
    } catch (error) {
      console.error('Update cart item error:', error);
      res.status(500).json({ error: 'Failed to update cart item' });
    }
  });

  app.delete('/api/cart/:id', async (req: TenantRequest, res) => {
    try {
      const itemId = parseInt(req.params.id);
      await storage.removeFromCart(itemId);
      res.status(204).send();
    } catch (error) {
      console.error('Remove from cart error:', error);
      res.status(500).json({ error: 'Failed to remove item from cart' });
    }
  });

  // Order creation and payment
  const checkoutSchema = z.object({
    customerEmail: z.string().email(),
    customerName: z.string().min(1),
    shippingAddress: z.string().min(1),
    city: z.string().min(1),
    postalCode: z.string().min(1),
  });

  app.post('/api/orders/checkout', async (req: TenantRequest, res) => {
    try {
      if (!req.tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      const sessionId = req.headers['x-session-id'] as string || 'anonymous';
      const checkoutData = checkoutSchema.parse(req.body);

      // Get cart items
      const cartItems = await storage.getCartItems(sessionId, req.tenant.id);
      if (cartItems.length === 0) {
        return res.status(400).json({ error: 'Cart is empty' });
      }

      // Calculate totals
      const subtotal = cartItems.reduce((sum, item) => 
        sum + (parseFloat(item.product.price) * item.quantity), 0
      );
      const tax = subtotal * 0.08; // 8% tax
      const total = subtotal + tax;

      // Create order
      const orderData = insertOrderSchema.parse({
        tenantId: req.tenant.id,
        ...checkoutData,
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2),
      });

      const order = await storage.createOrder(orderData);

      // Create order items
      for (const cartItem of cartItems) {
        await storage.createOrderItem({
          orderId: order.id,
          productId: cartItem.productId,
          quantity: cartItem.quantity,
          price: cartItem.product.price,
          name: cartItem.product.name,
        });
      }

      // Initialize Paystack payment
      const paystackData = await paystackService.initializeTransaction({
        amount: total,
        email: checkoutData.customerEmail,
        currency: 'ZAR',
        reference: paystackService.generateReference('ORD'),
        metadata: {
          orderId: order.id,
          tenantId: req.tenant.id,
        },
      });

      // Update order with Paystack reference
      await storage.updateOrderStatus(order.id, 'pending');

      // Clear cart
      await storage.clearCart(sessionId);

      res.json({
        order,
        payment: {
          authorization_url: paystackData.authorization_url,
          access_code: paystackData.access_code,
          reference: paystackData.reference,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid checkout data', details: error.errors });
      }
      console.error('Checkout error:', error);
      res.status(500).json({ error: 'Failed to process checkout' });
    }
  });

  // Paystack webhook
  app.post('/api/webhooks/paystack', async (req, res) => {
    try {
      const signature = req.headers['x-paystack-signature'] as string;
      const payload = JSON.stringify(req.body);

      if (!paystackService.verifyWebhookSignature(payload, signature)) {
        return res.status(400).json({ error: 'Invalid signature' });
      }

      const event: PaystackWebhookEvent = req.body;

      if (event.event === 'charge.success') {
        const { reference, status } = event.data;
        
        // Find order by metadata
        const orderId = event.data.metadata?.orderId;
        if (orderId) {
          await storage.updateOrderStatus(orderId, 'paid');
          
          // Create payment transaction record
          await storage.createPaymentTransaction({
            orderId,
            paystackReference: reference,
            amount: (event.data.amount / 100).toFixed(2), // Convert from kobo
            status: status,
            metadata: JSON.stringify(event.data),
          });
        }
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  // Get user orders (mock endpoint for demo)
  app.get('/api/orders/my-orders', async (req: TenantRequest, res) => {
    try {
      if (!req.tenant) {
        return res.status(400).json({ error: 'Tenant not found' });
      }
      
      // Get all orders for the tenant (in a real app, this would be filtered by user)
      const orders = await storage.getOrdersByTenant(req.tenant.id);
      res.json(orders);
    } catch (error) {
      console.error('Get orders error:', error);
      res.status(500).json({ error: 'Failed to get orders' });
    }
  });

  // Get Paystack public key
  app.get('/api/payment/config', (req, res) => {
    res.json({
      publicKey: paystackService.getPublicKey(),
    });
  });

  // Admin routes
  app.get('/api/admin/tenants', async (req, res) => {
    try {
      const tenants = await storage.getAllTenants();
      res.json(tenants);
    } catch (error) {
      console.error('Get tenants error:', error);
      res.status(500).json({ error: 'Failed to get tenants' });
    }
  });

  app.post('/api/admin/tenants', async (req, res) => {
    try {
      const tenantData = insertTenantSchema.parse(req.body);
      const tenant = await storage.createTenant(tenantData);
      res.status(201).json(tenant);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid tenant data', details: error.errors });
      }
      console.error('Create tenant error:', error);
      res.status(500).json({ error: 'Failed to create tenant' });
    }
  });

  app.post('/api/admin/products', async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid product data', details: error.errors });
      }
      console.error('Create product error:', error);
      res.status(500).json({ error: 'Failed to create product' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
