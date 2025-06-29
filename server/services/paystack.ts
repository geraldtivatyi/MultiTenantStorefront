import crypto from 'crypto';

export interface PaystackConfig {
  publicKey: string;
  secretKey: string;
  webhookSecret?: string;
}

export interface PaystackTransactionData {
  amount: number; // Amount in kobo (multiply by 100)
  email: string;
  currency?: string;
  reference?: string;
  callback_url?: string;
  metadata?: Record<string, any>;
}

export interface PaystackWebhookEvent {
  event: string;
  data: {
    reference: string;
    amount: number;
    status: string;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    customer: {
      email: string;
      customer_code: string;
    };
    metadata?: Record<string, any>;
  };
}

export class PaystackService {
  private config: PaystackConfig;

  constructor() {
    this.config = {
      publicKey: process.env.PAYSTACK_PUBLIC_KEY || process.env.VITE_PAYSTACK_PUBLIC_KEY || '',
      secretKey: process.env.PAYSTACK_SECRET_KEY || '',
      webhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET,
    };

    if (!this.config.secretKey) {
      console.warn('Paystack secret key not found in environment variables');
    }
  }

  async initializeTransaction(data: PaystackTransactionData): Promise<any> {
    try {
      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to initialize transaction');
      }

      return result.data;
    } catch (error) {
      console.error('Paystack initialization error:', error);
      throw new Error('Failed to initialize payment');
    }
  }

  async verifyTransaction(reference: string): Promise<any> {
    try {
      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.secretKey}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to verify transaction');
      }

      return result.data;
    } catch (error) {
      console.error('Paystack verification error:', error);
      throw new Error('Failed to verify payment');
    }
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.config.webhookSecret) {
      console.warn('Webhook secret not configured, skipping signature verification');
      return true; // In test mode, allow webhooks without verification
    }
    
    try {
      const hash = crypto
        .createHmac('sha512', this.config.webhookSecret!)
        .update(payload, 'utf8')
        .digest('hex');

      return hash === signature;
    } catch (error) {
      console.error('Webhook signature verification error:', error);
      return false;
    }
  }

  generateReference(prefix = 'REF'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}_${timestamp}_${random}`;
  }

  getPublicKey(): string {
    return this.config.publicKey;
  }

  // Calculate fees (Paystack charges 1.5% + NGN 100 capped at NGN 2000)
  calculateFees(amount: number): number {
    const percentage = amount * 0.015;
    const withFlat = percentage + 100;
    return Math.min(withFlat, 2000);
  }

  // Get total amount including fees
  getTotalWithFees(amount: number): number {
    return amount + this.calculateFees(amount);
  }
}

export const paystackService = new PaystackService();
