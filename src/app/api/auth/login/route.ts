import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';
import { emailService } from '@/lib/emailService';
import { AuthUtils } from '@/lib/auth';
import { LoginRequest, APIResponse } from '@/types/user';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { email, step, otp, username, password } = body;

    // 验证邮箱格式
    if (!AuthUtils.validateEmail(email)) {
      return NextResponse.json<APIResponse>({
        success: false,
        message: '邮箱格式不正确'
      }, { status: 400 });
    }

    if (step === 'password-login') {
      // 密码登录
      if (!password) {
        return NextResponse.json<APIResponse>({
          success: false,
          message: '请输入密码'
        }, { status: 400 });
      }

      const existingUser = dataStore.getUserByEmail(email);
      if (!existingUser) {
        return NextResponse.json<APIResponse>({
          success: false,
          message: '用户不存在'
        }, { status: 400 });
      }

      if (!existingUser.password) {
        return NextResponse.json<APIResponse>({
          success: false,
          message: '该账户未设置密码，请使用验证码登录'
        }, { status: 400 });
      }

      // 验证密码
      const passwordValid = await bcrypt.compare(password, existingUser.password);
      if (!passwordValid) {
        return NextResponse.json<APIResponse>({
          success: false,
          message: '密码错误'
        }, { status: 400 });
      }

      // 更新最后登录时间
      const user = dataStore.updateUser(existingUser.id, {
        lastLoginAt: new Date().toISOString()
      });

      if (!user) {
        return NextResponse.json<APIResponse>({
          success: false,
          message: '更新用户信息失败'
        }, { status: 500 });
      }

      // 创建会话
      const session = dataStore.createSession(user.id, user.email);

      // 设置cookie
      const response = NextResponse.json<APIResponse>({
        success: true,
        message: '登录成功',
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            avatar: user.avatar
          }
        }
      });

      response.cookies.set('session', session.sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7天
        path: '/'
      });

      return response;

    } else if (step === 'request-otp') {
      // 第一步：请求验证码
      const existingUser = dataStore.getUserByEmail(email);
      const purpose = existingUser ? 'login' : 'register';
      
      // 生成6位验证码
      const otpCode = AuthUtils.generateOTPCode();
      
      // 保存验证码（有效期10分钟）
      dataStore.saveOTPCode({
        email,
        code: otpCode,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        purpose
      });

      // 发送邮件
      const emailSent = await emailService.sendOTPCode(email, otpCode, purpose);
      
      if (!emailSent) {
        return NextResponse.json<APIResponse>({
          success: false,
          message: '验证码发送失败，请稍后重试'
        }, { status: 500 });
      }

      return NextResponse.json<APIResponse>({
        success: true,
        message: `验证码已发送到 ${email}`,
        data: { 
          isNewUser: !existingUser,
          purpose 
        }
      });    } else if (step === 'verify-otp') {
      // 第二步：验证OTP并登录（仅现有用户）
      if (!otp) {
        return NextResponse.json<APIResponse>({
          success: false,
          message: '请输入验证码'
        }, { status: 400 });
      }

      const existingUser = dataStore.getUserByEmail(email);
      
      // 如果是新用户，应该通过注册API处理
      if (!existingUser) {
        return NextResponse.json<APIResponse>({
          success: false,
          message: '用户不存在，请先完成注册'
        }, { status: 400 });
      }

      // 验证OTP
      const validOTP = dataStore.getValidOTPCode(email, otp, 'login');
      if (!validOTP) {
        return NextResponse.json<APIResponse>({
          success: false,
          message: '验证码无效或已过期'
        }, { status: 400 });
      }

      // 更新最后登录时间
      const user = dataStore.updateUser(existingUser.id, {
        lastLoginAt: new Date().toISOString()
      });

      if (!user) {
        return NextResponse.json<APIResponse>({
          success: false,
          message: '更新用户信息失败'
        }, { status: 500 });
      }

      // 创建会话
      const session = dataStore.createSession(user.id, user.email);

      // 删除使用过的验证码
      dataStore.deleteOTPCode(email, 'login');

      // 设置cookie
      const response = NextResponse.json<APIResponse>({
        success: true,
        message: '登录成功',
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            avatar: user.avatar
          }
        }
      });

      response.cookies.set('session', session.sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7天
        path: '/'
      });

      return response;
      
    } else if (step === 'verify-register-otp') {
      // 注册时验证OTP（仅验证验证码，不登录）
      if (!otp) {
        return NextResponse.json<APIResponse>({
          success: false,
          message: '请输入验证码'
        }, { status: 400 });
      }

      const existingUser = dataStore.getUserByEmail(email);
      
      // 注册时用户不应该已存在
      if (existingUser) {
        return NextResponse.json<APIResponse>({
          success: false,
          message: '该邮箱已被注册，请使用登录功能'
        }, { status: 400 });
      }

      // 验证注册验证码
      const validOTP = dataStore.getValidOTPCode(email, otp, 'register');
      if (!validOTP) {
        return NextResponse.json<APIResponse>({
          success: false,
          message: '验证码无效或已过期'
        }, { status: 400 });
      }

      // 验证成功但不删除验证码，等注册完成后再删除
      return NextResponse.json<APIResponse>({
        success: true,
        message: '验证码验证成功'
      });
    }

    return NextResponse.json<APIResponse>({
      success: false,
      message: '无效的请求步骤'
    }, { status: 400 });

  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json<APIResponse>({
      success: false,
      message: '服务器内部错误'
    }, { status: 500 });
  }
}
