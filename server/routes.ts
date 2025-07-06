import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { tenantMiddleware, adminBypass, type TenantRequest } from "./middleware/tenant";
import { paystackService, type PaystackWebhookEvent } from "./services/paystack";
import { whatsappService, type WhatsAppWebhookEvent } from "./services/whatsapp";
import { emailService } from "./services/email";
import { pudoService } from "./services/pudo";
import { 
  AuthService, 
  authMiddleware, 
  requireAuth, 
  requireAdmin, 
  requirePlatformAdmin,
  requireTenantOwner,
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

      // Determine redirect URL based on user role
      let redirectUrl = '/';
      if (user.role === 'platform_admin') {
        redirectUrl = '/admin';
      } else if (user.role === 'tenant_owner') {
        redirectUrl = '/vendor';
      }

      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.json({ 
        user: userWithoutPassword,
        message: 'Login successful',
        redirectUrl
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
        role: req.user.role,
        tenantId: req.user.tenantId,
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

  // Account Settings Routes
  
  // Update user profile
  app.put('/api/account/profile', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { firstName, lastName, phone } = req.body;
      const userId = req.user!.id;

      const updatedUser = await storage.updateUserProfile(userId, {
        firstName,
        lastName,
        phone,
      });

      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { password, ...userWithoutPassword } = updatedUser;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  // Change password
  app.put('/api/account/password', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user!.id;

      // Verify current password
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const isValidPassword = await AuthService.verifyPassword(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      // Hash new password
      const hashedPassword = await AuthService.hashPassword(newPassword);
      
      // Update password
      const updatedUser = await storage.updateUserProfile(userId, {
        password: hashedPassword,
      });

      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Failed to change password' });
    }
  });

  // Get user addresses
  app.get('/api/account/addresses', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const addresses = await storage.getUserAddresses(userId);
      res.json(addresses);
    } catch (error) {
      console.error('Get addresses error:', error);
      res.status(500).json({ error: 'Failed to get addresses' });
    }
  });

  // Create new address
  app.post('/api/account/addresses', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { street, city, state, postalCode, country, type, isDefault } = req.body;
      const userId = req.user!.id;

      const address = await storage.createUserAddress({
        userId,
        street,
        city,
        state,
        postalCode,
        country: country || 'South Africa',
        type: type || 'shipping',
        isDefault: isDefault || false,
      });

      // If this is set as default, ensure no other addresses are default
      if (isDefault) {
        await storage.setDefaultAddress(userId, address.id);
      }

      res.status(201).json(address);
    } catch (error) {
      console.error('Create address error:', error);
      res.status(500).json({ error: 'Failed to create address' });
    }
  });

  // Update address
  app.put('/api/account/addresses/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const addressId = parseInt(req.params.id);
      const { street, city, state, postalCode, country, type, isDefault } = req.body;
      const userId = req.user!.id;

      const updatedAddress = await storage.updateUserAddress(addressId, {
        street,
        city,
        state,
        postalCode,
        country,
        type,
        isDefault,
      });

      if (!updatedAddress) {
        return res.status(404).json({ error: 'Address not found' });
      }

      // If this is set as default, ensure no other addresses are default
      if (isDefault) {
        await storage.setDefaultAddress(userId, addressId);
      }

      res.json(updatedAddress);
    } catch (error) {
      console.error('Update address error:', error);
      res.status(500).json({ error: 'Failed to update address' });
    }
  });

  // Delete address
  app.delete('/api/account/addresses/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const addressId = parseInt(req.params.id);
      await storage.deleteUserAddress(addressId);
      res.json({ message: 'Address deleted successfully' });
    } catch (error) {
      console.error('Delete address error:', error);
      res.status(500).json({ error: 'Failed to delete address' });
    }
  });

  // Get user preferences
  app.get('/api/account/preferences', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      let preferences = await storage.getUserPreferences(userId);

      // Create default preferences if none exist
      if (!preferences) {
        preferences = await storage.createUserPreferences({
          userId,
          emailOrderUpdates: true,
          emailMarketing: false,
          emailSecurity: true,
          smsNotifications: false,
          currency: 'ZAR',
          language: 'en',
        });
      }

      res.json(preferences);
    } catch (error) {
      console.error('Get preferences error:', error);
      res.status(500).json({ error: 'Failed to get preferences' });
    }
  });

  // Update user preferences
  app.put('/api/account/preferences', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const { 
        emailOrderUpdates, 
        emailMarketing, 
        emailSecurity, 
        smsNotifications, 
        currency, 
        language 
      } = req.body;

      const updatedPreferences = await storage.updateUserPreferences(userId, {
        emailOrderUpdates,
        emailMarketing,
        emailSecurity,
        smsNotifications,
        currency,
        language,
      });

      if (!updatedPreferences) {
        return res.status(404).json({ error: 'Preferences not found' });
      }

      res.json(updatedPreferences);
    } catch (error) {
      console.error('Update preferences error:', error);
      res.status(500).json({ error: 'Failed to update preferences' });
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
        deliveryOptions: req.tenant.deliveryOptions || ["collection"],
        pudoApiKey: req.tenant.pudoApiKey,
        pudoCollectionAddress: req.tenant.pudoCollectionAddress,
        pudoPreferredLocker: req.tenant.pudoPreferredLocker,
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
    deliveryMethod: z.enum(["collection", "standard_delivery", "pudo"]),
    pudoLocker: z.string().optional(),
    shippingCost: z.number().default(0),
    totalAmount: z.number().optional(),
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
      const shippingCost = checkoutData.shippingCost || 0;
      const total = subtotal + tax + shippingCost;

      // Create order with delivery information
      const orderData = insertOrderSchema.parse({
        tenantId: req.tenant.id,
        customerEmail: checkoutData.customerEmail,
        customerName: checkoutData.customerName,
        shippingAddress: checkoutData.shippingAddress,
        city: checkoutData.city,
        postalCode: checkoutData.postalCode,
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2),
        deliveryMethod: checkoutData.deliveryMethod,
        pudoLocker: checkoutData.pudoLocker,
        shippingCost: shippingCost.toFixed(2),
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

          // Send notifications to vendor and customer
          try {
            const order = await storage.getOrder(orderId);
            if (order) {
              const tenant = await storage.getTenant(order.tenantId);
              const orderItems = await storage.getOrderItems(orderId);
              
              if (tenant && orderItems.length > 0) {
                // Prepare notification data
                const notificationData = {
                  orderId: order.id,
                  storeName: tenant.name,
                  customerName: order.customerName,
                  customerEmail: order.customerEmail,
                  totalAmount: parseFloat(order.total),
                  currency: 'ZAR',
                  itemCount: orderItems.length,
                  items: orderItems.map(item => ({
                    name: item.product.name,
                    quantity: item.quantity,
                    price: item.price,
                  })),
                };

                // Send WhatsApp notification to vendor
                if (tenant.whatsappPhone) {
                  try {
                    await whatsappService.sendOrderNotification(
                      tenant.whatsappPhone,
                      {
                        orderId: notificationData.orderId,
                        storeName: notificationData.storeName,
                        customerName: notificationData.customerName,
                        totalAmount: notificationData.totalAmount,
                        currency: notificationData.currency,
                        itemCount: notificationData.itemCount,
                      }
                    );
                    console.log(`WhatsApp notification sent to vendor for order ${orderId}`);
                  } catch (whatsappError) {
                    console.error('Failed to send WhatsApp notification:', whatsappError);
                  }
                }

                // Send email notification to vendor
                try {
                  await emailService.sendOrderNotificationToVendor({
                    vendorEmail: tenant.ownerEmail,
                    storeName: notificationData.storeName,
                    orderId: notificationData.orderId,
                    customerName: notificationData.customerName,
                    customerEmail: notificationData.customerEmail,
                    totalAmount: notificationData.totalAmount,
                    currency: notificationData.currency,
                    itemCount: notificationData.itemCount,
                    items: notificationData.items,
                  });
                  console.log(`Email notification sent to vendor for order ${orderId}`);
                } catch (emailError) {
                  console.error('Failed to send email notification to vendor:', emailError);
                }

                // Send email confirmation to customer
                try {
                  await emailService.sendOrderConfirmationToCustomer({
                    customerEmail: notificationData.customerEmail,
                    customerName: notificationData.customerName,
                    orderId: notificationData.orderId,
                    storeName: notificationData.storeName,
                    totalAmount: notificationData.totalAmount,
                    currency: notificationData.currency,
                    items: notificationData.items,
                  });
                  console.log(`Order confirmation email sent to customer for order ${orderId}`);
                } catch (emailError) {
                  console.error('Failed to send order confirmation email:', emailError);
                }
              }
            }
          } catch (notificationError) {
            console.error('Failed to send notifications:', notificationError);
            // Don't fail the webhook if notifications fail
          }
        }
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  // WhatsApp webhook endpoints
  app.get('/api/webhooks/whatsapp', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const result = whatsappService.verifyWebhook(mode as string, token as string, challenge as string);
    if (result) {
      res.status(200).send(result);
    } else {
      res.status(403).send('Forbidden');
    }
  });

  app.post('/api/webhooks/whatsapp', (req, res) => {
    try {
      const event: WhatsAppWebhookEvent = req.body;
      whatsappService.processWebhookEvent(event);
      res.status(200).json({ received: true });
    } catch (error) {
      console.error('WhatsApp webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  // WhatsApp configuration endpoint
  app.get('/api/whatsapp/config', (req, res) => {
    res.json(whatsappService.getConfig());
  });

  // Test WhatsApp notification endpoint (for testing)
  app.post('/api/whatsapp/test', requireAuth, requirePlatformAdmin, async (req, res) => {
    try {
      const { phone, message } = req.body;
      
      if (!phone || !message) {
        return res.status(400).json({ error: 'Phone and message are required' });
      }

      const result = await whatsappService.sendMessage({
        to: phone,
        text: message,
      });

      res.json({ success: true, result });
    } catch (error) {
      console.error('Test WhatsApp message error:', error);
      res.status(500).json({ error: 'Failed to send test message' });
    }
  });

  // Email configuration endpoint
  app.get('/api/email/config', (req, res) => {
    res.json(emailService.getConfig());
  });

  // Test email notification endpoint (for testing)
  app.post('/api/email/test', requireAuth, requirePlatformAdmin, async (req, res) => {
    try {
      const { email, subject, message } = req.body;
      
      if (!email || !subject || !message) {
        return res.status(400).json({ error: 'Email, subject, and message are required' });
      }

      const result = await emailService.sendEmail({
        to: email,
        subject,
        text: message,
        html: `<p>${message.replace(/\n/g, '<br>')}</p>`,
      });

      res.json({ success: result, message: result ? 'Email sent successfully' : 'Email failed to send' });
    } catch (error) {
      console.error('Test email error:', error);
      res.status(500).json({ error: 'Failed to send test email' });
    }
  });

  // Admin tenant management endpoints
  app.get('/api/admin/tenants', requireAuth, requirePlatformAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const tenants = await storage.getAllTenants();
      res.json(tenants);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      res.status(500).json({ error: 'Failed to fetch tenants' });
    }
  });

  app.post('/api/admin/tenants', requireAuth, requirePlatformAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const tenantData = req.body;
      
      // Validate required fields
      if (!tenantData.name || !tenantData.subdomain || !tenantData.ownerName || !tenantData.ownerEmail) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check if subdomain already exists
      const existingTenant = await storage.getTenantBySubdomain(tenantData.subdomain);
      if (existingTenant) {
        return res.status(400).json({ error: 'Subdomain already exists' });
      }

      // Create user account for tenant owner
      let ownerId = null;
      try {
        const existingUser = await storage.getUserByEmail(tenantData.ownerEmail);
        if (existingUser) {
          ownerId = existingUser.id;
        } else {
          // Create new user account
          const newUser = await storage.createUser({
            username: tenantData.ownerEmail,
            email: tenantData.ownerEmail,
            password: await AuthService.hashPassword('temp123'), // Temporary password
            firstName: tenantData.ownerName.split(' ')[0] || tenantData.ownerName,
            lastName: tenantData.ownerName.split(' ').slice(1).join(' ') || '',
            role: 'tenant_owner',
          });
          ownerId = newUser.id;
        }
      } catch (error) {
        console.error('Error creating/finding user:', error);
        return res.status(500).json({ error: 'Failed to create user account' });
      }

      // Create tenant
      const tenant = await storage.createTenant({
        name: tenantData.name,
        subdomain: tenantData.subdomain,
        ownerId,
        ownerName: tenantData.ownerName,
        ownerEmail: tenantData.ownerEmail,
        ownerPhone: tenantData.ownerPhone || null,
        description: tenantData.description || null,
        address: tenantData.address || null,
        businessType: tenantData.businessType || 'other',
      });

      res.json(tenant);
    } catch (error) {
      console.error('Error creating tenant:', error);
      res.status(500).json({ error: 'Failed to create tenant' });
    }
  });

  app.put('/api/admin/tenants/:id', requireAuth, requirePlatformAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const tenantId = parseInt(req.params.id);
      const updateData = req.body;

      const tenant = await storage.updateTenant(tenantId, updateData);
      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      res.json(tenant);
    } catch (error) {
      console.error('Error updating tenant:', error);
      res.status(500).json({ error: 'Failed to update tenant' });
    }
  });

  // Update tenant WhatsApp settings
  app.put('/api/tenant/whatsapp', requireAuth, requireTenantOwner, async (req: AuthenticatedRequest, res) => {
    try {
      const { whatsappPhone } = req.body;
      const userId = req.user!.id;
      
      // Get user's tenant
      const user = await storage.getUser(userId);
      if (!user || !user.tenantId) {
        return res.status(400).json({ error: 'User not associated with a tenant' });
      }

      // Update tenant's WhatsApp phone
      await storage.updateTenant(user.tenantId, { whatsappPhone });
      
      res.json({ success: true, message: 'WhatsApp settings updated' });
    } catch (error) {
      console.error('Update WhatsApp settings error:', error);
      res.status(500).json({ error: 'Failed to update WhatsApp settings' });
    }
  });

  // Update tenant delivery options and Pudo settings
  app.put('/api/tenant/delivery', requireAuth, requireTenantOwner, async (req: AuthenticatedRequest, res) => {
    try {
      const { deliveryOptions, pudoCollectionAddress, pudoPreferredLocker } = req.body;
      const userId = req.user!.id;
      
      // Get user's tenant
      const user = await storage.getUser(userId);
      if (!user || !user.tenantId) {
        return res.status(400).json({ error: 'User not associated with a tenant' });
      }

      // Validate Pudo API if pudo delivery is enabled
      if (deliveryOptions?.includes('pudo')) {
        const isValid = await pudoService.validatePudoCredentials();
        if (!isValid) {
          return res.status(400).json({ error: 'Pudo API not configured properly' });
        }
      }

      const updateData: any = { deliveryOptions };
      if (pudoCollectionAddress !== undefined) updateData.pudoCollectionAddress = pudoCollectionAddress;
      if (pudoPreferredLocker !== undefined) updateData.pudoPreferredLocker = pudoPreferredLocker;

      const tenant = await storage.updateTenant(user.tenantId, updateData);
      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      res.json({ success: true, tenant });
    } catch (error) {
      console.error('Error updating delivery settings:', error);
      res.status(500).json({ error: 'Failed to update delivery settings' });
    }
  });

  // Get Pudo lockers
  app.get('/api/pudo/lockers', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const user = await storage.getUser(userId);
      
      if (!user || !user.tenantId) {
        return res.status(400).json({ error: 'User not associated with a tenant' });
      }

      const lockers = await pudoService.getLockers();
      res.json(lockers);
    } catch (error) {
      console.error('Error fetching Pudo lockers:', error);
      res.status(500).json({ error: 'Failed to fetch Pudo lockers' });
    }
  });

  // Get Pudo rates
  app.get('/api/pudo/rates', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const user = await storage.getUser(userId);
      
      if (!user || !user.tenantId) {
        return res.status(400).json({ error: 'User not associated with a tenant' });
      }

      const rates = await pudoService.getLockerRates();
      res.json(rates);
    } catch (error) {
      console.error('Error fetching Pudo rates:', error);
      res.status(500).json({ error: 'Failed to fetch Pudo rates' });
    }
  });

  // Calculate Pudo shipping for products in cart
  app.post('/api/pudo/calculate-shipping', async (req: TenantRequest, res) => {
    try {
      const { items, deliveryLocker } = req.body; // items with product IDs and quantities
      
      if (!req.tenant) {
        return res.status(400).json({ error: 'Tenant not found' });
      }

      if (!req.tenant.pudoApiKey || !req.tenant.pudoCollectionAddress) {
        return res.status(400).json({ error: 'Pudo not configured for this store' });
      }

      if (!deliveryLocker) {
        return res.status(400).json({ error: 'Delivery locker location required' });
      }

      let totalRate = 0;
      const shippingDetails = [];

      for (const item of items) {
        const product = await storage.getProduct(item.productId, req.tenant.id);
        if (!product || !product.pudoDimensions || !product.pudoWeight) {
          return res.status(400).json({ 
            error: `Product "${product?.name || 'Unknown'}" is not configured for Pudo delivery` 
          });
        }

        const dimensions = product.pudoDimensions as any;
        const weight = parseFloat(product.pudoWeight.toString());

        const shipping = await pudoService.calculateShippingRate(
          req.tenant.pudoCollectionAddress as any,
          deliveryLocker,
          dimensions,
          weight * item.quantity
        );

        totalRate += shipping.rate * item.quantity;
        shippingDetails.push({
          productId: item.productId,
          productName: product.name,
          quantity: item.quantity,
          individualRate: shipping.rate,
          totalRate: shipping.rate * item.quantity,
          deliveryTime: shipping.delivery_time
        });
      }

      res.json({
        totalRate: parseFloat(totalRate.toFixed(2)),
        currency: 'ZAR',
        deliveryTime: '2-3 business days',
        details: shippingDetails
      });
    } catch (error) {
      console.error('Error calculating Pudo shipping:', error);
      res.status(500).json({ error: 'Failed to calculate shipping' });
    }
  });

  // Get user orders
  app.get('/api/orders/my-orders', requireAuth, async (req: TenantRequest, res) => {
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

  // Get order items for a specific order
  app.get('/api/orders/:orderId/items', requireAuth, async (req: TenantRequest, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      if (!orderId) {
        return res.status(400).json({ error: 'Invalid order ID' });
      }

      const orderItems = await storage.getOrderItems(orderId);
      res.json(orderItems);
    } catch (error) {
      console.error('Get order items error:', error);
      res.status(500).json({ error: 'Failed to get order items' });
    }
  });

  // Reorder - add all items from an order back to cart
  app.post('/api/orders/:orderId/reorder', requireAuth, async (req: TenantRequest, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      if (!orderId) {
        return res.status(400).json({ error: 'Invalid order ID' });
      }

      if (!req.tenant) {
        return res.status(400).json({ error: 'Tenant not found' });
      }

      const sessionId = req.sessionID || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Get order items
      const orderItems = await storage.getOrderItems(orderId);
      if (orderItems.length === 0) {
        return res.status(404).json({ error: 'Order not found or has no items' });
      }

      // Add each item to cart
      const addedItems = [];
      for (const item of orderItems) {
        try {
          const cartItem = await storage.addToCart({
            sessionId,
            productId: item.productId,
            quantity: item.quantity,
          });
          addedItems.push(cartItem);
        } catch (error) {
          console.error(`Failed to add item ${item.productId} to cart:`, error);
          // Continue with other items even if one fails
        }
      }

      res.json({ 
        message: 'Items added to cart successfully', 
        addedItemsCount: addedItems.length,
        totalItems: orderItems.length 
      });
    } catch (error) {
      console.error('Reorder error:', error);
      res.status(500).json({ error: 'Failed to reorder items' });
    }
  });

  // Complete payment for pending order
  app.post('/api/orders/:orderId/complete-payment', requireAuth, async (req: TenantRequest, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      if (!orderId) {
        return res.status(400).json({ error: 'Invalid order ID' });
      }

      if (!req.tenant) {
        return res.status(400).json({ error: 'Tenant not found' });
      }

      // Get the order
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      if (order.status !== 'pending') {
        return res.status(400).json({ error: 'Order is not pending payment' });
      }

      // Initialize Paystack transaction
      const transactionData = {
        amount: Math.round(parseFloat(order.total) * 100), // Convert to kobo
        email: order.customerEmail,
        currency: 'ZAR',
        reference: `${order.orderNumber}_${Date.now()}`,
        callback_url: `${req.protocol}://${req.get('host')}/orders/${orderId}/payment-success`,
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
        },
      };

      const paystackResponse = await paystackService.initializeTransaction(transactionData);
      
      if (!paystackResponse.status) {
        throw new Error(paystackResponse.message || 'Failed to initialize payment');
      }

      res.json({
        paymentUrl: paystackResponse.data.authorization_url,
        reference: paystackResponse.data.reference,
      });
    } catch (error) {
      console.error('Complete payment error:', error);
      res.status(500).json({ error: 'Failed to initialize payment' });
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

  // Get products for specific tenant (admin)
  app.get('/api/admin/products/:tenantId', async (req, res) => {
    try {
      const tenantId = parseInt(req.params.tenantId);
      if (!tenantId) {
        return res.status(400).json({ error: 'Invalid tenant ID' });
      }
      const products = await storage.getProductsByTenant(tenantId);
      res.json(products);
    } catch (error) {
      console.error('Get products error:', error);
      res.status(500).json({ error: 'Failed to get products' });
    }
  });

  // Get dashboard stats (admin)
  app.get('/api/admin/stats', requireAuth, requirePlatformAdmin, async (req, res) => {
    try {
      const tenants = await storage.getAllTenants();
      
      // Get all orders from all tenants
      const allOrders = [];
      for (const tenant of tenants) {
        const tenantOrders = await storage.getOrdersByTenant(tenant.id);
        allOrders.push(...tenantOrders);
      }

      // Calculate stats from all tenants
      const paidOrders = allOrders.filter(order => order.status === 'paid');
      const totalRevenue = paidOrders.reduce((sum, order) => {
        return sum + parseFloat(order.total);
      }, 0);

      const stats = {
        totalTenants: tenants.length,
        totalRevenue: `R ${totalRevenue.toFixed(2)}`,
        totalOrders: allOrders.length,
        activeUsers: paidOrders.length, // Number of completed payments
      };

      res.json(stats);
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({ error: 'Failed to get dashboard stats' });
    }
  });

  // Get all orders across tenants (admin)
  app.get('/api/admin/orders', async (req, res) => {
    try {
      // Get orders from all tenants by fetching all tenants first
      const tenants = await storage.getAllTenants();
      const allOrders = [];
      
      for (const tenant of tenants) {
        const tenantOrders = await storage.getOrdersByTenant(tenant.id);
        // Add tenant info to each order for admin display
        const ordersWithTenant = tenantOrders.map(order => ({
          ...order,
          tenantName: tenant.name,
          tenantSubdomain: tenant.subdomain
        }));
        allOrders.push(...ordersWithTenant);
      }
      
      // Sort by creation date (newest first)
      allOrders.sort((a, b) => {
        if (!a.createdAt && !b.createdAt) return 0;
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      res.json(allOrders);
    } catch (error) {
      console.error('Get admin orders error:', error);
      res.status(500).json({ error: 'Failed to get orders' });
    }
  });

  // Get payment transactions (admin)
  app.get('/api/admin/payments', async (req, res) => {
    try {
      // For now, we'll use orders as payment data since they contain payment info
      const tenants = await storage.getAllTenants();
      const allOrders = [];
      
      for (const tenant of tenants) {
        const tenantOrders = await storage.getOrdersByTenant(tenant.id);
        const ordersWithTenant = tenantOrders.map(order => ({
          ...order,
          tenantName: tenant.name,
          tenantSubdomain: tenant.subdomain
        }));
        allOrders.push(...ordersWithTenant);
      }
      
      // Filter to only paid orders for payment transactions
      const paidOrders = allOrders.filter(order => order.status === 'paid');
      
      // Sort by creation date (newest first)
      paidOrders.sort((a, b) => {
        if (!a.createdAt && !b.createdAt) return 0;
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      res.json(paidOrders);
    } catch (error) {
      console.error('Get admin payments error:', error);
      res.status(500).json({ error: 'Failed to get payment transactions' });
    }
  });

  // Get payment statistics (admin)
  app.get('/api/admin/payment-stats', async (req, res) => {
    try {
      const tenants = await storage.getAllTenants();
      
      // Get all orders from all tenants
      const allOrders = [];
      for (const tenant of tenants) {
        const tenantOrders = await storage.getOrdersByTenant(tenant.id);
        allOrders.push(...tenantOrders);
      }

      // Calculate payment-specific stats
      const paidOrders = allOrders.filter(order => order.status === 'paid');
      const pendingOrders = allOrders.filter(order => order.status === 'pending');
      const failedOrders = allOrders.filter(order => order.status === 'failed');
      
      const totalRevenue = paidOrders.reduce((sum, order) => {
        return sum + parseFloat(order.total);
      }, 0);

      const pendingRevenue = pendingOrders.reduce((sum, order) => {
        return sum + parseFloat(order.total);
      }, 0);

      // Calculate today's revenue
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todaysPaidOrders = paidOrders.filter(order => {
        const orderDate = new Date(order.createdAt || new Date());
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === today.getTime();
      });
      
      const todaysRevenue = todaysPaidOrders.reduce((sum, order) => {
        return sum + parseFloat(order.total);
      }, 0);

      const paymentStats = {
        totalRevenue: `R ${totalRevenue.toFixed(2)}`,
        totalTransactions: paidOrders.length,
        pendingPayments: pendingOrders.length,
        pendingRevenue: `R ${pendingRevenue.toFixed(2)}`,
        todaysRevenue: `R ${todaysRevenue.toFixed(2)}`,
        failedPayments: failedOrders.length,
        successRate: allOrders.length > 0 ? ((paidOrders.length / allOrders.length) * 100).toFixed(1) : '0.0',
      };

      res.json(paymentStats);
    } catch (error) {
      console.error('Get payment stats error:', error);
      res.status(500).json({ error: 'Failed to get payment statistics' });
    }
  });

  // === VENDOR API ENDPOINTS ===
  
  // Get vendor dashboard stats for tenant owner
  app.get('/api/vendor/stats', requireAuth, requireTenantOwner, async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user!;
      
      // Get the tenant this user owns
      let tenantId = user.tenantId;
      if (!tenantId) {
        return res.status(404).json({ error: 'No tenant associated with this user' });
      }

      // Get tenant orders
      const orders = await storage.getOrdersByTenant(tenantId);
      const paidOrders = orders.filter(order => order.status === 'paid');
      
      // Calculate revenue
      const totalRevenue = paidOrders.reduce((sum, order) => {
        return sum + parseFloat(order.total);
      }, 0);

      // Get products for this tenant
      const products = await storage.getProductsByTenant(tenantId);

      // Get unique customers (based on email from orders)
      const uniqueCustomers = new Set();
      paidOrders.forEach(order => {
        if (order.customerEmail) {
          uniqueCustomers.add(order.customerEmail);
        }
      });

      const vendorStats = {
        totalRevenue: `R ${totalRevenue.toFixed(2)}`,
        totalOrders: orders.length,
        totalProducts: products.length,
        totalCustomers: uniqueCustomers.size,
      };

      res.json(vendorStats);
    } catch (error) {
      console.error('Get vendor stats error:', error);
      res.status(500).json({ error: 'Failed to get vendor statistics' });
    }
  });

  // Get vendor orders
  app.get('/api/vendor/orders', requireAuth, requireTenantOwner, async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user!;
      
      let tenantId = user.tenantId;
      if (!tenantId) {
        return res.status(404).json({ error: 'No tenant associated with this user' });
      }

      const orders = await storage.getOrdersByTenant(tenantId);
      
      // Sort by creation date (newest first)
      orders.sort((a, b) => {
        if (!a.createdAt && !b.createdAt) return 0;
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      res.json(orders);
    } catch (error) {
      console.error('Get vendor orders error:', error);
      res.status(500).json({ error: 'Failed to get vendor orders' });
    }
  });

  // Get vendor products
  app.get('/api/vendor/products', requireAuth, requireTenantOwner, async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user!;
      
      let tenantId = user.tenantId;
      if (!tenantId) {
        return res.status(404).json({ error: 'No tenant associated with this user' });
      }

      const products = await storage.getProductsByTenant(tenantId);
      res.json(products);
    } catch (error) {
      console.error('Get vendor products error:', error);
      res.status(500).json({ error: 'Failed to get vendor products' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
