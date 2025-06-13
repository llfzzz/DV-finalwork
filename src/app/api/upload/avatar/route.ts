import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { APIResponse } from '@/types/user';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json<APIResponse>({
        success: false,
        message: '没有上传文件'
      }, { status: 400 });
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json<APIResponse>({
        success: false,
        message: '只支持 JPG、PNG 格式的图片'
      }, { status: 400 });
    }

    // 验证文件大小 (2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json<APIResponse>({
        success: false,
        message: '文件大小不能超过 2MB'
      }, { status: 400 });
    }

    // 生成唯一文件名
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop() || 'jpg';
    const fileName = `avatar_${timestamp}_${randomString}.${extension}`;

    // 确保上传目录存在
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'avatars');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // 目录可能已存在，忽略错误
    }

    // 保存文件
    const filePath = join(uploadDir, fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    await writeFile(filePath, buffer);

    // 返回文件URL
    const fileUrl = `/uploads/avatars/${fileName}`;

    return NextResponse.json<APIResponse>({
      success: true,
      message: '头像上传成功',
      data: {
        url: fileUrl
      }
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json<APIResponse>({
      success: false,
      message: '上传失败，请重试'
    }, { status: 500 });
  }
}
