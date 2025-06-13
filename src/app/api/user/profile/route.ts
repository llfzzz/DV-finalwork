import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { AuthUtils } from '@/lib/auth';
import { dataStore } from '@/lib/dataStore';
import { APIResponse } from '@/types/user';

// 根据用户名获取用户信息
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username } = body;

    if (!username) {
      return NextResponse.json<APIResponse>({
        success: false,
        message: '用户名不能为空'
      }, { status: 400 });
    }

    const user = dataStore.getUserByUsername(username);

    if (!user) {
      return NextResponse.json<APIResponse>({
        success: false,
        message: '用户不存在'
      }, { status: 404 });
    }    return NextResponse.json<APIResponse>({
      success: true,
      message: '获取用户信息成功',
      data: {
        user: {
          id: user.id,
          username: user.username,
          avatar: user.avatar
        }
      }
    });

  } catch (error) {
    console.error('Get profile API error:', error);
    return NextResponse.json<APIResponse>({
      success: false,
      message: '服务器内部错误'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { session, user } = await AuthUtils.getSessionFromRequest(request);

    if (!session || !user) {
      return NextResponse.json<APIResponse>({
        success: false,
        message: '未登录'
      }, { status: 401 });
    }

    const formData = await request.formData();
    const username = formData.get('username') as string;
    const avatarFile = formData.get('avatar') as File;

    const updates: any = {};

    // 更新用户名
    if (username && username !== user.username) {
      if (!AuthUtils.validateUsername(username)) {
        return NextResponse.json<APIResponse>({
          success: false,
          message: '用户名格式不正确（2-20个字符，支持中英文、数字、下划线）'
        }, { status: 400 });
      }

      if (AuthUtils.isUsernameExists(username, user.id)) {
        return NextResponse.json<APIResponse>({
          success: false,
          message: '用户名已存在'
        }, { status: 400 });
      }

      updates.username = username;
    }

    // 更新头像
    if (avatarFile && avatarFile.size > 0) {
      // 验证文件类型
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(avatarFile.type)) {
        return NextResponse.json<APIResponse>({
          success: false,
          message: '只支持 JPG、PNG、GIF、WebP 格式的图片'
        }, { status: 400 });
      }

      // 验证文件大小（最大5MB）
      if (avatarFile.size > 5 * 1024 * 1024) {
        return NextResponse.json<APIResponse>({
          success: false,
          message: '头像文件大小不能超过5MB'
        }, { status: 400 });
      }

      try {
        const bytes = await avatarFile.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // 生成文件名
        const timestamp = Date.now();
        const extension = avatarFile.name.split('.').pop();
        const filename = `${user.id}_${timestamp}.${extension}`;
        const filepath = path.join(process.cwd(), 'public', 'uploads', 'avatars', filename);

        // 保存文件
        await writeFile(filepath, buffer);
        updates.avatar = `/uploads/avatars/${filename}`;
      } catch (error) {
        console.error('Avatar upload error:', error);
        return NextResponse.json<APIResponse>({
          success: false,
          message: '头像上传失败'
        }, { status: 500 });
      }
    }

    // 如果没有更新内容
    if (Object.keys(updates).length === 0) {
      return NextResponse.json<APIResponse>({
        success: false,
        message: '没有需要更新的内容'
      }, { status: 400 });
    }

    // 更新用户信息
    const updatedUser = dataStore.updateUser(user.id, updates);

    if (!updatedUser) {
      return NextResponse.json<APIResponse>({
        success: false,
        message: '更新失败'
      }, { status: 500 });
    }

    return NextResponse.json<APIResponse>({
      success: true,
      message: '更新成功',
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          username: updatedUser.username,
          avatar: updatedUser.avatar
        }
      }
    });

  } catch (error) {
    console.error('Update profile API error:', error);
    return NextResponse.json<APIResponse>({
      success: false,
      message: '服务器内部错误'
    }, { status: 500 });
  }
}
