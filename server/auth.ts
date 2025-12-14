import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import type { User } from '@shared/schema';

// Session management
export class AuthService {
  private static SALT_ROUNDS = 12;
  private static SESSION_EXPIRY_HOURS = 24 * 7; // 7 days

  // Hash password
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  // Verify password
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // Generate session ID
  static generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Create session
  static async createSession(userId: number): Promise<string> {
    const sessionId = this.generateSessionId();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.SESSION_EXPIRY_HOURS);

    await storage.createUserSession({
      id: sessionId,
      userId,
      expiresAt,
    });

    return sessionId;
  }

  // Validate session
  static async validateSession(sessionId: string): Promise<User | null> {
    if (!sessionId) return null;

    try {
      const session = await storage.getUserSession(sessionId);
      if (!session || session.expiresAt < new Date()) {
        // Clean up expired session
        if (session) {
          await storage.deleteUserSession(sessionId);
        }
        return null;
      }

      const user = await storage.getUser(session.userId);
      if (!user || !user.isActive) {
        return null;
      }

      return user;
    } catch (error) {
      console.error('Session validation error:', error);
      return null;
    }
  }

  // Delete session (logout)
  static async deleteSession(sessionId: string): Promise<void> {
    try {
      await storage.deleteUserSession(sessionId);
    } catch (error) {
      console.error('Session deletion error:', error);
    }
  }

  // Clean up expired sessions
  static async cleanupExpiredSessions(): Promise<void> {
    try {
      await storage.cleanupExpiredSessions();
    } catch (error) {
      console.error('Session cleanup error:', error);
    }
  }

  // Generate verification token
  static generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Generate password reset token
  static generatePasswordResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

// Authentication middleware
export interface AuthenticatedRequest extends Request {
  user?: User;
  sessionId?: string;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }
  
  if (!req.user.isAdmin) {
    return res.status(403).json({ 
      error: 'Admin access required',
      code: 'ADMIN_REQUIRED'
    });
  }
  
  next();
}

// Authentication middleware to inject user into request
export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    // Check for session ID in cookie or Authorization header
    const sessionId = req.cookies?.sessionId || 
                     (req.headers.authorization?.startsWith('Bearer ') ? 
                      req.headers.authorization.slice(7) : null);

    if (sessionId) {
      const user = await AuthService.validateSession(sessionId);
      if (user) {
        req.user = user;
        req.sessionId = sessionId;
        
        // Update last login time
        await storage.updateUserLastLogin(user.id);
      }
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    next();
  }
}

// Set session cookie
export function setSessionCookie(res: Response, sessionId: string) {
  res.cookie('sessionId', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  });
}

// Clear session cookie
export function clearSessionCookie(res: Response) {
  res.clearCookie('sessionId');
}

// Role-based middleware functions
export function requirePlatformAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.user.role !== 'platform_admin') {
    return res.status(403).json({ error: 'Platform admin access required' });
  }
  
  next();
}


// Validation schemas for auth
export const loginSchema = {
  email: { required: true, type: 'email' },
  password: { required: true, minLength: 6 }
};

export const registerSchema = {
  username: { required: true, minLength: 3, maxLength: 50 },
  email: { required: true, type: 'email' },
  password: { required: true, minLength: 6 },
  firstName: { required: false, maxLength: 50 },
  lastName: { required: false, maxLength: 50 },
  phone: { required: false }
};