import nodemailer from 'nodemailer';

/**
 * Production Multi-Provider Transactional Email Service.
 * Supports:
 * 1. Resend API (RESEND_API_KEY) — 100% HTTPS REST delivery (0 IP blocks)
 * 2. Brevo/Sendinblue API (BREVO_API_KEY) — HTTPS REST delivery
 * 3. Nodemailer SMTP (Gmail / Custom SMTP)
 */
class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    const smtpUser = process.env.SMTP_USER || '6abhi6nad6@gmail.com';
    const smtpPass = (process.env.BREVO_API_KEY || process.env.SMTP_PASS || '').replace(/\s+/g, '');

    try {
      if (smtpPass.startsWith('xsmtpsib-')) {
        this.transporter = nodemailer.createTransport({
          host: 'smtp-relay.brevo.com',
          port: 587,
          secure: false,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });
        console.log(`[EmailService] ✅ Brevo Dedicated SMTP Relay initialized for: ${smtpUser}`);
      } else if (smtpPass) {
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });
        console.log(`[EmailService] ✅ Gmail SMTP initialized for: ${smtpUser}`);
      }
    } catch (e) {
      console.warn('[EmailService] SMTP init note:', e);
    }
  }

  /**
   * Send a rich HTML 6-Digit Verification OTP email to customer/driver inbox
   */
  async sendOtpEmail(toEmail: string, otp: string, userName?: string): Promise<boolean> {
    const appName = process.env.APP_NAME || 'PQM Kitchen & Delivery';
    const recipientName = userName || 'Valued Customer';
    const resendApiKey = process.env.RESEND_API_KEY;
    const brevoApiKey = process.env.BREVO_API_KEY;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Your Gmail Verification Code</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 0; }
          .container { max-width: 580px; margin: 30px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
          .header { background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%); padding: 32px 24px; text-align: center; }
          .header h1 { color: #F59E0B; font-size: 24px; margin: 0; font-weight: 800; letter-spacing: 0.5px; }
          .content { padding: 32px 24px; text-align: center; }
          .greeting { font-size: 16px; color: #334155; font-weight: 600; margin-bottom: 12px; }
          .instruction { font-size: 14px; color: #64748B; line-height: 1.6; margin-bottom: 28px; }
          .otp-box { background: #FEF3C7; border: 2px dashed #F59E0B; border-radius: 12px; padding: 20px; display: inline-block; margin-bottom: 28px; }
          .otp-code { font-size: 36px; font-weight: 900; color: #D97706; letter-spacing: 8px; font-family: monospace; }
          .expiry-note { font-size: 12px; color: #94A3B8; margin-top: 16px; }
          .footer { background: #F8FAFC; padding: 20px; text-align: center; border-top: 1px solid #E2E8F0; font-size: 12px; color: #94A3B8; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✨ ${appName}</h1>
          </div>
          <div class="content">
            <div class="greeting">Hello ${recipientName}, 👋</div>
            <div class="instruction">
              Thank you for registering with <strong>${appName}</strong>. Please use the 6-digit Email Verification Code below to complete your registration:
            </div>

            <div class="otp-box">
              <div class="otp-code">${otp}</div>
            </div>

            <div class="instruction">
              This code will expire in <strong>10 minutes</strong>. If you did not request this verification, please ignore this email.
            </div>
            <div class="expiry-note">🔒 Secure Email Verification System</div>
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} ${appName}. All rights reserved.<br/>
            Coimbatore, Tamil Nadu, India.
          </div>
        </div>
      </body>
      </html>
    `;

    // 1. Primary HTTP REST Dispatch via Resend API (if RESEND_API_KEY configured)
    if (resendApiKey) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || `${appName} <onboarding@resend.dev>`,
            to: [toEmail],
            subject: `🔑 ${otp} is your ${appName} Verification Code`,
            html: htmlContent,
          }),
        });

        const resData: any = await response.json();
        if (response.ok) {
          console.log(`[EmailService] ✉️ OTP sent via Resend API to ${toEmail}. Resend ID: ${resData?.id}`);
          return true;
        } else {
          console.warn(`[EmailService] Resend API error: ${resData?.message}`);
        }
      } catch (err: any) {
        console.warn(`[EmailService] Resend API exception: ${err.message}`);
      }
    }

    // 2. Secondary HTTP REST Dispatch via Brevo API (if BREVO_API_KEY configured)
    if (brevoApiKey) {
      try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'api-key': brevoApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sender: { name: appName, email: process.env.SMTP_USER || '6abhi6nad6@gmail.com' },
            to: [{ email: toEmail }],
            subject: `🔑 ${otp} is your ${appName} Verification Code`,
            htmlContent,
          }),
        });

        const resData: any = await response.json();
        if (response.ok) {
          console.log(`[EmailService] ✉️ OTP sent via Brevo API to ${toEmail}. MessageId: ${resData?.messageId}`);
          return true;
        } else {
          console.warn(`[EmailService] Brevo API error: ${resData?.message}`);
        }
      } catch (err: any) {
        console.warn(`[EmailService] Brevo API exception: ${err.message}`);
      }
    }

    // 3. Fallback Dispatch via Nodemailer SMTP (Gmail)
    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from: `"${appName}" <${process.env.SMTP_USER || '6abhi6nad6@gmail.com'}>`,
          to: toEmail,
          subject: `🔑 ${otp} is your ${appName} Verification Code`,
          html: htmlContent,
        });

        console.log(`[EmailService] ✉️ Real OTP email sent via SMTP to ${toEmail}. MessageId: ${info.messageId}`);
        return true;
      } catch (err: any) {
        console.warn(`[EmailService] ⚠️ Gmail SMTP dispatch error (${err.message}). OTP active in system.`);
        return false;
      }
    }

    return false;
  }

  /**
   * Send a rich HTML Order Confirmation Receipt to customer email
   */
  async sendOrderReceiptEmail(toEmail: string, orderDetails: {
    orderId: string;
    customerName: string;
    totalAmount: number;
    itemsSummary: string;
    deliveryAddress: string;
  }): Promise<boolean> {
    const appName = process.env.APP_NAME || 'PQM Kitchen & Delivery';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Order Receipt #${orderDetails.orderId.slice(-6).toUpperCase()}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 0; }
          .container { max-width: 580px; margin: 30px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
          .header { background: #10B981; padding: 28px 24px; text-align: center; color: #ffffff; }
          .header h1 { font-size: 22px; margin: 0; font-weight: 800; }
          .content { padding: 24px; }
          .order-id { font-size: 18px; font-weight: 800; color: #1E293B; margin-bottom: 16px; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #E2E8F0; font-size: 14px; }
          .total-row { font-size: 18px; font-weight: 900; color: #10B981; margin-top: 16px; text-align: right; }
          .footer { background: #F8FAFC; padding: 20px; text-align: center; font-size: 12px; color: #94A3B8; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Order Placed Successfully!</h1>
          </div>
          <div class="content">
            <div class="order-id">Order #${orderDetails.orderId.slice(-6).toUpperCase()}</div>
            <p>Hi ${orderDetails.customerName}, your delicious food order has been received by kitchen!</p>

            <div class="detail-row">
              <span><strong>Items:</strong></span>
              <span>${orderDetails.itemsSummary}</span>
            </div>
            <div class="detail-row">
              <span><strong>Delivery Destination:</strong></span>
              <span>${orderDetails.deliveryAddress}</span>
            </div>

            <div class="total-row">
              Grand Total: ₹${orderDetails.totalAmount}
            </div>
          </div>
          <div class="footer">
            Thank you for ordering with ${appName}!
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      if (this.transporter) {
        await this.transporter.sendMail({
          from: `"${appName}" <${process.env.SMTP_USER || '6abhi6nad6@gmail.com'}>`,
          to: toEmail,
          subject: `🧾 Order Receipt #${orderDetails.orderId.slice(-6).toUpperCase()} - ${appName}`,
          html: htmlContent,
        });
        return true;
      }
    } catch (err: any) {
      console.warn(`[EmailService] Receipt email error: ${err.message}`);
      return false;
    }
    return false;
  }
}

export const emailService = new EmailService();
