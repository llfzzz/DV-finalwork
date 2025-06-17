# 网站介绍

一个基于 Next.js 构建的数据可视化平台 目的是完成《数据可视化》课程的期末作业

## 🌟 项目特色

- **团队成员展示**: 精美的团队成员个人页面展示
- **用户认证系统**: 支持用户注册、登录、头像上传
- **评论互动**: 完整的评论系统，支持点赞和回复
- **数据可视化**: 多种图表组件展示数据分析
- **响应式设计**: 适配各种屏幕尺寸的现代化界面
- **实时消息**: Toast 消息提示系统

## 🚀 快速开始

### 安装依赖

```bash
npm install
# 或者
yarn install
# 或者
pnpm install
```

### 启动开发服务器

```bash
npm run dev
# 或者
yarn dev
# 或者
pnpm dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000) 查看项目效果。

## 🛠️ 技术栈

- **前端框架**: Next.js 14 (App Router)
- **编程语言**: TypeScript
- **UI 组件库**: TDesign React
- **样式方案**: Tailwind CSS
- **状态管理**: React Context
- **数据可视化**: 自定义图表组件
- **文件上传**: 内置文件上传 API(未实现)

## 📁 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   │   ├── auth/          # 认证相关 API
│   │   ├── comments/      # 评论系统 API
│   │   ├── upload/        # 文件上传 API（未实现）
│   │   └── user/          # 用户相关 API
│   ├── components/        # React 组件
│   │   ├── auth/          # 认证组件
│   │   ├── charts/        # 图表组件
│   │   ├── layout/        # 布局组件
│   │   ├── team/          # 团队组件
│   │   └── ui/            # UI 组件
│   └── globals.css        # 全局样式
├── contexts/              # React Context
├── data/                  # 静态数据
├── lib/                   # 工具库
└── types/                 # TypeScript 类型定义
```

## ✨ 主要功能

### 🔐 用户认证
- 用户注册/登录
- 头像上传和管理（未实现）
- 用户个人资料

### 👥 团队展示
- 团队成员个人页面
- 成员信息展示
- 个性化背景图片

### 💬 评论系统
- 发表评论
- 评论点赞
- 评论回复
- 实时评论统计

### 📊 数据可视化
- 条形图 (BarChart)
- 箱线图 (BoxPlot)
- 日历热力图 (CalendarHeatmap)
- 直方图 (Histogram)
- 平行坐标图 (ParallelCoordinatesChart)
- 饼图 (PieChart)
- 雷达图 (RadarChart)
- 散点图 (ScatterPlot)
- 时间序列图 (TimeSeriesChart)

## 🎨 界面预览

- 响应式导航栏，支持用户登录状态显示
- 现代化的卡片式布局
- 流畅的动画效果
- 友好的消息提示系统

## 📄 许可证

本项目采用 MIT 许可证。

---

基于 [Next.js](https://nextjs.org) 构建
