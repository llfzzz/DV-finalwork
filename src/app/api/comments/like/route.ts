import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Comment } from '@/types/comment';
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
    const { commentId, memberName, replyId } = body;    if (!commentId || !memberName) {
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

    // 如果是回复点赞
    if (replyId) {
      const reply = comment.replies.find(r => r.id === replyId);
      if (!reply) {
        return NextResponse.json({ error: '回复不存在' }, { status: 404 });
      }      const userIndex = reply.likedBy.indexOf(user.username);
      if (userIndex > -1) {
        // 取消点赞
        reply.likedBy.splice(userIndex, 1);
        reply.likes = Math.max(0, reply.likes - 1);
      } else {
        // 添加点赞
        reply.likedBy.push(user.username);
        reply.likes += 1;
      }
    } else {
      // 评论点赞
      const userIndex = comment.likedBy.indexOf(user.username);
      if (userIndex > -1) {
        // 取消点赞
        comment.likedBy.splice(userIndex, 1);
        comment.likes = Math.max(0, comment.likes - 1);
      } else {
        // 添加点赞
        comment.likedBy.push(user.username);
        comment.likes += 1;
      }
    }    saveComments(memberName, comments);
    
    // 返回更新后的点赞数据
    if (replyId) {
      const reply = comment.replies.find(r => r.id === replyId);
      return NextResponse.json({ 
        success: true, 
        data: {
          likes: reply!.likes,
          isLiked: reply!.likedBy.includes(user.username)
        }
      });
    } else {
      return NextResponse.json({ 
        success: true, 
        data: {
          likes: comment.likes,
          isLiked: comment.likedBy.includes(user.username)
        }
      });
    }
  } catch (error) {
    console.error('Error in POST /api/comments/like:', error);
    return NextResponse.json({ error: '点赞操作失败' }, { status: 500 });
  }
}
