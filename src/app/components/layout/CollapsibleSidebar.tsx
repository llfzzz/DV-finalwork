'use client';

import { useState } from 'react';
import "../../globals.css";
import 'tdesign-react/es/style/index.css';
import { Menu, Button } from 'tdesign-react';
import {
  HousesIcon,
  ChartIcon,
  AnalyticsIcon,
  DashboardIcon,
  ViewListIcon,
  MapLocationIcon,
  LayersIcon,
  FileIcon,
  ChartBarIcon,
  ChartPieIcon,
  ChartRadialIcon,
  ChartLineData1Icon,
  MapBubbleIcon,
  ChartLineMultiIcon,
  TableSplitIcon,
  ChartComboIcon,
  Chart3DIcon,
  MapAimingIcon,
  MapGridIcon
} from 'tdesign-icons-react';
import type { MenuValue } from 'tdesign-react';

const { SubMenu, MenuItem } = Menu;

interface CollapsibleSidebarProps {
  onChartSelect: (chartType: string) => void;
  onHomeReturn: () => void;
}

export default function CollapsibleSidebar({ onChartSelect, onHomeReturn }: CollapsibleSidebarProps) {
  const [active, setActive] = useState<MenuValue>('');
  const [collapsed, setCollapsed] = useState(false);
  const [expands, setExpands] = useState<MenuValue[]>([]);
  const handleMenuChange = (value: MenuValue) => {
    setActive(value);
    // 判断是否为叶子节点（可选择的图表类型）
    const chartTypes = [
      'pie-chart', 'bar-chart', 'radar-chart', 'parallel-coordinates', 'scatter-plot',
      'time-series', 'line-chart', 'geo-heatmap', 'histogram', 'box-plot', 
      'violin-plot', '2d-density', 'confusion-matrix', 'roc-curve', 
      'dendrogram-chart', 'cluster-chart', 'calendar-heat'
    ];
    
    if (chartTypes.includes(value as string)) {
      onChartSelect(value as string);
    }
  };return (
    <aside className={`operate-area bg-white border-2 border-black transition-all duration-300 h-full flex flex-col ${
      collapsed ? 'w-16' : 'w-80'
    }`}>
      <div className="border-b-2 border-black flex-shrink-0">
        <h2 className={`operate-title text-lg font-bold flex items-center transition-all ${
          collapsed ? 'justify-center p-2' : 'justify-between px-4 py-3'
        }`}>
          {!collapsed && <span>操作区域</span>}
          <button
            onClick={onHomeReturn}
            className="home-icon text-lg hover:text-blue-500 transition-colors"
            title="返回首页"
          >
            <HousesIcon />
          </button>
        </h2>
      </div>
      <Menu
        value={active}
        collapsed={collapsed}
        expandMutex={false}
        expanded={expands}
        onExpand={(values) => setExpands(values)}
        onChange={handleMenuChange}
        operations={
          <Button
            variant="text"
            shape="square"
            icon={<ViewListIcon />}
            onClick={() => setCollapsed(!collapsed)}
          />
        }
        style={{
          flex: 1,
          overflowY: 'auto',
          border: 'none',
          width: '100%'
        }}
        theme="light"
        className={`
          [&_.t-menu__operations]:!border-none 
          [&_.t-menu__item]:!w-full 
          [&_.t-submenu]:!w-full 
          [&_.t-menu--light]:!border-none
          [&_.t-menu__item-inner]:!justify-start
          ${collapsed ? '[&_.t-menu__item-inner]:!justify-center' : ''}
        `}
      >        
      {/* 对比分析 */}
        <SubMenu value="compare-viz" title={<span>对比分析</span>} icon={<AnalyticsIcon />}>
          <SubMenu value="single-compare" title={<span>单维对比</span>} icon={<ChartIcon />}>
            <MenuItem value="pie-chart" icon={<ChartPieIcon />}>
              饼图
            </MenuItem>
            <MenuItem value="bar-chart" icon={<ChartBarIcon />}>
              柱状图
            </MenuItem>
          </SubMenu>
          
          <SubMenu value="multi-compare" title={<span>多维对比</span>} icon={<ChartLineMultiIcon />}>
            <MenuItem value="radar-chart" icon={<ChartRadialIcon />}>
              雷达图
            </MenuItem>
            <MenuItem value="parallel-coordinates" icon={<TableSplitIcon />}>
              水平坐标图
            </MenuItem>
          </SubMenu>
          
          <SubMenu value="time-series" title={<span>时间对比分析</span>} icon={<ChartIcon />}>
            <MenuItem value="time-series" icon={<ChartLineData1Icon />}>
              时间序列图
            </MenuItem>
          </SubMenu>
        </SubMenu>

        {/* 分布分析 */}
        <SubMenu value="distributed-viz" title={<span>分布分析</span>} icon={<DashboardIcon />}>
          <SubMenu value="geo-dis" title={<span>地理分布</span>} icon={<MapLocationIcon />}>
            <MenuItem value="geo-heatmap" icon={<MapGridIcon />}>
              地理热力图
            </MenuItem>
          </SubMenu>
          
          <SubMenu value="describe-dis" title={<span>描述性分布</span>} icon={<FileIcon />}>
            <MenuItem value="histogram" icon={<ChartComboIcon />}>
              直方图
            </MenuItem>
            <MenuItem value="box-plot" icon={<Chart3DIcon />}>
              箱线图
            </MenuItem>
          </SubMenu>
          
          <SubMenu value="multi-dis" title={<span>多维分布</span>} icon={<LayersIcon />}>
            <MenuItem value="scatter-plot" icon={<MapBubbleIcon />}>
              散点图
            </MenuItem>
          </SubMenu>
        </SubMenu>

        {/* 分类对比 */}
        <SubMenu value="cls-compare" title={<span>分类对比</span>} icon={<ChartIcon />}>
          <MenuItem value="calendar-heat" icon={<DashboardIcon />}>
            日历热力图
          </MenuItem>
        </SubMenu>

        {/* 自主对比 */}
        <MenuItem value="custom-compare" disabled icon={<MapAimingIcon />}>
          自主对比（未实现）
        </MenuItem>
      </Menu>
    </aside>
  );
}