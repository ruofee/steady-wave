<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue'
import * as echarts from 'echarts'

interface StockHolding {
  stockCode: string
  stockName: string
  holdRatio: number
  holdShares: number
  holdValue: number
  updateDate: string
}

interface Props {
  holdings: StockHolding[]
}

const props = defineProps<Props>()

const chartRef = ref<HTMLDivElement>()
let chartInstance: echarts.ECharts | null = null

const initChart = () => {
  if (!chartRef.value || !props.holdings.length) return
  
  if (chartInstance) {
    chartInstance.dispose()
  }
  
  chartInstance = echarts.init(chartRef.value)
  
  // 准备树图数据
  const treeData = {
    name: '持仓占比',
    children: props.holdings.map(holding => ({
      name: holding.stockName,
      value: holding.holdRatio,
      stockCode: holding.stockCode,
      holdShares: holding.holdShares,
      holdValue: holding.holdValue,
    }))
  }
  
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        if (params.data.stockCode) {
          return `
            <div style="padding: 4px 0;">
              <div style="font-weight: 600; margin-bottom: 6px;">${params.data.name} (${params.data.stockCode})</div>
              <div style="color: #666;">占净值比例: <span style="font-weight: 600;">${params.data.value.toFixed(2)}%</span></div>
              <div style="color: #666;">持股数: <span style="font-weight: 600;">${params.data.holdShares.toFixed(2)}万股</span></div>
              <div style="color: #666;">持仓市值: <span style="font-weight: 600;">${params.data.holdValue.toFixed(2)}万元</span></div>
            </div>
          `
        }
        return ''
      },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e0e0e0',
      borderWidth: 1,
      textStyle: {
        color: '#333',
      },
      padding: 12,
    },
    series: [
      {
        type: 'treemap',
        data: [treeData],
        roam: false,
        nodeClick: false,
        breadcrumb: {
          show: false,
        },
        label: {
          show: true,
          formatter: (params: any) => {
            if (params.data.stockCode) {
              return `{name|${params.data.name}}\n{ratio|${params.data.value.toFixed(2)}%}`
            }
            return ''
          },
          position: 'inside',
          verticalAlign: 'middle',
          align: 'center',
          rich: {
            name: {
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              lineHeight: 22,
            },
            ratio: {
              fontSize: 16,
              fontWeight: 700,
              color: '#fff',
              lineHeight: 24,
            },
          },
        },
        upperLabel: {
          show: false,
        },
        itemStyle: {
          borderColor: 'transparent',
          borderWidth: 0,
          gapWidth: 2,
        },
        levels: [
          {
            itemStyle: {
              borderColor: 'transparent',
              borderWidth: 0,
              gapWidth: 1,
            },
            label: {
              position: 'inside',
              verticalAlign: 'middle',
              align: 'center',
            },
          },
          {
            colorSaturation: [0.5, 0.8],
            itemStyle: {
              borderWidth: 0,
              gapWidth: 2,
              borderColor: 'transparent',
            },
            label: {
              position: 'inside',
              verticalAlign: 'middle',
              align: 'center',
            },
          },
        ],
        visualMin: 0,
        visualMax: Math.max(...props.holdings.map(h => h.holdRatio)),
        colorAlpha: [0.6, 1],
        color: [
          '#5470c6',
          '#91cc75',
          '#fac858',
          '#ee6666',
          '#73c0de',
          '#3ba272',
          '#fc8452',
          '#9a60b4',
          '#ea7ccc',
          '#5e9cd3',
        ],
      },
    ],
  }
  
  chartInstance.setOption(option)
}

const handleResize = () => {
  chartInstance?.resize()
}

onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})

watch(() => props.holdings, () => {
  initChart()
}, { deep: true })
</script>

<template>
  <div class="fund-holding-chart">
    <div class="chart-header">
      <h3 class="chart-title">持仓比例分布</h3>
      <p class="chart-desc">前十大重仓股</p>
    </div>
    <div ref="chartRef" class="chart-container"></div>
  </div>
</template>

<style lang="scss" scoped>
.fund-holding-chart {
  background: var(--color-bg-white);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.chart-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border);
}

.chart-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.chart-desc {
  margin: 4px 0 0;
  font-size: 0.875rem;
  color: var(--color-text-tertiary);
}

.chart-container {
  width: 100%;
  height: 500px;
  padding: 20px;
  
  @media (max-width: 768px) {
    height: 400px;
  }
}
</style>
