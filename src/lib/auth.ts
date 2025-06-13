import { NextRequest } from 'next/server';
import { dataStore } from './dataStore';
import { Session, User } from '@/types/user';

export class AuthUtils {
  // 生成6位数验证码
  static generateOTPCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // 验证邮箱格式
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // 从请求中获取会话
  static async getSessionFromRequest(request: NextRequest): Promise<{ session: Session | null, user: User | null }> {
    try {
      const sessionId = request.cookies.get('session')?.value;
      
      if (!sessionId) {
        return { session: null, user: null };
      }

      const session = dataStore.getValidSession(sessionId);
      if (!session) {
        return { session: null, user: null };
      }

      const user = dataStore.getUserById(session.userId);
      return { session, user: user || null };
    } catch (error) {
      console.error('Error getting session from request:', error);
      return { session: null, user: null };
    }
  }

  // 验证用户名格式
  static validateUsername(username: string): boolean {
    // 用户名应该是2-20个字符，可以包含中文、英文、数字、下划线
    const usernameRegex = /^[\u4e00-\u9fa5a-zA-Z0-9_]{2,20}$/;
    return usernameRegex.test(username);
  }

  // 清理过期数据（定期调用）
  static cleanupExpiredData(): void {
    dataStore.cleanupExpiredData();
  }

  // 生成默认用户名
  static generateDefaultUsername(email: string): string {
    const localPart = email.split('@')[0];
    const timestamp = Date.now().toString().slice(-4);
    return `用户_${localPart}_${timestamp}`;
  }

  // 检查用户名是否已存在
  static isUsernameExists(username: string, excludeUserId?: string): boolean {
    const users = dataStore.getUsers();
    return users.some(user => 
      user.username === username && 
      (excludeUserId ? user.id !== excludeUserId : true)
    );
  }

  // 生成唯一用户名
  static generateUniqueUsername(email: string): string {
    let baseUsername = this.generateDefaultUsername(email);
    let counter = 1;
    
    while (this.isUsernameExists(baseUsername)) {
      const localPart = email.split('@')[0];
      const timestamp = Date.now().toString().slice(-4);
      baseUsername = `用户_${localPart}_${timestamp}_${counter}`;
      counter++;
      
      // 防止无限循环
      if (counter > 999) {
        baseUsername = `用户_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;
        break;
      }
    }
    
    return baseUsername;
  }
}

// 定期清理过期数据（每小时清理一次）
if (typeof window === 'undefined') { // 只在服务器端运行
  setInterval(() => {
    AuthUtils.cleanupExpiredData();
  }, 60 * 60 * 1000);
}
