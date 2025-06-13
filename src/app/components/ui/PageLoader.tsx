'use client';

import React, { useState, useEffect } from 'react';
import { Progress } from 'tdesign-react';

interface PageLoaderProps {
  onLoadComplete?: () => void;
  minLoadTime?: number; // 最小加载时间（毫秒）
  children?: React.ReactNode;
}

export default function PageLoader({ 
  onLoadComplete, 
  minLoadTime = 3000, // 增加到3秒
  children 
}: PageLoaderProps) {
  const [percent, setPercent] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showProgress, setShowProgress] = useState(true); // 控制进度条显示
  const [opacity, setOpacity] = useState(1);
  const [audio] = useState(() => {
    if (typeof window !== 'undefined') {
      const audioElement = new Audio('/voice.MP3');
      audioElement.volume = 1;
      return audioElement;
    }
    return null;
  });
  // 音频播放 - 独立进程，在加载开始时自动播放
  useEffect(() => {
    if (audio) {
      // 设置音频属性确保完整播放
      audio.loop = false;
      audio.preload = 'auto';
      
      // 添加音频事件监听器
      const handleCanPlay = () => {
        console.log('音频可以播放');
        setTimeout(() => {
        audio.play().catch(error => {
          console.log('音频播放失败:', error);
        });
      }, 1800);
    };
      
      const handlePlay = () => {
        console.log('音频开始播放');
      };
      
      const handleEnded = () => {
        console.log('音频播放完成');
      };
        const handleError = (e: Event) => {
        console.log('音频错误:', e);
      };
      
      // 添加事件监听器
      audio.addEventListener('canplay', handleCanPlay);
      audio.addEventListener('play', handlePlay);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);
      
      // 加载音频
      audio.load();
      
      // 清理函数
      return () => {
        audio.removeEventListener('canplay', handleCanPlay);
        audio.removeEventListener('play', handlePlay);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('error', handleError);
      };
    }
  }, [audio]);

  // 进度条和加载逻辑
  useEffect(() => {
    const startTime = Date.now();
      // 进度条动画
    const progressTimer = setInterval(() => {
      setPercent((prevPercent) => {
        const newPercent = prevPercent + Math.random() * 8 + 2; // 随机增加2-10%（更慢）
        return newPercent >= 100 ? 100 : newPercent;
      });
    }, 300);

    // 检查加载完成条件
    const checkComplete = setInterval(() => {
      const currentTime = Date.now();
      const elapsedTime = currentTime - startTime;      
      if (percent >= 100 && elapsedTime >= minLoadTime) {
        clearInterval(progressTimer);
        clearInterval(checkComplete);
        setShowProgress(false);
        
        // 等待一段时间后让派大星渐渐消失
        setTimeout(() => {
          setOpacity(0);
          // 等待淡出动画完成后完全完成加载
          setTimeout(() => {
            setIsLoading(false);
            onLoadComplete?.();
          }, 1000);
        }, 1000);
      }
    }, 100);
    return () => {
      clearInterval(progressTimer);
      clearInterval(checkComplete);
    };
  }, [percent, minLoadTime, onLoadComplete]);

  if (!isLoading) {
    return <>{children}</>;
  }  return (
    <>
      <div className="page-loader" style={{ opacity }}>
        <div className="patrick-container">
          <img 
            src="./assets/images/loading.png"
            alt="Loading Patrick" 
            className="patrick-image"
          />          <div className="crystal-ball-loader">
            {showProgress && (
              <Progress 
                theme="circle" 
                percentage={Math.floor(percent)} 
                strokeWidth={8}
                size="large"
                label={<div className="crystal-progress-label">{Math.floor(percent)}%</div>}
                color="#8B5CF6"
              />
            )}
          </div>
        </div>
        <div className="loading-text">
          <div className="page-loader-title">派大星正在努力为你绘制网页中...</div>
        </div>
      </div>
      <div style={{ display: isLoading ? 'none' : 'block' }}>
        {children}
      </div>
    </>
  );
}