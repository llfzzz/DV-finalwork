'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import TimeSeriesProvinceSelector from '../ui/TimeSeriesProvinceSelector';
import ChartDescriptionComponent from '../ui/ChartDescription';
import { chartDescriptions } from '../../../types/chartDescriptions';

interface TimeSeriesChartProps {
  chartType: string;
}

interface TimeSeriesData {
  date: Date;
  value: number;
  province?: string;
}

export default function TimeSeriesChart({ chartType }: TimeSeriesChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<TimeSeriesData[]>([]);
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>(['全国总计']);
  const [availableProvinces, setAvailableProvinces] = useState<string[]>([]);
  const [dataType, setDataType] = useState<'infections' | 'deaths' | 'recoveries'>('infections');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 解析CSV数据为时间序列格式
  const parseTimeSeriesCSV = (csvText: string): { dates: Date[], provinceData: Map<string, number[]> } => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    
    // 提取日期列（从第5列开始）
    const dateStrings = headers.slice(4);
    const dates = dateStrings.map(dateStr => {
      const cleanDate = dateStr.trim();
      return new Date(cleanDate);
    });

    const provinceData = new Map<string, number[]>();

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',');
      if (row.length < headers.length) continue;
      
      const province = row[3] || row[1] || '未知'; // 中文省份名
      
      // 提取数值数据
      const values: number[] = [];
      for (let j = 4; j < row.length && j < headers.length; j++) {
        const value = parseFloat(row[j]);
        values.push(isNaN(value) ? 0 : value);
      }
      
      if (!provinceData.has(province)) {
        provinceData.set(province, new Array(dates.length).fill(0));
      }
      
      const existingValues = provinceData.get(province)!;
      for (let k = 0; k < Math.min(values.length, existingValues.length); k++) {
        existingValues[k] += values[k];
      }
    }

    return { dates, provinceData };
  };

  // 计算全国总计数据
  const calculateNationalTotal = (dates: Date[], provinceData: Map<string, number[]>): number[] => {
    const nationalData = new Array(dates.length).fill(0);
    
    provinceData.forEach(values => {
      for (let i = 0; i < values.length; i++) {
        nationalData[i] += values[i];
      }
    });
    
    return nationalData;
  };

  // 获取数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        let filename = '';
        switch (dataType) {
          case 'infections':
            filename = 'China_daily_new_infections.csv';
            break;
          case 'deaths':
            filename = 'China_daily_new_deaths.csv';
            break;
          case 'recoveries':
            filename = 'China_daily_new_recoveries.csv';
            break;
        }

        const response = await fetch(`/data/${filename}`);
        if (!response.ok) {
          throw new Error(`无法加载数据文件: ${filename}`);
        }

        const csvText = await response.text();
        const { dates, provinceData } = parseTimeSeriesCSV(csvText);

        // 计算全国总计
        const nationalTotal = calculateNationalTotal(dates, provinceData);
        provinceData.set('全国总计', nationalTotal);

        // 设置可用省份列表
        const provinces = Array.from(provinceData.keys()).sort();
        setAvailableProvinces(provinces);

        // 生成时间序列数据
        const timeSeriesData: TimeSeriesData[] = [];
        
        selectedProvinces.forEach(province => {
          const values = provinceData.get(province);
          if (values) {
            dates.forEach((date, index) => {
              timeSeriesData.push({
                date,
                value: values[index] || 0,
                province
              });
            });
          }
        });

        setData(timeSeriesData);
      } catch (err) {
        console.error('数据加载失败:', err);
        setError(err instanceof Error ? err.message : '数据加载失败');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dataType, selectedProvinces]);

  // 绘制图表
  useEffect(() => {
    if (!data.length || loading) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 120, bottom: 60, left: 80 };
    const width = 900 - margin.left - margin.right;
    const height = 500 - margin.bottom - margin.top;

    const g = svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // 按省份分组数据
    const groupedData = d3.group(data, d => d.province);

    // 设置比例尺
    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => d.date) as [Date, Date])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value) || 0])
      .range([height, 0]);

    // 颜色比例尺
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // 线条生成器
    const line = d3.line<TimeSeriesData>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // 绘制网格线
    g.selectAll('.grid-line-x')
      .data(xScale.ticks())
      .enter()
      .append('line')
      .attr('class', 'grid-line-x')
      .attr('x1', d => xScale(d))
      .attr('x2', d => xScale(d))
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', '#e0e0e0')
      .attr('stroke-width', 0.5);

    g.selectAll('.grid-line-y')
      .data(yScale.ticks())
      .enter()
      .append('line')
      .attr('class', 'grid-line-y')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d))
      .attr('stroke', '#e0e0e0')
      .attr('stroke-width', 0.5);

    // 绘制线条
    groupedData.forEach((values, province) => {
      const sortedValues = values.sort((a, b) => a.date.getTime() - b.date.getTime());
      
      g.append('path')
        .datum(sortedValues)
        .attr('fill', 'none')
        .attr('stroke', colorScale(province || ''))
        .attr('stroke-width', province === '全国总计' ? 3 : 2)
        .attr('d', line)
        .attr('opacity', 0.8);

      // 添加数据点
      g.selectAll(`.dots-${province?.replace(/[^a-zA-Z0-9]/g, '')}`)
        .data(sortedValues.filter((_, i) => i % 5 === 0)) // 每5个点显示一个
        .enter()
        .append('circle')
        .attr('class', `dots-${province?.replace(/[^a-zA-Z0-9]/g, '')}`)
        .attr('cx', d => xScale(d.date))
        .attr('cy', d => yScale(d.value))
        .attr('r', province === '全国总计' ? 4 : 3)
        .attr('fill', colorScale(province || ''))
        .attr('opacity', 0.7);
    });    // 添加坐标轴
    const xAxis = d3.axisBottom(xScale)
      .tickFormat((domainValue) => {
        if (domainValue instanceof Date) {
          return d3.timeFormat('%Y-%m')(domainValue);
        }
        return '';
      });
    
    const yAxis = d3.axisLeft(yScale)
      .tickFormat((domainValue) => {
        if (typeof domainValue === 'number') {
          return d3.format(',')(domainValue);
        }
        return '';
      });

    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis as any)
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');

    g.append('g')
      .call(yAxis as any);

    // 添加坐标轴标签
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left + 20)
      .attr('x', 0 - (height / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .text(`每日新增${dataType === 'infections' ? '感染' : dataType === 'deaths' ? '死亡' : '康复'}人数`);

    g.append('text')
      .attr('transform', `translate(${width / 2}, ${height + margin.bottom - 10})`)
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .text('日期');    // 添加图例
    const legend = g.append('g')
      .attr('transform', `translate(${width + 10}, 20)`);

    // 限制图例显示的数量，避免图例过长
    const legendProvinces = selectedProvinces.slice(0, 10); // 最多显示10个
    
    legendProvinces.forEach((province, i) => {
      const legendItem = legend.append('g')
        .attr('transform', `translate(0, ${i * 20})`);

      legendItem.append('line')
        .attr('x1', 0)
        .attr('x2', 15)
        .attr('y1', 0)
        .attr('y2', 0)
        .attr('stroke', colorScale(province))
        .attr('stroke-width', province === '全国总计' ? 3 : 2);

      legendItem.append('text')
        .attr('x', 20)
        .attr('y', 0)
        .attr('dy', '0.35em')
        .style('font-size', '11px')
        .style('font-weight', province === '全国总计' ? 'bold' : 'normal')
        .text(province.length > 8 ? province.substring(0, 8) + '...' : province);
    });

    // 如果有更多省份未显示，添加提示
    if (selectedProvinces.length > 10) {
      legend.append('text')
        .attr('x', 0)
        .attr('y', 10 * 20 + 10)
        .style('font-size', '10px')
        .style('fill', '#666')
        .text(`...等${selectedProvinces.length - 10}个其他地区`);
    }

  }, [data, loading]);

  const handleProvinceChange = (province: string, checked: boolean) => {
    if (checked) {
      setSelectedProvinces(prev => [...prev, province]);
    } else {
      setSelectedProvinces(prev => prev.filter(p => p !== province));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-600">正在加载数据...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-red-600">错误: {error}</div>
      </div>
    );
  }

  return (
    <div className="w-full">      
    <div className="mb-4 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-bold text-gray-800">COVID-19 时间序列图</h3>
          <ChartDescriptionComponent description={chartDescriptions.timeSeriesChart} />
        </div>
        
        {/* 数据类型选择 */}
        <div className="flex space-x-4">
          <label className="text-sm font-medium text-gray-700">数据类型:</label>
          <div className="flex space-x-4">
            {[
              { key: 'infections', label: '每日新增感染' },
              { key: 'deaths', label: '每日新增死亡' },
              { key: 'recoveries', label: '每日新增康复' }
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center">
                <input
                  type="radio"
                  value={key}
                  checked={dataType === key}
                  onChange={(e) => setDataType(e.target.value as any)}
                  className="mr-2"
                />
                {label}
              </label>
            ))}
          </div>
        </div>        
        {/* 省份选择器 */}
        <TimeSeriesProvinceSelector
          availableProvinces={availableProvinces}
          selectedProvinces={selectedProvinces}
          onProvinceChange={handleProvinceChange}
          onSelectedProvincesChange={setSelectedProvinces}
          loading={loading}
        />
      </div>      
      <div className="border rounded-lg p-4 bg-white">
        <svg ref={svgRef}></svg>
      </div>
    </div>
  );
}
