'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import ProvinceSelector from '../ui/ProvinceSelector';
import ChartDescriptionComponent from '../ui/ChartDescription';
import { chartDescriptions } from '../../../types/chartDescriptions';

interface ParallelCoordinatesChartProps {
  chartType: string;
}

interface ParallelData {
  province: string;
  infections: number;
  deaths: number;
  recoveries: number;
  maxInfections: number;
  maxDeaths: number;
  maxRecoveries: number;
  finalInfections: number;
  finalDeaths: number;
  finalRecoveries: number;
}

export default function ParallelCoordinatesChart({ chartType }: ParallelCoordinatesChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<ParallelData[]>([]);
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>(['北京市', '上海市', '广东省', '湖北省', '浙江省']);
  const [availableProvinces, setAvailableProvinces] = useState<string[]>([]);
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

  // 解析CSV数据为平行坐标数据格式
  const parseCSVData = (csvText: string): { provinceData: Map<string, number[]> } => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    
    const provinceData = new Map<string, number[]>();

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',');
      if (row.length < headers.length) continue;
      
      const province = row[3] || row[1] || '未知'; // 中文省份名
      
      // 提取数值数据（从第5列开始的所有日期数据）
      const values: number[] = [];
      for (let j = 4; j < row.length && j < headers.length; j++) {
        const value = parseFloat(row[j]);
        values.push(isNaN(value) ? 0 : value);
      }
      
      if (values.length > 0 && province !== '未知') {
        provinceData.set(province, values);
      }
    }

    return { provinceData };
  };

  // 加载数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 并行加载三种数据类型
        const [infectionsResponse, deathsResponse, recoveriesResponse] = await Promise.all([
          fetch('/data/China_accumulated_infections.csv'),
          fetch('/data/China_accumulated_deaths.csv'),
          fetch('/data/China_accumulated_recoveries.csv')
        ]);

        if (!infectionsResponse.ok || !deathsResponse.ok || !recoveriesResponse.ok) {
          throw new Error('无法加载数据文件');
        }

        const infectionsText = await infectionsResponse.text();
        const deathsText = await deathsResponse.text();
        const recoveriesText = await recoveriesResponse.text();

        const { provinceData: infectionsData } = parseCSVData(infectionsText);
        const { provinceData: deathsData } = parseCSVData(deathsText);
        const { provinceData: recoveriesData } = parseCSVData(recoveriesText);

        // 获取所有省份名称
        const allProvinces = Array.from(new Set([
          ...infectionsData.keys(),
          ...deathsData.keys(),
          ...recoveriesData.keys()
        ])).sort();

        setAvailableProvinces(allProvinces);

        // 构建平行坐标数据
        const parallelData: ParallelData[] = [];
        
        allProvinces.forEach(province => {
          const infections = infectionsData.get(province) || [];
          const deaths = deathsData.get(province) || [];
          const recoveries = recoveriesData.get(province) || [];

          if (infections.length > 0 || deaths.length > 0 || recoveries.length > 0) {
            // 计算各种统计指标
            const maxInfections = Math.max(...infections);
            const maxDeaths = Math.max(...deaths);
            const maxRecoveries = Math.max(...recoveries);
            const finalInfections = infections[infections.length - 1] || 0;
            const finalDeaths = deaths[deaths.length - 1] || 0;
            const finalRecoveries = recoveries[recoveries.length - 1] || 0;
            const totalInfections = infections.reduce((sum, val) => sum + val, 0);
            const totalDeaths = deaths.reduce((sum, val) => sum + val, 0);
            const totalRecoveries = recoveries.reduce((sum, val) => sum + val, 0);

            parallelData.push({
              province,
              infections: totalInfections / infections.length, // 平均感染数
              deaths: totalDeaths / deaths.length, // 平均死亡数
              recoveries: totalRecoveries / recoveries.length, // 平均康复数
              maxInfections,
              maxDeaths,
              maxRecoveries,
              finalInfections,
              finalDeaths,
              finalRecoveries
            });
          }
        });

        setData(parallelData);
      } catch (err) {
        console.error('数据加载失败:', err);
        setError(err instanceof Error ? err.message : '数据加载失败');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 绘制平行坐标图
  useEffect(() => {
    if (!data.length || loading) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 40, right: 120, bottom: 80, left: 80 };
    const width = 1000 - margin.left - margin.right;
    const height = 500 - margin.bottom - margin.top;

    const g = svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // 定义维度
    const dimensions = [
      { key: 'finalInfections', label: '最终累计感染' },
      { key: 'finalDeaths', label: '最终累计死亡' },
      { key: 'finalRecoveries', label: '最终累计康复' },
      { key: 'maxInfections', label: '峰值感染' },
      { key: 'maxDeaths', label: '峰值死亡' },
      { key: 'maxRecoveries', label: '峰值康复' }
    ];

    // 设置x轴位置
    const x = d3.scalePoint()
      .range([0, width])
      .domain(dimensions.map(d => d.key));

    // 为每个维度创建y轴比例尺
    const y: { [key: string]: d3.ScaleLinear<number, number> } = {};
    dimensions.forEach(dimension => {
      y[dimension.key] = d3.scaleLinear()
        .domain(d3.extent(data, d => (d as any)[dimension.key]) as [number, number])
        .range([height, 0]);
    });

    // 筛选选中的省份数据
    const filteredData = data.filter(d => selectedProvinces.includes(d.province));

    // 创建颜色比例尺
    const colorScale = d3.scaleOrdinal()
      .domain(selectedProvinces)
      .range(d3.schemeCategory10);

    // 绘制路径生成器
    const line = d3.line<[string, number]>()
      .x(d => x(d[0])!)
      .y(d => y[d[0]](d[1]));

    // 绘制背景路径（未选中的省份）
    const unselectedData = data.filter(d => !selectedProvinces.includes(d.province));
    g.selectAll(".background-path")
      .data(unselectedData)
      .enter()
      .append("path")
      .attr("class", "background-path")
      .attr("d", d => {
        const pathData: [string, number][] = dimensions.map(dim => [dim.key, (d as any)[dim.key]]);
        return line(pathData);
      })
      .style("fill", "none")
      .style("stroke", "#ddd")
      .style("stroke-width", 1)
      .style("opacity", 0.3);

    // 绘制选中省份的路径
    const paths = g.selectAll(".foreground-path")
      .data(filteredData)
      .enter()
      .append("path")
      .attr("class", "foreground-path")
      .attr("d", d => {
        const pathData: [string, number][] = dimensions.map(dim => [dim.key, (d as any)[dim.key]]);
        return line(pathData);
      })
      .style("fill", "none")
      .style("stroke", d => colorScale(d.province) as string)
      .style("stroke-width", 2.5)
      .style("opacity", 0.8);

    // 添加鼠标交互
    paths
      .on("mouseover", function(event, d) {
        d3.select(this)
          .style("stroke-width", 4)
          .style("opacity", 1);
        
        // 添加提示框
        const tooltip = g.append("g")
          .attr("class", "tooltip")
          .attr("transform", `translate(${width + 10}, 20)`);
        
        tooltip.append("rect")
          .attr("width", 200)
          .attr("height", 140)
          .attr("fill", "white")
          .attr("stroke", "#ccc")
          .attr("rx", 5);
        
        const text = tooltip.append("text")
          .attr("x", 10)
          .attr("y", 20)
          .style("font-size", "12px");
        
        text.append("tspan")
          .attr("x", 10)
          .attr("dy", "1.2em")
          .style("font-weight", "bold")
          .text(d.province);
        
        text.append("tspan")
          .attr("x", 10)
          .attr("dy", "1.5em")
          .text(`最终感染: ${d.finalInfections.toLocaleString()}`);
        
        text.append("tspan")
          .attr("x", 10)
          .attr("dy", "1.2em")
          .text(`最终死亡: ${d.finalDeaths.toLocaleString()}`);
        
        text.append("tspan")
          .attr("x", 10)
          .attr("dy", "1.2em")
          .text(`最终康复: ${d.finalRecoveries.toLocaleString()}`);
        
        text.append("tspan")
          .attr("x", 10)
          .attr("dy", "1.2em")
          .text(`峰值感染: ${d.maxInfections.toLocaleString()}`);
      })
      .on("mouseout", function() {
        d3.select(this)
          .style("stroke-width", 2.5)
          .style("opacity", 0.8);
        
        g.select(".tooltip").remove();
      });

    // 绘制坐标轴
    dimensions.forEach(dimension => {
      const axis = g.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(${x(dimension.key)}, 0)`)
        .call(d3.axisLeft(y[dimension.key]).ticks(6));

      // 添加轴标题
      axis.append("text")
        .style("text-anchor", "middle")
        .style("fill", "black")
        .style("font-weight", "bold")
        .style("font-size", "12px")
        .attr("y", -20)
        .text(dimension.label);
    });

    // 添加图例
    const legend = g.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width + 20}, 50)`);

    const legendItems = legend.selectAll(".legend-item")
      .data(filteredData.slice(0, 10)) // 最多显示10个
      .enter()
      .append("g")
      .attr("class", "legend-item")
      .attr("transform", (d, i) => `translate(0, ${i * 20})`);

    legendItems.append("line")
      .attr("x1", 0)
      .attr("x2", 15)
      .style("stroke", d => colorScale(d.province) as string)
      .style("stroke-width", 3);

    legendItems.append("text")
      .attr("x", 20)
      .attr("y", 0)
      .attr("dy", "0.35em")
      .style("font-size", "12px")
      .text(d => d.province);

  }, [data, selectedProvinces, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2">加载中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        <p>错误: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">      
    <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">COVID-19 平行坐标图</h2>
          <ChartDescriptionComponent description={chartDescriptions.parallelCoordinatesChart} />
        </div>
          {/* 省份选择器 */}
        <ProvinceSelector
          availableProvinces={availableProvinces}
          selectedProvinces={selectedProvinces}
          onProvinceChange={handleProvinceChange}
          onSelectedProvincesChange={setSelectedProvinces}
          loading={loading}
          title="选择省份进行多维度对比分析"
          showRegionButtons={true}
          gridCols={6}
          maxHeight="12rem"
        />
      </div>

      <div className="border rounded-lg p-4 bg-white">
        <svg ref={svgRef}></svg>
      </div>
    </div>
  );
}
