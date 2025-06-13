'use client';

import React from 'react';

interface BoxPlotProvinceSelectorProps {
  /** 所有可用省份列表 */
  allProvinces: string[];
  /** 当前选中的省份列表 (可包含null) */
  selectedProvinces: (string | null)[];
  /** 省份选择变化回调 */
  onProvinceSelectionChange: (provinces: (string | null)[]) => void;
  /** 最大选择数量 */
  maxSelection?: number;
}

export default function BoxPlotProvinceSelector({
  allProvinces,
  selectedProvinces,
  onProvinceSelectionChange,
  maxSelection = 5
}: BoxPlotProvinceSelectorProps) {

  // 获取已选择的省份（排除null）
  const getSelectedProvinces = () => selectedProvinces.filter(p => p !== null) as string[];
  
  // 获取指定位置可选的省份（排除已选择的）
  const getAvailableProvinces = (currentIndex: number) => {
    const selected = getSelectedProvinces();
    const currentValue = selectedProvinces[currentIndex];
    
    return allProvinces.filter(province => 
      !selected.includes(province) || province === currentValue
    );
  };

  // 更新省份选择
  const updateProvinceSelection = (index: number, value: string | null) => {
    const newSelection = [...selectedProvinces];
    newSelection[index] = value;
    onProvinceSelectionChange(newSelection);
  };

  // 快速选择预设
  const handleQuickSelect = (type: 'top5' | 'random5' | 'clear') => {
    let newSelection: (string | null)[] = [null, null, null, null, null];
    
    switch (type) {
      case 'top5':
        const top5 = allProvinces.slice(0, Math.min(5, allProvinces.length));
        top5.forEach((province, index) => {
          if (index < maxSelection) {
            newSelection[index] = province;
          }
        });
        break;
      case 'random5':
        const shuffled = [...allProvinces].sort(() => Math.random() - 0.5);
        const random5 = shuffled.slice(0, Math.min(5, allProvinces.length));
        random5.forEach((province, index) => {
          if (index < maxSelection) {
            newSelection[index] = province;
          }
        });
        break;
      case 'clear':
        // newSelection 已经是全null数组
        break;
    }
    
    onProvinceSelectionChange(newSelection);
  };

  return (
    <div className="flex flex-col space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 mb-2">
          省份对比选择（最多{maxSelection}个）
        </label>
        
        {/* 快速选择按钮 */}
        <div className="flex space-x-2">
          <button
            onClick={() => handleQuickSelect('top5')}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            前5省份
          </button>
          <button
            onClick={() => handleQuickSelect('random5')}
            className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            随机5个
          </button>
          <button
            onClick={() => handleQuickSelect('clear')}
            className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            清空
          </button>
        </div>
      </div>
      
      {/* 省份选择下拉框 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
        {selectedProvinces.map((selectedProvince, index) => (
          <div key={index} className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">省份 {index + 1}</label>
            <select
              value={selectedProvince || ''}
              onChange={(e) => updateProvinceSelection(index, e.target.value || null)}
              className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[120px]"
              disabled={index > 0 && selectedProvinces[index - 1] === null}
            >
              <option value="">请选择省份</option>
              {getAvailableProvinces(index).map(province => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      
      {/* 选择状态显示 */}
      <div className="text-xs text-gray-500">
        已选择: {getSelectedProvinces().length} / {maxSelection} 个省份
        {getSelectedProvinces().length > 0 && (
          <span className="ml-2 text-blue-600">
            {getSelectedProvinces().join(', ')}
          </span>
        )}
      </div>
    </div>
  );
}
