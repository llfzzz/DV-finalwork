import { NextRequest, NextResponse } from 'next/server';
import { AuthUtils } from '@/lib/auth';
import { APIResponse } from '@/types/user';

export async function GET(request: NextRequest) {
  try {
    const { session, user } = await AuthUtils.getSessionFromRequest(request);

    if (!session || !user) {
      return NextResponse.json<APIResponse>({
        success: false,
        message: '未登录'
      }, { status: 401 });
    }

    return NextResponse.json<APIResponse>({
      success: true,
      message: '获取用户信息成功',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          avatar: user.avatar,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt
        }
      }
    });

  } catch (error) {
    console.error('Get user API error:', error);
    return NextResponse.json<APIResponse>({
      success: false,
      message: '服务器内部错误'
    }, { status: 500 });
  }
}
