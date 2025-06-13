'use client';

import React from 'react';
import { Avatar } from 'tdesign-react';

interface AvatarSelectorProps {
  value?: string;
  onChange: (avatar: string) => void;
  required?: boolean;
}

// 预设头像列表
const PRESET_AVATARS = [
  '/assets/icons/lfz.jpeg',
  '/assets/icons/lzd.jpg',
  '/assets/icons/pl.jpg',
  '/assets/icons/wys.jpg',
  '/assets/icons/zx.jpg'
];

export default function AvatarSelector({ value, onChange, required = false }: AvatarSelectorProps) {
  const handlePresetSelect = (presetUrl: string) => {
    onChange(presetUrl);
  };

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          头像{required && <span className="text-red-500">*</span>}
        </label>
      </div>           
      {/* 预设头像选择 */}
      <div>
        <div className="grid grid-cols-5 gap-3">
          {PRESET_AVATARS.map((avatarUrl, index) => (
            <div
              key={index}
              className={`cursor-pointer rounded-lg p-2 border-2 transition-all hover:border-blue-300 ${
                value === avatarUrl ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
              onClick={() => handlePresetSelect(avatarUrl)}
            >
              <Avatar size="large" image={avatarUrl} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
