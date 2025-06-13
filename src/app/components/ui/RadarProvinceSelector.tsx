'use client';

import React from 'react';
import { Button } from 'tdesign-react';

interface RadarProvinceSelectorProps {
  /** 可选择的省份列表 */
  availableProvinces: string[];
  /** 当前选中的省份列表 */
  selectedProvinces: string[];
  /** 省份选择变化回调 */
  onProvinceChange: (province: string, checked: boolean) => void;
  /** 设置选中省份列表的回调 */
  onSelectedProvincesChange: (provinces: string[]) => void;
  /** 是否显示加载状态 */
  loading?: boolean;
  /** 最大选择数量 */
  maxSelection?: number;
}

export default function RadarProvinceSelector({
  availableProvinces,
  selectedProvinces,
  onProvinceChange,
  onSelectedProvincesChange,
  loading = false,
  maxSelection = 6
}: RadarProvinceSelectorProps) {

  // 处理快速选择
  const handleQuickSelect = (provinces: string[]) => {
    // 过滤出在可用省份列表中的省份，并限制数量
    const validProvinces = provinces
      .filter(province => availableProvinces.includes(province))
      .slice(0, maxSelection);
    onSelectedProvincesChange(validProvinces);
  };

  // 处理清空选择
  const handleClearAll = () => {
    onSelectedProvincesChange([]);
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700">选择省份进行比较</div>
        <div className="animate-pulse bg-gray-200 h-8 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
        选择省份进行比较 (最多{maxSelection}个，共{availableProvinces.length}个):
      </label>
      <div className="space-y-2">
        {/* 快速选择按钮 */}
        <div className="flex space-x-2">
          <Button
            shape="rectangle"
            size="medium"
            type="button"
            variant="base"
            onClick={() => handleQuickSelect(availableProvinces.slice(0, 3))}
            style={{ backgroundColor: '#3b82f6', borderColor: '#3b82f6' }}
          >
            前3省份
          </Button>
          <Button
            shape="rectangle"
            size="medium"
            type="button"
            variant="base"
            onClick={() => handleQuickSelect(availableProvinces.slice(0, maxSelection))}
            style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
          >
            前{maxSelection}省份
          </Button>
          <Button
            shape="rectangle"
            size="medium"
            type="button"
            variant="base"
            onClick={() => handleQuickSelect(['湖北省', '广东省', '河南省', '浙江省', '湖南省', '安徽省'])}
            style={{ backgroundColor: '#f59e0b', borderColor: '#f59e0b' }}
          >
            重点省份
          </Button>
          <Button
            shape="rectangle"
            size="medium"
            type="button"
            variant="base"
            onClick={handleClearAll}
            style={{ backgroundColor: '#6b7280', borderColor: '#6b7280' }}
          >
            清空选择
          </Button>
        </div>
        
        {/* 省份复选框网格 */}
        <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto border p-3 rounded bg-gray-50">
          {availableProvinces.map(province => (
            <label 
              key={province} 
              className="flex items-center text-sm hover:bg-white rounded p-1 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedProvinces.includes(province)}
                onChange={(e) => onProvinceChange(province, e.target.checked)}
                disabled={!selectedProvinces.includes(province) && selectedProvinces.length >= maxSelection}
                className="mr-2 rounded"
              />
              <span 
                className={`text-xs truncate ${
                  selectedProvinces.includes(province) 
                    ? 'font-medium text-blue-600' 
                    : !selectedProvinces.includes(province) && selectedProvinces.length >= maxSelection
                      ? 'text-gray-400'
                      : ''
                }`} 
                title={province}
              >
                {province}
              </span>
            </label>
          ))}
        </div>

        {/* 选择状态提示 */}
        {selectedProvinces.length > 0 && (
          <div className="text-xs text-gray-500">
            已选择: {selectedProvinces.slice(0, 3).join('、')}
            {selectedProvinces.length > 3 && `等${selectedProvinces.length}个省份`}
            {selectedProvinces.length >= maxSelection && (
              <span className="text-orange-600 ml-2">已达到最大选择数量</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
