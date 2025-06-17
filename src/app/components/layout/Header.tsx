'use client';

import React, { Fragment, useState } from 'react';
import { Menu, Button, Dropdown, Avatar } from 'tdesign-react';
import { UserIcon, LoginIcon, LogoutIcon } from 'tdesign-icons-react';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '.././auth/AuthModal';
import { showMessage } from '@/lib/message';
import { teamMembers } from '@/types/teamMembers';

import type { MenuValue } from 'tdesign-react';

const { HeadMenu, MenuItem } = Menu;

interface HeaderProps {
  onMemberSelect?: (memberName: string) => void;
}

function Single({ onMemberSelect }: HeaderProps) {
    const [active, setActive] = useState<MenuValue>('0');
    const { user, isAuthenticated, logout, setShowAuthModal, showAuthModal, authMode } = useAuth();

    const handleLogin = () => {
        setShowAuthModal(true, 'login');
    };

    const handleRegister = () => {
        setShowAuthModal(true, 'register');
    };    const handleLogout = async () => {
        try {
            await logout();
            showMessage.success('已成功登出');
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            showMessage.error('登出失败，请重试');
        }
    };    const handleMenuClick = (value: MenuValue, memberName: string) => {
        if (!isAuthenticated) {
            showMessage.warning('请先登录后再访问团队成员页面');
            setShowAuthModal(true, 'login');
            return;
        }
        
        // 调用成员选择回调
        setActive(value);
        if (onMemberSelect) {
            onMemberSelect(memberName);
        }
        showMessage.info(`正在访问 ${memberName} 的页面`);
    };

    const operations = () => (
        <div className="tdesign-demo-menu__operations">
            {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                    {/* 用户头像 */}
                    <Dropdown
                        options={[
                            {
                                content: '个人资料',
                                value: 'profile',
                            },
                            {
                                content: '设置',
                                value: 'settings',
                            },
                        ]}
                        onClick={(data) => {
                            if (data.value === 'profile') {
                                showMessage.info('个人资料功能开发中');
                            } else if (data.value === 'settings') {
                                showMessage.info('设置功能开发中');
                            }
                        }}
                    >
                        <div className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors">
                            {user?.avatar ? (
                                <Avatar image={user.avatar} size="small" />
                            ) : (
                                <Avatar size="small" style={{ backgroundColor: '#1976d2' }}>
                                    {user?.username?.[0]?.toUpperCase() || 'U'}
                                </Avatar>
                            )}
                            <span className="text-sm text-gray-700 font-medium">{user?.username || '用户'}</span>
                        </div>
                    </Dropdown>
                    
                    {/* 登出按钮 */}
                    <Button 
                        variant="outline" 
                        size="small"
                        icon={<LogoutIcon />}
                        onClick={handleLogout}
                        style={{ borderColor: '#d32f2f', color: '#d32f2f' }}
                    >
                        登出
                    </Button>
                </div>
            ) : (
                <div className="flex items-center space-x-2">
                    <Button 
                        variant="outline" 
                        shape="round" 
                        size="small"
                        icon={<LoginIcon />}
                        onClick={handleLogin}
                    >
                        登录
                    </Button>
                    <Button 
                        theme="primary" 
                        shape="round" 
                        size="small"
                        icon={<UserIcon />}
                        onClick={handleRegister}
                    >
                        注册
                    </Button>
                </div>
            )}
        </div>
    );return (
        <Fragment>            
            <HeadMenu
                value={active}
                onChange={(v) => setActive(v)}
                logo={
                    <img 
                        src="./assets/images/logo.png"
                        height="32px" 
                        alt="logo"
                        style={{
                            height: '32px',
                            width: 'auto',
                            objectFit: 'contain',
                            verticalAlign: 'middle'
                        }}
                    />
                }
                operations={operations()}
                style={{marginBottom: 20}}
            >
                {teamMembers.map((member, index) => (
                    <MenuItem 
                        key={member.name}
                        value={String(index)} 
                        onClick={() => handleMenuClick(String(index), member.name)}
                    >
                        <span>{member.name}</span>
                    </MenuItem>
                ))}
            </HeadMenu>
            <AuthModal 
                visible={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                mode={authMode}
            />
        </Fragment>
    );
}

export default Single;