import React from 'react';
import { Card, Avatar, Tag } from 'tdesign-react';
import { UserIcon } from 'tdesign-icons-react';
import { InlineCommentDisplay } from '../CommentComponents';
import { TeamMember } from '@/data/teamMembers';

interface MemberDetailProps {
  memberName: string;
  memberInfo: TeamMember;
}

export default function MemberDetail({ memberName, memberInfo }: MemberDetailProps) {
  return (
    <div style={{ padding: '20px', height: '100%', overflow: 'auto' }}>
      {/* 成员信息卡片 */}
      <Card
        bordered
        style={{ marginBottom: '20px' }}
        header={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Avatar size="64px" image={memberInfo.avatar}>
              {!memberInfo.avatar && <UserIcon />}
            </Avatar>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
                {memberInfo.name}
              </h2>
              <Tag theme={memberInfo.role === 'leader' ? 'primary' : 'success'} size="small">
                {memberInfo.position}
              </Tag>
            </div>
          </div>
        }
      >
        {memberInfo.shareContent && (
          <div>
            {memberInfo.shareContent.description && (
              <p style={{ margin: '0 0 15px 0', lineHeight: '1.6', color: '#666' }}>
                {memberInfo.shareContent.description}
              </p>
            )}
              {memberInfo.shareContent.skills.length > 0 && (
              <div style={{ marginBottom: '15px' }}>
                <strong style={{ display: 'block', marginBottom: '8px' }}>标签：</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {memberInfo.shareContent.skills.map((skill, index) => (
                    <Tag key={index} variant="light" theme="primary">
                      {skill}
                    </Tag>
                  ))}
                </div>
              </div>
              )}
          </div>
        )}
      </Card>

      {/* 评论区 */}
      <Card
        bordered
        header={<h3 style={{ margin: 0 }}>评论区</h3>}
      >
        <InlineCommentDisplay memberName={memberName} />
      </Card>
    </div>
  );
}
