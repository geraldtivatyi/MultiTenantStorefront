import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: string | number): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(numPrice);
}

export function generateSessionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function getSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  
  let sessionId = localStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
}

export function extractSubdomain(): string {
  if (typeof window === 'undefined') return 'demo';
  
  const host = window.location.host;
  
  // For local development
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    return 'demo';
  }
  
  const parts = host.split('.');
  return parts.length > 2 ? parts[0] : 'demo';
}

export function calculateCartTotal(items: any[]): { subtotal: number; tax: number; total: number } {
  const subtotal = items.reduce((sum, item) => 
    sum + (parseFloat(item.product.price) * item.quantity), 0
  );
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + tax;
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}
