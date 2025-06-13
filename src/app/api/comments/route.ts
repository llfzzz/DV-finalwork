import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Comment, CommentFormData } from '@/types/comment';
import { AuthUtils } from '@/lib/auth';

const commentsDir = path.join(process.cwd(), 'data', 'comments');
const membersMap = {
  '王宇盛': 'wys',
  '刘子东': 'lzd',
  '周璇': 'zx',
  '彭雷': 'pl',
  '罗方政': 'lfz'
};

// 确保评论目录存在
if (!fs.existsSync(commentsDir)) {
  fs.mkdirSync(commentsDir, { recursive: true });
}

function getCommentsFilePath(memberName: string): string {
  const memberCode = membersMap[memberName as keyof typeof membersMap];
  if (!memberCode) {
    throw new Error(`未知的成员名称: ${memberName}`);
  }
  return path.join(commentsDir, `${memberCode}_comments.json`);
}

function loadComments(memberName: string): Comment[] {
  const filePath = getCommentsFilePath(memberName);
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading comments:', error);
  }
  return [];
}

function saveComments(memberName: string, comments: Comment[]): void {
  const filePath = getCommentsFilePath(memberName);
  try {
    fs.writeFileSync(filePath, JSON.stringify(comments, null, 2));
  } catch (error) {
    console.error('Error saving comments:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const memberName = searchParams.get('memberName');
    
    if (!memberName) {
      return NextResponse.json({ error: '缺少成员名称参数' }, { status: 400 });
    }

    const comments = loadComments(memberName);
    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Error in GET /api/comments:', error);
    return NextResponse.json({ error: '获取评论失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CommentFormData;
    const { content, memberName } = body;    if (!content || !memberName) {
      return NextResponse.json({ error: '评论内容和成员名称不能为空' }, { status: 400 });
    }
    
    // 从session中获取用户信息
    const { session, user } = await AuthUtils.getSessionFromRequest(request);
    if (!session || !user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const comments = loadComments(memberName);
    const newComment: Comment = {
      id: Date.now().toString(),
      content,
      author: user.username,
      memberName,
      timestamp: Date.now(),
      likes: 0,
      likedBy: [],
      replies: []
    };

    comments.push(newComment);
    saveComments(memberName, comments);

    return NextResponse.json({ success: true, comment: newComment });
  } catch (error) {
    console.error('Error in POST /api/comments:', error);
    return NextResponse.json({ error: '添加评论失败' }, { status: 500 });
  }
}
