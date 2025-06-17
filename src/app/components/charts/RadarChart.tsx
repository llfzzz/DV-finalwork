'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Button } from 'tdesign-react';
import RadarProvinceSelector from '../ui/RadarProvinceSelector';
import ChartDescriptionComponent from '../ui/ChartDescription';
import { chartDescriptions } from '../../../types/chartDescriptions';

interface RadarChartProps {
  chartType: string;
}

interface ChartData {
  region: string;
  province: string;
  infections: number;
  deaths: number;
  recoveries: number;
  mortalityRate: number;
  recoveryRate: number;
}

interface RadarDataPoint {
  axis: string;
  value: number;
  fullMark: number;
}

interface RadarSeriesData {
  name: string;
  data: RadarDataPoint[];
  color: string;
}

export default function RadarChart({ chartType }: RadarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<ChartData[]>([]);
  const [radarData, setRadarData] = useState<RadarSeriesData[]>([]);
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([]);
  const [availableProvinces, setAvailableProvinces] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 颜色配置
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];
  // 解析CSV数据并按省份聚合
  const parseCSV = (csvText: string): Array<{province: string, totalValue: number}> => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    const dateColumns = headers.slice(4);
    
    const provinceData = new Map<string, number>();
    
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',');
      if (row.length < headers.length) continue;
      
      const province = row[3] || row[1]; // 省级行政区
      if (!province) continue;
      
      // 找到最新的非空数值
      let latestValue = 0;
      for (let j = dateColumns.length - 1; j >= 0; j--) {
        const value = parseFloat(row[4 + j]);
        if (!isNaN(value)) {
          latestValue = value;
          break;
        }
      }
      
      // 按省份累加
      if (provinceData.has(province)) {
        provinceData.set(province, provinceData.get(province)! + latestValue);
      } else {
        provinceData.set(province, latestValue);
      }
    }
    
    return Array.from(provinceData.entries()).map(([province, totalValue]) => ({
      province,
      totalValue
    }));
  };
  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [infectionsRes, deathsRes, recoveriesRes] = await Promise.all([
          fetch('/data/China_accumulated_infections.csv'),
          fetch('/data/China_accumulated_deaths.csv'),
          fetch('/data/China_accumulated_recoveries.csv')
        ]);

        if (!infectionsRes.ok || !deathsRes.ok || !recoveriesRes.ok) {
          throw new Error('Failed to load data files');
        }

        const [infectionsText, deathsText, recoveriesText] = await Promise.all([
          infectionsRes.text(),
          deathsRes.text(),
          recoveriesRes.text()
        ]);

        const infectionsData = parseCSV(infectionsText);
        const deathsData = parseCSV(deathsText);
        const recoveriesData = parseCSV(recoveriesText);

        // 合并数据
        const combinedData: ChartData[] = [];
        const dataMap = new Map<string, Partial<ChartData>>();

        // 处理感染数据
        infectionsData.forEach(item => {
          dataMap.set(item.province, {
            region: item.province, // 这里region和province相同
            province: item.province,
            infections: item.totalValue
          });
        });

        // 处理死亡数据
        deathsData.forEach(item => {
          const existing = dataMap.get(item.province) || {};
          dataMap.set(item.province, {
            ...existing,
            deaths: item.totalValue
          });
        });

        // 处理康复数据
        recoveriesData.forEach(item => {
          const existing = dataMap.get(item.province) || {};
          dataMap.set(item.province, {
            ...existing,
            recoveries: item.totalValue
          });
        });

        // 转换为最终数据格式并计算比率
        dataMap.forEach((item, province) => {
          if (item.province) {
            const infections = item.infections || 0;
            const deaths = item.deaths || 0;
            const recoveries = item.recoveries || 0;
            
            combinedData.push({
              region: province,
              province: province,
              infections,
              deaths,
              recoveries,
              mortalityRate: infections > 0 ? (deaths / infections) * 100 : 0,
              recoveryRate: infections > 0 ? (recoveries / infections) * 100 : 0
            });
          }
        });

        // 按感染数排序，过滤掉无效数据
        const sortedData = combinedData
          .filter(item => item.infections > 0 && item.province !== '')
          .sort((a, b) => b.infections - a.infections);

        setData(sortedData);
        
        // 设置可用省份列表
        const provinces = sortedData.map(item => item.province);
        setAvailableProvinces(provinces);
        
        // 默认选择前5个省份
        const defaultProvinces = sortedData.slice(0, 5).map(item => item.province);
        setSelectedProvinces(defaultProvinces);

      } catch (err) {
        console.error('Error loading data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // 准备雷达图数据
  useEffect(() => {
    if (data.length === 0 || selectedProvinces.length === 0) return;

    const selectedData = data.filter(item => selectedProvinces.includes(item.province));
    
    // 找到最大值用于归一化
    const maxInfections = Math.max(...selectedData.map(d => d.infections));
    const maxDeaths = Math.max(...selectedData.map(d => d.deaths));
    const maxRecoveries = Math.max(...selectedData.map(d => d.recoveries));
    const maxMortalityRate = Math.max(...selectedData.map(d => d.mortalityRate));
    const maxRecoveryRate = Math.max(...selectedData.map(d => d.recoveryRate));

    const radarSeries: RadarSeriesData[] = selectedData.map((item, index) => ({
      name: item.province,
      color: colors[index % colors.length],
      data: [
        {
          axis: '累计感染',
          value: maxInfections > 0 ? (item.infections / maxInfections) * 100 : 0,
          fullMark: 100
        },
        {
          axis: '累计死亡',
          value: maxDeaths > 0 ? (item.deaths / maxDeaths) * 100 : 0,
          fullMark: 100
        },
        {
          axis: '累计康复',
          value: maxRecoveries > 0 ? (item.recoveries / maxRecoveries) * 100 : 0,
          fullMark: 100
        },
        {
          axis: '死亡率(%)',
          value: maxMortalityRate > 0 ? (item.mortalityRate / maxMortalityRate) * 100 : 0,
          fullMark: 100
        },
        {
          axis: '康复率(%)',
          value: maxRecoveryRate > 0 ? (item.recoveryRate / maxRecoveryRate) * 100 : 0,
          fullMark: 100
        }
      ]
    }));

    setRadarData(radarSeries);
  }, [data, selectedProvinces]);

  // 绘制雷达图
  useEffect(() => {
    if (!svgRef.current || radarData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();    const width = 600;
    const height = 600;
    const margin = { top: 80, right: 80, bottom: 80, left: 80 };
    const radius = Math.min(width - margin.left - margin.right, height - margin.top - margin.bottom) / 2;

    svg.attr('width', width).attr('height', height).style('display', 'block').style('margin', '0 auto');

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    // 获取轴标签
    const axes = radarData[0]?.data.map(d => d.axis) || [];
    const levels = 5;

    // 角度计算
    const angleSlice = (Math.PI * 2) / axes.length;

    // 绘制网格线
    for (let level = 0; level < levels; level++) {
      const levelRadius = radius * ((level + 1) / levels);
      
      // 绘制同心圆
      g.append('circle')
        .attr('r', levelRadius)
        .attr('fill', 'none')
        .attr('stroke', '#CDCDCD')
        .attr('stroke-width', '1px')
        .attr('opacity', 0.5);
      
      // 绘制数值标签
      if (level === levels - 1) {
        g.append('text')
          .attr('x', 4)
          .attr('y', -levelRadius + 4)
          .attr('fill', '#737373')
          .attr('font-size', '10px')
          .text('100%');
      }
    }

    // 绘制轴线和标签
    axes.forEach((axis, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      // 绘制轴线
      g.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', x)
        .attr('y2', y)
        .attr('stroke', '#CDCDCD')
        .attr('stroke-width', '1px');

      // 绘制轴标签
      const labelX = Math.cos(angle) * (radius + 25);
      const labelY = Math.sin(angle) * (radius + 25);
      
      g.append('text')
        .attr('x', labelX)
        .attr('y', labelY)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .attr('fill', '#333')
        .text(axis);
    });    // 绘制数据区域和线条
    radarData.forEach((series, seriesIndex) => {
      const pathData: [number, number][] = series.data.map((d, i) => {
        const angle = angleSlice * i - Math.PI / 2;
        const value = (d.value / 100) * radius;
        const x = Math.cos(angle) * value;
        const y = Math.sin(angle) * value;
        return [x, y] as [number, number];
      });// 创建路径生成器
      const lineGenerator = d3.line<[number, number]>()
        .x(d => d[0])
        .y(d => d[1])
        .curve(d3.curveLinearClosed);

      // 绘制填充区域
      g.append('path')
        .datum(pathData)
        .attr('d', lineGenerator)
        .attr('fill', series.color)
        .attr('fill-opacity', 0.1)
        .attr('stroke', series.color)
        .attr('stroke-width', 2)
        .attr('stroke-opacity', 0.8);

      // 绘制数据点
      pathData.forEach((point, i) => {
        g.append('circle')
          .attr('cx', point[0])
          .attr('cy', point[1])
          .attr('r', 4)
          .attr('fill', series.color)
          .attr('stroke', '#fff')
          .attr('stroke-width', 2);
      });
    });

    // 绘制图例
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 120}, 30)`);

    radarData.forEach((series, i) => {
      const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${i * 20})`);

      legendRow.append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', series.color);

      legendRow.append('text')
        .attr('x', 16)
        .attr('y', 9)
        .attr('font-size', '12px')
        .attr('fill', '#333')
        .text(series.name);
    });

  }, [radarData]);
  const handleProvinceChange = (province: string, checked: boolean) => {
    if (checked) {
      if (selectedProvinces.length < 6) {
        setSelectedProvinces(prev => [...prev, province]);
      }
    } else {
      setSelectedProvinces(prev => prev.filter(p => p !== province));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载数据...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold mb-2">数据加载失败</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (    <div className="w-full">      <div className="mb-4 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-bold text-gray-800">COVID-19 多维数据雷达图</h3>
          <ChartDescriptionComponent description={chartDescriptions.radarChart} />
        </div>
          {/* 省份选择器 */}
        <RadarProvinceSelector
          availableProvinces={availableProvinces}
          selectedProvinces={selectedProvinces}
          onProvinceChange={handleProvinceChange}
          onSelectedProvincesChange={setSelectedProvinces}
          loading={loading}
          maxSelection={6}
        />

        {/* 说明文字 */}
        <div className="text-sm text-gray-600">
          <p>• 图表显示各省份在5个维度上的相对表现（已归一化处理）</p>
          <p>• 数值越大，距离圆心越远</p>
          <p>• 基于截止到2020年2月29日的累计数据</p>
          <p>• 选择不同省份可以进行多维度对比分析</p>
        </div>
      </div>      {/* 雷达图 */}
      <div className="border rounded-lg p-4 bg-white">
        <svg ref={svgRef}></svg>
      </div>      {/* 数据统计 */}
      {selectedProvinces.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium mb-2">选中省份详细数据:</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-1 text-left">省份</th>
                  <th className="px-2 py-1 text-right">累计感染</th>
                  <th className="px-2 py-1 text-right">累计死亡</th>
                  <th className="px-2 py-1 text-right">累计康复</th>
                  <th className="px-2 py-1 text-right">死亡率</th>
                  <th className="px-2 py-1 text-right">康复率</th>
                </tr>
              </thead>
              <tbody>
                {data
                  .filter(item => selectedProvinces.includes(item.province))
                  .map((item, index) => (
                    <tr key={item.province} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-2 py-1 font-medium">{item.province}</td>
                      <td className="px-2 py-1 text-right">{item.infections.toLocaleString()}</td>
                      <td className="px-2 py-1 text-right">{item.deaths.toLocaleString()}</td>
                      <td className="px-2 py-1 text-right">{item.recoveries.toLocaleString()}</td>
                      <td className="px-2 py-1 text-right">{item.mortalityRate.toFixed(2)}%</td>
                      <td className="px-2 py-1 text-right">{item.recoveryRate.toFixed(2)}%</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}      <div className="mt-4 text-sm text-gray-600">
        <p>• 该雷达图展示了COVID-19疫情期间不同省份的多维数据对比</p>
        <p>• 数据来源于2020年1月至2月的官方统计</p>
        <p>• 可以选择最多6个省份进行同时比较分析</p>
        <p>• 五个维度分别为：累计感染、累计死亡、累计康复、死亡率、康复率</p>
        <p>• 使用快速选择按钮可以方便地切换不同的省份组合</p>
      </div>
    </div>
  );
}
