import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Comment, Reply } from '@/types/comment';
import { AuthUtils } from '@/lib/auth';

const commentsDir = path.join(process.cwd(), 'data', 'comments');
const membersMap = {
  '王宇盛': 'wys',
  '刘子东': 'lzd',
  '周璇': 'zx',
  '彭雷': 'pl',
  '罗方政': 'lfz'
};

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, commentId, memberName, replyTo } = body;    if (!content || !commentId || !memberName) {
      return NextResponse.json({ error: '参数不完整' }, { status: 400 });
    }

    // 从session中获取用户信息
    const { session, user } = await AuthUtils.getSessionFromRequest(request);
    if (!session || !user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const comments = loadComments(memberName);
    const comment = comments.find(c => c.id === commentId);
    
    if (!comment) {
      return NextResponse.json({ error: '评论不存在' }, { status: 404 });
    }

    const newReply: Reply = {
      id: Date.now().toString(),
      content,
      author: user.username,
      timestamp: Date.now(),
      likes: 0,
      likedBy: [],
      replyTo
    };

    comment.replies.push(newReply);
    saveComments(memberName, comments);

    return NextResponse.json({ success: true, reply: newReply });
  } catch (error) {
    console.error('Error in POST /api/comments/reply:', error);
    return NextResponse.json({ error: '添加回复失败' }, { status: 500 });
  }
}
