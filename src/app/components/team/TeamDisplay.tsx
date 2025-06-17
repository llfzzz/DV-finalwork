import React, { useState, useRef } from 'react';
import { Card, Tag, Avatar, Row, Col, Button, Divider, Dialog } from 'tdesign-react';
import { UserIcon, ChatIcon, ShareIcon, ThumbUpIcon } from 'tdesign-icons-react';
import { useAuth } from '@/contexts/AuthContext';
import { PersonalCommentDialog } from '../CommentComponents';
import { TeamMember, teamMembers } from '@/data/teamMembers';

interface FloatingLike {
  id: number;
  x: number;
  y: number;
}

const TeamMemberCard: React.FC<{ member: TeamMember; style?: React.CSSProperties }> = ({ member, style }) => {
  const [floatingLikes, setFloatingLikes] = useState<FloatingLike[]>([]);
  const [likeId, setLikeId] = useState(0);
  const [shareDialogVisible, setShareDialogVisible] = useState(false);
  const [commentDialogVisible, setCommentDialogVisible] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const likeButtonRef = useRef<HTMLElement>(null);
  const { requireAuth } = useAuth();

  const handleLike = (e: React.MouseEvent) => {
    // 点击点赞不需要登录
    const buttonRect = likeButtonRef.current?.getBoundingClientRect();
    if (buttonRect) {
      const angle = (Math.random() - 0.5) * Math.PI;
      const distance = 30 + Math.random() * 50;
      
      const newLike: FloatingLike = {
        id: likeId,
        x: Math.cos(angle) * distance,
        y: -Math.abs(Math.sin(angle)) * distance - 20,
      };
      
      setFloatingLikes(prev => [...prev, newLike]);
      setLikeId(prev => prev + 1);
      
      setTimeout(() => {
        setFloatingLikes(prev => prev.filter(like => like.id !== newLike.id));
      }, 3000);
    }
  };    
  const handleChat = () => {
    // 评论功能需要登录
    if (requireAuth()) {
      setCommentDialogVisible(true);
    }
  };

  const handleShare = () => {
    // 查看详细信息需要登录
    if (requireAuth()) {
      setShareDialogVisible(true);
    }
  };
  const handleShareDialogClose = () => {
    setShareDialogVisible(false);
    setIsConfirmed(false); // 退出对话框时重置状态
  };
  const handleConfirm = () => {
    if (isConfirmed) {
      // 如果已经确认过，点击"已加 莫辜负"会重置状态并关闭对话框
      setIsConfirmed(false);
      setShareDialogVisible(false);
    } else {
      // 首次点击"认可了"只设置确认状态，不关闭对话框
      setIsConfirmed(true);
    }
  };
  const handleCancel = () => {
    setShareDialogVisible(false);
    setIsConfirmed(false);
  };
  return (
    <div style={{ position: 'relative' }}>
      <Card
        actions={
          <Tag theme={member.role === 'leader' ? 'primary' : 'success'}>
            {member.position}
          </Tag>
        }      
        bordered
        cover={member.coverImage || "https://tdesign.gtimg.com/site/source/card-demo.png"}
        style={{ width: '320px', ...style }}      
        header={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Avatar size="48px" image={member.avatar}>
              {!member.avatar && <UserIcon />}
            </Avatar>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
                {member.name}
              </h3>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                {member.position}
              </p>
            </div>
          </div>
        }
        footer={
          <Row align="middle" justify="center">
            <Col flex="auto">
              <Button 
                ref={likeButtonRef}
                variant="text" 
                onClick={handleLike}
                style={{ position: 'relative' }}
              >
                <ThumbUpIcon />
              </Button>
            </Col>
            <Divider layout="vertical" />
            <Col flex="auto">
              <Button variant="text" onClick={handleChat}>
                <ChatIcon />
              </Button>
            </Col>
            <Divider layout="vertical" />
            <Col flex="auto">
              <Button variant="text" onClick={handleShare}>
                <ShareIcon />
              </Button>
            </Col>
          </Row>
        }
      >    
        </Card>      
      {/* 漂浮的点赞图标 */}
      {floatingLikes.map((like) => (
        <div
          key={like.id}
          className="floating-like"
          style={{
            position: 'absolute',
            bottom: '60px',
            left: '10%',
            transform: `translate(${like.x}px, ${like.y}px)`,
            pointerEvents: 'none',
            fontSize: '24px',
            color: '#ff6b6b',
            zIndex: 1000,
          }}
        >
          <ThumbUpIcon/>
        </div>
      ))}      
      {/* 对话框 */}
      <Dialog
        header={`${member.name} `}
        visible={shareDialogVisible}
        confirmBtn={isConfirmed ? "已加 莫辜负" : "认可了"}
        cancelBtn="一般"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        onClose={handleShareDialogClose}
      >
        {member.shareContent && (
          <div style={{ padding: '10px 0' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#1890ff' }}>
              {member.shareContent.title}
            </h4>
            <p style={{ margin: '0 0 15px 0', lineHeight: '1.6' }}>
              {member.shareContent.description}
            </p>
              <div style={{ marginBottom: '15px' }}>
              <strong style={{ display: 'block', marginBottom: '8px' }}>标签：</strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {member.shareContent.skills.map((skill, index) => (
                  <Tag key={index} variant="light" theme="primary">
                    {skill}
                  </Tag>
                ))}
              </div>
            </div>
            {isConfirmed && (
              <div>
                <strong style={{ display: 'block', marginBottom: '8px' }}>vx</strong>
                <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                  {member.shareContent.contact}
                </p>
              </div>
            )}
          </div>
        )}
      </Dialog>

      {/* 个人评论弹窗 */}
      <PersonalCommentDialog 
        memberName={member.name}
        visible={commentDialogVisible}
        onClose={() => setCommentDialogVisible(false)}
      />
    </div>
  );
};

export default function TeamDisplay() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', padding: '20px' }}>
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <TeamMemberCard member={teamMembers[0]} />
      </div>

      <div style={{ position: 'absolute', top: '20px', left: '20px' }}>
        <TeamMemberCard member={teamMembers[1]} />
      </div>

      <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
        <TeamMemberCard member={teamMembers[2]} />
      </div>

      <div style={{ position: 'absolute', bottom: '20px', left: '20px' }}>
        <TeamMemberCard member={teamMembers[3]} />
      </div>

      <div style={{ position: 'absolute', bottom: '20px', right: '20px' }}>
        <TeamMemberCard member={teamMembers[4]} />
      </div>
    </div>
  );
}
