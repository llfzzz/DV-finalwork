import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';
import { AuthUtils } from '@/lib/auth';
import { APIResponse } from '@/types/user';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, username, password, avatar } = body;

    // 验证必填字段
    if (!email || !username || !password || !avatar) {
      return NextResponse.json<APIResponse>({
        success: false,
        message: '请填写所有必填字段'
      }, { status: 400 });
    }

    // 验证邮箱格式
    if (!AuthUtils.validateEmail(email)) {
      return NextResponse.json<APIResponse>({
        success: false,
        message: '邮箱格式不正确'
      }, { status: 400 });
    }

    // 验证用户名长度
    if (username.length < 2 || username.length > 20) {
      return NextResponse.json<APIResponse>({
        success: false,
        message: '用户名长度应在2-20个字符之间'
      }, { status: 400 });
    }

    // 验证密码长度
    if (password.length < 6) {
      return NextResponse.json<APIResponse>({
        success: false,
        message: '密码长度至少6位'
      }, { status: 400 });
    }    // 检查邮箱是否已存在
    const existingUser = dataStore.getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json<APIResponse>({
        success: false,
        message: '该邮箱已被注册'
      }, { status: 400 });
    }

    // 检查用户名是否已存在
    const existingUsername = dataStore.getUserByUsername(username);
    if (existingUsername) {
      return NextResponse.json<APIResponse>({
        success: false,
        message: '用户名已被使用'
      }, { status: 400 });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 12);    // 创建新用户
    const newUser = dataStore.createUser({
      email,
      username,
      password: hashedPassword,
      avatar,
      lastLoginAt: new Date().toISOString(),
      isVerified: true // 直接注册的用户默认已验证
    });    // 创建会话
    const session = dataStore.createSession(newUser.id, newUser.email);
    
    // 删除已使用的注册验证码
    dataStore.deleteOTPCode(newUser.email, 'register');
    
    // 设置会话cookie
    const response = NextResponse.json<APIResponse>({
      success: true,
      message: '注册成功',
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          avatar: newUser.avatar,
          createdAt: newUser.createdAt,
          lastLoginAt: newUser.lastLoginAt,
          isVerified: newUser.isVerified
        }
      }
    });

    response.cookies.set('session', session.sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7天
    });

    return response;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json<APIResponse>({
      success: false,
      message: '服务器错误'
    }, { status: 500 });
  }
}
