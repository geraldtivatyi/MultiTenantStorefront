import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import type { Tenant } from "@shared/schema";

export interface TenantRequest extends Request {
  tenant?: Tenant;
}

export function tenantMiddleware() {
  return async (req: TenantRequest, res: Response, next: NextFunction) => {
    try {
      // Extract subdomain from Host header
      const host = req.get('host') || '';
      const subdomain = extractSubdomain(host);

      if (!subdomain) {
        return res.status(400).json({ 
          error: 'Invalid subdomain', 
          message: 'Please access the store through a valid subdomain (e.g., store.domain.com)' 
        });
      }

      // Find tenant by subdomain
      const tenant = await storage.getTenantBySubdomain(subdomain);

      if (!tenant) {
        return res.status(404).json({ 
          error: 'Store not found', 
          message: `No store found for subdomain: ${subdomain}` 
        });
      }

      if (!tenant.isActive) {
        return res.status(403).json({ 
          error: 'Store inactive', 
          message: 'This store is currently inactive' 
        });
      }

      // Attach tenant to request object
      req.tenant = tenant;
      next();
    } catch (error) {
      console.error('Tenant middleware error:', error);
      res.status(500).json({ 
        error: 'Internal server error', 
        message: 'Failed to resolve tenant' 
      });
    }
  };
}

function extractSubdomain(host: string): string | null {
  // Handle different environments
  if (host.includes('localhost') || host.includes('127.0.0.1') || !host || host === '') {
    // For development, always use demo store
    return 'demo';
  }

  // Remove port if present
  const hostWithoutPort = host.split(':')[0];
  
  // Split by dots
  const parts = hostWithoutPort.split('.');
  
  // Need at least 3 parts for subdomain (subdomain.domain.com)
  if (parts.length < 3) {
    // For development and single domain setups, default to demo
    return 'demo';
  }

  // Return the first part as subdomain
  return parts[0];
}

// Middleware to bypass tenant resolution for admin routes
export function adminBypass() {
  return (req: TenantRequest, res: Response, next: NextFunction) => {
    // Skip tenant middleware for admin routes
    next();
  };
}
