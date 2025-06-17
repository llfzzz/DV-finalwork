import React, {useEffect, useState, useCallback} from 'react';
import {Button, Comment as TComment, Dialog, Textarea} from 'tdesign-react';
import {CaretRightSmallIcon, ChatIcon, ThumbUpIcon} from 'tdesign-icons-react';
import {Comment, Reply} from '@/types/comment';
import {useAuth} from '@/contexts/AuthContext';
import {showMessage} from '@/lib/message';

interface CommentDisplayProps {
  memberName: string;
  visible: boolean;
  onClose: () => void;
}

interface PersonalCommentProps {
  memberName: string;
  visible: boolean;
  onClose: () => void;
}

interface InlineCommentDisplayProps {
  memberName: string;
}

// 公共状态和方法的钩子
function useCommentState() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [replyDialogs, setReplyDialogs] = useState<{[key: string]: boolean}>({});
  const [replyContents, setReplyContents] = useState<{[key: string]: string}>({});
  const [replyTargets, setReplyTargets] = useState<{[key: string]: string}>({});
  const [userAvatars, setUserAvatars] = useState<{[key: string]: string}>({});
  const { user } = useAuth();

  return {
    comments,
    setComments,
    loading,
    setLoading,
    replyDialogs,
    setReplyDialogs,
    replyContents,
    setReplyContents,
    replyTargets,
    setReplyTargets,
    userAvatars,
    setUserAvatars,
    user
  };
}

// 公共方法
function useCommentActions(
  memberName: string,
  {
    setUserAvatars,
    setLoading,
    setComments,
    setReplyDialogs,
    setReplyContents,
    setReplyTargets,
    replyDialogs,
    replyContents,
    replyTargets,
    userAvatars,
    user
  }: ReturnType<typeof useCommentState>
) {  // 获取用户头像
  const fetchUserAvatar = useCallback(async (username: string): Promise<string> => {
    if (userAvatars[username]) {
      return userAvatars[username];
    }

    try {
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const avatar = data.data?.user?.avatar || '/assets/icons/lfz.jpeg';
        setUserAvatars(prev => ({ ...prev, [username]: avatar }));
        return avatar;
      }
    } catch (error) {
      console.error('获取用户头像失败:', error);
    }
    
    const fallbackAvatar = '/assets/icons/lfz.jpeg';
    setUserAvatars(prev => ({ ...prev, [username]: fallbackAvatar }));
    return fallbackAvatar;
  }, [userAvatars, setUserAvatars]);
  // 加载评论
  const loadComments = useCallback(async (checkVisible?: boolean, visible?: boolean) => {
    if (checkVisible && !visible) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/comments?memberName=${encodeURIComponent(memberName)}`);
      const data = await response.json();
      if (data.comments) {
        setComments(data.comments);
        
        // 收集所有用户名
        const usernames = new Set<string>();
        data.comments.forEach((comment: Comment) => {
          usernames.add(comment.author);
          comment.replies.forEach((reply: Reply) => {
            usernames.add(reply.author);
          });
        });
        
        // 并行获取所有用户头像
        const avatarPromises = Array.from(usernames).map(async (username) => {
          // 内联头像获取逻辑，避免依赖循环
          try {
            const response = await fetch('/api/user/profile', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ username }),
            });
            
            if (response.ok) {
              const data = await response.json();
              return { username, avatar: data.data?.user?.avatar || '/assets/icons/lfz.jpeg' };
            }
          } catch (error) {
            console.error('获取用户头像失败:', error);
          }
          
          return { username, avatar: '/assets/icons/lfz.jpeg' };
        });
        
        const avatarResults = await Promise.all(avatarPromises);
        const avatarMap: {[key: string]: string} = {};
        avatarResults.forEach(({ username, avatar }) => {
          avatarMap[username] = avatar;
        });
        
        setUserAvatars(prev => ({ ...prev, ...avatarMap }));
      }
    } catch (error) {
      console.error('加载评论失败:', error);
      showMessage.error('加载评论失败');
    } finally {
      setLoading(false);
    }
  }, [memberName, setLoading, setComments, setUserAvatars]);

  // 点赞评论
  const handleLike = useCallback(async (commentId: string, replyId?: string) => {
    try {
      const response = await fetch('/api/comments/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          commentId,
          memberName,
          replyId
        }),
      });

      const data = await response.json();
      if (data.success) {
        // 只更新点赞状态，不重新加载整个评论列表
        setComments(prevComments => 
          prevComments.map(comment => {
            if (comment.id === commentId) {
              if (replyId) {
                // 更新回复的点赞状态
                return {
                  ...comment,
                  replies: comment.replies.map(reply => 
                    reply.id === replyId 
                      ? { 
                          ...reply, 
                          likes: data.data.likes, 
                          likedBy: data.data.isLiked 
                            ? [...reply.likedBy.filter(u => u !== user?.username), user?.username || '']
                            : reply.likedBy.filter(u => u !== user?.username)
                        }
                      : reply
                  )
                };
              } else {
                // 更新评论的点赞状态
                return {
                  ...comment,
                  likes: data.data.likes,
                  likedBy: data.data.isLiked 
                    ? [...comment.likedBy.filter(u => u !== user?.username), user?.username || '']
                    : comment.likedBy.filter(u => u !== user?.username)
                };
              }
            }
            return comment;
          })
        );
      } else {
        showMessage.error(data.error || '点赞失败');
      }
    } catch (error) {
      console.error('点赞失败:', error);
      showMessage.error('点赞失败，请重试');
    }
  }, [memberName, setComments, user?.username]);

  // 显示回复对话框
  const showReplyDialog = useCallback((commentId: string, replyTo?: string) => {
    setReplyDialogs({ ...replyDialogs, [commentId]: true });
    setReplyTargets({ ...replyTargets, [commentId]: replyTo || '' });
  }, [replyDialogs, replyTargets, setReplyDialogs, setReplyTargets]);

  // 隐藏回复对话框
  const hideReplyDialog = useCallback((commentId: string) => {
    setReplyDialogs({ ...replyDialogs, [commentId]: false });
    setReplyContents({ ...replyContents, [commentId]: '' });
    setReplyTargets({ ...replyTargets, [commentId]: '' });
  }, [replyDialogs, replyContents, replyTargets, setReplyDialogs, setReplyContents, setReplyTargets]);

  // 提交回复
  const handleReply = useCallback(async (commentId: string) => {
    const content = replyContents[commentId];
    if (!content?.trim()) {
      showMessage.warning('请输入回复内容');
      return;
    }

    try {
      const response = await fetch('/api/comments/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          content: content.trim(),
          commentId,
          memberName,
          replyTo: replyTargets[commentId]
        }),
      });

      const data = await response.json();
      if (data.success) {
        showMessage.success('回复发布成功！');
        hideReplyDialog(commentId);
        await loadComments();
      } else {
        showMessage.error(data.error || '回复失败');
      }
    } catch (error) {
      console.error('回复失败:', error);
      showMessage.error('回复失败，请重试');
    }
  }, [replyContents, replyTargets, memberName, hideReplyDialog, loadComments]);

  return {
    loadComments,
    handleLike,
    showReplyDialog,
    hideReplyDialog,
    handleReply
  };
}

// 渲染回复的组件
function RepliesRenderer({ 
  replies, 
  commentId, 
  userAvatars, 
  user, 
  handleLike, 
  showReplyDialog 
}: {
  replies: Reply[];
  commentId: string;
  userAvatars: {[key: string]: string};
  user: { username?: string } | null;
  handleLike: (commentId: string, replyId?: string) => void;
  showReplyDialog: (commentId: string, replyTo?: string) => void;
}) {
  return (
    <>
      {replies.map((reply) => {
        const isLiked = reply.likedBy.includes(user?.username || '');
        
        const replyAuthor = reply.replyTo ? (
          <>
            <span>{reply.author}</span>
            <CaretRightSmallIcon size="small" />
            <span>{reply.replyTo}</span>
          </>
        ) : (
          <span>{reply.author}</span>
        );

        const actions = [
          <div key="like" style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} onClick={() => handleLike(commentId, reply.id)}>
            <ThumbUpIcon size="16px" style={{ color: isLiked ? '#1890ff' : '#666' }} />
            <span style={{ color: isLiked ? '#1890ff' : '#666' }}>{reply.likes}</span>
          </div>,
          <div key="reply" style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} onClick={() => showReplyDialog(commentId, reply.author)}>
            <ChatIcon size="16px" />
            <span>回复</span>
          </div>,
        ];
        return (
          <TComment
            key={reply.id}
            avatar={userAvatars[reply.author] || '/assets/icons/lfz.jpeg'}
            author={replyAuthor}
            datetime={new Date(reply.timestamp).toLocaleString()}
            content={reply.content}
            actions={actions}
          />
        );
      })}
    </>
  );
}

// 回复对话框组件
function ReplyDialog({
  commentId,
  visible,
  replyTargets,
  replyContents,
  setReplyContents,
  hideReplyDialog,
  handleReply
}: {
  commentId: string;
  visible: boolean;
  replyTargets: {[key: string]: string};
  replyContents: {[key: string]: string};
  setReplyContents: React.Dispatch<React.SetStateAction<{[key: string]: string}>>;
  hideReplyDialog: (commentId: string) => void;
  handleReply: (commentId: string) => void;
}) {
  if (!visible) return null;

  return (
    <div style={{ margin: '10px 0', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
      <Textarea
        placeholder={replyTargets[commentId] ? `回复 @${replyTargets[commentId]}` : '写下你的回复...'}
        value={replyContents[commentId] || ''}
        onChange={(value: string) => setReplyContents({ ...replyContents, [commentId]: value })}
        autosize={{ minRows: 2, maxRows: 4 }}
      />
      <div style={{ textAlign: 'right', marginTop: '8px' }}>
        <Button size="small" variant="outline" onClick={() => hideReplyDialog(commentId)} style={{ marginRight: '8px' }}>
          取消
        </Button>
        <Button size="small" theme="primary" onClick={() => handleReply(commentId)}>
          回复
        </Button>
      </div>
    </div>
  );
}

// 评论列表组件
function CommentList({
  comments,
  loading,
  userAvatars,
  user,
  handleLike,
  showReplyDialog,
  replyDialogs,
  replyTargets,
  replyContents,
  setReplyContents,
  hideReplyDialog,
  handleReply
}: {
  comments: Comment[];
  loading: boolean;
  userAvatars: {[key: string]: string};
  user: { username?: string } | null;
  handleLike: (commentId: string, replyId?: string) => void;
  showReplyDialog: (commentId: string, replyTo?: string) => void;
  replyDialogs: {[key: string]: boolean};
  replyTargets: {[key: string]: string};
  replyContents: {[key: string]: string};
  setReplyContents: React.Dispatch<React.SetStateAction<{[key: string]: string}>>;
  hideReplyDialog: (commentId: string) => void;
  handleReply: (commentId: string) => void;
}) {
  if (loading) {
    return <div style={{ textAlign: 'center', padding: '20px' }}>加载中...</div>;
  }

  if (comments.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
        看起来，并没有人想说话...
      </div>
    );
  }

  return (
    <>
      {comments.map((comment) => {
        const isLiked = comment.likedBy.includes(user?.username || '');
        
        const actions = [
          <div key="like" style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} onClick={() => handleLike(comment.id)}>
            <ThumbUpIcon size="16px" style={{ color: isLiked ? '#1890ff' : '#666' }} />
            <span style={{ color: isLiked ? '#1890ff' : '#666' }}>{comment.likes}</span>
          </div>,
          <div key="reply" style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} onClick={() => showReplyDialog(comment.id)}>
            <ChatIcon size="16px" />
            <span>回复</span>
          </div>,
        ];

        return (
            <div key={comment.id}>
            <TComment
              avatar={userAvatars[comment.author] || '/assets/icons/lfz.jpeg'}
              author={comment.author}
              datetime={new Date(comment.timestamp).toLocaleString()}
              content={comment.content}
              actions={actions}
              reply={comment.replies.length > 0 ? (
                <RepliesRenderer
                  replies={comment.replies}
                  commentId={comment.id}
                  userAvatars={userAvatars}
                  user={user}
                  handleLike={handleLike}
                  showReplyDialog={showReplyDialog}
                />
              ) : undefined}
            />
            <ReplyDialog
              commentId={comment.id}
              visible={replyDialogs[comment.id]}
              replyTargets={replyTargets}
              replyContents={replyContents}
              setReplyContents={setReplyContents}
              hideReplyDialog={hideReplyDialog}
              handleReply={handleReply}
            />
          </div>
        );
      })}
    </>
  );
}

// 个人评论弹窗组件
export function PersonalCommentDialog({ memberName, visible, onClose }: PersonalCommentProps) {
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!comment.trim()) {
      showMessage.warning('你想对他说什么？');
      return;
    }

    setLoading(true);
    try {      
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          content: comment.trim(),
          memberName
        }),
      });

      const data = await response.json();
      if (data.success) {
        showMessage.success('评论发布成功！');
        setComment('');
        onClose();
      } else {
        showMessage.error(data.error || '评论发布失败');
      }
    } catch (error) {
      console.error('评论发布失败:', error);
      showMessage.error('评论发布失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      header={`给 ${memberName} 的话`}
      visible={visible}
      onClose={onClose}
      footer={
        <div style={{ textAlign: 'right' }}>
          <Button variant="outline" onClick={onClose} style={{ marginRight: 8 }}>
            取消
          </Button>
          <Button theme="primary" onClick={handleSubmit} loading={loading}>
            发布评论
          </Button>
        </div>
      }
      width={500}
    >      
      <div style={{ padding: '20px 0' }}>        
        <Textarea
          placeholder={`写下你想对 ${memberName} 说的话...`}
          autosize={{ minRows: 4, maxRows: 8 }}
          value={comment}
          onChange={setComment}
          maxlength={500}
        />
      </div>
    </Dialog>
  );
}

// 内联评论展示组件（不使用弹窗）
export function InlineCommentDisplay({ memberName }: InlineCommentDisplayProps) {
  const state = useCommentState();
  const actions = useCommentActions(memberName, state);
  useEffect(() => {
    actions.loadComments();
  }, [memberName, actions.loadComments]);

  return (
    <div style={{ padding: '10px 0' }}>
      <CommentList
        comments={state.comments}
        loading={state.loading}
        userAvatars={state.userAvatars}
        user={state.user}
        handleLike={actions.handleLike}
        showReplyDialog={actions.showReplyDialog}
        replyDialogs={state.replyDialogs}
        replyTargets={state.replyTargets}
        replyContents={state.replyContents}
        setReplyContents={state.setReplyContents}
        hideReplyDialog={actions.hideReplyDialog}
        handleReply={actions.handleReply}
      />
    </div>
  );
}

// 评论展示组件
export function CommentDisplay({ memberName, visible, onClose }: CommentDisplayProps) {
  const state = useCommentState();
  const actions = useCommentActions(memberName, state);

  useEffect(() => {
    actions.loadComments(true, visible);
  }, [visible, memberName, actions.loadComments]);

  return (
    <Dialog
      header={`${memberName} 的评论区`}
      visible={visible}
      onClose={onClose}
      width={800}
      style={{ maxHeight: '80vh' }}
    >
      <div style={{ maxHeight: '60vh', overflow: 'auto', padding: '10px 0' }}>
        <CommentList
          comments={state.comments}
          loading={state.loading}
          userAvatars={state.userAvatars}
          user={state.user}
          handleLike={actions.handleLike}
          showReplyDialog={actions.showReplyDialog}
          replyDialogs={state.replyDialogs}
          replyTargets={state.replyTargets}
          replyContents={state.replyContents}
          setReplyContents={state.setReplyContents}
          hideReplyDialog={actions.hideReplyDialog}
          handleReply={actions.handleReply}
        />
      </div>
    </Dialog>
  );
}
