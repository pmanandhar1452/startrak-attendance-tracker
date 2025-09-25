import { supabase } from '../lib/supabase';

export class EmailService {
  static async sendCredentials(
    email: string, 
    password: string, 
    fullName: string, 
    qrCodeUrl?: string
  ): Promise<void> {
    const subject = 'Welcome to StarTrak - Your Login Credentials';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to StarTrak</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3B82F6, #06B6D4); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
          .credentials { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3B82F6; }
          .qr-section { text-align: center; margin: 30px 0; padding: 20px; background: #f0f9ff; border-radius: 8px; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          .security-tips { background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 Welcome to StarTrak</h1>
            <p>Your Attendance Tracking System</p>
          </div>
          
          <div class="content">
            <h2>Hello ${fullName}!</h2>
            <p>Your StarTrak account has been created successfully. You can now access the system using the credentials below:</p>
            
            <div class="credentials">
              <h3>🔐 Login Credentials</h3>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Password:</strong> <code style="background: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${password}</code></p>
              <p><strong>Login URL:</strong> <a href="https://startrak.edu/login" class="button">Access StarTrak</a></p>
            </div>

            ${qrCodeUrl ? `
            <div class="qr-section">
              <h3>📱 Your QR Code</h3>
              <p>Use this QR code for quick check-ins and attendance tracking:</p>
              <img src="${qrCodeUrl}" alt="Your QR Code" style="max-width: 200px; border: 2px solid #e5e7eb; border-radius: 8px;">
              <p><small>Save this QR code to your phone for easy access</small></p>
            </div>
            ` : ''}

            <div class="security-tips">
              <h3>🛡️ Security Tips</h3>
              <ul>
                <li>Change your password after first login</li>
                <li>Keep your QR code private and secure</li>
                <li>Never share your login credentials</li>
                <li>Log out when using shared computers</li>
              </ul>
            </div>

            <h3>📞 Need Help?</h3>
            <p>If you have any questions or need assistance, please contact our support team:</p>
            <ul>
              <li>Email: support@startrak.edu</li>
              <li>Phone: (555) 123-4567</li>
              <li>Hours: Monday-Friday, 8AM-6PM</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>© 2024 StarTrak Attendance System. All rights reserved.</p>
            <p>This email contains sensitive information. Please keep it secure.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      const { data, error } = await supabase.functions.invoke('send-credentials', {
        body: {
          to: email,
          subject: subject,
          html: html,
          qrCodeUrl: qrCodeUrl
        }
      });

      if (error) {
        throw new Error(`Failed to send email: ${error.message}`);
      }

      console.log('Email sent successfully:', data);
    } catch (error) {
      console.error('Email service error:', error);
      throw error;
    }
  }

  static async sendQRCode(email: string, fullName: string, qrCodeUrl: string): Promise<void> {
    const subject = 'StarTrak - Your New QR Code';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your New QR Code</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3B82F6, #06B6D4); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
          .qr-section { text-align: center; margin: 30px 0; padding: 20px; background: #f0f9ff; border-radius: 8px; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 StarTrak QR Code</h1>
            <p>Your Updated QR Code</p>
          </div>
          
          <div class="content">
            <h2>Hello ${fullName}!</h2>
            <p>A new QR code has been generated for your StarTrak account:</p>
            
            <div class="qr-section">
              <h3>📱 Your New QR Code</h3>
              <img src="${qrCodeUrl}" alt="Your QR Code" style="max-width: 200px; border: 2px solid #e5e7eb; border-radius: 8px;">
              <p><small>Save this QR code to your phone for easy access</small></p>
            </div>

            <p><strong>Important:</strong> Your previous QR code is no longer valid. Please use this new QR code for all future check-ins.</p>
          </div>
          
          <div class="footer">
            <p>© 2024 StarTrak Attendance System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      const { data, error } = await supabase.functions.invoke('send-credentials', {
        body: {
          to: email,
          subject: subject,
          html: html,
          qrCodeUrl: qrCodeUrl
        }
      });

      if (error) {
        throw new Error(`Failed to send QR code email: ${error.message}`);
      }

      console.log('QR code email sent successfully:', data);
    } catch (error) {
      console.error('QR code email service error:', error);
      throw error;
    }
  }
}