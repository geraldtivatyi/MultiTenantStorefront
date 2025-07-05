import { MailService } from '@sendgrid/mail';

export interface EmailConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
}

export interface EmailData {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export interface OrderEmailData {
  vendorEmail: string;
  storeName: string;
  orderId: number;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  currency: string;
  itemCount: number;
  items: Array<{
    name: string;
    quantity: number;
    price: string;
  }>;
}

export class EmailService {
  private mailService: MailService;
  private config: EmailConfig;

  constructor() {
    this.config = {
      apiKey: process.env.SENDGRID_API_KEY || '',
      fromEmail: process.env.FROM_EMAIL || 'noreply@geraldtivatyi.com',
      fromName: process.env.FROM_NAME || 'Your E-commerce Platform',
    };

    this.mailService = new MailService();
    if (this.config.apiKey) {
      this.mailService.setApiKey(this.config.apiKey);
    }
  }

  private isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  async sendEmail(data: EmailData): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn('SendGrid API not configured. Email not sent:', data.subject);
      return false;
    }

    try {
      await this.mailService.send({
        to: data.to,
        from: this.config.fromEmail!,
        subject: data.subject,
        text: data.text,
        html: data.html,
      });

      console.log(`Email sent successfully to ${data.to}: ${data.subject}`);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  async sendOrderNotificationToVendor(data: OrderEmailData): Promise<boolean> {
    const subject = `🛍️ New Order #${data.orderId} - ${data.storeName}`;
    
    const itemsList = data.items
      .map(item => `• ${item.name} (Qty: ${item.quantity}) - ${data.currency} ${item.price}`)
      .join('\n');

    const textContent = `
New Order Notification

Order Details:
- Order ID: #${data.orderId}
- Store: ${data.storeName}
- Customer: ${data.customerName} (${data.customerEmail})
- Total Amount: ${data.currency} ${data.totalAmount.toFixed(2)}
- Number of Items: ${data.itemCount}

Items Ordered:
${itemsList}

Please log into your vendor dashboard to view the full order details and process the order.

Thank you for using our platform!
    `.trim();

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Order Notification</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
        .order-info { background: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
        .order-details { margin-bottom: 20px; }
        .order-details h3 { margin-top: 0; color: #495057; }
        .items-list { background: #f8f9fa; padding: 15px; border-radius: 5px; }
        .item { padding: 8px 0; border-bottom: 1px solid #e9ecef; }
        .item:last-child { border-bottom: none; }
        .total { font-size: 18px; font-weight: bold; color: #28a745; }
        .footer { text-align: center; padding: 20px; color: #6c757d; font-size: 14px; }
        .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🛍️ New Order Received!</h1>
        <p>Order #${data.orderId} has been placed at ${data.storeName}</p>
    </div>

    <div class="order-info">
        <div class="order-details">
            <h3>Order Information</h3>
            <p><strong>Order ID:</strong> #${data.orderId}</p>
            <p><strong>Store:</strong> ${data.storeName}</p>
            <p><strong>Customer:</strong> ${data.customerName}</p>
            <p><strong>Customer Email:</strong> ${data.customerEmail}</p>
            <p><strong>Number of Items:</strong> ${data.itemCount}</p>
            <p class="total"><strong>Total Amount:</strong> ${data.currency} ${data.totalAmount.toFixed(2)}</p>
        </div>

        <div class="order-details">
            <h3>Items Ordered</h3>
            <div class="items-list">
                ${data.items.map(item => `
                    <div class="item">
                        <strong>${item.name}</strong><br>
                        Quantity: ${item.quantity} | Price: ${data.currency} ${item.price}
                    </div>
                `).join('')}
            </div>
        </div>
    </div>

    <div class="footer">
        <p>Please log into your vendor dashboard to view the full order details and process the order.</p>
        <p>Thank you for using our platform!</p>
    </div>
</body>
</html>
    `.trim();

    return this.sendEmail({
      to: data.vendorEmail,
      subject,
      text: textContent,
      html: htmlContent,
    });
  }

  async sendOrderConfirmationToCustomer(data: {
    customerEmail: string;
    customerName: string;
    orderId: number;
    storeName: string;
    totalAmount: number;
    currency: string;
    items: Array<{
      name: string;
      quantity: number;
      price: string;
    }>;
  }): Promise<boolean> {
    const subject = `Order Confirmation #${data.orderId} - ${data.storeName}`;

    const itemsList = data.items
      .map(item => `• ${item.name} (Qty: ${item.quantity}) - ${data.currency} ${item.price}`)
      .join('\n');

    const textContent = `
Hi ${data.customerName},

Thank you for your order! Your payment has been processed successfully.

Order Details:
- Order ID: #${data.orderId}
- Store: ${data.storeName}
- Total Amount: ${data.currency} ${data.totalAmount.toFixed(2)}

Items Ordered:
${itemsList}

Your order is being processed and you will receive shipping updates via email.

Thank you for shopping with us!
    `.trim();

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #28a745; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
        .order-info { background: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
        .order-details h3 { margin-top: 0; color: #495057; }
        .items-list { background: #f8f9fa; padding: 15px; border-radius: 5px; }
        .item { padding: 8px 0; border-bottom: 1px solid #e9ecef; }
        .item:last-child { border-bottom: none; }
        .total { font-size: 18px; font-weight: bold; color: #28a745; }
        .footer { text-align: center; padding: 20px; color: #6c757d; font-size: 14px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>✅ Order Confirmed!</h1>
        <p>Thank you for your order, ${data.customerName}!</p>
    </div>

    <div class="order-info">
        <div class="order-details">
            <h3>Order Summary</h3>
            <p><strong>Order ID:</strong> #${data.orderId}</p>
            <p><strong>Store:</strong> ${data.storeName}</p>
            <p class="total"><strong>Total Amount:</strong> ${data.currency} ${data.totalAmount.toFixed(2)}</p>
        </div>

        <div class="order-details">
            <h3>Items Ordered</h3>
            <div class="items-list">
                ${data.items.map(item => `
                    <div class="item">
                        <strong>${item.name}</strong><br>
                        Quantity: ${item.quantity} | Price: ${data.currency} ${item.price}
                    </div>
                `).join('')}
            </div>
        </div>
    </div>

    <div class="footer">
        <p>Your order is being processed and you will receive shipping updates via email.</p>
        <p>Thank you for shopping with us!</p>
    </div>
</body>
</html>
    `.trim();

    return this.sendEmail({
      to: data.customerEmail,
      subject,
      text: textContent,
      html: htmlContent,
    });
  }

  getConfig(): { configured: boolean; fromEmail?: string } {
    return {
      configured: this.isConfigured(),
      fromEmail: this.config.fromEmail || undefined,
    };
  }
}

export const emailService = new EmailService();