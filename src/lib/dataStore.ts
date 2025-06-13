import fs from 'fs';
import path from 'path';
import {OTPCode, Session, User} from '@/types/user';

class DataStore {
  private basePath = path.join(process.cwd(), 'data');

  // 读取JSON文件
  private readFile<T>(filename: string): T[] {
    try {
      const filePath = path.join(this.basePath, filename);
      if (!fs.existsSync(filePath)) {
        return [];
      }
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data) || [];
    } catch (error) {
      console.error(`Error reading file ${filename}:`, error);
      return [];
    }
  }

  // 写入JSON文件
  private writeFile<T>(filename: string, data: T[]): void {
    try {
      const filePath = path.join(this.basePath, filename);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`Error writing file ${filename}:`, error);
    }
  }

  // 用户相关操作
  getUsers(): User[] {
    return this.readFile<User>('users.json');
  }

  saveUsers(users: User[]): void {
    this.writeFile('users.json', users);
  }

  getUserByEmail(email: string): User | undefined {
    const users = this.getUsers();
    return users.find(user => user.email === email);
  }

  getUserById(id: string): User | undefined {
    const users = this.getUsers();
    return users.find(user => user.id === id);
  }

  getUserByUsername(username: string): User | undefined {
    const users = this.getUsers();
    return users.find(user => user.username === username);
  }

  createUser(userData: Omit<User, 'id' | 'createdAt'>): User {
    const users = this.getUsers();
    const newUser: User = {
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      ...userData
    };
    users.push(newUser);
    this.saveUsers(users);
    return newUser;
  }
  updateUser(id: string, updates: Partial<User>): User | undefined {
    const users = this.getUsers();
    const userIndex = users.findIndex(user => user.id === id);
    if (userIndex === -1) return undefined;

    users[userIndex] = { ...users[userIndex], ...updates };
    this.saveUsers(users);
    return users[userIndex];
  }

  // OTP相关操作
  getOTPCodes(): OTPCode[] {
    return this.readFile<OTPCode>('otp_codes.json');
  }

  saveOTPCodes(codes: OTPCode[]): void {
    this.writeFile('otp_codes.json', codes);
  }

  saveOTPCode(code: OTPCode): void {
    const codes = this.getOTPCodes();
    // 清除同一邮箱的旧验证码
    const filteredCodes = codes.filter(c => c.email !== code.email || c.purpose !== code.purpose);
    filteredCodes.push(code);
    this.saveOTPCodes(filteredCodes);
  }

  getValidOTPCode(email: string, code: string, purpose: 'login' | 'register'): OTPCode | undefined {
    const codes = this.getOTPCodes();
    return codes.find(c =>
        c.email === email &&
        c.code === code &&
        c.purpose === purpose &&
        new Date(c.expiresAt) > new Date()
    );
  }

  deleteOTPCode(email: string, purpose: 'login' | 'register'): void {
    const codes = this.getOTPCodes();
    const filteredCodes = codes.filter(c => !(c.email === email && c.purpose === purpose));
    this.saveOTPCodes(filteredCodes);
  }

  // 会话相关操作
  getSessions(): Session[] {
    return this.readFile<Session>('sessions.json');
  }

  saveSessions(sessions: Session[]): void {
    this.writeFile('sessions.json', sessions);
  }

  createSession(userId: string, email: string): Session {
    const sessions = this.getSessions();
    const newSession: Session = {
      sessionId: this.generateId(),
      userId,
      email,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7天过期
    };
    sessions.push(newSession);
    this.saveSessions(sessions);
    return newSession;
  }

  getValidSession(sessionId: string): Session | undefined {
    const sessions = this.getSessions();
    return sessions.find(s =>
        s.sessionId === sessionId &&
        new Date(s.expiresAt) > new Date()
    );
  }

  deleteSession(sessionId: string): void {
    const sessions = this.getSessions();
    const filteredSessions = sessions.filter(s => s.sessionId !== sessionId);
    this.saveSessions(filteredSessions);
  }

  // 清理过期数据
  cleanupExpiredData(): void {
    const now = new Date();
    
    // 清理过期的OTP
    const otpCodes = this.getOTPCodes();
    const validOTPs = otpCodes.filter(otp => new Date(otp.expiresAt) > now);
    this.saveOTPCodes(validOTPs);

    // 清理过期的会话
    const sessions = this.getSessions();
    const validSessions = sessions.filter(session => new Date(session.expiresAt) > now);
    this.saveSessions(validSessions);
  }

  // 生成唯一ID
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

export const dataStore = new DataStore();
