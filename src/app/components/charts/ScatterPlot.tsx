'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import ProvinceSelector from '../ui/ProvinceSelector';
import ChartDescriptionComponent from '../ui/ChartDescription';
import { chartDescriptions } from '../../../types/chartDescriptions';

interface ScatterPlotProps {
  chartType: string;
}

interface ChartData {
  province: string;
  infections: number;
  deaths: number;
  recoveries: number;
  mortalityRate: number;
  recoveryRate: number;
  severity: number; // 严重程度指数
}

interface ScatterConfig {
  xData: 'accumulated_infections';
  yData: 'accumulated_deaths';
  pointSize: 'population_or_severity';
  colorBy: 'province';
  interaction: {
    brush: boolean;
    regionHighlight: boolean;
    correlationLine: boolean;
  };
}

export default function ScatterPlot({ chartType }: ScatterPlotProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<ChartData[]>([]);
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>(['北京市', '上海市', '广东省', '湖北省', '浙江省']);
  const [availableProvinces, setAvailableProvinces] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [showCorrelationLine, setShowCorrelationLine] = useState(true);
  const [brushSelection, setBrushSelection] = useState<[[number, number], [number, number]] | null>(null);

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
          province: item.province,
          infections: 0,
          deaths: 0,
          recoveries: 0,
          mortalityRate: 0,
          recoveryRate: 0,
          severity: 0
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

    // 计算比率和严重程度
    provinceMap.forEach(entry => {
      if (entry.infections > 0) {
        entry.mortalityRate = (entry.deaths / entry.infections) * 100;
        entry.recoveryRate = (entry.recoveries / entry.infections) * 100;
        // 严重程度：感染数 + 死亡数的权重
        entry.severity = entry.infections + entry.deaths * 10;
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

  // 绘制散点图
  useEffect(() => {
    if (!data.length || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 120, bottom: 80, left: 80 };
    const width = 1000 - margin.left - margin.right;
    const height = 600 - margin.bottom - margin.top;    // 过滤数据（移除零值点，避免散点图显示异常，并筛选选中的省份）
    let filteredData = data.filter(d => d.infections > 0 && d.deaths >= 0 && selectedProvinces.includes(d.province));

    // 创建比例尺
    const xScale = d3.scaleLinear()
      .domain([0, d3.max(filteredData, d => d.infections) || 0])
      .nice()
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(filteredData, d => d.deaths) || 0])
      .nice()
      .range([height, 0]);

    // 点的大小比例尺（基于严重程度）
    const sizeScale = d3.scaleSqrt()
      .domain([0, d3.max(filteredData, d => d.severity) || 0])
      .range([3, 20]);

    // 颜色比例尺（按省份）
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
      .domain(filteredData.map(d => d.province));

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // 添加X轴
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .style('font-size', '12px');

    // 添加Y轴
    g.append('g')
      .call(d3.axisLeft(yScale))
      .style('font-size', '12px');

    // 添加轴标签
    g.append('text')
      .attr('x', width / 2)
      .attr('y', height + 50)
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text('累计感染数');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -50)
      .attr('x', -height / 2)
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text('累计死亡数');

    // 绘制相关性趋势线
    if (showCorrelationLine && filteredData.length > 1) {
      // 计算线性回归
      const xValues = filteredData.map(d => d.infections);
      const yValues = filteredData.map(d => d.deaths);
      
      const n = xValues.length;
      const sumX = d3.sum(xValues);
      const sumY = d3.sum(yValues);
      const sumXY = d3.sum(xValues.map((x, i) => x * yValues[i]));
      const sumXX = d3.sum(xValues.map(x => x * x));
      
      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;
      
      // 绘制趋势线
      const lineData = [
        [xScale.domain()[0], slope * xScale.domain()[0] + intercept],
        [xScale.domain()[1], slope * xScale.domain()[1] + intercept]
      ];

      g.append('line')
        .attr('x1', xScale(lineData[0][0]))
        .attr('y1', yScale(lineData[0][1]))
        .attr('x2', xScale(lineData[1][0]))
        .attr('y2', yScale(lineData[1][1]))
        .attr('stroke', '#ff6b6b')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5')
        .style('opacity', 0.7);

      // 显示相关系数
      const correlation = (n * sumXY - sumX * sumY) / 
        Math.sqrt((n * sumXX - sumX * sumX) * (n * d3.sum(yValues.map(y => y * y)) - sumY * sumY));
      
      g.append('text')
        .attr('x', width - 10)
        .attr('y', 20)
        .style('text-anchor', 'end')
        .style('font-size', '12px')
        .style('fill', '#ff6b6b')
        .text(`相关系数: ${correlation.toFixed(3)}`);
    }

    // 创建刷选功能
    const brush = d3.brush()
      .extent([[0, 0], [width, height]])
      .on('end', (event) => {
        if (!event.selection) {
          setBrushSelection(null);
          setSelectedRegions([]);
          return;
        }
        
        const [[x0, y0], [x1, y1]] = event.selection;
        setBrushSelection([[x0, y0], [x1, y1]]);
        
        const selected = filteredData.filter(d => {
          const x = xScale(d.infections);
          const y = yScale(d.deaths);
          return x >= x0 && x <= x1 && y >= y0 && y <= y1;
        });
        
        setSelectedRegions(selected.map(d => d.province));
      });

    const brushGroup = g.append('g')
      .attr('class', 'brush')
      .call(brush);

    // 绘制散点
    const circles = g.selectAll('.dot')
      .data(filteredData)
      .enter().append('circle')
      .attr('class', 'dot')
      .attr('cx', d => xScale(d.infections))
      .attr('cy', d => yScale(d.deaths))
      .attr('r', 0)
      .attr('fill', d => colorScale(d.province) as string)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .style('opacity', 0.7)
      .style('cursor', 'pointer');

    // 动画效果
    circles.transition()
      .duration(750)
      .attr('r', d => sizeScale(d.severity))
      .style('opacity', 0.8);    
      // 添加交互效果
    circles
      .on('mouseover', function(event, d) {
        // 高亮当前点
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', sizeScale(d.severity) * 1.5)
          .style('opacity', 1)
          .attr('stroke-width', 3);

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
          康复率: ${d.recoveryRate.toFixed(2)}%<br/>
          严重程度: ${d.severity.toFixed(0)}
        `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', function(event, d) {
        // 恢复原始状态
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', sizeScale(d.severity))
          .style('opacity', selectedRegions.length === 0 || selectedRegions.includes(d.province) ? 0.8 : 0.3)
          .attr('stroke-width', 1);
        
        d3.selectAll('.tooltip')
        .remove();
      })
      .on('click', function(event, d) {
        d3.selectAll('.tooltip').remove();
      });

    // 根据选择状态更新透明度
    if (selectedRegions.length > 0) {
      circles
        .style('opacity', d => selectedRegions.includes(d.province) ? 0.8 : 0.3);
    }

    // 创建图例
    const legend = svg.append('g')
      .attr('transform', `translate(${width + margin.left + 20}, ${margin.top})`);

    // 省份颜色图例（仅显示前10个主要省份）
    const topProvinces = filteredData
      .sort((a, b) => b.severity - a.severity)
      .slice(0, 10);

    const legendItems = legend.selectAll('.legend-item')
      .data(topProvinces)
      .enter().append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 20})`);

    legendItems.append('circle')
      .attr('cx', 8)
      .attr('cy', 8)
      .attr('r', 6)
      .attr('fill', d => colorScale(d.province) as string)
      .style('opacity', 0.8);

    legendItems.append('text')
      .attr('x', 20)
      .attr('y', 8)
      .attr('dy', '0.35em')
      .style('font-size', '11px')
      .text(d => d.province);

    // 大小图例
    const sizeLegend = legend.append('g')
      .attr('transform', `translate(0, ${topProvinces.length * 20 + 30})`);

    sizeLegend.append('text')
      .attr('x', 0)
      .attr('y', 0)
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .text('严重程度:');

    const sizeValues = [
      d3.min(filteredData, d => d.severity) || 0,
      d3.median(filteredData, d => d.severity) || 0,
      d3.max(filteredData, d => d.severity) || 0
    ];

    const sizeItems = sizeLegend.selectAll('.size-item')
      .data(sizeValues)
      .enter().append('g')
      .attr('class', 'size-item')
      .attr('transform', (d, i) => `translate(${i * 60}, 20)`);

    sizeItems.append('circle')
      .attr('cx', 15)
      .attr('cy', 15)
      .attr('r', d => sizeScale(d))
      .attr('fill', '#999')
      .style('opacity', 0.6);

    sizeItems.append('text')
      .attr('x', 15)
      .attr('y', 35)
      .style('text-anchor', 'middle')
      .style('font-size', '10px')
      .text(d => d >= 1000 ? `${(d/1000).toFixed(1)}k` : d.toFixed(0));

  }, [data, selectedRegions, showCorrelationLine, brushSelection, selectedProvinces]);

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

  return (    
  <div className="w-full h-full p-4">      
  <div className="mb-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">COVID-19 感染数与死亡数相关性分析</h2>
          <ChartDescriptionComponent description={chartDescriptions.scatterPlot} />
        </div>
        
        {/* 控制面板 */}
        <div className="space-y-4 mb-4">
          {/* 功能控制 */}
          <div className="flex flex-wrap gap-4">
            {/* 显示相关性趋势线 */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="correlation-line"
                checked={showCorrelationLine}
                onChange={(e) => setShowCorrelationLine(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="correlation-line" className="font-medium">显示相关性趋势线</label>
            </div>

            {/* 清除选择 */}
            {selectedRegions.length > 0 && (
              <button
                onClick={() => setSelectedRegions([])}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                清除选择 ({selectedRegions.length})
              </button>
            )}
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
      </div>      
      {/* 图表 */}
      <div className="w-full overflow-x-auto">
        <svg 
          ref={svgRef} 
          width={1200} 
          height={600}
          className="border border-gray-200"
        />
      </div>
    </div>
  );
}
