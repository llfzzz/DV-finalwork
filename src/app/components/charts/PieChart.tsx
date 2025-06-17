'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import ProvinceSelector from '../ui/ProvinceSelector';
import ChartDescriptionComponent from '../ui/ChartDescription';
import { chartDescriptions } from '../../../types/chartDescriptions';

interface PieChartProps {
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

interface PieData {
  label: string;
  value: number;
  color: string;
}

export default function PieChart({ chartType }: PieChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<ChartData[]>([]);
  const [currentMetric, setCurrentMetric] = useState<'infections' | 'deaths' | 'recoveries'>('infections');
  const [displayMode, setDisplayMode] = useState<'top10' | 'regions' | 'selected'>('top10');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([]);
  const [availableProvinces, setAvailableProvinces] = useState<string[]>([]);

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
        const recoveriesData = parseCSV(recoveriesText);        
        const aggregatedData = aggregateByProvince(infectionsData, deathsData, recoveriesData);
        setData(aggregatedData);
        
        // 设置可用省份列表
        const provinces = aggregatedData.map(item => item.province).sort();
        setAvailableProvinces(provinces);
        
        // 默认选择前5个省份
        setSelectedProvinces(provinces.slice(0, 5));
      } catch (err) {
        setError(err instanceof Error ? err.message : '数据加载出错');
      } finally {
        setLoading(false);
      }
    };

    if (chartType === 'pie-chart') {
      loadData();
    }
  }, [chartType]);  // 准备饼图数据
  const preparePieData = (): PieData[] => {
    if (data.length === 0) return [];
    
    const colorSchemes = {
      infections: [
        '#FF4444', '#4A90E2', '#7B68EE', '#FF6B35', '#32CD32',
        '#FF1493', '#00CED1', '#FF8C00', '#9370DB', '#20B2AA'
      ],
      deaths: [
        '#2C2C2C', '#8B0000', '#4B0082', '#006400', '#FF4500',
        '#800080', '#008B8B', '#B8860B', '#483D8B', '#2F4F4F'
      ],
      recoveries: [
        '#00C851', '#FF6347', '#4169E1', '#FF69B4', '#8A2BE2',
        '#DC143C', '#00BFFF', '#FF7F50', '#6A5ACD', '#228B22'
      ]
    };

    if (displayMode === 'top10') {
      // 显示前10个省份的数据
      const sortedData = data
        .sort((a, b) => b[currentMetric] - a[currentMetric])
        .slice(0, 10);

      return sortedData.map((item, index) => ({
        label: item.province,
        value: item[currentMetric],
        color: colorSchemes[currentMetric][index % colorSchemes[currentMetric].length]
      }));
    } else if (displayMode === 'selected') {
      // 显示选中省份的数据
      const selectedData = data.filter(item => selectedProvinces.includes(item.province));
      
      return selectedData.map((item, index) => ({
        label: item.province,
        value: item[currentMetric],
        color: colorSchemes[currentMetric][index % colorSchemes[currentMetric].length]
      }));
    } else {
      // 显示感染、死亡、康复三大类的总和对比
      const totalInfections = data.reduce((sum, item) => sum + item.infections, 0);
      const totalDeaths = data.reduce((sum, item) => sum + item.deaths, 0);
      const totalRecoveries = data.reduce((sum, item) => sum + item.recoveries, 0);

      return [
        { label: '累计感染', value: totalInfections, color: '#FF6B6B' },
        { label: '累计死亡', value: totalDeaths, color: '#4A4A4A' },
        { label: '累计康复', value: totalRecoveries, color: '#2ED573' }
      ];
    }
  };    // 绘制饼图
  useEffect(() => {
    if (!data.length || !svgRef.current) return;

    const pieData = preparePieData();
    if (pieData.length === 0) {
      // 清空SVG
      const svg = d3.select(svgRef.current);
      svg.selectAll('*').remove();
      return;
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 1000;
    const height = 600;
    const radius = Math.min(width, height) / 2 - 50;
    const pieX = width * 0.4; // 饼图放在左侧40%的位置
    const legendX = width * 0.8; // 图例放在右侧80%的位置

    svg.attr('width', width).attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${pieX}, ${height / 2})`);

    // 创建饼图生成器
    const pie = d3.pie<PieData>()
      .value(d => d.value)
      .sort(null);

    // 创建弧形生成器
    const arc = d3.arc<d3.PieArcDatum<PieData>>()
      .innerRadius(0)
      .outerRadius(radius);

    const outerArc = d3.arc<d3.PieArcDatum<PieData>>()
      .innerRadius(radius * 1.1)
      .outerRadius(radius * 1.1);

    // 绘制饼图切片
    const slices = g.selectAll('.slice')
      .data(pie(pieData))
      .enter()
      .append('g')
      .attr('class', 'slice');

    slices.append('path')
      .attr('d', arc)
      .attr('fill', d => d.data.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('transform', function() {
            const centroid = arc.centroid(d);
            return `translate(${centroid[0] * 0.1}, ${centroid[1] * 0.1})`;
          });

        // 显示tooltip
        const tooltip = d3.select('body')
          .append('div')
          .attr('class', 'pie-tooltip')
          .style('position', 'absolute')
          .style('background', 'rgba(0,0,0,0.8)')
          .style('color', 'white')
          .style('padding', '10px')
          .style('border-radius', '5px')
          .style('pointer-events', 'none')
          .style('font-size', '12px')
          .style('z-index', '1000');

        const percentage = ((d.data.value / d3.sum(pieData, p => p.value)) * 100).toFixed(1);
        tooltip.html(`
          <strong>${d.data.label}</strong><br/>
          数值: ${d.data.value.toLocaleString()}<br/>
          占比: ${percentage}%
        `)
        .style('left', (event.pageX + 20) + 'px')
        .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('transform', 'translate(0,0)');        
          d3.selectAll('.pie-tooltip')
          .remove();
      });

    // 添加右侧图例
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${legendX}, 50)`);

    const legendItems = legend.selectAll('.legend-item')
      .data(pieData)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 40})`);

    // 图例色块
    legendItems.append('rect')
      .attr('width', 18)
      .attr('height', 18)
      .attr('fill', d => d.color)
      .attr('stroke', '#333')
      .attr('stroke-width', 1);

    // 图例文字
    legendItems.append('text')
      .attr('x', 25)
      .attr('y', 9)
      .attr('dy', '0.35em')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .style('fill', '#333')
      .text(d => d.label);

    // 图例数值
    legendItems.append('text')
      .attr('x', 25)
      .attr('y', 22)
      .style('font-size', '12px')
      .style('fill', '#666')
      .text(d => {
        const percentage = ((d.value / d3.sum(pieData, p => p.value)) * 100).toFixed(1);
        return `${d.value.toLocaleString()} (${percentage}%)`;
      });    // 添加交互效果到图例
    legendItems
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        // 高亮对应的饼图切片
        const correspondingSlice = g.selectAll('.slice')
          .filter((sliceData: any) => sliceData.data.label === d.label);
        
        correspondingSlice.select('path')
          .transition()
          .duration(200)
          .attr('transform', function(sliceData: any) {
            const centroid = arc.centroid(sliceData);
            return `translate(${centroid[0] * 0.1}, ${centroid[1] * 0.1})`;
          });

        // 高亮图例项
        d3.select(this).style('opacity', 0.7);
      })
      .on('mouseout', function(event, d) {
        // 恢复饼图切片
        const correspondingSlice = g.selectAll('.slice')
          .filter((sliceData: any) => sliceData.data.label === d.label);
        
        correspondingSlice.select('path')
          .transition()
          .duration(200)
          .attr('transform', 'translate(0,0)');

        // 恢复图例项
        d3.select(this).style('opacity', 1);
      });

    // 只在饼图内部显示百分比标签（对于较大的切片）
    g.selectAll('.percentage')
      .data(pie(pieData))
      .enter()
      .append('text')
      .attr('class', 'percentage')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .style('fill', 'white')
      .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.7)')
      .text(d => {
        const percentage = ((d.data.value / d3.sum(pieData, p => p.value)) * 100);
        return percentage > 5 ? percentage.toFixed(1) + '%' : '';
      });

    function midAngle(d: d3.PieArcDatum<PieData>) {
      return d.startAngle + (d.endAngle - d.startAngle) / 2;
    }

  }, [data, currentMetric, displayMode, selectedProvinces]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-600">数据加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-red-600">错误: {error}</div>
      </div>
    );
  }
  const getMetricLabel = () => {
    switch (currentMetric) {
      case 'infections': return '累计感染';
      case 'deaths': return '累计死亡';
      case 'recoveries': return '累计康复';
      default: return '';
    }
  };

  // 处理省份选择变化
  const handleProvinceChange = (province: string, checked: boolean) => {
    if (checked) {
      setSelectedProvinces(prev => [...prev, province]);
    } else {
      setSelectedProvinces(prev => prev.filter(p => p !== province));
    }
  };

  // 处理选中省份列表变化
  const handleSelectedProvincesChange = (provinces: string[]) => {
    setSelectedProvinces(provinces);
  };

  return (
    <div className="w-full h-full p-6 bg-white">      
    <div className="mb-6">        
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            COVID-19 数据饼图分析
          </h2>
          <ChartDescriptionComponent description={chartDescriptions.pieChart} />
        </div>
          <div className="flex flex-wrap gap-4 mb-4">
          {/* 显示模式选择 */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">显示模式:</label>
            <select
              value={displayMode}
              onChange={(e) => setDisplayMode(e.target.value as 'top10' | 'regions' | 'selected')}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="top10">前10省份</option>
              <option value="selected">选择省份</option>
              <option value="regions">数据类型对比</option>
            </select>
          </div>

          {/* 指标选择（仅在前10省份模式和选择省份模式下显示） */}
          {(displayMode === 'top10' || displayMode === 'selected') && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">数据指标:</label>
              <select
                value={currentMetric}
                onChange={(e) => setCurrentMetric(e.target.value as 'infections' | 'deaths' | 'recoveries')}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="infections">累计感染</option>
                <option value="deaths">累计死亡</option>
                <option value="recoveries">累计康复</option>
              </select>
            </div>
          )}
        </div>

        {/* 省份选择器 */}
        {displayMode === 'selected' && (
          <div className="mb-6">
            <ProvinceSelector
              availableProvinces={availableProvinces}
              selectedProvinces={selectedProvinces}
              onProvinceChange={handleProvinceChange}
              onSelectedProvincesChange={handleSelectedProvincesChange}
              loading={loading}
              title="选择要在饼图中显示的省份"
              showRegionButtons={true}
              gridCols={6}
              maxHeight="12rem"
            />
          </div>
        )}

        <div className="text-sm text-gray-600 mb-4">
          {displayMode === 'top10' 
            ? `显示${getMetricLabel()}数据最高的10个省份` 
            : displayMode === 'selected'
            ? `显示所选省份的${getMetricLabel()}数据对比`
            : '显示全国累计感染、死亡、康复数据对比'
          }
        </div>
      </div>      
      <div className="flex justify-center">
        {(() => {
          const pieData = preparePieData();
          if (displayMode === 'selected' && selectedProvinces.length === 0) {
            return (
              <div className="flex items-center justify-center h-96 text-gray-500">
                <div className="text-center">
                  <div className="text-lg mb-2">📊</div>
                  <div>请选择要显示的省份</div>
                </div>
              </div>
            );
          }
          if (pieData.length === 0) {
            return (
              <div className="flex items-center justify-center h-96 text-gray-500">
                <div>暂无数据可显示</div>
              </div>
            );
          }
          return <svg ref={svgRef}></svg>;
        })()}
      </div>
    </div>
  );
}
