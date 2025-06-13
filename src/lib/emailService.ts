import nodemailer from 'nodemailer';

class EmailService {
  private transporter: nodemailer.Transporter;
  constructor() {
    // 使用Gmail SMTP服务或其他邮件服务
    // 注意：在生产环境中，请使用环境变量存储敏感信息
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com', // 替换为你的邮箱
        pass: process.env.EMAIL_PASS || 'your-app-password'      // 替换为你的应用密码
      }
    });
  }
// 发送OTP验证码
  async sendOTPCode(email: string, code: string, purpose: 'login' | 'register'): Promise<boolean> {
    try {
      // 在开发环境中，我们直接在控制台输出验证码，而不发送邮件
      if (process.env.NODE_ENV === 'development') {
        return true;
      }

      // 生产环境中使用真实的邮件发送
      const subject = purpose === 'login' ? '登录验证码' : '注册验证码';
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">小王给你发验证码啦</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">验证码邮件</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e1e5e9; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">您的${purpose === 'login' ? '登录' : '注册'}验证码</h2>
            
            <p style="color: #666; line-height: 1.6;">
              您好！您正在使用邮箱 <strong>${email}</strong> ${purpose === 'login' ? '登录' : '注册'}。
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <p style="margin: 0 0 10px 0; color: #666;">您的验证码是：</p>
              <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                ${code}
              </div>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;">
                <strong>⚠️ 重要提示：</strong><br>
                • 验证码有效期为 <strong>10分钟</strong><br>
                • 请勿将验证码透露给他人<br>
                • 如果这不是您的操作，请忽略此邮件
              </p>
            </div>
            
            <p style="color: #999; font-size: 14px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
              此邮件由系统自动发送，请勿回复。<br>
              如有问题，请联系我们的客服团队。
            </p>
          </div>
        </div>
      `;

      await this.transporter.sendMail({
        from: '"数据可视化平台" <noreply@datavis.com>',
        to: email,
        subject: subject,
        html: html
      });

      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  // 测试邮件服务连接
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
