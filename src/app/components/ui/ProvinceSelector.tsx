'use client';

import React from 'react';
import { Button } from 'tdesign-react';

interface ProvinceSelectorProps {
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
  /** 组件标题 */
  title?: string;
  /** 是否显示地区快选按钮 */
  showRegionButtons?: boolean;
  /** 网格列数 */
  gridCols?: number;
  /** 最大高度（用于滚动） */
  maxHeight?: string;
}

// 预设地区组合
const regionPresets = [
  {
    name: '重点省份',
    provinces: ['北京市', '上海市', '广东省', '湖北省', '浙江省'],
    color: '#3b82f6'
  },
  {
    name: '华北地区',
    provinces: ['北京市', '天津市', '河北省', '山西省', '内蒙古自治区'],
    color: '#10b981'
  },
  {
    name: '华东地区',
    provinces: ['上海市', '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省'],
    color: '#f59e0b'
  },
  {
    name: '华南地区',
    provinces: ['广东省', '广西壮族自治区', '海南省'],
    color: '#8b5cf6'
  },
  {
    name: '华中地区',
    provinces: ['湖北省', '湖南省', '河南省'],
    color: '#ec4899'
  },
  {
    name: '华西地区',
    provinces: ['重庆市', '四川省', '贵州省', '云南省', '西藏自治区'],
    color: '#06b6d4'
  },
  {
    name: '西北地区',
    provinces: ['陕西省', '甘肃省', '青海省', '宁夏回族自治区', '新疆维吾尔自治区'],
    color: '#84cc16'
  },
  {
    name: '东北地区',
    provinces: ['辽宁省', '吉林省', '黑龙江省'],
    color: '#f97316'
  }
];

export default function ProvinceSelector({
  availableProvinces,
  selectedProvinces,
  onProvinceChange,
  onSelectedProvincesChange,
  loading = false,
  title = '选择省份进行对比',
  showRegionButtons = true,
  gridCols = 6,
  maxHeight = '12rem'
}: ProvinceSelectorProps) {

  // 处理快速选择
  const handleQuickSelect = (provinces: string[]) => {
    // 过滤出在可用省份列表中的省份
    const validProvinces = provinces.filter(province => 
      availableProvinces.includes(province)
    );
    onSelectedProvincesChange(validProvinces);
  };

  // 处理全选
  const handleSelectAll = () => {
    onSelectedProvincesChange(availableProvinces);
  };

  // 处理清空选择
  const handleClearAll = () => {
    onSelectedProvincesChange([]);
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700">{title}</div>
        <div className="animate-pulse bg-gray-200 h-8 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          {title} (当前选择: {selectedProvinces.length}个，共{availableProvinces.length}个可选)
        </label>
      </div>

      {/* 快速选择按钮 */}
      {showRegionButtons && (
        <div className="space-y-2">
          <div className="flex space-x-2 flex-wrap gap-2">
            {regionPresets.map((preset) => (
              <Button
                key={preset.name}
                shape="rectangle"
                size="small"
                type="button"
                variant="base"
                onClick={() => handleQuickSelect(preset.provinces)}
                style={{ 
                  backgroundColor: preset.color, 
                  borderColor: preset.color,
                  fontSize: '12px',
                  padding: '4px 8px',
                  height: 'auto'
                }}
                className="text-white hover:opacity-80"
              >
                {preset.name}
              </Button>
            ))}
            
            {/* 全选和清空按钮 */}
            <Button
              shape="rectangle"
              size="small"
              type="button"
              variant="base"
              onClick={handleSelectAll}
              style={{ 
                backgroundColor: '#059669', 
                borderColor: '#059669',
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
              onClick={handleClearAll}
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
        </div>
      )}
      
      {/* 省份复选框网格 */}
      <div 
        className={`grid grid-cols-${gridCols} gap-2 overflow-y-auto border p-3 rounded bg-gray-50`}
        style={{ maxHeight }}
      >
        {availableProvinces.map(province => (
          <label 
            key={province} 
            className="flex items-center text-sm hover:bg-white rounded p-1 cursor-pointer transition-colors"
          >
            <input
              type="checkbox"
              checked={selectedProvinces.includes(province)}
              onChange={(e) => onProvinceChange(province, e.target.checked)}
              className="mr-2 rounded"
            />
            <span className="text-xs truncate" title={province}>
              {province}
            </span>
          </label>
        ))}
      </div>

      {/* 统计信息 */}
      {selectedProvinces.length > 0 && (
        <div className="text-xs text-gray-500">
          已选择: {selectedProvinces.slice(0, 5).join('、')}
          {selectedProvinces.length > 5 && `等${selectedProvinces.length}个省份`}
        </div>
      )}
    </div>
  );
}
