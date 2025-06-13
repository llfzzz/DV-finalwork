'use client';

import React, {useEffect, useRef} from 'react';
import * as d3 from 'd3';

interface HeatmapProps {
    chartType?: string
}

const Heatmap: React.FC<HeatmapProps> = ({chartType}: HeatmapProps) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current) return;

        const width = 1000;
        const height = 700;

        // 清空之前的内容
        d3.select(svgRef.current).selectAll("*").remove();

        // 定义地图投影
        const projection = d3.geoMercator()
            .center([107, 31]) // 地图中心位置,107是经度，31是纬度
            .scale(600) // 设置缩放量
            .translate([width / 2, height / 2]); // 设置平移量

        // 定义地理路径生成器,使每一个坐标都会先调用此投影,才产生路径值
        const path = d3.geoPath()
            .projection(projection); // 设定投影

        // 创建svg
        const svg = d3.select(svgRef.current)
            .attr("width", width)
            .attr("height", height);        
            const groups = svg.append("g");
        
        // 请求Chinese.json数据
        d3.json("/data/Chinese.json").then((root: any) => {
            if (!root) {
                console.error('数据请求失败');
                return;
            }
            console.log(root);
              groups.selectAll("path")
                .data(root.features) // 绑定数据
                .enter()
                .append("path")
                .style("fill", '#404466')
                .attr("d", (d: any) => path(d)); // 使用路径生成器
        }).catch((error: any) => {
            console.error('数据请求失败', error);
        });

    }, []);

    return (
        <div>
            <svg ref={svgRef}></svg>
        </div>
    );
};

export default Heatmap;