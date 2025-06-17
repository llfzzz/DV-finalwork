'use client';

import BarChart from "./charts/BarChart";
import TimeSeriesChart from "./charts/TimeSeriesChart";
import Histogram from "./charts/Histogram";
import BoxPlot from "./charts/BoxPlot";
import ScatterPlot from "./charts/ScatterPlot";
import PieChart from "./charts/PieChart";
import RadarChart from "./charts/RadarChart";
import ParallelCoordinatesChart from "./charts/ParallelCoordinatesChart";
import CalendarHeatmap from "./charts/CalendarHeatmap";

interface ChartRendererProps {
  chartType: string | null;
}

export default function ChartRenderer({ chartType }: ChartRendererProps) {  
  switch (chartType) {
    case 'pie-chart':
      return (
        <PieChart chartType={chartType} />
      );
      case 'bar-chart':
      return (
          <BarChart chartType={chartType} />
      );    
      case 'radar-chart':
      return (
        <RadarChart chartType={chartType} />
      );    
      case 'parallel-coordinates':
      return (
        <ParallelCoordinatesChart chartType={chartType} />
      );

    case 'time-series':
      return (
          <TimeSeriesChart chartType={chartType} />
      );
        case 'geo-heatmap':
      return (
        <div className="text-gray-600 text-center">
          <h3 className="text-xl font-bold mb-2">做不到兄弟</h3>
        </div>
      );
    case 'histogram':
      return (
          <Histogram chartType={chartType} />
      );
    case 'box-plot':
      return (
        <BoxPlot chartType={chartType} />
      );
    case 'scatter-plot':
      return (
          <ScatterPlot chartType={chartType} />
      );    
    case 'calendar-heat':
      return (
        <CalendarHeatmap chartType={chartType} />
      );

    case 'custom-compare':
      return (
        <div className="text-gray-600 text-center">
          <h3 className="text-xl font-bold mb-2">自主对比</h3>
          <p>暂时没实现</p>
        </div>
      );

    default:
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
          <p>请从左侧菜单选择要显示的图表类型</p>
        </div>
      );
  }
}