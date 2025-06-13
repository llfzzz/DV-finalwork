export interface User {
  id: string;
  email: string;
  username: string;
  avatar: string;
  password?: string; // 存储时加密
  createdAt: string;
  lastLoginAt: string;
  isVerified: boolean;
}

// OTP
export interface OTPCode {
  email: string;
  code: string;
  expiresAt: string;
  purpose: 'login' | 'register';
}

// 会话
export interface Session {
  sessionId: string;
  userId: string;
  email: string;
  createdAt: string;
  expiresAt: string;
}

// API响应
export interface APIResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

// 登录请求
export interface LoginRequest {
  email: string;
  step: 'request-otp' | 'verify-otp' | 'verify-register-otp' | 'password-login';
  otp?: string;
  password?: string;
  username?: string;
  avatar?: string;
  confirmPassword?: string;
}

// 更新个人资料（未实现）
export interface UpdateProfileRequest {
  username?: string;
  avatar?: File;
}
