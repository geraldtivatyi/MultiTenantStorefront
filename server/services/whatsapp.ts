export interface WhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  webhookVerifyToken: string;
}

export interface WhatsAppMessageData {
  to: string; // Phone number in international format (e.g., "+27823456789")
  template?: {
    name: string;
    language: string;
    components?: any[];
  };
  text?: string; // For simple text messages
}

export interface WhatsAppWebhookEvent {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          text: {
            body: string;
          };
          type: string;
        }>;
        statuses?: Array<{
          id: string;
          status: string;
          timestamp: string;
          recipient_id: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

export class WhatsAppService {
  private config: WhatsAppConfig;
  private baseUrl = 'https://graph.facebook.com/v18.0';

  constructor() {
    this.config = {
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
      webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '',
    };
  }

  private isConfigured(): boolean {
    return !!(this.config.accessToken && this.config.phoneNumberId);
  }

  async sendMessage(data: WhatsAppMessageData): Promise<any> {
    if (!this.isConfigured()) {
      console.warn('WhatsApp API not configured. Message not sent:', data);
      return { success: false, message: 'WhatsApp API not configured' };
    }

    try {
      const messagePayload: any = {
        messaging_product: 'whatsapp',
        to: data.to,
      };

      if (data.template) {
        messagePayload.type = 'template';
        messagePayload.template = data.template;
      } else if (data.text) {
        messagePayload.type = 'text';
        messagePayload.text = { body: data.text };
      } else {
        throw new Error('Either template or text must be provided');
      }

      const response = await fetch(
        `${this.baseUrl}/${this.config.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(messagePayload),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`WhatsApp API error: ${response.status} ${error}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to send WhatsApp message:', error);
      throw error;
    }
  }

  async sendOrderNotification(
    vendorPhone: string,
    orderData: {
      orderId: number;
      storeName: string;
      customerName: string;
      totalAmount: number;
      currency: string;
      itemCount: number;
    }
  ): Promise<any> {
    const message = `🛍️ New Order Alert!

Order #${orderData.orderId} placed at ${orderData.storeName}

👤 Customer: ${orderData.customerName}
📦 Items: ${orderData.itemCount}
💰 Total: ${orderData.currency} ${orderData.totalAmount.toFixed(2)}

Please log into your vendor dashboard to view full order details and process the order.`;

    return this.sendMessage({
      to: vendorPhone,
      text: message,
    });
  }

  async sendOrderStatusUpdate(
    customerPhone: string,
    orderData: {
      orderId: number;
      storeName: string;
      status: string;
      trackingInfo?: string;
    }
  ): Promise<any> {
    let message = `📋 Order Update from ${orderData.storeName}

Order #${orderData.orderId} status: ${orderData.status}`;

    if (orderData.trackingInfo) {
      message += `\n📦 Tracking: ${orderData.trackingInfo}`;
    }

    message += '\n\nThank you for shopping with us!';

    return this.sendMessage({
      to: customerPhone,
      text: message,
    });
  }

  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    if (!this.config.webhookVerifyToken) {
      console.warn('WhatsApp webhook verify token not configured');
      return null;
    }

    if (mode === 'subscribe' && token === this.config.webhookVerifyToken) {
      console.log('WhatsApp webhook verified successfully');
      return challenge;
    }

    console.error('WhatsApp webhook verification failed');
    return null;
  }

  processWebhookEvent(event: WhatsAppWebhookEvent): void {
    if (!this.isConfigured()) {
      console.warn('WhatsApp API not configured. Webhook event ignored');
      return;
    }

    try {
      event.entry.forEach(entry => {
        entry.changes.forEach(change => {
          if (change.field === 'messages') {
            const messages = change.value.messages || [];
            messages.forEach(message => {
              console.log('Received WhatsApp message:', {
                from: message.from,
                text: message.text?.body,
                timestamp: message.timestamp,
              });
              
              // Handle incoming messages here if needed
              // For now, we're primarily sending notifications, not receiving
            });

            const statuses = change.value.statuses || [];
            statuses.forEach(status => {
              console.log('WhatsApp message status update:', {
                messageId: status.id,
                status: status.status,
                timestamp: status.timestamp,
              });
            });
          }
        });
      });
    } catch (error) {
      console.error('Error processing WhatsApp webhook event:', error);
    }
  }

  getConfig(): { configured: boolean; phoneNumberId?: string } {
    return {
      configured: this.isConfigured(),
      phoneNumberId: this.config.phoneNumberId || undefined,
    };
  }
}

export const whatsappService = new WhatsAppService();