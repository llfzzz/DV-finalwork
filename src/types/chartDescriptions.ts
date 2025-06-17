// 图表说明配置类型定义

export interface ChartSection {
  title: string;
  items: string[];
}

export interface ChartDescription {
  title: string;
  sections: ChartSection[];
  usageTip?: {
    content: string;
    bgColor: string;
    borderColor: string;
    textColor: string;
  };
}

// 图表说明配置
export const chartDescriptions: Record<string, ChartDescription> = {
  // 直方图说明
  histogram: {
    title: "图表说明：",
    sections: [
      {
        title: "基础可视化功能：",
        items: [
          "• <strong>直方图用途：</strong>显示COVID-19疫情数据在各地区的分布情况，帮助理解数据的频率分布特征",
          "• <strong>数据维度：</strong>可选择查看累计感染、累计死亡或累计康复数据的分布",
          "• <strong>柱状图：</strong>每个柱子代表一个数值区间，柱子高度表示落在该区间内的地区数量"
        ]
      },
      {
        title: "智能分析功能：",
        items: [
          "• <strong>自动分箱算法：</strong>采用Sturges规则和Freedman-Diaconis规则智能确定最优分组数量",
          "• <strong>正态分布拟合：</strong>红色虚线显示理论正态分布曲线，用于检验数据分布的正态性",
          "• <strong>核密度估计：</strong>蓝色虚线显示数据的真实概率密度分布，反映数据的实际分布形状",
          "• <strong>描述性统计：</strong>实时计算并显示样本数量、平均值、中位数、标准差、最值等关键统计指标"
        ]
      },
      {
        title: "交互分析功能：",
        items: [
          "• <strong>悬停详情：</strong>鼠标悬停在柱形上可查看区间范围、频次统计和包含的具体地区列表",
          "• <strong>范围筛选：</strong>点击柱形可选择特定数值范围，对数据进行交互式筛选分析",
          "• <strong>动态调整：</strong>支持手动调节分组数量或使用智能自动分组",
          "• <strong>曲线控制：</strong>可选择性显示或隐藏正态分布曲线和核密度估计曲线"
        ]
      },
      {
        title: "可视分析应用：",
        items: [
          "• <strong>分布形状分析：</strong>识别数据分布的偏度（正偏、负偏、对称）和峰度特征",
          "• <strong>异常值检测：</strong>通过观察分布尾部和孤立柱形识别数据异常值和极端地区",
          "• <strong>集中趋势分析：</strong>通过平均值、中位数和分布中心判断疫情影响的集中程度",
          "• <strong>离散程度评估：</strong>通过标准差和分布宽度评估地区间疫情差异的变异性",
          "• <strong>正态性检验：</strong>比较实际分布与正态分布的差异，评估数据分布的规律性",
          "• <strong>密度分布评估：</strong>通过核密度估计了解数据的真实分布密度和多峰特征"
        ]
      },      {
        title: "应用场景：",
        items: [
          "• <strong>疫情监测：</strong>分析疫情数据在不同地区的分布规律和集中程度",
          "• <strong>风险评估：</strong>识别高风险地区集群和疫情传播的热点区域",
          "• <strong>政策制定：</strong>为疫情防控政策提供数据驱动的决策支持",
          "• <strong>资源配置：</strong>根据地区疫情分布特征优化医疗资源配置",
          "• <strong>趋势预测：</strong>通过分布分析预测疫情发展趋势和影响范围"
        ]
      }
    ],
    usageTip: {
      content: "<strong>使用建议：</strong>建议优先使用自动分箱模式进行初步分析，然后根据需要手动调整分箱数量。关注分布的偏度和峰度特征，以及正态曲线与实际分布的偏差程度，这些能够揭示数据的深层统计特征。",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-400",
      textColor: "text-blue-800"
    }
  },

  // 柱状图说明
  barChart: {
    title: "图表说明：",
    sections: [
      {
        title: "基础可视化功能：",
        items: [
          "• <strong>柱状图用途：</strong>对比不同省份的COVID-19累计数据，支持多指标横向比较分析",
          "• <strong>数据维度：</strong>支持切换查看累计感染、死亡、康复三种核心疫情指标",
          "• <strong>柱形设计：</strong>每个柱子代表一个省份的数据值，柱子高度直观反映数值大小"
        ]
      },
      {
        title: "智能分析功能：",
        items: [
          "• <strong>多省份对比：</strong>同时显示多个省份数据，便于识别地区间差异和排名关系",
          "• <strong>动态排序：</strong>支持按数值大小进行升序或降序排列，快速识别最高值和最低值",
          "• <strong>Top-N分析：</strong>可限制显示前N名数据，聚焦重点地区进行深入分析",
          "• <strong>比率计算：</strong>自动计算病死率、康复率等衍生指标，提供更全面的分析视角"
        ]
      },
      {
        title: "交互分析功能：",
        items: [
          "• <strong>省份筛选：</strong>通过复选框灵活选择要对比的省份，支持自定义对比组合",
          "• <strong>悬停详情：</strong>鼠标悬停显示详细数据，包含累计数值、病死率、康复率等综合信息",
          "• <strong>快速选择：</strong>提供重点省份、华北、华东、华南等预设地区组合的一键选择",
          "• <strong>动画效果：</strong>柱状图具有流畅的动画过渡，提升数据展示的视觉体验"
        ]
      },
      {
        title: "可视分析应用：",
        items: [
          "• <strong>地区差异分析：</strong>直观比较不同省份疫情严重程度和防控效果差异",
          "• <strong>排名趋势识别：</strong>通过排序功能快速识别疫情最严重和控制最好的地区",
          "• <strong>区域模式发现：</strong>通过地区组合选择发现华北、华东等区域的疫情分布模式",
          "• <strong>相对风险评估：</strong>通过多指标对比评估各地区的相对风险水平",
          "• <strong>防控效果评价：</strong>通过康复率、病死率等指标评价各地防控措施的有效性",
          "• <strong>资源配置优化：</strong>为医疗资源配置和政策制定提供量化的决策依据"
        ]
      },
      {
        title: "应用场景：",
        items: [
          "• <strong>疫情监控：</strong>实时监控各省份疫情发展状况，及时发现异常变化",
          "• <strong>政策评估：</strong>评估不同地区防控政策的实施效果和成效差异",
          "• <strong>资源调配：</strong>根据各地疫情严重程度合理调配医疗资源和防控力量",
          "• <strong>经验总结：</strong>识别防控效果好的地区，总结推广成功经验",
          "• <strong>预警决策：</strong>通过地区对比提前识别潜在风险区域，制定预警机制"
        ]
      }
    ],
    usageTip: {
      content: "<strong>使用建议：</strong>建议选择5-15个省份进行对比分析，过多的省份会影响图表可读性。可以先选择重点省份进行对比，再根据需要添加其他感兴趣的地区。",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-400",
      textColor: "text-blue-800"
    }  },

  // 箱线图说明
  boxPlot: {
    title: "图表说明：",
    sections: [
      {
        title: "基础可视化功能：",
        items: [
          "• <strong>箱线图用途：</strong>显示COVID-19疫情数据的分布特征，揭示数据的集中趋势、离散程度和异常值",
          "• <strong>数据维度：</strong>支持切换查看累计感染、死亡、康复三种疫情指标的分布分析",
          "• <strong>箱体设计：</strong>箱体显示第一四分位数(Q1)到第三四分位数(Q3)的数据范围，直观展示数据的集中区间"
        ]
      },
      {
        title: "统计分析功能：",
        items: [
          "• <strong>五数概括：</strong>自动计算并显示最小值、第一四分位数、中位数、第三四分位数、最大值",
          "• <strong>异常值检测：</strong>基于IQR(四分位数间距)规则自动识别和标记数据异常值",
          "• <strong>分布形状分析：</strong>通过箱体位置和须线长度分析数据分布的对称性和偏度",
          "• <strong>多维度对比：</strong>支持按省份或时间分组，进行横向和纵向的统计对比分析"
        ]
      },
      {
        title: "交互分析功能：",
        items: [
          "• <strong>省份筛选：</strong>灵活选择最多5个省份进行对比分析，支持动态切换对比组合",
          "• <strong>异常值详情：</strong>点击红色异常值点可查看具体数值、地区、日期等详细信息",
          "• <strong>分组切换：</strong>支持按省份分组或按时间分组，提供不同维度的分析视角",
          "• <strong>实时更新：</strong>选择条件改变时图表实时重新计算和渲染，保持分析的连续性"
        ]
      },
      {
        title: "可视分析应用：",
        items: [
          "• <strong>数据分布评估：</strong>通过箱体和须线判断数据的集中程度和分散情况",
          "• <strong>异常情况识别：</strong>快速识别偏离正常范围的数据点，发现异常疫情事件",
          "• <strong>地区差异比较：</strong>通过多个箱线图并排比较不同地区的疫情分布特征",
          "• <strong>时间模式分析：</strong>按时间分组观察疫情数据随时间的分布变化模式",
          "• <strong>稳定性评价：</strong>通过箱体大小和异常值数量评估各地区疫情数据的稳定性",
          "• <strong>风险等级划分：</strong>基于四分位数划分低风险、中风险、高风险等级区间"
        ]
      },
      {
        title: "应用场景：",
        items: [
          "• <strong>疫情监测：</strong>监测各地区疫情数据的分布状态，及时发现异常波动",
          "• <strong>风险评估：</strong>基于统计分布特征评估不同地区的疫情风险等级",
          "• <strong>政策制定：</strong>为差异化防控政策制定提供统计学依据",
          "• <strong>资源配置：</strong>根据数据分布特征合理配置医疗资源和防控力量",
          "• <strong>异常预警：</strong>通过异常值检测建立疫情数据的预警机制"
        ]
      }
    ],
    usageTip: {
      content: "<strong>使用建议：</strong>建议选择2-5个具有代表性的省份进行对比分析。关注箱体的位置和大小差异，以及异常值的分布模式，这些能够揭示不同地区疫情发展的统计规律。",
      bgColor: "bg-blue-50",      borderColor: "border-blue-400",
      textColor: "text-blue-800"
    }
  },

  // 时间序列图说明
  timeSeriesChart: {
    title: "图表说明：",
    sections: [
      {
        title: "基础可视化功能：",
        items: [
          "• <strong>时间序列图用途：</strong>展示COVID-19疫情数据随时间的变化趋势，揭示疫情发展的时间模式",
          "• <strong>数据维度：</strong>支持查看每日新增感染、死亡、康复三种核心疫情指标的时间变化",
          "• <strong>曲线设计：</strong>每条曲线代表一个地区的时间序列数据，线条粗细区分全国总计与省级数据"
        ]
      },
      {
        title: "时间分析功能：",
        items: [
          "• <strong>趋势识别：</strong>通过曲线斜率和走向识别疫情的增长、平稳、下降等发展阶段",
          "• <strong>周期性分析：</strong>发现数据中的周期性波动模式和季节性特征",
          "• <strong>拐点检测：</strong>识别疫情发展过程中的关键时间节点和转折点",
          "• <strong>多地区同步分析：</strong>同时展示多个地区数据，便于识别地区间的时间关联性"
        ]
      },
      {
        title: "交互分析功能：",
        items: [
          "• <strong>省份筛选：</strong>灵活选择要分析的省份组合，支持最多10个地区的同时展示",
          "• <strong>快速选择：</strong>提供重点省份、经济发达地区、疫情严重地区等预设组合",
          "• <strong>数据类型切换：</strong>在感染、死亡、康复数据间快速切换，观察不同指标的时间模式",
          "• <strong>动态图例：</strong>智能显示图例信息，避免界面拥挤，支持颜色编码识别"
        ]
      },
      {
        title: "可视分析应用：",
        items: [
          "• <strong>疫情阶段划分：</strong>通过时间序列特征识别疫情爆发期、高峰期、缓解期等不同阶段",
          "• <strong>政策效果评估：</strong>分析防控政策实施前后的数据变化，评估政策干预效果",
          "• <strong>地区差异分析：</strong>比较不同地区疫情发展的时间差异和同步性特征",
          "• <strong>预测建模支持：</strong>为时间序列预测模型提供可视化的数据探索支持",
          "• <strong>异常事件识别：</strong>通过时间序列异常波动识别特殊疫情事件或数据异常",
          "• <strong>传播模式分析：</strong>分析疫情在不同地区的传播时间模式和扩散规律"
        ]
      },
      {
        title: "应用场景：",
        items: [
          "• <strong>疫情监测：</strong>实时监测各地区疫情发展趋势，及时发现异常变化",
          "• <strong>政策制定：</strong>基于时间趋势分析制定阶段性防控策略和政策调整",
          "• <strong>资源规划：</strong>根据疫情发展趋势预测资源需求，提前进行资源配置",
          "• <strong>经验总结：</strong>分析成功防控地区的时间模式，总结推广防控经验",
          "• <strong>预警系统：</strong>建立基于时间序列特征的疫情预警和早期识别系统"
        ]
      }
    ],
    usageTip: {
      content: "<strong>使用建议：</strong>建议选择3-8个具有代表性的地区进行时间序列对比。关注曲线的斜率变化、峰值时间和下降趋势，这些特征能够揭示疫情发展的时间规律和地区差异。",
      bgColor: "bg-green-50",      borderColor: "border-green-400",
      textColor: "text-green-800"
    }
  },

  // 饼图说明
  pieChart: {
    title: "图表说明：",
    sections: [
      {
        title: "基础可视化功能：",
        items: [
          "• <strong>饼图用途：</strong>展示COVID-19疫情数据的占比关系，直观显示各部分在整体中的相对大小",
          "• <strong>数据维度：</strong>支持切换查看累计感染、死亡、康复三种疫情指标的占比分析",
          "• <strong>扇形设计：</strong>每个扇形代表一个地区或数据类别，扇形角度大小反映数据占比"
        ]
      },
      {
        title: "占比分析功能：",
        items: [
          "• <strong>Top-N分析：</strong>显示疫情数据最高的前10个省份，突出重点地区的占比情况",
          "• <strong>区域对比：</strong>按全国累计数据分析感染、死亡、康复三类数据的整体占比关系",
          "• <strong>自定义选择：</strong>支持自选省份进行定制化的占比分析和对比",
          "• <strong>百分比计算：</strong>自动计算各部分在总体中的精确百分比和数值"
        ]
      },
      {
        title: "交互分析功能：",
        items: [
          "• <strong>显示模式切换：</strong>支持Top10省份、区域对比、自选省份三种显示模式",
          "• <strong>悬停详情：</strong>鼠标悬停显示扇形的具体数值、百分比和标签信息",
          "• <strong>省份筛选：</strong>灵活选择要分析的省份组合，支持地区快速选择按钮",
          "• <strong>动态更新：</strong>切换数据类型或显示模式时图表实时重新渲染"
        ]
      },
      {
        title: "可视分析应用：",
        items: [
          "• <strong>贡献度分析：</strong>识别各地区在全国疫情数据中的贡献度和重要性排序",
          "• <strong>资源配置评估：</strong>根据各地区占比情况评估资源配置的合理性",
          "• <strong>重点地区识别：</strong>快速识别疫情最严重的重点关注地区",
          "• <strong>结构化分析：</strong>分析疫情数据的地区分布结构和集中程度",
          "• <strong>比例关系评估：</strong>评估不同类型疫情数据间的比例关系",
          "• <strong>政策优先级确定：</strong>为差异化政策制定提供优先级排序依据"
        ]
      },
      {
        title: "应用场景：",
        items: [
          "• <strong>疫情总结：</strong>制作疫情数据总结报告，展示各地区疫情占比情况",
          "• <strong>资源分配：</strong>基于占比分析进行医疗资源和防控力量的合理分配",
          "• <strong>重点监控：</strong>确定需要重点监控和支援的高占比疫情地区",
          "• <strong>政策制定：</strong>为区域性防控政策制定提供数据占比支撑",
          "• <strong>成效评估：</strong>评估各地区防控成效在全国范围内的相对表现"
        ]
      }
    ],
    usageTip: {
      content: "<strong>使用建议：</strong>使用Top10模式快速识别重点地区，使用区域对比模式了解全国整体情况，使用自选模式进行定制化分析。注意饼图适合展示占比关系，不适合精确数值比较。",
      bgColor: "bg-purple-50",      borderColor: "border-purple-400",
      textColor: "text-purple-800"
    }
  },

  // 散点图说明
  scatterPlot: {
    title: "图表说明：",
    sections: [
      {
        title: "基础可视化功能：",
        items: [
          "• <strong>散点图用途：</strong>分析COVID-19疫情数据间的相关关系，揭示感染数与死亡数的关联模式",
          "• <strong>坐标系统：</strong>X轴表示累计感染数，Y轴表示累计死亡数，构建二维数据关系图",
          "• <strong>点的属性：</strong>点的大小表示疫情严重程度，颜色区分不同省份，位置反映数据关系"
        ]
      },
      {
        title: "相关分析功能：",
        items: [
          "• <strong>线性回归分析：</strong>显示红色趋势线和相关系数，量化两个变量间的线性关系强度",
          "• <strong>聚类模式识别：</strong>通过点的分布模式识别不同类型的疫情发展特征群组",
          "• <strong>异常值检测：</strong>识别偏离主要趋势线的异常数据点，发现特殊疫情情况",
          "• <strong>严重程度评估：</strong>通过点的大小（感染数+死亡数×10）直观评估各地区疫情严重程度"
        ]
      },
      {
        title: "交互分析功能：",
        items: [
          "• <strong>省份筛选：</strong>灵活选择要分析的省份，支持地区组合快速选择",
          "• <strong>悬停详情：</strong>鼠标悬停显示详细的疫情数据，包括感染、死亡、康复、病死率等",
          "• <strong>点击选择：</strong>单击数据点进行选择/取消选择，支持多选分析",
          "• <strong>框选功能：</strong>拖拽鼠标框选多个省份，进行群组化分析和对比"
        ]
      },
      {
        title: "可视分析应用：",
        items: [
          "• <strong>相关性评估：</strong>评估感染数与死亡数的相关强度，理解疫情严重程度关联性",
          "• <strong>风险分类：</strong>根据数据点在坐标系中的位置对地区进行风险等级分类",
          "• <strong>模式发现：</strong>识别数据中的聚类模式，发现具有相似特征的地区群组",
          "• <strong>异常分析：</strong>识别偏离正常模式的地区，分析其特殊情况和原因",
          "• <strong>趋势预测：</strong>基于回归线预测不同感染水平对应的死亡风险",
          "• <strong>效果评估：</strong>通过偏离趋势线的程度评估各地区防控措施的相对效果"
        ]
      },
      {
        title: "应用场景：",
        items: [
          "• <strong>风险评估：</strong>基于感染-死亡关系评估各地区的疫情风险水平",
          "• <strong>政策制定：</strong>根据相关分析结果制定差异化的防控和救治策略",
          "• <strong>资源配置：</strong>基于严重程度评估合理分配医疗资源和救治力量",
          "• <strong>效果评价：</strong>评估不同地区防控措施的相对效果和成功经验",
          "• <strong>预警系统：</strong>建立基于相关关系的疫情发展预警和风险评估模型"
        ]
      }
    ],
    usageTip: {
      content: "<strong>分析提示：</strong>关注数据点的分布模式和趋势线拟合程度。相关系数接近1表示强正相关，偏离趋势线较远的点代表特殊情况，聚集成群的点揭示相似的疫情特征。",
      bgColor: "bg-red-50",      borderColor: "border-red-400",
      textColor: "text-red-800"
    }
  },
  // 日历热力图说明
  calendarHeatmap: {
    title: "图表说明：",
    sections: [
      {
        title: "基础可视化功能：",
        items: [
          "• <strong>日历热力图用途：</strong>以日历形式展示COVID-19疫情数据的时间分布，直观显示每日疫情强度变化",
          "• <strong>时间维度展示：</strong>按年、月、日的层次结构展示数据，便于识别时间模式和周期性特征",
          "• <strong>颜色编码：</strong>使用颜色深浅表示每日数据强度，颜色越深表示当日疫情数据越高"
        ]
      },
      {
        title: "时间模式分析功能：",
        items: [
          "• <strong>季节性识别：</strong>识别疫情数据的季节性变化模式和周期性特征",
          "• <strong>峰值时段分析：</strong>快速识别疫情高峰期、低谷期和关键时间节点",
          "• <strong>趋势观察：</strong>通过颜色梯度变化观察疫情发展的长期趋势",
          "• <strong>异常日期识别：</strong>识别疫情数据异常高或异常低的特殊日期"
        ]
      },
      {
        title: "交互分析功能：",
        items: [
          "• <strong>日期悬停：</strong>鼠标悬停显示具体日期和当日疫情数据详情",
          "• <strong>时间范围选择：</strong>支持选择特定时间范围进行深入分析",
          "• <strong>缩放导航：</strong>支持年月级别的缩放和导航，便于查看不同时间粒度",
          "• <strong>图例引导：</strong>提供颜色图例说明，便于理解数据强度对应关系"
        ]
      },
      {
        title: "可视分析应用：",
        items: [
          "• <strong>时间模式发现：</strong>发现疫情数据在时间维度上的规律性和周期性模式",
          "• <strong>关键事件识别：</strong>识别对疫情发展产生重大影响的关键时间节点",
          "• <strong>政策效果评估：</strong>评估防控政策实施前后的疫情数据变化效果",
          "• <strong>预测支持：</strong>为时间序列预测提供可视化的历史模式参考",
          "• <strong>节假日影响分析：</strong>分析节假日、特殊事件对疫情数据的影响",
          "• <strong>周期性验证：</strong>验证疫情数据是否存在周、月等周期性变化规律"
        ]
      },
      {
        title: "应用场景：",
        items: [
          "• <strong>疫情回顾：</strong>回顾疫情发展的完整时间轨迹，总结历史经验教训",
          "• <strong>政策评估：</strong>评估不同时期防控政策的实施效果和时间影响",
          "• <strong>预警系统：</strong>基于历史时间模式建立疫情预警和早期识别系统",
          "• <strong>资源规划：</strong>根据时间模式规律制定资源配置的时间计划",
          "• <strong>公众教育：</strong>向公众展示疫情发展的时间规律，增强防控意识"
        ]
      }
    ],
    usageTip: {
      content: "<strong>使用建议：</strong>关注颜色深浅的时间聚集模式，深色日期代表疫情高峰日。注意观察相邻日期的颜色变化趋势，这能够揭示疫情发展的时间规律和转折点。",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-400",
      textColor: "text-yellow-800"
    }
  },

  // 平行坐标图说明
  parallelCoordinatesChart: {
    title: "图表说明：",
    sections: [
      {
        title: "基础可视化功能：",
        items: [
          "• <strong>平行坐标图用途：</strong>展示COVID-19疫情的多维数据关系，揭示各指标间的关联模式",
          "• <strong>多维展示：</strong>同时展示6个维度数据：最终累计感染、死亡、康复及其对应的峰值数据",
          "• <strong>线条设计：</strong>每条线代表一个省份，线条走向反映该省份在各维度上的表现特征"
        ]
      },
      {
        title: "多维分析功能：",
        items: [
          "• <strong>模式识别：</strong>通过线条走向识别不同省份的疫情发展模式和特征",
          "• <strong>维度关联分析：</strong>分析各个疫情指标之间的相关性和依赖关系",
          "• <strong>聚类发现：</strong>识别具有相似多维特征的省份群组和类别",
          "• <strong>异常检测：</strong>发现在某些维度上表现异常的省份和数据点"
        ]
      },
      {
        title: "交互分析功能：",
        items: [
          "• <strong>省份筛选：</strong>灵活选择要分析的省份，支持多省份同时对比",
          "• <strong>线条高亮：</strong>鼠标悬停高亮显示特定省份的完整数据轨迹",
          "• <strong>背景对比：</strong>未选中省份以灰色背景线显示，便于对比分析",
          "• <strong>详情展示：</strong>悬停显示具体数值，便于精确数据查看"
        ]
      },
      {
        title: "可视分析应用：",
        items: [
          "• <strong>综合评估：</strong>基于多个维度综合评估各省份的疫情发展水平",
          "• <strong>类型分类：</strong>根据多维特征将省份分为不同的疫情发展类型",
          "• <strong>平衡性分析：</strong>分析各省份在不同疫情指标上的平衡程度",
          "• <strong>发展轨迹对比：</strong>对比不同省份的疫情发展轨迹和演变模式",
          "• <strong>指标权重评估：</strong>评估不同疫情指标的重要性和影响程度",
          "• <strong>决策支持：</strong>为多维度决策提供可视化的数据支撑"
        ]
      },
      {
        title: "应用场景：",
        items: [
          "• <strong>综合排名：</strong>基于多维指标对各省份进行综合排名和评估",
          "• <strong>政策制定：</strong>根据多维特征制定差异化的防控政策和措施",
          "• <strong>经验总结：</strong>识别表现优异省份的多维特征，总结成功经验",
          "• <strong>资源配置：</strong>基于多维评估结果进行资源的优先级配置",
          "• <strong>监测预警：</strong>建立基于多维指标的疫情监测和预警体系"
        ]
      }
    ],
    usageTip: {
      content: "<strong>使用建议：</strong>关注线条的整体走向和交叉模式。平行的线条表示相似特征，交叉较多的区域表示数据差异较大。选择3-8个代表性省份进行对比分析效果最佳。",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-400",
      textColor: "text-indigo-800"
    }  },

  // 雷达图说明
  radarChart: {
    title: "图表说明：",
    sections: [
      {
        title: "基础可视化功能：",
        items: [
          "• <strong>雷达图用途：</strong>多维度综合展示COVID-19疫情的各项指标，形成综合评估视图",
          "• <strong>多指标对比：</strong>同时展示感染、死亡、康复等多个维度的数据关系",
          "• <strong>轮廓分析：</strong>通过多边形轮廓直观比较不同地区的综合疫情特征"
        ]
      },
      {
        title: "综合分析功能：",
        items: [
          "• <strong>多维评估：</strong>综合评估各地区在多个疫情指标上的表现",
          "• <strong>平衡性分析：</strong>分析各地区疫情数据在不同维度上的平衡程度",
          "• <strong>强弱项识别：</strong>识别各地区在不同疫情指标上的优势和薄弱环节",
          "• <strong>综合排名：</strong>基于多维指标进行综合评估和排名比较"
        ]
      }
    ],
    usageTip: {
      content: "<strong>使用建议：</strong>建议选择3-6个具有代表性的省份进行雷达图对比。关注多边形的面积大小和形状特征，面积大小反映综合实力，形状反映各维度的平衡性。避免选择过多省份，以免图形重叠影响可读性。",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-400",
      textColor: "text-purple-800"
    }
  }
};
