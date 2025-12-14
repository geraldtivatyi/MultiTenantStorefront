import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { paystackService, type PaystackWebhookEvent } from "./services/paystack";
import { whatsappService, type WhatsAppWebhookEvent } from "./services/whatsapp";
import { emailService } from "./services/email";
import { pudoService } from "./services/pudo";
import { cloudinaryService } from "./services/cloudinary";
import { 
  AuthService, 
  authMiddleware, 
  requireAuth, 
  requireAdmin, 
  requirePlatformAdmin,
  setSessionCookie, 
  clearSessionCookie,
  type AuthenticatedRequest 
} from "./auth";
import { 
  insertStoreSettingsSchema,
  insertProductSchema, 
  insertCartItemSchema,
  insertOrderSchema,
  insertOrderItemSchema,
  insertUserSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint (before auth middleware)
  app.get('/api/health', async (req: Request, res: Response) => {
    try {
      // Simple database connectivity check
      await storage.getStoreSettings(); // This will fail if DB is down
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'e-commerce-api'
      });
    } catch (error) {
      res.status(503).json({ 
        status: 'unhealthy', 
        timestamp: new Date().toISOString(),
        error: 'Database connection failed'
      });
    }
  });

  // Apply authentication middleware to all routes
  app.use(authMiddleware);

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

      // Generate email verification token
      const verificationToken = AuthService.generateVerificationToken();
      const verificationTokenExpires = new Date();
      verificationTokenExpires.setHours(verificationTokenExpires.getHours() + 24); // 24 hours

      // Create user
      const user = await storage.createUser({
        username: data.username,
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: "customer",
        isAdmin: false,
        emailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationTokenExpires: verificationTokenExpires,
        isActive: true,
      });

      // Send verification email
      try {
        const verificationUrl = `${req.protocol}://${req.get('host')}/verify-email?token=${verificationToken}`;
        await emailService.sendEmailVerification({
          email: data.email,
          name: data.firstName || data.username,
          verificationUrl,
        });
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Don't fail registration if email fails
      }

      // Create session
      const sessionId = await AuthService.createSession(user.id);
      setSessionCookie(res, sessionId);

      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.status(201).json({ 
        user: userWithoutPassword,
        message: 'Registration successful. Please check your email to verify your account.'
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
    console.log('Auth status check - User:', req.user ? { id: req.user.id, role: req.user.role } : 'null');
    res.json({ 
      authenticated: !!req.user,
      user: req.user ? { 
        id: req.user.id, 
        username: req.user.username, 
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        phone: req.user.phone,
        role: req.user.role,
        isAdmin: req.user.isAdmin,
        emailVerified: req.user.emailVerified
      } : null 
    });
  });

  // Verify email
  app.get('/api/auth/verify-email', async (req: AuthenticatedRequest, res) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        return res.status(400).json({ error: 'Verification token is required' });
      }

      const user = await storage.getUserByVerificationToken(token);
      if (!user) {
        return res.status(400).json({ error: 'Invalid or expired verification token' });
      }

      // Check if token is expired
      if (user.emailVerificationTokenExpires && new Date(user.emailVerificationTokenExpires) < new Date()) {
        return res.status(400).json({ error: 'Verification token has expired' });
      }

      // Verify email
      await storage.updateUserProfile(user.id, {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationTokenExpires: null,
      });

      res.json({ 
        success: true,
        message: 'Email verified successfully'
      });
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({ error: 'Failed to verify email' });
    }
  });

  // Resend verification email
  app.post('/api/auth/resend-verification', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (req.user.emailVerified) {
        return res.status(400).json({ error: 'Email is already verified' });
      }

      // Generate new verification token
      const verificationToken = AuthService.generateVerificationToken();
      const verificationTokenExpires = new Date();
      verificationTokenExpires.setHours(verificationTokenExpires.getHours() + 24);

      // Update user with new token
      await storage.updateUserProfile(req.user.id, {
        emailVerificationToken: verificationToken,
        emailVerificationTokenExpires: verificationTokenExpires,
      });

      // Send verification email
      const verificationUrl = `${req.protocol}://${req.get('host')}/verify-email?token=${verificationToken}`;
      await emailService.sendEmailVerification({
        email: req.user.email,
        name: req.user.firstName || req.user.username,
        verificationUrl,
      });

      res.json({ 
        success: true,
        message: 'Verification email sent successfully'
      });
    } catch (error) {
      console.error('Resend verification error:', error);
      res.status(500).json({ error: 'Failed to send verification email' });
    }
  });

  // Request password reset
  app.post('/api/auth/forgot-password', async (req: AuthenticatedRequest, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if user exists for security
        return res.json({ 
          success: true,
          message: 'If an account exists with this email, a password reset link has been sent.'
        });
      }

      // Generate password reset token
      const resetToken = AuthService.generatePasswordResetToken();
      const resetTokenExpires = new Date();
      resetTokenExpires.setHours(resetTokenExpires.getHours() + 1); // 1 hour

      // Update user with reset token
      await storage.updateUserProfile(user.id, {
        passwordResetToken: resetToken,
        passwordResetTokenExpires: resetTokenExpires,
      });

      // Send password reset email
      const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`;
      await emailService.sendPasswordReset({
        email: user.email,
        name: user.firstName || user.username,
        resetUrl,
      });

      res.json({ 
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ error: 'Failed to process password reset request' });
    }
  });

  // Reset password
  app.post('/api/auth/reset-password', async (req: AuthenticatedRequest, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token and new password are required' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }

      const user = await storage.getUserByPasswordResetToken(token);
      if (!user) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }

      // Check if token is expired
      if (user.passwordResetTokenExpires && new Date(user.passwordResetTokenExpires) < new Date()) {
        return res.status(400).json({ error: 'Reset token has expired' });
      }

      // Hash new password
      const hashedPassword = await AuthService.hashPassword(newPassword);

      // Update password and clear reset token
      await storage.updateUserProfile(user.id, {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetTokenExpires: null,
      });

      res.json({ 
        success: true,
        message: 'Password reset successfully'
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  });

  // Create demo user (for testing - remove in production)
  app.post('/api/auth/create-demo-user', async (req, res) => {
    try {
      // Check if demo user already exists
      const existingUser = await storage.getUserByEmail('demo@fashionstore.co.za');
      if (existingUser) {
        return res.json({ message: 'Demo user already exists' });
      }

      // Create demo user
      const hashedPassword = await AuthService.hashPassword('demo123');
      const user = await storage.createUser({
        username: 'demo',
        email: 'demo@fashionstore.co.za',
        password: hashedPassword,
        firstName: 'Demo',
        lastName: 'User',
        phone: '+27 12 345 6789',
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

  // Get store settings
  app.get('/api/storefront/settings', async (req: AuthenticatedRequest, res) => {
    try {
      const settings = await storage.getStoreSettings();
      
      // Return default settings if none exist (instead of 404)
      if (!settings) {
        return res.json({
          id: 0,
          name: 'M Blessings',
          heroTitle: 'Welcome to M Blessings',
          heroSubtitle: 'Discover quality products and excellent service',
          heroImageUrl: undefined,
          deliveryOptions: ["collection", "pudo"], // Default to both options
          pudoCollectionAddress: undefined,
          pudoPreferredLocker: undefined,
          aboutStory: undefined,
          aboutValues: undefined,
          aboutStats: undefined,
          aboutImages: undefined,
          contactEmail: undefined,
          contactPhone: undefined,
          contactAddress: undefined,
          storeHours: undefined,
          address: undefined,
          whatsappPhone: undefined,
        });
      }

      // Ensure deliveryOptions always includes both collection and pudo
      let deliveryOptions = settings.deliveryOptions && settings.deliveryOptions.length > 0 
        ? [...settings.deliveryOptions] 
        : ["collection", "pudo"];
      
      // Always include "collection" and "pudo" if not already present
      if (!deliveryOptions.includes("collection")) {
        deliveryOptions.push("collection");
      }
      if (!deliveryOptions.includes("pudo")) {
        deliveryOptions.push("pudo");
      }

      res.json({
        id: settings.id,
        name: settings.name,
        heroTitle: settings.heroTitle || `Welcome to ${settings.name}`,
        heroSubtitle: settings.heroSubtitle || 'Discover quality products and excellent service',
        heroImageUrl: settings.heroImageUrl,
        deliveryOptions: deliveryOptions,
        pudoCollectionAddress: settings.pudoCollectionAddress,
        pudoPreferredLocker: settings.pudoPreferredLocker,
        // About page content
        aboutStory: settings.aboutStory,
        aboutValues: settings.aboutValues,
        aboutStats: settings.aboutStats,
        aboutImages: settings.aboutImages,
        // Contact page content
        contactEmail: settings.contactEmail,
        contactPhone: settings.contactPhone,
        contactAddress: settings.contactAddress,
        storeHours: settings.storeHours,
        // Fallback fields
        address: settings.address,
        whatsappPhone: settings.whatsappPhone,
      });
    } catch (error) {
      console.error('Get store settings error:', error);
      // Return default settings even on error
      res.json({
        id: 0,
        name: 'My Store',
        heroTitle: 'Welcome to My Store',
        heroSubtitle: 'Discover amazing products',
        deliveryOptions: ["collection", "pudo"],
      });
    }
  });

  // Get products
  app.get('/api/storefront/products', async (req: AuthenticatedRequest, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      console.error('Get products error:', error);
      res.status(500).json({ error: 'Failed to get products' });
    }
  });

  // Get single product
  app.get('/api/storefront/products/:id', async (req: AuthenticatedRequest, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);
      
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
  app.get('/api/cart', async (req: AuthenticatedRequest, res) => {
    try {
      const sessionId = req.headers['x-session-id'] as string || 'anonymous';
      const cartItems = await storage.getCartItems(sessionId);
      res.json(cartItems);
    } catch (error) {
      console.error('Get cart error:', error);
      res.status(500).json({ error: 'Failed to get cart items' });
    }
  });

  app.post('/api/cart', async (req: AuthenticatedRequest, res) => {
    try {
      const sessionId = req.headers['x-session-id'] as string || 'anonymous';
      const cartItemData = insertCartItemSchema.parse({
        ...req.body,
        sessionId,
      });

      // Verify product exists
      const product = await storage.getProduct(cartItemData.productId);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Check if product is active
      if (!product.isActive) {
        return res.status(400).json({ error: 'This product is currently unavailable' });
      }

      // Check stock availability
      if (product.stock !== null && product.stock < cartItemData.quantity) {
        return res.status(400).json({ 
          error: `Only ${product.stock} item(s) available in stock`,
          availableStock: product.stock
        });
      }

      // Check if item already exists in cart and validate total quantity
      const existingCartItems = await storage.getCartItems(sessionId);
      const existingItem = existingCartItems.find(item => item.productId === cartItemData.productId);
      const currentQuantity = existingItem ? existingItem.quantity : 0;
      const newTotalQuantity = currentQuantity + cartItemData.quantity;

      if (product.stock !== null && product.stock < newTotalQuantity) {
        return res.status(400).json({ 
          error: `Only ${product.stock} item(s) available. You already have ${currentQuantity} in your cart.`,
          availableStock: product.stock,
          currentInCart: currentQuantity
        });
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

  app.put('/api/cart/:id', async (req: AuthenticatedRequest, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const { quantity } = req.body;

      if (!quantity || quantity < 1) {
        return res.status(400).json({ error: 'Invalid quantity' });
      }

      // Get the cart item to check product stock
      const sessionId = req.headers['x-session-id'] as string || 'anonymous';
      const cartItems = await storage.getCartItems(sessionId);
      const cartItem = cartItems.find(item => item.id === itemId);
      
      if (!cartItem) {
        return res.status(404).json({ error: 'Cart item not found' });
      }

      // Check product stock
      const product = cartItem.product;
      if (!product.isActive) {
        return res.status(400).json({ error: 'This product is currently unavailable' });
      }

      if (product.stock !== null && product.stock < quantity) {
        return res.status(400).json({ 
          error: `Only ${product.stock} item(s) available in stock`,
          availableStock: product.stock
        });
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

  app.delete('/api/cart/:id', async (req: AuthenticatedRequest, res) => {
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
    customerPhone: z.string().optional(), // Customer phone number for notifications
    shippingAddress: z.string().min(1),
    city: z.string().min(1),
    postalCode: z.string().min(1),
    deliveryMethod: z.enum(["collection", "pudo"]),
    pudoLocker: z.string().optional(),
    shippingCost: z.number().default(0),
    totalAmount: z.number().optional(),
  });

  app.post('/api/orders/checkout', async (req: AuthenticatedRequest, res) => {
    try {
      const sessionId = req.headers['x-session-id'] as string || 'anonymous';
      const checkoutData = checkoutSchema.parse(req.body);
      const userId = req.user?.id; // Optional - will be null for guest users

      // Get cart items
      const cartItems = await storage.getCartItems(sessionId);
      if (cartItems.length === 0) {
        return res.status(400).json({ error: 'Cart is empty' });
      }

      // Validate stock availability for all items before checkout
      for (const cartItem of cartItems) {
        const product = await storage.getProduct(cartItem.productId);
        if (!product) {
          return res.status(400).json({ error: `Product "${cartItem.product.name}" no longer exists` });
        }
        if (!product.isActive) {
          return res.status(400).json({ error: `Product "${product.name}" is currently unavailable` });
        }
        if (product.stock !== null && product.stock < cartItem.quantity) {
          return res.status(400).json({ 
            error: `Insufficient stock for "${product.name}". Only ${product.stock} item(s) available.`,
            productName: product.name,
            availableStock: product.stock,
            requestedQuantity: cartItem.quantity
          });
        }
      }

      // Calculate totals
      const subtotal = cartItems.reduce((sum, item) => 
        sum + (parseFloat(item.product.price) * item.quantity), 0
      );
      const tax = 0; // No tax - client does not have VAT yet
      const shippingCost = checkoutData.shippingCost || 0;
      const total = subtotal + shippingCost; // Total = subtotal + shipping (no tax)

      // Create order with delivery information
      const orderData = insertOrderSchema.parse({
        userId: userId || undefined, // Link to authenticated user if available
        customerEmail: checkoutData.customerEmail,
        customerName: checkoutData.customerName,
        customerPhone: checkoutData.customerPhone || undefined,
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
        amount: Math.round(total * 100), // Convert to cents for ZAR
        email: checkoutData.customerEmail,
        currency: 'ZAR', // Using South African Rand as originally intended
        reference: paystackService.generateReference('ORD'),
        metadata: {
          orderId: order.id,
          sessionId: sessionId, // Store sessionId to clear cart after successful payment
        },
      });

      console.log('Paystack response:', paystackData);

      // Update order with Paystack reference
      await storage.updateOrderStatus(order.id, 'pending');

      // Don't clear cart here - wait for payment confirmation
      // Cart will be cleared in the webhook when payment succeeds

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
          const sessionId = event.data.metadata?.sessionId;
          
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

            // Clear cart only after successful payment
            if (sessionId) {
              try {
                await storage.clearCart(sessionId);
                console.log(`Cart cleared for session ${sessionId} after successful payment for order ${orderId}`);
              } catch (cartError) {
                console.error(`Failed to clear cart for session ${sessionId}:`, cartError);
                // Don't fail the payment processing if cart clearing fails
              }
            }

            // Create Pudo shipment if delivery method is Pudo
            try {
              const order = await storage.getOrder(orderId);
              if (order && order.deliveryMethod === 'pudo' && order.pudoLocker) {
                const storeSettings = await storage.getStoreSettings();
                const orderItems = await storage.getOrderItems(orderId);
                
                if (storeSettings?.pudoCollectionAddress && orderItems.length > 0) {
                  // Calculate combined dimensions and weight
                  let totalWeight = 0;
                  let maxLength = 0;
                  let maxWidth = 0;
                  let totalHeight = 0;

                  for (const item of orderItems) {
                    const product = await storage.getProduct(item.productId);
                    if (product?.pudoDimensions && product.pudoWeight) {
                      const dimensions = product.pudoDimensions as any;
                      const weight = parseFloat(product.pudoWeight.toString());
                      
                      totalWeight += weight * item.quantity;
                      maxLength = Math.max(maxLength, dimensions.length || 0);
                      maxWidth = Math.max(maxWidth, dimensions.width || 0);
                      totalHeight += (dimensions.height || 0) * item.quantity;
                    }
                  }

                  // Create Pudo shipment
                  const shipment = await pudoService.createShipment(
                    storeSettings.pudoCollectionAddress as any,
                    {
                      name: storeSettings.name || 'Store',
                      email: storeSettings.contactEmail || storeSettings.ownerEmail || '',
                      phone: storeSettings.contactPhone || storeSettings.ownerPhone || ''
                    },
                    order.pudoLocker,
                    {
                      name: order.customerName,
                      email: order.customerEmail,
                      phone: order.customerPhone || '' // Use customer phone from order
                    },
                    {
                      length: maxLength,
                      width: maxWidth,
                      height: totalHeight
                    },
                    totalWeight,
                    `Order #${order.orderNumber}`,
                    order.orderNumber
                  );

                  // Update order with Courier Guy shipment details
                  // Handle different possible response formats
                  const shipmentId = shipment.id || shipment.shipment_id;
                  const trackingRef = shipment.short_tracking_reference || shipment.tracking_reference;
                  
                  await storage.updateOrder(orderId, {
                    pudoShipmentId: shipmentId ? parseInt(shipmentId.toString()) : undefined,
                    pudoTrackingReference: trackingRef || undefined
                  });

                  console.log(`Courier Guy shipment created for order ${orderId}: ${trackingRef || 'N/A'}`);
                }
              }
            } catch (pudoError) {
              console.error('Error creating Courier Guy shipment:', pudoError);
              // Don't fail the payment processing if shipment creation fails
            }

            // Send notifications to store admin and customer
            try {
              const order = await storage.getOrder(orderId);
              if (order) {
              const storeSettings = await storage.getStoreSettings();
              const orderItems = await storage.getOrderItems(orderId);
              
              if (storeSettings && orderItems.length > 0) {
                // Prepare notification data
                const notificationData = {
                  orderId: order.id,
                  storeName: storeSettings.name,
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

                // Send WhatsApp notification if configured
                if (storeSettings.whatsappPhone) {
                  try {
                    await whatsappService.sendOrderNotification(
                      storeSettings.whatsappPhone,
                      {
                        orderId: notificationData.orderId,
                        storeName: notificationData.storeName,
                        customerName: notificationData.customerName,
                        totalAmount: notificationData.totalAmount,
                        currency: notificationData.currency,
                        itemCount: notificationData.itemCount,
                      }
                    );
                    console.log(`WhatsApp notification sent for order ${orderId}`);
                  } catch (whatsappError) {
                    console.error('Failed to send WhatsApp notification:', whatsappError);
                  }
                }

                // Send email notification to store admin
                if (storeSettings.contactEmail) {
                  try {
                    await emailService.sendOrderNotificationToVendor({
                      vendorEmail: storeSettings.contactEmail,
                      storeName: notificationData.storeName,
                      orderId: notificationData.orderId,
                      customerName: notificationData.customerName,
                      customerEmail: notificationData.customerEmail,
                      totalAmount: notificationData.totalAmount,
                      currency: notificationData.currency,
                      itemCount: notificationData.itemCount,
                      items: notificationData.items,
                    });
                    console.log(`Email notification sent for order ${orderId}`);
                  } catch (emailError) {
                    console.error('Failed to send email notification:', emailError);
                  }
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

  // Dashboard stats endpoint
  app.get('/api/admin/stats', requireAuth, requirePlatformAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      // Get all products
      const products = await storage.getAllProducts();
      
      // Get all orders
      const allOrders = await storage.getAllOrders();
      
      // Calculate revenue from paid orders
      const paidOrders = allOrders.filter(order => order.status === 'paid');
      const totalRevenue = paidOrders.reduce((sum, order) => {
        return sum + parseFloat(order.total);
      }, 0);
      
      // Get all users
      const allUsers = await storage.getAllUsers();
      
      // Calculate active users (users who have logged in recently or have orders)
      const activeUsers = allUsers.filter(u => {
        // Consider users active if they have orders or logged in within last 90 days
        const hasOrders = allOrders.some(o => o.userId === u.id);
        if (hasOrders) return true;
        if (u.lastLoginAt) {
          const lastLogin = new Date(u.lastLoginAt);
          const daysSinceLogin = (Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceLogin <= 90;
        }
        return false;
      });
      
      const stats = {
        totalProducts: products.length,
        totalRevenue: `R ${totalRevenue.toFixed(2)}`,
        totalOrders: allOrders.length,
        activeUsers: activeUsers.length,
        totalCustomers: allUsers.filter(u => u.role === 'customer').length,
      };
      
      res.json(stats);
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      res.status(500).json({ error: 'Failed to get dashboard statistics' });
    }
  });

  // Store settings management endpoints
  app.get('/api/admin/store-settings', requireAuth, requirePlatformAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const settings = await storage.getStoreSettings();
      if (!settings) {
        return res.status(404).json({ error: 'Store settings not found' });
      }
      res.json(settings);
    } catch (error) {
      console.error('Error fetching store settings:', error);
      res.status(500).json({ error: 'Failed to fetch store settings' });
    }
  });

  app.put('/api/admin/store-settings', requireAuth, requirePlatformAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const updateData = insertStoreSettingsSchema.partial().parse(req.body);
      let settings = await storage.getStoreSettings();
      
      if (!settings) {
        // Create if doesn't exist
        settings = await storage.createStoreSettings({
          name: updateData.name || 'M Blessings',
          ...updateData,
        });
      } else {
        // Update existing
        settings = await storage.updateStoreSettings(updateData);
      }
      
      if (!settings) {
        return res.status(500).json({ error: 'Failed to update store settings' });
      }

      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid store settings data', details: error.errors });
      }
      console.error('Error updating store settings:', error);
      res.status(500).json({ error: 'Failed to update store settings' });
    }
  });


  // Get Courier Guy lockers (public endpoint for checkout)
  // Supports query parameters: lat, lng, order_closest, search, bounding box
  app.get('/api/pudo/lockers', async (req: Request, res: Response) => {
    try {
      const filters: any = {};
      
      // Parse query parameters
      if (req.query.lat) filters.lat = parseFloat(req.query.lat as string);
      if (req.query.lng) filters.lng = parseFloat(req.query.lng as string);
      if (req.query.order_closest === 'true') filters.order_closest = true;
      if (req.query.search) filters.search = req.query.search as string;
      if (req.query.min_lat) filters.min_lat = parseFloat(req.query.min_lat as string);
      if (req.query.max_lat) filters.max_lat = parseFloat(req.query.max_lat as string);
      if (req.query.min_lng) filters.min_lng = parseFloat(req.query.min_lng as string);
      if (req.query.max_lng) filters.max_lng = parseFloat(req.query.max_lng as string);
      
      const lockers = await pudoService.getLockers(Object.keys(filters).length > 0 ? filters : undefined);
      res.json(lockers);
    } catch (error) {
      console.error('Unexpected error fetching Courier Guy lockers:', error);
      // getLockers should always return sample data on error, but just in case:
      res.status(500).json({ error: 'Failed to fetch lockers' });
    }
  });

  // Calculate Courier Guy shipping for products in cart (public endpoint for checkout)
  app.post('/api/pudo/calculate-shipping', async (req: Request, res: Response) => {
    try {
      const { items, deliveryLocker } = req.body; // items with product IDs and quantities
      
      const storeSettings = await storage.getStoreSettings();
      if (!storeSettings) {
        return res.status(400).json({ error: 'Store settings not found' });
      }

      if (!storeSettings.pudoCollectionAddress) {
        return res.status(400).json({ error: 'Collection address not configured for Courier Guy delivery' });
      }

      if (!deliveryLocker) {
        return res.status(400).json({ error: 'Delivery locker location required' });
      }

      // Calculate combined dimensions and weight for all items
      let totalWeight = 0;
      let maxLength = 0;
      let maxWidth = 0;
      let totalHeight = 0;

      for (const item of items) {
        const product = await storage.getProduct(item.productId);
        if (!product || !product.pudoDimensions || !product.pudoWeight) {
          return res.status(400).json({ 
            error: `Product "${product?.name || 'Unknown'}" is not configured for Courier Guy delivery` 
          });
        }

        const dimensions = product.pudoDimensions as any;
        const weight = parseFloat(product.pudoWeight.toString());
        
        totalWeight += weight * item.quantity;
        maxLength = Math.max(maxLength, dimensions.length || 0);
        maxWidth = Math.max(maxWidth, dimensions.width || 0);
        totalHeight += (dimensions.height || 0) * item.quantity;
      }

      // Calculate shipping rate using combined package dimensions
      // Note: collectionAddress is still needed for the service method signature,
      // but the new API uses pickup point IDs internally
      const shipping = await pudoService.calculateShippingRate(
        storeSettings.pudoCollectionAddress as any,
        deliveryLocker,
        {
          length: maxLength,
          width: maxWidth,
          height: totalHeight
        },
        totalWeight
      );

      res.json({
        totalRate: shipping.rate,
        currency: shipping.currency,
        deliveryTime: shipping.delivery_time,
        baseRate: shipping.base_rate
      });
    } catch (error) {
      console.error('Error calculating Courier Guy shipping:', error);
      res.status(500).json({ error: 'Failed to calculate shipping' });
    }
  });

  // Track a Courier Guy shipment (public endpoint)
  app.get('/api/pudo/track/:trackingReference', async (req: Request, res: Response) => {
    try {
      const { trackingReference } = req.params;
      const tracking = await pudoService.trackShipment(trackingReference);
      res.json(tracking);
    } catch (error) {
      console.error('Error tracking Courier Guy shipment:', error);
      res.status(500).json({ error: 'Failed to track shipment' });
    }
  });

  // Get shipment label PDF (admin only)
  app.get('/api/pudo/shipments/:shipmentId/label', requireAuth, requirePlatformAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const shipmentId = parseInt(req.params.shipmentId);
      const labelBuffer = await pudoService.getShipmentLabel(shipmentId);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="shipment-${shipmentId}-label.pdf"`);
      res.send(labelBuffer);
    } catch (error) {
      console.error('Error getting shipment label:', error);
      res.status(500).json({ error: 'Failed to get shipment label' });
    }
  });

  // Cancel a Pudo shipment (admin only)
  app.put('/api/pudo/shipments/:shipmentId/cancel', requireAuth, requirePlatformAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const shipmentId = parseInt(req.params.shipmentId);
      const result = await pudoService.cancelShipment(shipmentId);
      res.json(result);
    } catch (error) {
      console.error('Error cancelling Pudo shipment:', error);
      res.status(500).json({ error: 'Failed to cancel shipment' });
    }
  });

  // Get user orders
  app.get('/api/orders/my-orders', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      
      // Get orders for the authenticated user only
      const orders = await storage.getOrdersByUser(userId);
      res.json(orders);
    } catch (error) {
      console.error('Get orders error:', error);
      res.status(500).json({ error: 'Failed to get orders' });
    }
  });

  // Get order items for a specific order
  app.get('/api/orders/:orderId/items', requireAuth, async (req: AuthenticatedRequest, res) => {
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
  app.post('/api/orders/:orderId/reorder', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      if (!orderId) {
        return res.status(400).json({ error: 'Invalid order ID' });
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
  app.post('/api/orders/:orderId/complete-payment', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      if (!orderId) {
        return res.status(400).json({ error: 'Invalid order ID' });
      }

      // Get the order
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Verify user has access to this order
      if (req.user && req.user.role !== 'platform_admin' && order.userId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      if (order.status !== 'pending') {
        return res.status(400).json({ error: 'Order is not pending payment' });
      }

      // Initialize Paystack transaction
      const transactionData = {
        amount: Math.round(parseFloat(order.total) * 100), // Convert to cents for ZAR
        email: order.customerEmail,
        currency: 'ZAR', // Using South African Rand as originally intended
        reference: `${order.orderNumber}_${Date.now()}`,
        callback_url: `${req.protocol}://${req.get('host')}/orders/${orderId}/payment-success`,
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
        },
      };

      const paystackResponse = await paystackService.initializeTransaction(transactionData);
      
      // Check if the response has the expected structure
      if (!paystackResponse.status || !paystackResponse.data) {
        throw new Error('Invalid response from Paystack API');
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

  // Cancel order
  app.post('/api/orders/:orderId/cancel', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      if (!orderId) {
        return res.status(400).json({ error: 'Invalid order ID' });
      }

      // Get order to verify ownership and status
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Verify user has access to this order (must be the order owner or admin)
      if (req.user && req.user.role !== 'platform_admin' && order.userId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Check if order can be cancelled (only pending orders can be cancelled)
      if (order.status !== 'pending') {
        return res.status(400).json({ error: 'Only pending orders can be cancelled' });
      }

      // Restore stock for all items in the order
      try {
        const orderItems = await storage.getOrderItems(orderId);
        for (const item of orderItems) {
          const product = await storage.getProduct(item.productId);
          if (product) {
            const currentStock = product.stock || 0;
            const newStock = currentStock + item.quantity;
            await storage.updateProduct(item.productId, { stock: newStock });
          }
        }
      } catch (stockError) {
        console.error('Error restoring stock:', stockError);
        // Continue with cancellation even if stock restoration fails
      }

      // Update order status to cancelled
      const updatedOrder = await storage.updateOrderStatus(orderId, 'cancelled');
      if (!updatedOrder) {
        return res.status(500).json({ error: 'Failed to cancel order' });
      }

      res.json({ message: 'Order cancelled successfully', order: updatedOrder });
    } catch (error) {
      console.error('Error cancelling order:', error);
      res.status(500).json({ error: 'Failed to cancel order' });
    }
  });

  // Get all products across all tenants (admin)
  app.get('/api/admin/products', requireAuth, requirePlatformAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      console.error('Get all products error:', error);
      res.status(500).json({ error: 'Failed to get products' });
    }
  });



  // Get all orders (admin)
  app.get('/api/admin/orders', requireAuth, requirePlatformAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const allOrders = await storage.getAllOrders();
      
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
  app.get('/api/admin/payments', requireAuth, requirePlatformAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const allOrders = await storage.getAllOrders();
      
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
  app.get('/api/admin/payment-stats', requireAuth, requirePlatformAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const allOrders = await storage.getAllOrders();

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

  // Admin order status update
  app.put('/api/admin/orders/:id/update-status', requireAuth, requirePlatformAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { status } = req.body;

      if (!orderId || !status) {
        return res.status(400).json({ error: 'Order ID and status are required' });
      }

      // Valid status transitions
      const validStatuses = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      // Get order
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Validate status transition
      const currentStatus = order.status;
      const validTransitions: Record<string, string[]> = {
        'pending': ['paid', 'cancelled'],
        'paid': ['processing', 'cancelled'],
        'processing': ['shipped', 'cancelled'],
        'shipped': ['delivered'],
        'delivered': [],
        'cancelled': []
      };

      if (!validTransitions[currentStatus]?.includes(status)) {
        return res.status(400).json({ 
          error: `Cannot change status from ${currentStatus} to ${status}`,
          validTransitions: validTransitions[currentStatus] || []
        });
      }

      // Update order status
      const updatedOrder = await storage.updateOrderStatus(orderId, status);

      if (!updatedOrder) {
        return res.status(500).json({ error: 'Failed to update order status' });
      }

      // Send notifications if status changed to shipped or delivered
      if (status === 'shipped' || status === 'delivered') {
        try {
          const storeSettings = await storage.getStoreSettings();
          if (storeSettings && order.customerEmail) {
            // Send email notification
            await emailService.sendOrderStatusUpdate({
              customerEmail: order.customerEmail,
              customerName: order.customerName,
              orderId: order.id,
              orderNumber: order.orderNumber,
              storeName: storeSettings.name,
              status: status,
              trackingInfo: order.pudoTrackingReference || undefined,
            });

            // Send WhatsApp notification if customer phone is available
            if (order.customerPhone && storeSettings.whatsappPhone) {
              try {
                await whatsappService.sendOrderStatusUpdate(
                  order.customerPhone,
                  {
                    orderId: order.id,
                    storeName: storeSettings.name,
                    status: status,
                    trackingInfo: order.pudoTrackingReference || undefined,
                  }
                );
                console.log(`WhatsApp status update sent for order ${orderId}`);
              } catch (whatsappError) {
                console.error('Failed to send WhatsApp status update:', whatsappError);
              }
            }
          }
        } catch (emailError) {
          console.error('Failed to send status update email:', emailError);
          // Don't fail the request if email fails
        }
      }

      res.json({ 
        success: true, 
        order: updatedOrder,
        message: `Order status updated to ${status}`
      });
    } catch (error) {
      console.error('Update order status error:', error);
      res.status(500).json({ error: 'Failed to update order status' });
    }
  });

  // Admin product image upload
  app.post('/api/admin/products/upload-image', requireAuth, requirePlatformAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { imageBase64 } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: 'Image data is required' });
      }

      if (!cloudinaryService.isConfigured()) {
        return res.status(500).json({ 
          error: 'Image upload is not configured. Please configure Cloudinary environment variables.' 
        });
      }

      // Upload to Cloudinary
      const uploadResult = await cloudinaryService.uploadImageFromBase64(
        imageBase64,
        'products'
      );

      res.json({
        success: true,
        imageUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      });
    } catch (error: any) {
      console.error('Image upload error:', error);
      res.status(500).json({ 
        error: 'Failed to upload image',
        message: error.message || 'Unknown error'
      });
    }
  });

  // Admin create product
  app.post('/api/admin/products', requireAuth, requirePlatformAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { name, description, price, stock, pudoWeight, pudoDimensions, imageUrl, category } = req.body;

      if (!name || !price || stock === undefined || !pudoWeight || !pudoDimensions) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const product = await storage.createProduct({
        name,
        description: description || '',
        price: typeof price === 'number' ? price.toString() : price,
        stock: parseInt(stock),
        pudoWeight: typeof pudoWeight === 'number' ? pudoWeight.toString() : pudoWeight,
        pudoDimensions: JSON.stringify(pudoDimensions),
        imageUrl: imageUrl || null,
        category: category || null,
      });

      res.json(product);
    } catch (error) {
      console.error('Create product error:', error);
      res.status(500).json({ error: 'Failed to create product' });
    }
  });

  // Admin update product
  app.put('/api/admin/products/:id', requireAuth, requirePlatformAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const productId = parseInt(req.params.id);
      const { name, description, price, stock, pudoWeight, pudoDimensions, imageUrl, category } = req.body;

      // Verify product exists
      const existingProduct = await storage.getProduct(productId);
      if (!existingProduct) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (price !== undefined) updateData.price = typeof price === 'number' ? price.toString() : price;
      if (stock !== undefined) updateData.stock = parseInt(stock);
      if (pudoWeight !== undefined) updateData.pudoWeight = typeof pudoWeight === 'number' ? pudoWeight.toString() : pudoWeight;
      if (pudoDimensions !== undefined) updateData.pudoDimensions = JSON.stringify(pudoDimensions);
      if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
      if (category !== undefined) updateData.category = category;

      const updatedProduct = await storage.updateProduct(productId, updateData);
      res.json(updatedProduct);
    } catch (error) {
      console.error('Update product error:', error);
      res.status(500).json({ error: 'Failed to update product' });
    }
  });

  // Admin delete product
  app.delete('/api/admin/products/:id', requireAuth, requirePlatformAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const productId = parseInt(req.params.id);

      // Verify product exists
      const existingProduct = await storage.getProduct(productId);
      if (!existingProduct) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Soft delete by setting stock to 0
      await storage.updateProduct(productId, { stock: 0 });
      
      res.json({ message: 'Product deactivated successfully' });
    } catch (error) {
      console.error('Delete product error:', error);
      res.status(500).json({ error: 'Failed to delete product' });
    }
  });

  // Contact form endpoint
  app.post('/api/contact', async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;

      if (!name || !email || !subject || !message) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      // Import email service
      const { emailService } = await import('./services/email');

      console.log('SENDGRID_FROM_EMAIL:', process.env.SENDGRID_FROM_EMAIL);
      console.log('Available env vars:', Object.keys(process.env).filter(k => k.includes('SENDGRID')));

      // Send email notification
      const emailSent = await emailService.sendEmail({
        to: 'geraldtivatyi@gmail.com',
        subject: `Contact Form: ${subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">
              New Contact Form Submission
            </h2>
            
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #555; margin-top: 0;">Contact Details</h3>
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Subject:</strong> ${subject}</p>
            </div>
            
            <div style="background-color: #fff; padding: 20px; border-left: 4px solid #007bff; margin: 20px 0;">
              <h3 style="color: #555; margin-top: 0;">Message</h3>
              <p style="line-height: 1.6; color: #333;">${message.replace(/\n/g, '<br>')}</p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
              <p>This email was sent from the Fashion Store contact form.</p>
            </div>
          </div>
        `,
        text: `
New Contact Form Submission

Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}
        `,
      });

      if (emailSent) {
        res.json({ success: true, message: 'Contact form submitted successfully' });
      } else {
        res.status(500).json({ error: 'Failed to send email notification' });
      }
    } catch (error) {
      console.error('Contact form error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
