'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Button } from 'tdesign-react';
import ProvinceSelector from '../ui/ProvinceSelector';

interface BarChartProps {
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

export default function BarChart({ chartType }: BarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<ChartData[]>([]);
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>(['北京市', '上海市', '广东省', '湖北省', '浙江省']);
  const [availableProvinces, setAvailableProvinces] = useState<string[]>([]);
  const [currentMetric, setCurrentMetric] = useState<'infections' | 'deaths' | 'recoveries'>('infections');
  const [sortOrder, setSortOrder] = useState<'ascending' | 'descending'>('descending');
  const [topN, setTopN] = useState<number>(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 处理省份选择变化
  const handleProvinceChange = (province: string, checked: boolean) => {
    if (checked) {
      setSelectedProvinces(prev => [...prev, province]);
    } else {
      setSelectedProvinces(prev => prev.filter(p => p !== province));
    }
  };

  // 解析CSV数据
  const parseCSV = (csvText: string): Array<{region: string, province: string, latestValue: number}> => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    const dateColumns = headers.slice(4); // 跳过前4列（地区信息）
    
    const results: Array<{region: string, province: string, latestValue: number}> = [];
    
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',');
      if (row.length < headers.length) continue;
      
      const region = row[2] || row[0]; // 中文地区名
      const province = row[3] || row[1]; // 中文省份名
      
      // 找到最新的非空数值
      let latestValue = 0;
      for (let j = dateColumns.length - 1; j >= 0; j--) {
        const value = parseFloat(row[4 + j]);
        if (!isNaN(value)) {
          latestValue = value;
          break;
        }
      }
      
      results.push({
        region,
        province,
        latestValue
      });
    }
    
    return results;
  };

  // 聚合省级数据
  const aggregateByProvince = (
    infections: Array<{region: string, province: string, latestValue: number}>,
    deaths: Array<{region: string, province: string, latestValue: number}>,
    recoveries: Array<{region: string, province: string, latestValue: number}>
  ): ChartData[] => {
    const provinceMap = new Map<string, ChartData>();
    
    // 聚合感染数据
    infections.forEach(item => {
      if (!provinceMap.has(item.province)) {
        provinceMap.set(item.province, {
          region: item.province,
          province: item.province,
          infections: 0,
          deaths: 0,
          recoveries: 0,
          mortalityRate: 0,
          recoveryRate: 0
        });
      }
      const entry = provinceMap.get(item.province)!;
      entry.infections += item.latestValue;
    });

    // 聚合死亡数据
    deaths.forEach(item => {
      const entry = provinceMap.get(item.province);
      if (entry) {
        entry.deaths += item.latestValue;
      }
    });

    // 聚合康复数据
    recoveries.forEach(item => {
      const entry = provinceMap.get(item.province);
      if (entry) {
        entry.recoveries += item.latestValue;
      }
    });

    // 计算比率
    provinceMap.forEach(entry => {
      if (entry.infections > 0) {
        entry.mortalityRate = (entry.deaths / entry.infections) * 100;
        entry.recoveryRate = (entry.recoveries / entry.infections) * 100;
      }
    });

    return Array.from(provinceMap.values()).filter(entry => entry.infections > 0);
  };

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [infectionsResponse, deathsResponse, recoveriesResponse] = await Promise.all([
          fetch('/data/China_accumulated_infections.csv'),
          fetch('/data/China_accumulated_deaths.csv'),
          fetch('/data/China_accumulated_recoveries.csv')
        ]);

        if (!infectionsResponse.ok || !deathsResponse.ok || !recoveriesResponse.ok) {
          throw new Error('数据加载失败');
        }

        const [infectionsText, deathsText, recoveriesText] = await Promise.all([
          infectionsResponse.text(),
          deathsResponse.text(),
          recoveriesResponse.text()
        ]);

        const infectionsData = parseCSV(infectionsText);
        const deathsData = parseCSV(deathsText);
        const recoveriesData = parseCSV(recoveriesText);        const aggregatedData = aggregateByProvince(infectionsData, deathsData, recoveriesData);
        setData(aggregatedData);
        
        // 设置可用省份列表
        const provinces = aggregatedData.map(d => d.province).sort();
        setAvailableProvinces(provinces);
      } catch (err) {
        setError(err instanceof Error ? err.message : '数据加载出错');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);
  // 绘制图表
  useEffect(() => {
    if (!data.length || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 100, left: 80 };
    const width = 1000 - margin.left - margin.right;
    const height = 600 - margin.bottom - margin.top;

    // 过滤选中的省份数据
    let filteredData = data.filter(d => selectedProvinces.includes(d.province));

    // 排序
    filteredData.sort((a, b) => {
      const aValue = a[currentMetric];
      const bValue = b[currentMetric];
      return sortOrder === 'ascending' ? aValue - bValue : bValue - aValue;
    });

    // 取前N名
    filteredData = filteredData.slice(0, topN);

    // 创建比例尺 - 调整padding为0.5，使间距为柱形宽度的一半
    const xScale = d3.scaleBand()
      .domain(filteredData.map(d => d.province))
      .range([0, width])
      .padding(0.5); // 设置为0.5，使间距为柱形宽度的一半

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(filteredData, d => d[currentMetric]) || 0])
      .nice()
      .range([height, 0]);

    // 颜色比例尺
    const colorScale = d3.scaleOrdinal()
      .domain(['infections', 'deaths', 'recoveries'])
      .range(['#3b82f6', '#ef4444', '#10b981']);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // 添加X轴
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)')
      .style('font-size', '12px');

    // 添加Y轴
    g.append('g')
      .call(d3.axisLeft(yScale))
      .style('font-size', '12px');

    // 添加Y轴标签
    const metricLabels = {
      infections: '累计感染数',
      deaths: '累计死亡数',
      recoveries: '累计康复数'
    };

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (height / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text(metricLabels[currentMetric]);    // 绘制柱状图
    const bars = g.selectAll('.bar')
      .data(filteredData)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.province) || 0)
      .attr('width', xScale.bandwidth())
      .attr('y', height)
      .attr('height', 0)
      .attr('fill', colorScale(currentMetric) as string)
      .style('opacity', 0.8)
      .style('cursor', 'pointer');

    // 动画效果
    bars.transition()
      .duration(750)
      .attr('y', d => yScale(d[currentMetric]))
      .attr('height', d => height - yScale(d[currentMetric]));

    // 添加交互效果
    bars
      .on('mouseover', function(event, d) {
        d3.select(this)
          .style('opacity', 1)
          .attr('stroke', '#333')
          .attr('stroke-width', 2);

        // 显示工具提示
        const tooltip = d3.select('body').append('div')
          .attr('class', 'tooltip')
          .style('position', 'absolute')
          .style('background', 'rgba(0, 0, 0, 0.8)')
          .style('color', 'white')
          .style('padding', '10px')
          .style('border-radius', '5px')
          .style('font-size', '12px')
          .style('pointer-events', 'none')
          .style('z-index', 1000);

        tooltip.html(`
          <strong>${d.province}</strong><br/>
          累计感染: ${d.infections.toLocaleString()}<br/>
          累计死亡: ${d.deaths.toLocaleString()}<br/>
          累计康复: ${d.recoveries.toLocaleString()}<br/>
          病死率: ${d.mortalityRate.toFixed(2)}%<br/>
          康复率: ${d.recoveryRate.toFixed(2)}%
        `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
      })      .on('mouseout', function() {
        d3.select(this)
          .style('opacity', 0.8)
          .attr('stroke', 'none');
        
        d3.selectAll('.tooltip').remove();
      });

    // 添加数值标签
    g.selectAll('.value-label')
      .data(filteredData)
      .enter().append('text')
      .attr('class', 'value-label')
      .attr('x', d => (xScale(d.province) || 0) + xScale.bandwidth() / 2)
      .attr('y', height)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('font-weight', 'bold')
      .style('opacity', 0)
      .text(d => {
        const value = d[currentMetric];
        return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toString();
      })      .transition()
      .duration(750)
      .attr('y', d => yScale(d[currentMetric]) - 5)
      .style('opacity', 1);

    // 添加图例到右上角
    const legendData = [
      { label: '感染数据', color: '#3b82f6' },
      { label: '死亡数据', color: '#ef4444' },
      { label: '康复数据', color: '#10b981' }
    ];

    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width - 150}, 30)`);

    const legendItems = legend.selectAll('.legend-item')
      .data(legendData)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 25})`);

    // 图例色块
    legendItems.append('rect')
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', d => d.color)
      .attr('stroke', '#333')
      .attr('stroke-width', 1);

    // 图例文字
    legendItems.append('text')
      .attr('x', 20)
      .attr('y', 7)
      .attr('dy', '0.35em')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#333')
      .text(d => d.label);

  }, [data, currentMetric, sortOrder, topN, selectedProvinces]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">数据加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-600">错误: {error}</div>
      </div>
    );
  }

  return (    <div className="w-full h-full p-4">
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-4">COVID-19 各地区累计数据对比</h2>
        
        {/* 控制面板 */}
        <div className="space-y-4 mb-4">
          {/* 指标和排序控制 */}
          <div className="flex flex-wrap gap-4">
            {/* 指标选择 */}
            <div className="flex items-center gap-2">
              <label className="font-medium">指标:</label>
              <select 
                value={currentMetric} 
                onChange={(e) => setCurrentMetric(e.target.value as 'infections' | 'deaths' | 'recoveries')}
                className="border border-gray-300 rounded px-2 py-1"
              >
                <option value="infections">感染总数</option>
                <option value="deaths">死亡总数</option>
                <option value="recoveries">康复总数</option>
              </select>
            </div>

            {/* 排序选择 */}
            <div className="flex items-center gap-2">
              <label className="font-medium">排序:</label>
              <select 
                value={sortOrder} 
                onChange={(e) => setSortOrder(e.target.value as 'ascending' | 'descending')}
                className="border border-gray-300 rounded px-2 py-1"
              >
                <option value="descending">降序</option>
                <option value="ascending">升序</option>
              </select>
            </div>

            {/* 显示数量 */}
            <div className="flex items-center gap-2">
              <label className="font-medium">显示前:</label>
              <select 
                value={topN} 
                onChange={(e) => setTopN(Number(e.target.value))}
                className="border border-gray-300 rounded px-2 py-1"
              >
                <option value={10}>10名</option>
                <option value={20}>20名</option>
                <option value={30}>30名</option>
                <option value={50}>50名</option>
              </select>          
            </div>
          </div>
            {/* 省份选择器 */}
          <ProvinceSelector
            availableProvinces={availableProvinces}
            selectedProvinces={selectedProvinces}
            onProvinceChange={handleProvinceChange}
            onSelectedProvincesChange={setSelectedProvinces}
            loading={loading}
            title="选择省份进行对比分析"
            showRegionButtons={true}
            gridCols={6}
            maxHeight="12rem"
          />
        </div>
      </div>{/* 图表 */}
      <div className="w-full flex-1 overflow-auto">
        <svg 
          ref={svgRef} 
          width={1000}
          height={600}
          className="border border-gray-200"
        />
      </div>      {/* 数据说明 */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
        <h3 className="font-bold mb-2 text-gray-800">图表说明：</h3>
        <ul className="space-y-1">
          <li>• <strong>柱状图用途：</strong>对比不同省份的COVID-19累计数据，支持多指标分析</li>
          <li>• <strong>省份选择：</strong>可通过复选框选择要对比的省份，支持快速选择预设地区组合</li>
          <li>• <strong>数据指标：</strong>支持切换查看累计感染、死亡、康复三种数据类型</li>
          <li>• <strong>排序功能：</strong>支持按数值大小进行升序或降序排列</li>
          <li>• <strong>显示控制：</strong>可限制显示前N名的数据，避免图表过于拥挤</li>
          <li>• <strong>交互功能：</strong>
            <ul className="ml-4 mt-1 space-y-1">
              <li>- 鼠标悬停查看详细数据（包含病死率、康复率等）</li>
              <li>- 柱状图动画效果，提升视觉体验</li>
              <li>- 柱形间距为柱形宽度的一半，保持良好的视觉比例</li>
            </ul>
          </li>
          <li>• <strong>快速选择：</strong>提供重点省份、华北、华东、华南等地区组合的快速选择按钮</li>
          <li>• <strong>数据来源：</strong>基于COVID-19累计统计数据，展示各省份最新数据对比</li>
        </ul>
        
        <div className="mt-3 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
          <p className="text-blue-800 text-xs">
            <strong>使用建议：</strong>建议选择5-15个省份进行对比分析，过多的省份会影响图表可读性。
            可以先选择重点省份进行对比，再根据需要添加其他感兴趣的地区。
          </p>
        </div>
      </div>
    </div>
  );
}