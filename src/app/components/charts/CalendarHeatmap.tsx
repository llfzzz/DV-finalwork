'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import ChartDescriptionComponent from '../ui/ChartDescription';
import { chartDescriptions } from '../../../types/chartDescriptions';

interface CalendarHeatmapProps {
  chartType: string;
}

interface HeatmapData {
  [key: string]: number;
}

const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({ chartType }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<string>('全国');
  const [data, setData] = useState<HeatmapData>({});
  const [provinces, setProvinces] = useState<string[]>([]);

  // 省份映射
  const provinceMapping: { [key: string]: string } = {
    '全国': 'China',
    '北京市': 'Beijing Municipality',
    '天津市': 'Tianjin Municipality',
    '河北省': 'Hebei',
    '山西省': 'Shanxi',
    '内蒙古自治区': 'Inner Mongolia Autonomous Region',
    '辽宁省': 'Liaoning',
    '吉林省': 'Jilin',
    '黑龙江省': 'Heilongjiang',
    '上海市': 'Shanghai Municipality',
    '江苏省': 'Jiangsu',
    '浙江省': 'Zhejiang',
    '安徽省': 'Anhui',
    '福建省': 'Fujian',
    '江西省': 'Jiangxi',
    '山东省': 'Shandong',
    '河南省': 'Henan',
    '湖北省': 'Hubei',
    '湖南省': 'Hunan',
    '广东省': 'Guangdong',
    '广西壮族自治区': 'Guangxi Zhuang Autonomous Region',
    '海南省': 'Hainan',
    '重庆市': 'Chongqing Municipality',
    '四川省': 'Sichuan',
    '贵州省': 'Guizhou',
    '云南省': 'Yunnan',
    '西藏自治区': 'Tibet Autonomous Region',
    '陕西省': 'Shaanxi',
    '甘肃省': 'Gansu',
    '青海省': 'Qinghai',
    '宁夏回族自治区': 'Ningxia Hui Autonomous Region',
    '新疆维吾尔自治区': 'Xinjiang Uygur Autonomous Region'
  };
  // 解析CSV数据
  const parseCSV = async (csvContent: string): Promise<{ data: HeatmapData, provinces: string[] }> => {
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',');
    
    // 找到日期列的索引（从第5列开始）
    const dateColumns = headers.slice(4).map(header => {
      const cleanDate = header.trim().replace(' 00:00:00', '');
      // 确保日期格式正确
      return cleanDate;
    }).filter(date => date.includes('2020'));
    
    const provincesSet = new Set<string>();
    const aggregatedData: HeatmapData = {};
    
    // 初始化所有日期的数据为0
    dateColumns.forEach(date => {
      aggregatedData[date] = 0;
    });

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(',');
      if (values.length < 5) continue;
      
      const province = values[1]?.trim();
      const provinceChinese = values[3]?.trim();
      
      if (province && provinceChinese) {
        provincesSet.add(provinceChinese);
        
        // 处理每个日期的数据
        for (let j = 4; j < Math.min(headers.length, values.length); j++) {
          const valueStr = values[j]?.trim();
          if (valueStr && valueStr !== '') {
            const value = parseFloat(valueStr) || 0;
            const dateIndex = j - 4;
            if (dateIndex < dateColumns.length) {
              aggregatedData[dateColumns[dateIndex]] += value;
            }
          }
        }
      }
    }
    
    return {
      data: aggregatedData,
      provinces: Array.from(provincesSet).sort()
    };
  };

  // 根据选中的省份过滤数据
  const getProvinceData = async (csvContent: string, targetProvince: string): Promise<HeatmapData> => {
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',');
    const dateColumns = headers.slice(4).map(header => {
      const cleanDate = header.trim().replace(' 00:00:00', '');
      return cleanDate;
    }).filter(date => date.includes('2020'));
    
    const provinceData: HeatmapData = {};
    
    // 初始化所有日期的数据为0
    dateColumns.forEach(date => {
      provinceData[date] = 0;
    });

    if (targetProvince === '全国') {
      // 全国数据：汇总所有省份
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(',');
        if (values.length < 5) continue;
        
        for (let j = 4; j < Math.min(headers.length, values.length); j++) {
          const valueStr = values[j]?.trim();
          if (valueStr && valueStr !== '') {
            const value = parseFloat(valueStr) || 0;
            const dateIndex = j - 4;
            if (dateIndex < dateColumns.length) {
              provinceData[dateColumns[dateIndex]] += value;
            }
          }
        }
      }
    } else {
      // 特定省份数据
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(',');
        if (values.length < 5) continue;
        
        const provinceChinese = values[3]?.trim();
        
        if (provinceChinese === targetProvince) {
          for (let j = 4; j < Math.min(headers.length, values.length); j++) {
            const valueStr = values[j]?.trim();
            if (valueStr && valueStr !== '') {
              const value = parseFloat(valueStr) || 0;
              const dateIndex = j - 4;
              if (dateIndex < dateColumns.length) {
                provinceData[dateColumns[dateIndex]] += value;
              }
            }
          }
        }
      }
    }
    
    return provinceData;
  };

  // 加载数据
  const loadData = async () => {
    try {
      const response = await fetch('/data/China_daily_new_infections.csv');
      const csvContent = await response.text();
      
      if (selectedProvince === '全国' && provinces.length === 0) {
        // 首次加载，获取所有省份列表
        const { provinces: allProvinces } = await parseCSV(csvContent);
        setProvinces(['全国', ...allProvinces]);
      }
      
      const provinceData = await getProvinceData(csvContent, selectedProvince);
      setData(provinceData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // 转换数据为ECharts格式
  const formatDataForECharts = (data: HeatmapData): [string, number][] => {
    return Object.entries(data).map(([date, value]) => [date, value]);
  };

  // 初始化图表
  const initChart = () => {
    if (!chartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.dispose();
    }

    chartInstance.current = echarts.init(chartRef.current);
    
    const chartData = formatDataForECharts(data);
    const maxValue = Math.max(...Object.values(data));
      const option: echarts.EChartsOption = {
      title: {
        top: 30,
        left: 'center',
        text: `${selectedProvince} - 每日新增感染人数 (2020年1-2月)`,
        textStyle: {
          fontSize: 18,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        formatter: function (params: any) {
          return `日期: ${params.data[0]}<br/>新增感染: ${params.data[1]} 人`;
        }
      },
      visualMap: {
        min: 0,
        max: maxValue || 100,
        type: 'piecewise',
        orient: 'horizontal',
        left: 'center',
        top: 65,
        pieces: maxValue > 0 ? [
          { min: 0, max: 0, color: '#f0f0f0', label: '0' },
          { min: 1, max: Math.max(1, Math.floor(maxValue * 0.2)), color: '#c6e48b' },
          { min: Math.max(1, Math.floor(maxValue * 0.2)) + 1, max: Math.max(1, Math.floor(maxValue * 0.4)), color: '#7bc96f' },
          { min: Math.max(1, Math.floor(maxValue * 0.4)) + 1, max: Math.max(1, Math.floor(maxValue * 0.6)), color: '#239a3b' },
          { min: Math.max(1, Math.floor(maxValue * 0.6)) + 1, max: Math.max(1, Math.floor(maxValue * 0.8)), color: '#196127' },
          { min: Math.max(1, Math.floor(maxValue * 0.8)) + 1, max: maxValue, color: '#0e4b1a' }
        ] : [
          { min: 0, max: 0, color: '#f0f0f0', label: '无数据' }
        ]
      },      calendar: {
        top: 120,
        left: 60,
        right: 30,
        bottom: 50,
        cellSize: ['auto', 18],
        range: ['2020-01-20', '2020-02-29'],
        itemStyle: {
          borderWidth: 0.5,
          borderColor: '#ddd'
        },
        yearLabel: { show: false },
        monthLabel: {
          show: true,
          fontSize: 14
        },
        dayLabel: {
          show: true,
          fontSize: 12
        }
      },
      series: {
        type: 'heatmap',
        coordinateSystem: 'calendar',
        data: chartData
      }
    };

    chartInstance.current.setOption(option);
  };

  // 处理窗口大小变化
  const handleResize = () => {
    if (chartInstance.current) {
      chartInstance.current.resize();
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedProvince]);

  useEffect(() => {
    if (Object.keys(data).length > 0) {
      initChart();
    }
  }, [data, selectedProvince]);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartInstance.current) {
        chartInstance.current.dispose();
      }
    };
  }, []);

  return (
    <div className="p-4">      {/* 标题 */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            COVID-19 日历热力图
          </h2>
          <ChartDescriptionComponent description={chartDescriptions.calendarHeatmap} />
        </div>
      </div>
      
      {/* 省份选择器 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          选择省份:
        </label>
        <select
          value={selectedProvince}
          onChange={(e) => setSelectedProvince(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {provinces.map((province) => (
            <option key={province} value={province}>
              {province}
            </option>
          ))}
        </select>
      </div>      
        {/* 图表容器 */}
      <div 
        ref={chartRef} 
        style={{ width: '100%', height: '600px' }}
        className="border border-gray-200 rounded-lg bg-white"
      />
    </div>
  );
};

export default CalendarHeatmap;
