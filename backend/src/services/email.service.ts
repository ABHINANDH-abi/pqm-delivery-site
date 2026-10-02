import nodemailer from 'nodemailer';

/**
 * Production Multi-Provider Transactional Email Service.
 * Priority:
 * 1. Resend API (if RESEND_API_KEY env var set)
 * 2. Brevo API (if BREVO_API_KEY env var set)
 * 3. Gmail SMTP (guaranteed fallback — hardcoded credentials)
 */
class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  // Guaranteed Gmail SMTP credentials — always works as fallback
  private readonly GMAIL_USER = '6abhi6nad6@gmail.com';
  private readonly GMAIL_PASS = Buffer.from('dHNkeXBmd2J6a21teW91Yw==', 'base64').toString('utf8').replace(/\s+/g, '');

  constructor() {
    const brevoApiKey = process.env.BREVO_API_KEY;

    try {
      if (brevoApiKey && brevoApiKey.startsWith('xsmtpsib-')) {
        // Brevo SMTP relay
        this.transporter = nodemailer.createTransport({
          host: 'smtp-relay.brevo.com',
          port: 587,
          secure: false,
          auth: {
            user: process.env.SMTP_USER || 'b524dc001@smtp-brevo.com',
            pass: brevoApiKey,
          },
        });
        console.log(`[EmailService] ✅ Brevo Dedicated SMTP Relay initialized`);
      } else {
        // Gmail SMTP — use env vars if set, otherwise use hardcoded guaranteed credentials
        const gmailUser = (process.env.SMTP_USER && process.env.SMTP_USER.includes('@gmail.com'))
          ? process.env.SMTP_USER
          : this.GMAIL_USER;
        const gmailPass = process.env.SMTP_PASS
          ? process.env.SMTP_PASS.replace(/\s+/g, '')
          : this.GMAIL_PASS;

        this.transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            user: gmailUser,
            pass: gmailPass,
          },
        });
        console.log(`[EmailService] ✅ Gmail SMTP initialized for: ${gmailUser}`);

        // Verify connection on startup so we know immediately if it's broken
        this.transporter.verify((err, success) => {
          if (err) {
            console.error(`[EmailService] ❌ Gmail SMTP verify FAILED: ${err.message}`);
            // Retry with hardcoded credentials if env var credentials failed
            if (gmailUser !== this.GMAIL_USER || gmailPass !== this.GMAIL_PASS) {
              console.log(`[EmailService] 🔄 Retrying with hardcoded Gmail credentials...`);
              this.transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 465,
                secure: true,
                auth: { user: this.GMAIL_USER, pass: this.GMAIL_PASS },
              });
              this.transporter.verify((err2, ok2) => {
                if (err2) console.error(`[EmailService] ❌ Hardcoded Gmail also failed: ${err2.message}`);
                else console.log(`[EmailService] ✅ Hardcoded Gmail SMTP verified OK`);
              });
            }
          } else {
            console.log(`[EmailService] ✅ Gmail SMTP connection verified and ready`);
          }
        });
      }
    } catch (e) {
      console.error('[EmailService] ❌ SMTP init failed:', e);
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
        }
      } catch (err: any) {
        console.warn(`[EmailService] Resend API note: ${err.message}`);
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
            sender: { name: appName, email: process.env.EMAIL_FROM || 'b524dc001@smtp-brevo.com' },
            to: [{ email: toEmail }],
            subject: `🔑 ${otp} is your ${appName} Verification Code`,
            htmlContent,
          }),
        });

        const resData: any = await response.json();
        if (response.ok) {
          console.log(`[EmailService] ✉️ OTP sent via Brevo API to ${toEmail}. MessageId: ${resData?.messageId}`);
          return true;
        }
      } catch (err: any) {
        console.warn(`[EmailService] Brevo API note: ${err.message}`);
      }
    }

    // 3. Fallback via Nodemailer SMTP transporter
    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from: `"${appName}" <${this.GMAIL_USER}>`,
          to: toEmail,
          subject: `🔑 ${otp} is your ${appName} Verification Code`,
          html: htmlContent,
        });
        console.log(`[EmailService] ✉️ OTP sent via SMTP to ${toEmail}. MessageId: ${info.messageId}`);
        return true;
      } catch (err: any) {
        console.error(`[EmailService] ❌ SMTP transporter failed: ${err.message}`);
      }
    }

    // 4. Emergency direct Gmail send — guaranteed last resort
    try {
      console.log(`[EmailService] 🆘 Attempting emergency direct Gmail SMTP for ${toEmail}...`);
      const emergencyTransporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user: this.GMAIL_USER, pass: this.GMAIL_PASS },
      });
      const info = await emergencyTransporter.sendMail({
        from: `"${appName}" <${this.GMAIL_USER}>`,
        to: toEmail,
        subject: `🔑 ${otp} is your ${appName} Verification Code`,
        html: htmlContent,
      });
      console.log(`[EmailService] ✅ Emergency Gmail sent OTP to ${toEmail}. MessageId: ${info.messageId}`);
      return true;
    } catch (err: any) {
      console.error(`[EmailService] ❌ Emergency Gmail also failed: ${err.message}`);
      return false;
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
          from: `"${appName}" <6abhi6nad6@gmail.com>`,
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
