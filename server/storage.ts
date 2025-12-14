import { 
  storeSettings,
  users, 
  userSessions,
  userAddresses,
  userPreferences,
  products, 
  cartItems, 
  orders, 
  orderItems,
  paymentTransactions,
  type StoreSettings, 
  type InsertStoreSettings,
  type User, 
  type InsertUser,
  type UserSession,
  type InsertUserSession,
  type UserAddress,
  type InsertUserAddress,
  type UserPreferences,
  type InsertUserPreferences,
  type Product,
  type InsertProduct,
  type CartItem,
  type InsertCartItem,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type PaymentTransaction,
  type InsertPaymentTransaction
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, lt } from "drizzle-orm";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  getUserByPasswordResetToken(token: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  deleteUser(id: number): Promise<void>;
  updateUserLastLogin(id: number): Promise<void>;
  updateUserProfile(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;

  // Session management
  createUserSession(session: InsertUserSession): Promise<UserSession>;
  getUserSession(sessionId: string): Promise<UserSession | undefined>;
  deleteUserSession(sessionId: string): Promise<void>;
  cleanupExpiredSessions(): Promise<void>;

  // Store settings management
  getStoreSettings(): Promise<StoreSettings | undefined>;
  updateStoreSettings(updates: Partial<InsertStoreSettings>): Promise<StoreSettings | undefined>;
  createStoreSettings(settings: InsertStoreSettings): Promise<StoreSettings>;

  // Product management
  getProduct(id: number): Promise<Product | undefined>;
  getAllProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;

  // Cart management
  getCartItems(sessionId: string): Promise<(CartItem & { product: Product })[]>;
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: number, quantity: number): Promise<CartItem | undefined>;
  removeFromCart(id: number): Promise<void>;
  clearCart(sessionId: string): Promise<void>;

  // Order management
  getOrder(id: number): Promise<Order | undefined>;
  getAllOrders(): Promise<Order[]>;
  getOrdersByUser(userId: number): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  updateOrder(id: number, updates: Partial<InsertOrder>): Promise<Order | undefined>;

  // Order items
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
  getOrderItems(orderId: number): Promise<(OrderItem & { product: Product })[]>;

  // Payment transactions
  createPaymentTransaction(transaction: InsertPaymentTransaction): Promise<PaymentTransaction>;
  getPaymentTransactionByReference(reference: string): Promise<PaymentTransaction | undefined>;
  updatePaymentTransaction(id: number, updates: Partial<InsertPaymentTransaction>): Promise<PaymentTransaction | undefined>;

  // User addresses
  getUserAddresses(userId: number): Promise<UserAddress[]>;
  getUserDefaultAddress(userId: number): Promise<UserAddress | undefined>;
  createUserAddress(address: InsertUserAddress): Promise<UserAddress>;
  updateUserAddress(id: number, updates: Partial<InsertUserAddress>): Promise<UserAddress | undefined>;
  deleteUserAddress(id: number): Promise<void>;
  setDefaultAddress(userId: number, addressId: number): Promise<void>;

  // User preferences
  getUserPreferences(userId: number): Promise<UserPreferences | undefined>;
  createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences>;
  updateUserPreferences(userId: number, updates: Partial<InsertUserPreferences>): Promise<UserPreferences | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      and(
        eq(users.emailVerificationToken, token),
        // Token should not be expired
        // Note: We'll check expiration in the route handler
      )
    );
    return user || undefined;
  }

  async getUserByPasswordResetToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      eq(users.passwordResetToken, token)
    );
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUserLastLogin(id: number): Promise<void> {
    await db
      .update(users)
      .set({ 
        lastLoginAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, id));
  }

  async updateUserProfile(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ 
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  // Session methods
  async createUserSession(insertSession: InsertUserSession): Promise<UserSession> {
    const [session] = await db.insert(userSessions).values(insertSession).returning();
    return session;
  }

  async getUserSession(sessionId: string): Promise<UserSession | undefined> {
    const [session] = await db.select().from(userSessions).where(eq(userSessions.id, sessionId));
    return session || undefined;
  }

  async deleteUserSession(sessionId: string): Promise<void> {
    await db.delete(userSessions).where(eq(userSessions.id, sessionId));
  }

  async cleanupExpiredSessions(): Promise<void> {
    await db.delete(userSessions).where(lt(userSessions.expiresAt, new Date()));
  }

  // Store settings methods
  async getStoreSettings(): Promise<StoreSettings | undefined> {
    const [settings] = await db.select().from(storeSettings).limit(1);
    return settings || undefined;
  }

  async updateStoreSettings(updates: Partial<InsertStoreSettings>): Promise<StoreSettings | undefined> {
    const [settings] = await db
      .update(storeSettings)
      .set({ 
        ...updates,
        updatedAt: new Date()
      })
      .returning();
    return settings || undefined;
  }

  async createStoreSettings(insertSettings: InsertStoreSettings): Promise<StoreSettings> {
    const [settings] = await db.insert(storeSettings).values(insertSettings).returning();
    return settings;
  }

  // Product methods
  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products)
      .where(eq(products.isActive, true))
      .orderBy(desc(products.createdAt));
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(insertProduct).returning();
    return product;
  }

  async updateProduct(id: number, updateData: Partial<InsertProduct>): Promise<Product | undefined> {
    const [product] = await db.update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning();
    return product || undefined;
  }

  // Cart methods
  async getCartItems(sessionId: string): Promise<(CartItem & { product: Product })[]> {
    return await db.select({
      id: cartItems.id,
      sessionId: cartItems.sessionId,
      productId: cartItems.productId,
      quantity: cartItems.quantity,
      createdAt: cartItems.createdAt,
      product: products,
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.sessionId, sessionId));
  }

  async addToCart(insertCartItem: InsertCartItem): Promise<CartItem> {
    // Check if item already exists in cart
    const [existingItem] = await db.select().from(cartItems)
      .where(and(
        eq(cartItems.sessionId, insertCartItem.sessionId),
        eq(cartItems.productId, insertCartItem.productId)
      ));

    if (existingItem) {
      // Update quantity if item exists
      const [updated] = await db.update(cartItems)
        .set({ quantity: existingItem.quantity + (insertCartItem.quantity || 1) })
        .where(eq(cartItems.id, existingItem.id))
        .returning();
      return updated;
    } else {
      // Insert new item
      const [item] = await db.insert(cartItems).values(insertCartItem).returning();
      return item;
    }
  }

  async updateCartItem(id: number, quantity: number): Promise<CartItem | undefined> {
    const [item] = await db.update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, id))
      .returning();
    return item || undefined;
  }

  async removeFromCart(id: number): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.id, id));
  }

  async clearCart(sessionId: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.sessionId, sessionId));
  }

  // Order methods
  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async getAllOrders(): Promise<Order[]> {
    return await db.select().from(orders)
      .orderBy(desc(orders.createdAt));
  }

  async getOrdersByUser(userId: number): Promise<Order[]> {
    return await db.select().from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    const [order] = await db.insert(orders)
      .values({ ...insertOrder, orderNumber })
      .returning();
    return order;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [order] = await db.update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return order || undefined;
  }

  async updateOrder(id: number, updates: Partial<InsertOrder>): Promise<Order | undefined> {
    const [order] = await db.update(orders)
      .set(updates)
      .where(eq(orders.id, id))
      .returning();
    return order || undefined;
  }

  // Order items
  async createOrderItem(insertOrderItem: InsertOrderItem): Promise<OrderItem> {
    const [orderItem] = await db.insert(orderItems).values(insertOrderItem).returning();
    return orderItem;
  }

  async getOrderItems(orderId: number): Promise<(OrderItem & { product: Product })[]> {
    return await db.select({
      id: orderItems.id,
      orderId: orderItems.orderId,
      productId: orderItems.productId,
      quantity: orderItems.quantity,
      price: orderItems.price,
      name: orderItems.name,
      product: products,
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, orderId));
  }

  // Payment transactions
  async createPaymentTransaction(insertTransaction: InsertPaymentTransaction): Promise<PaymentTransaction> {
    const [transaction] = await db.insert(paymentTransactions).values(insertTransaction).returning();
    return transaction;
  }

  async getPaymentTransactionByReference(reference: string): Promise<PaymentTransaction | undefined> {
    const [transaction] = await db.select().from(paymentTransactions)
      .where(eq(paymentTransactions.paystackReference, reference));
    return transaction || undefined;
  }

  async updatePaymentTransaction(id: number, updates: Partial<InsertPaymentTransaction>): Promise<PaymentTransaction | undefined> {
    const [transaction] = await db.update(paymentTransactions)
      .set(updates)
      .where(eq(paymentTransactions.id, id))
      .returning();
    return transaction || undefined;
  }

  // User addresses methods
  async getUserAddresses(userId: number): Promise<UserAddress[]> {
    return await db.select().from(userAddresses)
      .where(eq(userAddresses.userId, userId))
      .orderBy(desc(userAddresses.isDefault), desc(userAddresses.createdAt));
  }

  async getUserDefaultAddress(userId: number): Promise<UserAddress | undefined> {
    const [address] = await db.select().from(userAddresses)
      .where(and(eq(userAddresses.userId, userId), eq(userAddresses.isDefault, true)));
    return address || undefined;
  }

  async createUserAddress(address: InsertUserAddress): Promise<UserAddress> {
    const [newAddress] = await db.insert(userAddresses).values(address).returning();
    return newAddress;
  }

  async updateUserAddress(id: number, updates: Partial<InsertUserAddress>): Promise<UserAddress | undefined> {
    const [address] = await db.update(userAddresses)
      .set({ 
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(userAddresses.id, id))
      .returning();
    return address || undefined;
  }

  async deleteUserAddress(id: number): Promise<void> {
    await db.delete(userAddresses).where(eq(userAddresses.id, id));
  }

  async setDefaultAddress(userId: number, addressId: number): Promise<void> {
    // First, unset all other default addresses for this user
    await db.update(userAddresses)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(eq(userAddresses.userId, userId));
    
    // Then set the specified address as default
    await db.update(userAddresses)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(and(eq(userAddresses.id, addressId), eq(userAddresses.userId, userId)));
  }

  // User preferences methods
  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    const [preferences] = await db.select().from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    return preferences || undefined;
  }

  async createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
    const [newPreferences] = await db.insert(userPreferences).values(preferences).returning();
    return newPreferences;
  }

  async updateUserPreferences(userId: number, updates: Partial<InsertUserPreferences>): Promise<UserPreferences | undefined> {
    const [preferences] = await db.update(userPreferences)
      .set({ 
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(userPreferences.userId, userId))
      .returning();
    return preferences || undefined;
  }
}

export const storage = new DatabaseStorage();
