<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import Card from '@/components/Card.vue'
import { get } from '@/packages/request'

interface Props {
  fundCode: string
}

const props = defineProps<Props>()
const chartRef = ref<HTMLDivElement>()
let chartInstance: echarts.ECharts | null = null

type NetDiagramResponse = {
  DWJZ: string        // 单位净值，如 "1.4096"
  FHFCBZ: string      // 分红发放标志，如 ""
  FHFCZ: string       // 分红发放值，如 ""
  FSRQ: string        // 净值日期，如 "2025-02-27"
  JZZZL: string       // 净值涨跌幅，如 "0.05"
  LJJZ: string        // 累计净值，如 "1.5796"
  NAVTYPE: string     // 净值类型，如 "1"
  RATE: string        // 比例，默认 "--"
  Remarks: string     // 备注，默认 ""
}[]

const selectedRange = ref('n') // 默认近1年
const loading = ref(false)

const rangeOptions = [
  { label: '近1月', value: 'y' },
  { label: '近3月', value: '3y' },
  { label: '近6月', value: '6y' },
  { label: '近1年', value: 'n' },
  { label: '近3年', value: '3n' },
  { label: '近5年', value: '5n' },
]

const fetchData = async () => {
  if (!props.fundCode) return
  
  loading.value = true
  
  try {
    const res = await get<NetDiagramResponse>(`/funds/${props.fundCode}/net-diagram?range=${selectedRange.value}`)
    const data = res.data
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.error('无净值数据')
      return
    }
    
    // 解析数据
    const dates: string[] = []
    const netValues: number[] = []
    const accumulatedValues: number[] = []
    
    data.forEach((item) => {
      dates.push(item.FSRQ) // 净值日期
      netValues.push(parseFloat(item.DWJZ) || 0) // 单位净值
      accumulatedValues.push(parseFloat(item.LJJZ) || 0) // 累计净值
    })
    
    // 计算相对第一个数据的百分比涨跌幅
    const baseNetValue = netValues[0] || 1
    const baseAccumulatedValue = accumulatedValues[0] || 1
    
    const netValuePercentages = netValues.map(value => 
      ((value - baseNetValue) / baseNetValue * 100)
    )
    
    const accumulatedValuePercentages = accumulatedValues.map(value => 
      ((value - baseAccumulatedValue) / baseAccumulatedValue * 100)
    )
    
    // 先关闭 loading,让 DOM 渲染
    loading.value = false
    
    // 等待 DOM 更新后再初始化图表
    await nextTick()
    initChart(dates, netValuePercentages, accumulatedValuePercentages)
  } catch (error) {
    console.error('获取净值数据失败:', error)
    loading.value = false
  }
}

const initChart = (dates: string[], netValues: number[], accumulatedValues: number[]) => {
  if (!chartRef.value) {
    console.error('chartRef is null, DOM not ready')
    return
  }
  
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }
  
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
      },
      formatter: (params: any) => {
        if (!Array.isArray(params) || params.length === 0) return ''
        const date = params[0].axisValue
        let tooltip = `${date}<br/>`
        params.forEach((param: any) => {
          const sign = param.value >= 0 ? '+' : ''
          tooltip += `${param.marker}${param.seriesName}: ${sign}${param.value.toFixed(2)}%<br/>`
        })
        return tooltip
      },
    },
    legend: {
      data: ['单位净值涨跌幅', '累计净值涨跌幅'],
      top: 10,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: dates,
      boundaryGap: false,
      axisTick: {
        show: false, // 隐藏刻度线
      },
      axisLabel: {
        rotate: 0, // 横向显示,不旋转
        interval: 0,
        formatter: (value: string, index: number) => {
          const total = dates.length
          
          // 只显示3个标签: 开始、中间、结束
          if (index === 0 || index === Math.floor(total / 2) || index === total - 1) {
            return value
          }
          
          return ''
        },
      },
    },
    yAxis: {
      type: 'value',
      scale: true,
      axisLabel: {
        formatter: (value: number) => {
          const sign = value >= 0 ? '+' : ''
          return `${sign}${value.toFixed(1)}%`
        },
      },
    },
    series: [
      {
        name: '单位净值涨跌幅',
        type: 'line',
        data: netValues,
        smooth: true,
        symbol: 'none',
        lineStyle: {
          width: 2,
          color: '#5470c6',
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(84, 112, 198, 0.3)' },
            { offset: 1, color: 'rgba(84, 112, 198, 0.05)' },
          ]),
        },
      },
      {
        name: '累计净值涨跌幅',
        type: 'line',
        data: accumulatedValues,
        smooth: true,
        symbol: 'none',
        lineStyle: {
          width: 2,
          color: '#91cc75',
        },
      },
    ],
  }
  
  chartInstance.setOption(option)
}

const resizeChart = () => {
  chartInstance?.resize()
}

const handleRangeChange = (range: string) => {
  selectedRange.value = range
  // 清除旧的图表实例
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
  fetchData()
}

onMounted(() => {
  fetchData()
  window.addEventListener('resize', resizeChart)
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
  window.removeEventListener('resize', resizeChart)
})

watch(() => props.fundCode, () => {
  // 基金代码变化时,清除旧图表
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
  fetchData()
})
</script>

<template>
  <Card title="净值走势">
    <div class="net-diagram">
      <div class="range-selector">
        <button
          v-for="option in rangeOptions"
          :key="option.value"
          :class="['range-btn', { active: selectedRange === option.value }]"
          @click="handleRangeChange(option.value)"
        >
          {{ option.label }}
        </button>
      </div>
      
      <div v-if="loading" class="loading">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>
      
      <div v-else ref="chartRef" class="chart"></div>
    </div>
  </Card>
</template>

<style lang="scss" scoped>
.net-diagram {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.range-selector {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.range-btn {
  padding: 6px 16px;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    color: var(--color-primary);
    border-color: var(--color-primary);
  }
  
  &.active {
    color: #fff;
    background: var(--color-primary);
    border-color: var(--color-primary);
  }
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: var(--color-text-secondary);
  
  &-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--color-border);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  
  p {
    margin-top: 12px;
    font-size: 0.875rem;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.chart {
  width: 100%;
  height: 400px;
}
</style>
