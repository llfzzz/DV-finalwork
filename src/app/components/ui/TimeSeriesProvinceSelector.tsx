'use client';

import React from 'react';
import { Button } from 'tdesign-react';

interface TimeSeriesProvinceSelectorProps {
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
}

export default function TimeSeriesProvinceSelector({
  availableProvinces,
  selectedProvinces,
  onProvinceChange,
  onSelectedProvincesChange,
  loading = false
}: TimeSeriesProvinceSelectorProps) {

  // 处理快速选择
  const handleQuickSelect = (type: 'national' | 'top5' | 'all' | 'clear') => {
    switch (type) {
      case 'national':
        onSelectedProvincesChange(['全国总计']);
        break;
      case 'top5':
        const top5 = availableProvinces.filter(p => p !== '全国总计').slice(0, 5);
        onSelectedProvincesChange(top5);
        break;
      case 'all':
        onSelectedProvincesChange(availableProvinces);
        break;
      case 'clear':
        onSelectedProvincesChange([]);
        break;
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700">选择地区进行时间序列对比</div>
        <div className="animate-pulse bg-gray-200 h-8 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          选择地区进行时间序列对比 (当前选择: {selectedProvinces.length}个，共{availableProvinces.length}个可选)
        </label>
      </div>

      {/* 快速选择按钮 */}
      <div className="flex space-x-2 flex-wrap gap-2">
        <Button
          shape="rectangle"
          size="small"
          type="button"
          variant="base"
          onClick={() => handleQuickSelect('national')}
          style={{ 
            backgroundColor: '#059669', 
            borderColor: '#059669',
            fontSize: '12px',
            padding: '4px 8px',
            height: 'auto'
          }}
          className="text-white hover:opacity-80"
        >
          仅全国总计
        </Button>
        <Button
          shape="rectangle"
          size="small"
          type="button"
          variant="base"
          onClick={() => handleQuickSelect('top5')}
          style={{ 
            backgroundColor: '#3b82f6', 
            borderColor: '#3b82f6',
            fontSize: '12px',
            padding: '4px 8px',
            height: 'auto'
          }}
          className="text-white hover:opacity-80"
        >
          前5省份
        </Button>
        <Button
          shape="rectangle"
          size="small"
          type="button"
          variant="base"
          onClick={() => handleQuickSelect('all')}
          style={{ 
            backgroundColor: '#f59e0b', 
            borderColor: '#f59e0b',
            fontSize: '12px',
            padding: '4px 8px',
            height: 'auto'
          }}
          className="text-white hover:opacity-80"
        >
          全部选择
        </Button>
        <Button
          shape="rectangle"
          size="small"
          type="button"
          variant="base"
          onClick={() => handleQuickSelect('clear')}
          style={{ 
            backgroundColor: '#6b7280', 
            borderColor: '#6b7280',
            fontSize: '12px',
            padding: '4px 8px',
            height: 'auto'
          }}
          className="text-white hover:opacity-80"
        >
          清空选择
        </Button>
      </div>
      
      {/* 省份复选框网格 */}
      <div 
        className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto border p-3 rounded bg-gray-50"
      >
        {availableProvinces.map(province => (
          <label 
            key={province} 
            className={`flex items-center text-sm hover:bg-white rounded p-1 cursor-pointer transition-colors ${
              province === '全国总计' ? 'bg-blue-50 border border-blue-200' : ''
            }`}
          >
            <input
              type="checkbox"
              checked={selectedProvinces.includes(province)}
              onChange={(e) => onProvinceChange(province, e.target.checked)}
              className="mr-2 rounded"
            />
            <span 
              className={`text-xs truncate ${
                selectedProvinces.includes(province) 
                  ? 'font-medium text-blue-600' 
                  : ''
              } ${province === '全国总计' ? 'font-bold' : ''}`}
              title={province}
            >
              {province}
            </span>
          </label>
        ))}
      </div>

      {/* 统计信息 */}
      {selectedProvinces.length > 0 && (
        <div className="text-xs text-gray-500">
          已选择: {selectedProvinces.slice(0, 5).join('、')}
          {selectedProvinces.length > 5 && `等${selectedProvinces.length}个地区`}
          {selectedProvinces.length > 10 && (
            <span className="text-orange-600 ml-2">注意：选择过多地区可能影响图表可读性</span>
          )}
        </div>
      )}
    </div>
  );
}
