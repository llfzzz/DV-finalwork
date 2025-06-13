import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';
import { APIResponse } from '@/types/user';

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('session')?.value;
    
    if (sessionId) {
      // 删除会话
      dataStore.deleteSession(sessionId);
    }

    // 清除cookie
    const response = NextResponse.json<APIResponse>({
      success: true,
      message: '已成功登出'
    });

    response.cookies.set('session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // 立即过期
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Logout API error:', error);
    return NextResponse.json<APIResponse>({
      success: false,
      message: '登出失败'
    }, { status: 500 });
  }
}
