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

export interface OrderStatusUpdateData {
  customerEmail: string;
  customerName: string;
  orderId: number;
  orderNumber: string;
  storeName: string;
  status: string;
}

export interface EmailVerificationData {
  email: string;
  name: string;
  verificationUrl: string;
}

export interface PasswordResetData {
  email: string;
  name: string;
  resetUrl: string;
}

export class EmailService {
  private mailService: MailService;
  private config: EmailConfig;

  constructor() {
    this.config = {
      apiKey: process.env.SENDGRID_API_KEY || '',
      fromEmail: process.env.SENDGRID_FROM_EMAIL || process.env.FROM_EMAIL || 'gerald@geraldtivatyi.com',
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

    if (!this.config.fromEmail) {
      console.error('From email not configured');
      return false;
    }

    try {
      await this.mailService.send({
        to: data.to,
        from: this.config.fromEmail,
        subject: data.subject,
        text: data.text,
        html: data.html,
      });

      console.log(`Email sent successfully to ${data.to}: ${data.subject}`);
      return true;
    } catch (error: any) {
      console.error('Failed to send email:', error);
      if (error.response?.body?.errors) {
        console.error('SendGrid errors:', error.response.body.errors);
      }
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

  async sendOrderStatusUpdate(data: OrderStatusUpdateData): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn('Email service not configured, skipping order status update email');
      return false;
    }

    const statusLabels: Record<string, string> = {
      'processing': 'Processing',
      'shipped': 'Shipped',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled',
    };

    const statusLabel = statusLabels[data.status] || data.status;
    const subject = `Order #${data.orderNumber} - ${statusLabel}`;

    const textContent = `
Hello ${data.customerName},

Your order status has been updated.

Order Details:
- Order Number: #${data.orderNumber}
- Store: ${data.storeName}
- New Status: ${statusLabel}

${data.status === 'shipped' ? 'Your order has been shipped and is on its way!' : ''}
${data.status === 'delivered' ? 'Your order has been delivered. Thank you for shopping with us!' : ''}
${data.status === 'cancelled' ? 'Your order has been cancelled. If you have any questions, please contact us.' : ''}

Thank you for shopping with ${data.storeName}!
    `.trim();

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Status Update</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #007bff; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
        .order-info { background: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
        .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
        .status-shipped { background: #17a2b8; color: white; }
        .status-delivered { background: #28a745; color: white; }
        .status-cancelled { background: #dc3545; color: white; }
        .status-processing { background: #ffc107; color: #333; }
        .footer { text-align: center; padding: 20px; color: #6c757d; font-size: 14px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Order Status Update</h1>
    </div>

    <div class="order-info">
        <p>Hello ${data.customerName},</p>
        <p>Your order status has been updated.</p>
        
        <div>
            <p><strong>Order Number:</strong> #${data.orderNumber}</p>
            <p><strong>Store:</strong> ${data.storeName}</p>
            <p><strong>New Status:</strong> 
                <span class="status-badge status-${data.status}">${statusLabel}</span>
            </p>
        </div>

        ${data.status === 'shipped' ? '<p>Your order has been shipped and is on its way!</p>' : ''}
        ${data.status === 'delivered' ? '<p>Your order has been delivered. Thank you for shopping with us!</p>' : ''}
        ${data.status === 'cancelled' ? '<p>Your order has been cancelled. If you have any questions, please contact us.</p>' : ''}
    </div>

    <div class="footer">
        <p>Thank you for shopping with ${data.storeName}!</p>
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

  async sendEmailVerification(data: EmailVerificationData): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn('Email service not configured, skipping verification email');
      return false;
    }

    const subject = 'Verify Your Email Address';

    const textContent = `
Hello ${data.name},

Thank you for registering! Please verify your email address by clicking the link below:

${data.verificationUrl}

This link will expire in 24 hours.

If you didn't create an account, please ignore this email.

Thank you!
    `.trim();

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #007bff; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
        .content { background: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
        .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6c757d; font-size: 14px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Verify Your Email Address</h1>
    </div>

    <div class="content">
        <p>Hello ${data.name},</p>
        <p>Thank you for registering! Please verify your email address by clicking the button below:</p>
        <div style="text-align: center;">
            <a href="${data.verificationUrl}" class="button">Verify Email Address</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #007bff;">${data.verificationUrl}</p>
        <p><strong>This link will expire in 24 hours.</strong></p>
        <p>If you didn't create an account, please ignore this email.</p>
    </div>

    <div class="footer">
        <p>Thank you!</p>
    </div>
</body>
</html>
    `.trim();

    return this.sendEmail({
      to: data.email,
      subject,
      text: textContent,
      html: htmlContent,
    });
  }

  async sendPasswordReset(data: PasswordResetData): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn('Email service not configured, skipping password reset email');
      return false;
    }

    const subject = 'Reset Your Password';

    const textContent = `
Hello ${data.name},

You requested to reset your password. Click the link below to reset it:

${data.resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, please ignore this email.

Thank you!
    `.trim();

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc3545; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
        .content { background: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
        .button { display: inline-block; background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6c757d; font-size: 14px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Reset Your Password</h1>
    </div>

    <div class="content">
        <p>Hello ${data.name},</p>
        <p>You requested to reset your password. Click the button below to reset it:</p>
        <div style="text-align: center;">
            <a href="${data.resetUrl}" class="button">Reset Password</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #dc3545;">${data.resetUrl}</p>
        <p><strong>This link will expire in 1 hour.</strong></p>
        <p>If you didn't request a password reset, please ignore this email.</p>
    </div>

    <div class="footer">
        <p>Thank you!</p>
    </div>
</body>
</html>
    `.trim();

    return this.sendEmail({
      to: data.email,
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