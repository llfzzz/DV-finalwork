'use client';

import React, {useEffect, useState} from 'react';

interface MessageItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  content: string;
  timestamp: number;
}

let messageQueue: MessageItem[] = [];
let messageListeners: Array<(messages: MessageItem[]) => void> = [];

export const showMessage = {
  success: (content: string) => {
    addMessage('success', content);
  },
  error: (content: string) => {
    addMessage('error', content);
  },
  warning: (content: string) => {
    addMessage('warning', content);
  },
  info: (content: string) => {
    addMessage('info', content);
  }
};

let messageCounter = 0;

function addMessage(type: MessageItem['type'], content: string) {
  const message: MessageItem = {
    id: `${Date.now()}-${++messageCounter}`,
    type,
    content,
    timestamp: Date.now()
  };
  
  messageQueue.push(message);
  notifyListeners();
  
  // 3秒后自动移除消息
  setTimeout(() => {
    removeMessage(message.id);
  }, 3000);
}

function removeMessage(id: string) {
  messageQueue = messageQueue.filter(msg => msg.id !== id);
  notifyListeners();
}

function notifyListeners() {
  messageListeners.forEach(listener => listener([...messageQueue]));
}

export function addMessageListener(listener: (messages: MessageItem[]) => void) {
  messageListeners.push(listener);
  return () => {
    messageListeners = messageListeners.filter(l => l !== listener);
  };
}

export default function Message() {
  const [messages, setMessages] = useState<MessageItem[]>([]);

  useEffect(() => {
    return addMessageListener(setMessages);
  }, []);

  const getMessageStyle = (type: MessageItem['type']) => {
    const baseStyle = {
      padding: '12px 16px',
      margin: '8px 0',
      borderRadius: '4px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      position: 'relative' as const,
      animation: 'slideIn 0.3s ease-out'
    };

    switch (type) {
      case 'success':
        return { ...baseStyle, backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', color: '#389e0d' };
      case 'error':
        return { ...baseStyle, backgroundColor: '#fff2f0', border: '1px solid #ffccc7', color: '#cf1322' };
      case 'warning':
        return { ...baseStyle, backgroundColor: '#fffbe6', border: '1px solid #ffe58f', color: '#d48806' };
      case 'info':
        return { ...baseStyle, backgroundColor: '#f0f8ff', border: '1px solid #91caff', color: '#0958d9' };
      default:
        return baseStyle;
    }
  };

  const getIcon = (type: MessageItem['type']) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '';
    }
  };

  if (messages.length === 0) {
    return null;
  }

  return (
    <>
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        width: '320px'
      }}>
        {messages.map((message) => (
          <div key={message.id} style={getMessageStyle(message.type)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{getIcon(message.type)}</span>
              <span>{message.content}</span>
              <button
                onClick={() => removeMessage(message.id)}
                style={{
                  marginLeft: 'auto',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                  color: 'inherit',
                  opacity: 0.7
                }}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
