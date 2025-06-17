'use client';

import React, { useState } from 'react';
import { Dialog, Input, Button } from 'tdesign-react';
import { useAuth } from '@/contexts/AuthContext';
import { showMessage } from '@/lib/message';
import AvatarSelector from './AvatarSelector';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  mode?: 'login' | 'register';
}

export default function AuthModal({ visible, onClose, mode = 'login' }: AuthModalProps) {
  const { login, passwordLogin } = useAuth();
  
  // 登录方式：'otp' 验证码登录，'password' 密码登录
  const [loginMethod, setLoginMethod] = useState<'otp' | 'password'>('otp');
    // OTP登录相关状态
  const [step, setStep] = useState<'email' | 'otp' | 'register-info'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
    // 密码登录相关状态
  const [password, setPassword] = useState('');
  
  // 注册相关状态
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);  // 重置表单
  const resetForm = () => {
    setStep('email');
    setEmail('');
    setOtp('');
    setPassword('');
    setUsername('');
    setAvatar('');
    setConfirmPassword('');
    setIsNewUser(false);
    setLoading(false);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };
  // 密码登录
  const handlePasswordLogin = async () => {
    if (!email.trim()) {
      showMessage.error('请输入邮箱地址');
      return;
    }

    if (!validateEmail(email)) {
      showMessage.error('请输入有效的邮箱地址');
      return;
    }

    if (!password.trim()) {
      showMessage.error('请输入密码');
      return;
    }

    setLoading(true);
    try {
      const success = await passwordLogin(email, password);
      
      if (success) {
        showMessage.success('登录成功！');
        handleClose();
      } else {
        showMessage.error('登录失败，请检查邮箱和密码');
      }
    } catch (error) {
      console.error('Password login failed:', error);
      showMessage.error('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 注册用户
  const handleRegister = async () => {
    if (!email.trim()) {
      showMessage.error('请输入邮箱地址');
      return;
    }

    if (!validateEmail(email)) {
      showMessage.error('请输入有效的邮箱地址');
      return;
    }

    if (!username.trim()) {
      showMessage.error('请输入用户名');
      return;
    }

    if (username.length < 2 || username.length > 20) {
      showMessage.error('用户名长度应在2-20个字符之间');
      return;
    }

    if (!password.trim()) {
      showMessage.error('请输入密码');
      return;
    }

    if (!validatePassword(password)) {
      showMessage.error('密码长度至少6位');
      return;
    }

    if (password !== confirmPassword) {
      showMessage.error('两次输入的密码不一致');
      return;
    }

    if (!avatar) {
      showMessage.error('请选择头像');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          username,
          password,
          avatar
        }),
      });

      const data = await response.json();
        if (data.success) {
        showMessage.success('注册成功！');
        handleClose();
        // 注册成功后，用户已经自动登录，刷新页面以更新状态
        window.location.reload();
      } else {
        showMessage.error(data.message || '注册失败');
      }
    } catch (error) {
      console.error('Register failed:', error);
      showMessage.error('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };
  // 请求验证码（OTP登录方式）
  const handleRequestOTP = async () => {
    if (!email.trim()) {
      showMessage.error('请输入邮箱地址');
      return;
    }

    if (!validateEmail(email)) {
      showMessage.error('请输入有效的邮箱地址');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          step: 'request-otp'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setIsNewUser(data.data.isNewUser);
        setStep('otp');
        showMessage.success('验证码已发送到您的邮箱');
      } else {
        showMessage.error(data.message || '发送验证码失败');
      }
    } catch (error) {
      console.error('Request OTP failed:', error);
      showMessage.error('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 注册模式：请求验证码
  const handleRegisterRequestOTP = async () => {
    if (!email.trim()) {
      showMessage.error('请输入邮箱地址');
      return;
    }

    if (!validateEmail(email)) {
      showMessage.error('请输入有效的邮箱地址');
      return;
    }

    setLoading(true);
    try {
      // 检查邮箱是否已存在
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          step: 'request-otp'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        if (data.data.isNewUser) {
          setStep('otp');
          showMessage.success('验证码已发送到您的邮箱');
        } else {
          showMessage.error('该邮箱已被注册，请使用登录功能');
        }
      } else {
        showMessage.error(data.message || '发送验证码失败');
      }
    } catch (error) {
      console.error('Register request OTP failed:', error);
      showMessage.error('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };
  // 验证OTP并登录
  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      showMessage.error('请输入验证码');
      return;
    }

    if (isNewUser && !username.trim()) {
      showMessage.error('请输入用户名');
      return;
    }

    if (isNewUser && username.length < 2 || username.length > 20) {
      showMessage.error('用户名长度应在2-20个字符之间');
      return;
    }

    if (isNewUser && !password.trim()) {
      showMessage.error('请输入密码');
      return;
    }

    if (isNewUser && !validatePassword(password)) {
      showMessage.error('密码长度至少6位');
      return;
    }

    if (isNewUser && password !== confirmPassword) {
      showMessage.error('两次输入的密码不一致');
      return;
    }

    if (isNewUser && !avatar) {
      showMessage.error('请选择头像');
      return;
    }

    setLoading(true);
    try {
      if (isNewUser) {
        // 新用户注册流程
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            username,
            password,
            avatar
          }),
        });

        const data = await response.json();
        
        if (data.success) {
          showMessage.success('注册成功！');
          handleClose();
          window.location.reload(); // 刷新页面以更新认证状态
        } else {
          showMessage.error(data.message || '注册失败');
        }
      } else {
        // 现有用户登录流程
        const success = await login(email, otp, username);
        
        if (success) {
          showMessage.success('登录成功！');
          handleClose();
        } else {
          showMessage.error('验证失败，请检查验证码');
        }
      }
    } catch (error) {
      console.error('Verify OTP failed:', error);
      showMessage.error('验证失败，请重试');
    } finally {
      setLoading(false);    }
  };
  // 注册模式：验证OTP
  const handleRegisterVerifyOTP = async () => {
    if (!otp.trim()) {
      showMessage.error('请输入验证码');
      return;
    }

    setLoading(true);
    try {
      // 验证注册验证码
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp,
          step: 'verify-register-otp'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // 验证成功，跳转到注册信息填写页面
        setStep('register-info');
        showMessage.success('邮箱验证成功！');
      } else {
        showMessage.error(data.message || '验证码错误');
      }
    } catch (error) {
      console.error('Register verify OTP failed:', error);
      showMessage.error('验证失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };  const handleBack = () => {
    if (mode === 'register') {
      if (step === 'otp') {
        setStep('email');
        setOtp('');
      } else if (step === 'register-info') {
        setStep('otp');
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setAvatar('');
      }
    } else {
      setStep('email');
      setOtp('');
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      setAvatar('');
    }
  };
  // 根据当前状态确定对话框标题
  const getDialogTitle = () => {
    if (mode === 'register') {
      if (step === 'email') {
        return '注册账户 - 邮箱验证';
      } else if (step === 'otp') {
        return '注册账户 - 验证码确认';
      } else {
        return '注册账户 - 完善信息';
      }
    } else {
      if (loginMethod === 'password') {
        return '密码登录';
      } else {
        return step === 'email' ? '验证码登录' : (isNewUser ? '完成注册' : '验证登录');
      }
    }
  };
  // 确定主要操作按钮的行为
  const handlePrimaryAction = () => {
    if (mode === 'register') {
      if (step === 'email') {
        handleRegisterRequestOTP();
      } else if (step === 'otp') {
        handleRegisterVerifyOTP();
      } else {
        handleRegister();
      }
    } else if (loginMethod === 'password') {
      handlePasswordLogin();
    } else if (step === 'email') {
      handleRequestOTP();
    } else {
      handleVerifyOTP();
    }
  };
  const getPrimaryButtonText = () => {
    if (loading) return '处理中...';
    
    if (mode === 'register') {
      if (step === 'email') {
        return '发送验证码';
      } else if (step === 'otp') {
        return '验证邮箱';
      } else {
        return '完成注册';
      }
    } else if (loginMethod === 'password') {
      return '登录';
    } else if (step === 'email') {
      return '获取验证码';
    } else {
      return isNewUser ? '完成注册' : '登录';
    }
  };

  return (
    <Dialog
      visible={visible}
      header={getDialogTitle()}
      onClose={handleClose}
      confirmBtn={
        <Button
          theme="primary"
          loading={loading}
          onClick={handlePrimaryAction}
        >
          {getPrimaryButtonText()}
        </Button>
      }      cancelBtn={
        ((step === 'otp' || step === 'register-info') && mode === 'register') || (step === 'otp' && mode !== 'register') ? (
          <Button variant="outline" onClick={handleBack}>
            返回
          </Button>
        ) : (
          <Button variant="outline" onClick={handleClose}>
            取消
          </Button>
        )
      }
      width={480}
      destroyOnClose
    >
      <div className="space-y-4 p-4">        
        {mode === 'register' ? (
          // 注册模式
          <>
            {step === 'email' ? (
              // 第一步：邮箱输入
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    邮箱地址 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={email}
                    onChange={(value) => setEmail(value)}
                    placeholder="请输入您的邮箱地址"
                    clearable
                  />
                </div>

                <div className="text-sm text-gray-500">
                  <p>• 我们将向您的邮箱发送验证码</p>
                  <p>• 请确保邮箱地址正确且可以接收邮件</p>
                </div>
              </>
            ) : step === 'otp' ? (
              // 第二步：OTP验证
              <>
                <div className="text-sm text-gray-600 mb-4">
                  验证码已发送至：<span className="font-medium">{email}</span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    验证码 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={otp}
                    onChange={(value) => setOtp(value)}
                    placeholder="请输入6位验证码"
                    maxlength={6}
                    clearable
                  />
                </div>

                <div className="text-sm text-gray-500">
                  <p>验证码有效期为10分钟</p>
                  <p 
                    className="text-blue-600 cursor-pointer hover:underline" 
                    onClick={handleRegisterRequestOTP}
                  >
                    没收到验证码？重新发送
                  </p>
                </div>
              </>
            ) : (
              // 第三步：注册信息
              <>
                <div className="text-sm text-green-600 mb-4">
                  ✓ 邮箱验证成功，请完善您的注册信息
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    用户名 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={username}
                    onChange={(value) => setUsername(value)}
                    placeholder="请设置您的用户名"
                    clearable
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    2-20个字符，支持中英文、数字、下划线
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    密码 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(value) => setPassword(value)}
                    placeholder="请设置密码"
                    clearable
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    至少6位字符
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    确认密码 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(value) => setConfirmPassword(value)}
                    placeholder="请再次输入密码"
                    clearable
                  />
                </div>

                <AvatarSelector
                  value={avatar}
                  onChange={setAvatar}
                  required
                />
              </>
            )}
          </>
        ) : (
          // 登录模式
          <>
            {step === 'email' ? (
              <>
                {/* 登录方式切换 */}
                <div className="flex items-center justify-center space-x-4 mb-4">
                  <Button
                    variant={loginMethod === 'otp' ? 'outline' : 'text'}
                    onClick={() => setLoginMethod('otp')}
                  >
                    验证码登录
                  </Button>
                  <Button
                    variant={loginMethod === 'password' ? 'outline' : 'text'}
                    onClick={() => setLoginMethod('password')}
                  >
                    密码登录
                  </Button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    邮箱地址
                  </label>
                  <Input
                    value={email}
                    onChange={(value) => setEmail(value)}
                    placeholder="请输入您的邮箱地址"
                    clearable
                  />
                </div>                
                
                {loginMethod === 'password' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      密码
                    </label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(value) => setPassword(value)}
                      placeholder="请输入密码"
                      clearable
                    />
                  </div>
                )}

                <div className="text-sm text-gray-500">
                  {loginMethod === 'otp' ? (
                    <>
                      <p>• 如果邮箱已注册，将发送登录验证码</p>
                      <p>• 如果邮箱未注册，将引导您完成注册</p>
                    </>
                  ) : (
                    <p>• 使用邮箱和密码登录</p>
                  )}
                </div>
              </>
            ) : (
              // OTP验证步骤
              <>
                <div className="text-sm text-gray-600 mb-4">
                  验证码已发送至：<span className="font-medium">{email}</span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    验证码
                  </label>
                  <Input
                    value={otp}
                    onChange={(value) => setOtp(value)}
                    placeholder="请输入6位验证码"
                    maxlength={6}
                    clearable
                  />
                </div>                
                
                {isNewUser && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        用户名 <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={username}
                        onChange={(value) => setUsername(value)}
                        placeholder="请设置您的用户名"
                        clearable
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        2-20个字符，支持中英文、数字、下划线
                      </div>
                    </div>                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        密码 <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="password"
                        value={password}
                        onChange={(value) => setPassword(value)}
                        placeholder="请设置密码"
                        clearable
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        至少6位字符
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        确认密码 <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(value) => setConfirmPassword(value)}
                        placeholder="请再次输入密码"
                        clearable
                      />
                    </div>

                    <AvatarSelector
                      value={avatar}
                      onChange={setAvatar}
                      required
                    />
                  </>
                )}

                <div className="text-sm text-gray-500">
                  <p>验证码有效期为10分钟</p>
                  {!isNewUser && (
                    <p 
                      className="text-blue-600 cursor-pointer hover:underline" 
                      onClick={handleRequestOTP}
                    >
                      没收到验证码？重新发送
                    </p>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </Dialog>
  );
}
