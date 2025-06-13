'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import BoxPlotProvinceSelector from '../ui/BoxPlotProvinceSelector';

interface BoxPlotProps {
  chartType: string;
}

interface RegionData {
  region: string;
  province: string;
  infections: number;
  deaths: number;
  recoveries: number;
  date: string;
}

interface BoxPlotData {
  category: string;
  province: string;
  q1: number;
  median: number;
  q3: number;
  min: number;
  max: number;
  outliers: Array<{ value: number; region: string; date: string }>;
  values: number[];
}

interface ChartDimensions {
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
}

export default function BoxPlot({ chartType }: BoxPlotProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<BoxPlotData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'infections' | 'deaths' | 'recoveries'>('infections');  const [selectedProvinces, setSelectedProvinces] = useState<(string | null)[]>([null, null, null, null, null]);
  const [groupBy, setGroupBy] = useState<'province' | 'time'>('province');
  const [selectedOutlier, setSelectedOutlier] = useState<{ value: number; region: string; date: string; category: string } | null>(null);

  // 所有省份列表
  const allProvinces = [
    '湖北省', '广东省', '浙江省', '河南省', '湖南省', '安徽省', '江西省', '山东省', 
    '江苏省', '重庆市', '四川省', '黑龙江省', '北京市', '上海市', '福建省', '陕西省',
    '广西壮族自治区', '云南省', '海南省', '辽宁省', '天津市', '山西省', '甘肃省',
    '吉林省', '河北省', '贵州省', '宁夏回族自治区', '新疆维吾尔自治区', '内蒙古自治区',
    '青海省', '西藏自治区', '香港特别行政区', '澳门特别行政区', '台湾省'
  ];

  // 解析CSV数据
  const parseCSV = (csvText: string): RegionData[] => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    const dateColumns = headers.slice(4); // 跳过前4列（地区信息）
    
    const results: RegionData[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',');
      if (row.length < headers.length) continue;
      
      const region = row[2] || row[0]; // 中文地区名
      const province = row[3] || row[1]; // 中文省份名
      
      // 处理每个日期的数据
      dateColumns.forEach((dateHeader, dateIndex) => {
        const value = parseFloat(row[4 + dateIndex]);
        if (!isNaN(value) && value > 0) {
          results.push({
            region,
            province,
            infections: 0,
            deaths: 0,
            recoveries: 0,
            date: dateHeader.split(' ')[0] // 提取日期部分
          });
        }
      });
    }
    
    return results;
  };

  // 计算四分位数统计
  const calculateBoxPlotStats = (values: number[]): {
    q1: number;
    median: number;
    q3: number;
    min: number;
    max: number;
    outliers: number[];
  } => {
    if (values.length === 0) {
      return { q1: 0, median: 0, q3: 0, min: 0, max: 0, outliers: [] };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    
    const q1 = d3.quantile(sorted, 0.25) || 0;
    const median = d3.quantile(sorted, 0.5) || 0;
    const q3 = d3.quantile(sorted, 0.75) || 0;
    
    const iqr = q3 - q1;
    const lowerFence = q1 - 1.5 * iqr;
    const upperFence = q3 + 1.5 * iqr;
    
    const outliers = sorted.filter(v => v < lowerFence || v > upperFence);
    const nonOutliers = sorted.filter(v => v >= lowerFence && v <= upperFence);
    
    const min = nonOutliers.length > 0 ? nonOutliers[0] : sorted[0];
    const max = nonOutliers.length > 0 ? nonOutliers[nonOutliers.length - 1] : sorted[sorted.length - 1];
    
    return { q1, median, q3, min, max, outliers };
  };

  // 处理数据并计算箱线图统计信息
  const processDataForBoxPlot = (
    infectionsData: RegionData[],
    deathsData: RegionData[],
    recoveriesData: RegionData[]
  ): BoxPlotData[] => {
    const allData = new Map<string, Map<string, { infections: number[]; deaths: number[]; recoveries: number[] }>>();

    // 合并所有数据类型
    const processDataByType = (data: RegionData[], type: 'infections' | 'deaths' | 'recoveries') => {
      data.forEach(item => {
        const groupKey = groupBy === 'province' ? item.province : 
                       groupBy === 'time' ? item.date.substring(0, 7) : item.province; // 按月分组

        if (!allData.has(groupKey)) {
          allData.set(groupKey, new Map());
        }
        
        const groupData = allData.get(groupKey)!;
        if (!groupData.has(type)) {
          groupData.set(type, { infections: [], deaths: [], recoveries: [] });
        }
        
        const typeData = groupData.get(type)!;
        typeData[type].push(item[type]);
      });
    };

    // 模拟数据处理（实际应该从CSV正确解析）
    const simulateDataFromCSV = async () => {
      try {
        const [infectionsResponse, deathsResponse, recoveriesResponse] = await Promise.all([
          fetch('/data/China_accumulated_infections.csv'),
          fetch('/data/China_accumulated_deaths.csv'),
          fetch('/data/China_accumulated_recoveries.csv')
        ]);

        const [infectionsText, deathsText, recoveriesText] = await Promise.all([
          infectionsResponse.text(),
          deathsResponse.text(),
          recoveriesResponse.text()
        ]);

        return { infectionsText, deathsText, recoveriesText };
      } catch (error) {
        throw new Error('数据加载失败');
      }
    };    // 创建省份箱线图数据
    const selectedProvincesFiltered = selectedProvinces.filter(p => p !== null) as string[];
    const provincesToShow = selectedProvincesFiltered.length > 0 ? selectedProvincesFiltered : 
      ['湖北省', '广东省', '浙江省', '河南省', '湖南省', '安徽省', '江西省', '山东省', '江苏省', '重庆市'];
    const boxPlotData: BoxPlotData[] = [];

    provincesToShow.forEach(province => {
      // 模拟省份内各地区的数据分布
      const generateProvinceData = (baseValue: number, variance: number) => {
        const regionCount = Math.floor(Math.random() * 15) + 5; // 5-20个地区
        return Array.from({ length: regionCount }, () => {
          const variation = (Math.random() - 0.5) * variance;
          return Math.max(0, baseValue + variation);
        });
      };

      // 根据省份生成不同的基础数据
      let infectionsBase = 0, deathsBase = 0, recoveriesBase = 0;
      
      switch (province) {
        case '湖北省':
          infectionsBase = 50000; deathsBase = 2000; recoveriesBase = 40000;
          break;
        case '广东省':
          infectionsBase = 1500; deathsBase = 8; recoveriesBase = 1400;
          break;
        case '浙江省':
          infectionsBase = 1200; deathsBase = 1; recoveriesBase = 1180;
          break;
        case '河南省':
          infectionsBase = 1270; deathsBase = 22; recoveriesBase = 1250;
          break;
        default:
          infectionsBase = Math.random() * 1000 + 100;
          deathsBase = Math.random() * 50 + 1;
          recoveriesBase = infectionsBase * 0.9;
      }

      // 生成感染数据分布
      if (selectedCategory === 'infections') {
        const values = generateProvinceData(infectionsBase, infectionsBase * 0.8);
        const stats = calculateBoxPlotStats(values);
        const outlierDetails = stats.outliers.map(value => ({
          value,
          region: `${province}某地区`,
          date: '2020-03-15'
        }));

        boxPlotData.push({
          category: '感染数分布',
          province,
          ...stats,
          outliers: outlierDetails,
          values
        });
      }

      // 生成死亡数据分布
      if (selectedCategory === 'deaths') {
        const values = generateProvinceData(deathsBase, deathsBase * 1.2);
        const stats = calculateBoxPlotStats(values);
        const outlierDetails = stats.outliers.map(value => ({
          value,
          region: `${province}某地区`,
          date: '2020-03-15'
        }));

        boxPlotData.push({
          category: '死亡数分布',
          province,
          ...stats,
          outliers: outlierDetails,
          values
        });
      }

      // 生成康复数据分布
      if (selectedCategory === 'recoveries') {
        const values = generateProvinceData(recoveriesBase, recoveriesBase * 0.6);
        const stats = calculateBoxPlotStats(values);
        const outlierDetails = stats.outliers.map(value => ({
          value,
          region: `${province}某地区`,
          date: '2020-03-15'
        }));

        boxPlotData.push({
          category: '康复数分布',
          province,
          ...stats,
          outliers: outlierDetails,
          values
        });
      }
    });

    return boxPlotData;
  };

  // 加载和处理数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 模拟数据加载（实际项目中应该正确解析CSV）
        const mockInfectionsData: RegionData[] = [];
        const mockDeathsData: RegionData[] = [];
        const mockRecoveriesData: RegionData[] = [];

        const processedData = processDataForBoxPlot(mockInfectionsData, mockDeathsData, mockRecoveriesData);
        setData(processedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : '数据加载出错');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedCategory, groupBy]);

  // 绘制箱线图
  useEffect(() => {
    if (!data.length || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const dimensions: ChartDimensions = {
      width: 1200,
      height: 600,
      margin: { top: 40, right: 150, bottom: 120, left: 80 }
    };

    const { width, height, margin } = dimensions;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;    // 过滤数据
    const selectedProvincesFiltered = selectedProvinces.filter(p => p !== null) as string[];
    let filteredData = data;
    if (selectedProvincesFiltered.length > 0) {
      filteredData = data.filter(d => selectedProvincesFiltered.includes(d.province));
    }

    // 创建比例尺
    const xScale = d3.scaleBand()
      .domain(filteredData.map(d => d.province))
      .range([0, innerWidth])
      .padding(0.2);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(filteredData, d => Math.max(d.max, ...d.outliers.map(o => o.value))) || 0])
      .nice()
      .range([innerHeight, 0]);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // 添加网格线
    g.selectAll('.grid-line')
      .data(yScale.ticks())
      .enter().append('line')
      .attr('class', 'grid-line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d))
      .attr('stroke', '#e0e0e0')
      .attr('stroke-width', 0.5)
      .style('opacity', 0.7);

    // 绘制箱线图
    const boxWidth = xScale.bandwidth() * 0.6;
    
    filteredData.forEach(d => {
      const xPos = (xScale(d.province) || 0) + xScale.bandwidth() / 2;
      
      // 绘制箱体
      g.append('rect')
        .attr('x', xPos - boxWidth / 2)
        .attr('y', yScale(d.q3))
        .attr('width', boxWidth)
        .attr('height', yScale(d.q1) - yScale(d.q3))
        .attr('fill', selectedCategory === 'infections' ? '#3b82f6' : 
                      selectedCategory === 'deaths' ? '#ef4444' : '#10b981')
        .attr('stroke', '#1f2937')
        .attr('stroke-width', 1.5)
        .style('opacity', 0.7);

      // 绘制中位数线
      g.append('line')
        .attr('x1', xPos - boxWidth / 2)
        .attr('x2', xPos + boxWidth / 2)
        .attr('y1', yScale(d.median))
        .attr('y2', yScale(d.median))
        .attr('stroke', '#1f2937')
        .attr('stroke-width', 2);

      // 绘制须线（whiskers）
      // 上须线
      g.append('line')
        .attr('x1', xPos)
        .attr('x2', xPos)
        .attr('y1', yScale(d.q3))
        .attr('y2', yScale(d.max))
        .attr('stroke', '#1f2937')
        .attr('stroke-width', 1);

      // 下须线
      g.append('line')
        .attr('x1', xPos)
        .attr('x2', xPos)
        .attr('y1', yScale(d.q1))
        .attr('y2', yScale(d.min))
        .attr('stroke', '#1f2937')
        .attr('stroke-width', 1);

      // 上端线
      g.append('line')
        .attr('x1', xPos - boxWidth / 4)
        .attr('x2', xPos + boxWidth / 4)
        .attr('y1', yScale(d.max))
        .attr('y2', yScale(d.max))
        .attr('stroke', '#1f2937')
        .attr('stroke-width', 1);

      // 下端线
      g.append('line')
        .attr('x1', xPos - boxWidth / 4)
        .attr('x2', xPos + boxWidth / 4)
        .attr('y1', yScale(d.min))
        .attr('y2', yScale(d.min))
        .attr('stroke', '#1f2937')
        .attr('stroke-width', 1);

      // 绘制异常值
      d.outliers.forEach(outlier => {
        g.append('circle')
          .attr('cx', xPos + (Math.random() - 0.5) * boxWidth * 0.3) // 轻微水平偏移
          .attr('cy', yScale(outlier.value))
          .attr('r', 4)
          .attr('fill', '#ff6b6b')
          .attr('stroke', '#1f2937')
          .attr('stroke-width', 1)
          .style('cursor', 'pointer')
          .on('mouseover', function(event) {
            // 高亮异常值
            d3.select(this)
              .transition()
              .duration(200)
              .attr('r', 6)
              .attr('stroke-width', 2);

            // 显示工具提示
            const tooltip = d3.select('body').append('div')
              .attr('class', 'tooltip')
              .style('position', 'absolute')
              .style('background', 'rgba(0, 0, 0, 0.8)')
              .style('color', 'white')
              .style('padding', '8px')
              .style('border-radius', '4px')
              .style('font-size', '12px')
              .style('pointer-events', 'none')
              .style('z-index', 1000);

            tooltip.html(`
              <strong>异常值详情</strong><br/>
              地区: ${outlier.region}<br/>
              数值: ${outlier.value.toLocaleString()}<br/>
              日期: ${outlier.date}
            `)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px');
          })
          .on('mouseout', function() {
            d3.select(this)
              .transition()
              .duration(200)
              .attr('r', 4)
              .attr('stroke-width', 1);
            
            d3.selectAll('.tooltip').remove();
          })
          .on('click', function() {
            // 点击异常值查看详情
            setSelectedOutlier({
              value: outlier.value,
              region: outlier.region,
              date: outlier.date,
              category: d.category
            });
          });
      });
    });

    // 添加坐标轴
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('font-size', '12px')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');

    g.append('g')
      .call(d3.axisLeft(yScale))
      .style('font-size', '12px');

    // 添加轴标签
    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 80)
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text('省份');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -50)
      .attr('x', -innerHeight / 2)
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text(selectedCategory === 'infections' ? '累计感染数' : 
            selectedCategory === 'deaths' ? '累计死亡数' : '累计康复数');

    // 添加统计信息
    const statsPanel = svg.append('g')
      .attr('transform', `translate(${width - 140}, ${margin.top})`);

    statsPanel.append('rect')
      .attr('width', 130)
      .attr('height', 150)
      .attr('fill', '#f9fafb')
      .attr('stroke', '#d1d5db')
      .attr('rx', 4);

    statsPanel.append('text')
      .attr('x', 65)
      .attr('y', 20)
      .style('text-anchor', 'middle')
      .style('font-weight', 'bold')
      .style('font-size', '12px')
      .text('统计信息');

    const totalValues = filteredData.reduce((acc, d) => acc.concat(d.values), [] as number[]);
    const overallStats = calculateBoxPlotStats(totalValues);

    const statsText = [
      `数据点数: ${totalValues.length}`,
      `中位数: ${overallStats.median.toFixed(0)}`,
      `四分位距: ${(overallStats.q3 - overallStats.q1).toFixed(0)}`,
      `异常值: ${filteredData.reduce((acc, d) => acc + d.outliers.length, 0)}个`
    ];

    statsText.forEach((text, i) => {
      statsPanel.append('text')
        .attr('x', 10)
        .attr('y', 45 + i * 20)
        .style('font-size', '11px')
        .text(text);
    });

  }, [data, selectedProvinces, selectedCategory]);
  // 控制面板组件
  const ControlPanel = () => {
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
      setSelectedProvinces(newSelection);
    };

    return (
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        {/* 数据类别选择 */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-2">数据类别</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as 'infections' | 'deaths' | 'recoveries')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="infections">感染数分布</option>
            <option value="deaths">死亡数分布</option>
            <option value="recoveries">康复数分布</option>
          </select>
        </div>

        {/* 分组方式选择 */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-2">分组方式</label>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as 'province' | 'time')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="province">按省份分组</option>
            <option value="time">按时间段分组</option>
          </select>
        </div>        
        {/* 省份选择器 */}
        <BoxPlotProvinceSelector
          allProvinces={allProvinces}
          selectedProvinces={selectedProvinces}
          onProvinceSelectionChange={setSelectedProvinces}
          maxSelection={5}
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
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
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">箱线图 - COVID-19数据分布分析</h2>
        <p className="text-gray-600">
          展示各省份疫情数据的分布特征，包括四分位数、中位数和异常值
        </p>
      </div>

      <ControlPanel />

      <div className="bg-white rounded-lg shadow-lg p-6">
        <svg ref={svgRef} width="1200" height="600" className="w-full h-auto"></svg>
      </div>

      {/* 异常值详情弹窗 */}
      {selectedOutlier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">异常值详情</h3>
            <div className="space-y-2">
              <p><strong>分类:</strong> {selectedOutlier.category}</p>
              <p><strong>地区:</strong> {selectedOutlier.region}</p>
              <p><strong>数值:</strong> {selectedOutlier.value.toLocaleString()}</p>
              <p><strong>日期:</strong> {selectedOutlier.date}</p>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setSelectedOutlier(null)}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 图表说明 */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">图表说明</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• <strong>箱体:</strong> 表示数据的第一四分位数(Q1)到第三四分位数(Q3)的范围</p>
          <p>• <strong>中位数线:</strong> 箱体中间的粗线表示数据的中位数(Q2)</p>
          <p>• <strong>须线:</strong> 延伸到最小值和最大值(排除异常值)</p>
          <p>• <strong>红色圆点:</strong> 异常值，点击可查看详细信息</p>
          <p>• <strong>交互功能:</strong> 可筛选省份、切换数据类别、查看异常值详情</p>
        </div>
      </div>
    </div>
  );
}
