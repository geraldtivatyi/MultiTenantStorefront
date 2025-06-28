interface PaystackConfig {
  publicKey: string;
}

interface PaystackPayment {
  email: string;
  amount: number;
  reference: string;
  callback: (response: any) => void;
  onClose: () => void;
}

declare global {
  interface Window {
    PaystackPop: {
      setup: (config: PaystackPayment) => {
        openIframe: () => void;
      };
    };
  }
}

export class PaystackService {
  private config: PaystackConfig | null = null;

  async initialize(): Promise<void> {
    try {
      const response = await fetch('/api/payment/config');
      const config = await response.json();
      this.config = config;
      
      // Load Paystack script
      await this.loadPaystackScript();
    } catch (error) {
      console.error('Failed to initialize Paystack:', error);
      throw new Error('Payment system unavailable');
    }
  }

  private loadPaystackScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.PaystackPop) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Paystack script'));
      document.head.appendChild(script);
    });
  }

  async makePayment({
    email,
    amount,
    reference,
    onSuccess,
    onCancel,
  }: {
    email: string;
    amount: number;
    reference: string;
    onSuccess: (response: any) => void;
    onCancel: () => void;
  }): Promise<void> {
    if (!this.config) {
      throw new Error('Paystack not initialized');
    }

    const handler = window.PaystackPop.setup({
      key: this.config.publicKey,
      email,
      amount: Math.round(amount * 100), // Convert to kobo
      reference,
      callback: onSuccess,
      onClose: onCancel,
    });

    handler.openIframe();
  }

  getPublicKey(): string {
    return this.config?.publicKey || '';
  }
}

export const paystackService = new PaystackService();
