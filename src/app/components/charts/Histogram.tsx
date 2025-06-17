'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import ChartDescriptionComponent from '../ui/ChartDescription';
import { chartDescriptions } from '../../../types/chartDescriptions';

interface HistogramProps {
  chartType: string;
}

interface RegionData {
  region: string;
  province: string;
  value: number;
  date: string;
}

interface BinData extends d3.Bin<RegionData, number> {
  x0: number;
  x1: number;
}

interface ChartDimensions {
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
}

export default function Histogram({ chartType }: HistogramProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<RegionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string>('累计感染');
  const [binSize, setBinSize] = useState<number>(10);
  const [binSizeMode, setBinSizeMode] = useState<'auto' | 'manual'>('auto');
  const [showNormalCurve, setShowNormalCurve] = useState<boolean>(true);
  const [showDensityCurve, setShowDensityCurve] = useState<boolean>(true);
  const [selectedRange, setSelectedRange] = useState<[number, number] | null>(null);
  const [hoveredBin, setHoveredBin] = useState<BinData | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // 定义指标配置
  const metricsConfig = {
    '累计感染': { file: 'China_accumulated_infections.csv', color: '#FF6B6B', field: 'infections' },
    '累计死亡': { file: 'China_accumulated_deaths.csv', color: '#FF4757', field: 'deaths' },
    '累计康复': { file: 'China_accumulated_recoveries.csv', color: '#2ED573', field: 'recoveries' }
  };

  // 加载和处理数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const config = metricsConfig[selectedMetric as keyof typeof metricsConfig];
        const response = await fetch(`/data/${config.file}`);
        const csvText = await response.text();
        
        // 解析CSV数据
        const rows = csvText.split('\n').slice(1).filter(row => row.trim());
        const headers = csvText.split('\n')[0].split(',');
        
        // 获取最新日期的数据（累计数据的最终值）
        const lastDateColumn = headers[headers.length - 1];
        const lastDateIndex = headers.length - 1;

        const regionData: RegionData[] = [];

        rows.forEach(row => {
          const cols = row.split(',');
          const region = cols[2] || cols[0];
          const province = cols[3] || cols[1];
          const value = parseFloat(cols[lastDateIndex]);

          if (!isNaN(value) && value > 0) {
            regionData.push({
              region,
              province,
              value,
              date: lastDateColumn.replace(' 00:00:00', '')
            });
          }
        });

        setData(regionData);
      } catch (err) {
        setError('数据加载失败: ' + (err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedMetric]);

  // 计算自动分箱数量
  const calculateAutoBins = (values: number[]) => {
    const n = values.length;
    // 使用Sturges规则或Freedman-Diaconis规则
    const sturges = Math.ceil(Math.log2(n) + 1);
    const iqr = d3.quantile(values.sort((a, b) => a - b), 0.75)! - d3.quantile(values, 0.25)!;
    const binWidth = 2 * iqr * Math.pow(n, -1/3);
    const freedmanDiaconis = Math.ceil((d3.max(values)! - d3.min(values)!) / binWidth);
    
    return Math.max(5, Math.min(50, Math.max(sturges, freedmanDiaconis)));
  };

  // 计算正态分布曲线
  const calculateNormalCurve = (values: number[], xScale: d3.ScaleLinear<number, number>) => {
    const mean = d3.mean(values) || 0;
    const std = d3.deviation(values) || 1;
    const points: Array<{ x: number; y: number }> = [];
    
    const domain = xScale.domain();
    for (let x = domain[0]; x <= domain[1]; x += (domain[1] - domain[0]) / 100) {
      const y = (1 / (std * Math.sqrt(2 * Math.PI))) * 
                Math.exp(-0.5 * Math.pow((x - mean) / std, 2));
      points.push({ x, y: y * values.length * (domain[1] - domain[0]) / (binSizeMode === 'auto' ? calculateAutoBins(values) : binSize) });
    }
    
    return points;
  };

  // 计算核密度估计曲线
  const calculateDensityCurve = (values: number[], xScale: d3.ScaleLinear<number, number>) => {
    const bandwidth = 1.06 * (d3.deviation(values) || 1) * Math.pow(values.length, -1/5);
    const points: Array<{ x: number; y: number }> = [];
    
    const domain = xScale.domain();
    for (let x = domain[0]; x <= domain[1]; x += (domain[1] - domain[0]) / 100) {
      let sum = 0;
      for (const value of values) {
        sum += Math.exp(-0.5 * Math.pow((x - value) / bandwidth, 2));
      }
      const density = sum / (values.length * bandwidth * Math.sqrt(2 * Math.PI));
      points.push({ x, y: density * values.length * (domain[1] - domain[0]) / (binSizeMode === 'auto' ? calculateAutoBins(values) : binSize) });
    }
    
    return points;
  };

  // 绘制直方图
  useEffect(() => {
    if (!data.length || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const dimensions: ChartDimensions = {
      width: 1200,
      height: 700,
      margin: { top: 50, right: 200, bottom: 80, left: 80 }
    };

    const { width, height, margin } = dimensions;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // 准备数据
    const values = data.map(d => d.value);
    const filteredValues = selectedRange ? 
      values.filter(v => v >= selectedRange[0] && v <= selectedRange[1]) : values;

    // 创建比例尺
    const xScale = d3.scaleLinear()
      .domain(d3.extent(values) as [number, number])
      .nice()
      .range([0, innerWidth]);

    // 创建直方图布局
    const numBins = binSizeMode === 'auto' ? calculateAutoBins(filteredValues) : binSize;
    const histogram = d3.histogram<RegionData, number>()
      .value(d => d.value)
      .domain(xScale.domain() as [number, number])
      .thresholds(numBins);

    const bins = histogram(data.filter(d => 
      !selectedRange || (d.value >= selectedRange[0] && d.value <= selectedRange[1])
    )) as BinData[];

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(bins, d => d.length) || 0])
      .nice()
      .range([innerHeight, 0]);

    // 绘制X轴
    const xAxis = g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).tickFormat(d => d3.format('.0f')(d as number)));

    xAxis.selectAll('text')
      .style('font-size', '12px');

    // 绘制Y轴
    const yAxis = g.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(yScale).tickFormat(d => d3.format('.0f')(d as number)));

    yAxis.selectAll('text')
      .style('font-size', '12px');

    // 轴标签
    g.append('text')
      .attr('class', 'x-label')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 50)
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text(selectedMetric + ' 数值');

    g.append('text')
      .attr('class', 'y-label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -50)
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text('频次');

    // 绘制直方图柱子
    const config = metricsConfig[selectedMetric as keyof typeof metricsConfig];
    const bars = g.selectAll('.bar')
      .data(bins)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.x0!))
      .attr('y', d => yScale(d.length))
      .attr('width', d => Math.max(0, xScale(d.x1!) - xScale(d.x0!) - 1))
      .attr('height', d => innerHeight - yScale(d.length))
      .style('fill', config.color)
      .style('fill-opacity', 0.7)
      .style('stroke', config.color)
      .style('stroke-width', 1)
      .style('cursor', 'pointer')      
      .on('mouseover', function(event, d) {
        setHoveredBin(d);
        setMousePosition({ x: event.pageX, y: event.pageY });
        d3.select(this)
          .style('fill-opacity', 0.9)
          .style('stroke-width', 2);
      })
      .on('mousemove', function(event) {
        setMousePosition({ x: event.pageX, y: event.pageY });
      })
      .on('mouseout', function() {
        setHoveredBin(null);
        d3.select(this)
          .style('fill-opacity', 0.7)
          .style('stroke-width', 1);
      })
      .on('click', function(event, d) {
        const range: [number, number] = [d.x0!, d.x1!];
        setSelectedRange(selectedRange && 
          selectedRange[0] === range[0] && selectedRange[1] === range[1] ? 
          null : range
        );
      });

    // 绘制正态分布曲线
    if (showNormalCurve) {
      const normalCurve = calculateNormalCurve(filteredValues, xScale);
      const normalLine = d3.line<{ x: number; y: number }>()
        .x(d => xScale(d.x))
        .y(d => yScale(d.y))
        .curve(d3.curveBasis);

      g.append('path')
        .datum(normalCurve)
        .attr('class', 'normal-curve')
        .attr('d', normalLine)
        .style('fill', 'none')
        .style('stroke', '#FF6B35')
        .style('stroke-width', 2)
        .style('stroke-dasharray', '5,5');
    }

    // 绘制密度曲线
    if (showDensityCurve) {
      const densityCurve = calculateDensityCurve(filteredValues, xScale);
      const densityLine = d3.line<{ x: number; y: number }>()
        .x(d => xScale(d.x))
        .y(d => yScale(d.y))
        .curve(d3.curveBasis);

      g.append('path')
        .datum(densityCurve)
        .attr('class', 'density-curve')
        .attr('d', densityLine)
        .style('fill', 'none')
        .style('stroke', '#3742FA')
        .style('stroke-width', 2)
        .style('stroke-dasharray', '3,3');
    }

    // 添加图例
    const legend = g.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${innerWidth + 20}, 20)`);

    let legendY = 0;

    // 主数据图例
    legend.append('rect')
      .attr('x', 0)
      .attr('y', legendY)
      .attr('width', 15)
      .attr('height', 15)
      .style('fill', config.color)
      .style('fill-opacity', 0.7);

    legend.append('text')
      .attr('x', 20)
      .attr('y', legendY + 12)
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .text(selectedMetric);

    legendY += 25;

    // 正态曲线图例
    if (showNormalCurve) {
      legend.append('line')
        .attr('x1', 0)
        .attr('x2', 15)
        .attr('y1', legendY + 7)
        .attr('y2', legendY + 7)
        .style('stroke', '#FF6B35')
        .style('stroke-width', 2)
        .style('stroke-dasharray', '5,5');

      legend.append('text')
        .attr('x', 20)
        .attr('y', legendY + 12)
        .style('font-size', '12px')
        .text('正态分布曲线');

      legendY += 25;
    }

    // 密度曲线图例
    if (showDensityCurve) {
      legend.append('line')
        .attr('x1', 0)
        .attr('x2', 15)
        .attr('y1', legendY + 7)
        .attr('y2', legendY + 7)
        .style('stroke', '#3742FA')
        .style('stroke-width', 2)
        .style('stroke-dasharray', '3,3');

      legend.append('text')
        .attr('x', 20)
        .attr('y', legendY + 12)
        .style('font-size', '12px')
        .text('核密度估计曲线');
    }

    // 统计信息
    const stats = {
      count: filteredValues.length,
      mean: d3.mean(filteredValues) || 0,
      median: d3.quantile(filteredValues.sort((a, b) => a - b), 0.5) || 0,
      std: d3.deviation(filteredValues) || 0,
      min: d3.min(filteredValues) || 0,
      max: d3.max(filteredValues) || 0
    };    
    
    const statsGroup = g.append('g')
      .attr('class', 'stats')
      .attr('transform', `translate(${innerWidth + 20}, ${legendY + 60})`);

    const statsData = [
      { label: '样本数量', value: stats.count.toFixed(0) },
      { label: '平均值', value: stats.mean.toFixed(2) },
      { label: '中位数', value: stats.median.toFixed(2) },
      { label: '标准差', value: stats.std.toFixed(2) },
      { label: '最小值', value: stats.min.toFixed(0) },
      { label: '最大值', value: stats.max.toFixed(0) }
    ];

    statsData.forEach((stat, i) => {
      statsGroup.append('text')
        .attr('x', 0)
        .attr('y', i * 20)
        .style('font-size', '11px')
        .style('font-weight', 'bold')
        .text(`${stat.label}: ${stat.value}`);
    });

  }, [data, selectedMetric, binSize, binSizeMode, showNormalCurve, showDensityCurve, selectedRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white rounded-lg shadow-lg relative">      
    {/* 标题 */}
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">
          COVID-19 数据分布直方图
        </h2>
        <ChartDescriptionComponent description={chartDescriptions.histogram} />
      </div>

      {/* 悬浮提示框 */}
      {hoveredBin && (
        <div 
          className="absolute z-10 bg-gray-800 text-white p-3 rounded-lg shadow-lg text-sm pointer-events-none"
          style={{
            left: mousePosition.x + 15,
            top: mousePosition.y - 50,
            transform: 'translate(-50%, 0)'
          }}
        >
          <div className="font-medium mb-1">区间信息</div>
          <div>区间: {hoveredBin.x0?.toFixed(0)} - {hoveredBin.x1?.toFixed(0)}</div>
          <div>频次: {hoveredBin.length}</div>
          <div>包含地区: {hoveredBin.slice(0, 3).map((d: RegionData) => d.region).join(', ')}
            {hoveredBin.length > 3 && ` 等${hoveredBin.length}个地区`}
          </div>
        </div>
      )}

      {/* 控制面板 */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex flex-wrap gap-4 items-center">
          {/* 指标选择 */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">数据指标:</label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="px-3 py-1 border rounded text-sm"
            >
              {Object.keys(metricsConfig).map(metric => (
                <option key={metric} value={metric}>{metric}</option>
              ))}
            </select>
          </div>

          {/* 分箱设置 */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">分箱模式:</label>
            <select
              value={binSizeMode}
              onChange={(e) => setBinSizeMode(e.target.value as 'auto' | 'manual')}
              className="px-3 py-1 border rounded text-sm"
            >
              <option value="auto">自动分箱</option>
              <option value="manual">手动调整</option>
            </select>
          </div>

          {/* 手动分箱数量 */}
          {binSizeMode === 'manual' && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">分箱数量:</label>
              <input
                type="range"
                min="5"
                max="50"
                value={binSize}
                onChange={(e) => setBinSize(parseInt(e.target.value))}
                className="w-20"
              />
              <span className="text-sm w-8">{binSize}</span>
            </div>
          )}

          {/* 曲线显示选项 */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={showNormalCurve}
                onChange={(e) => setShowNormalCurve(e.target.checked)}
              />
              正态曲线
            </label>
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={showDensityCurve}
                onChange={(e) => setShowDensityCurve(e.target.checked)}
              />
              密度曲线
            </label>
          </div>

          {/* 清除范围选择 */}
          {selectedRange && (
            <button
              onClick={() => setSelectedRange(null)}
              className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
            >
              清除选择
            </button>
          )}
        </div>        
        {/* 选择范围信息 */}
        {selectedRange && (
          <div className="mt-2 text-sm text-blue-600">
            已选择范围: {selectedRange[0].toFixed(0)} - {selectedRange[1].toFixed(0)}
          </div>
        )}      
        </div>      
      {/* 图表区域 */}
      <div className="p-4">
        <svg ref={svgRef}></svg>
      </div>        
    </div>
  );
}
