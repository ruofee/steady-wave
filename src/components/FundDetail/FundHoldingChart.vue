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

interface BondHolding {
  bondCode: string
  bondName: string
  holdRatio: number
  holdValue: number
  updateDate: string
}

interface AssetAllocation {
  stocks: number
  bonds: number
  cash: number
  other: number
  updateDate: string
}

interface Props {
  stockHoldings: StockHolding[]
  bondHoldings: BondHolding[]
  assetAllocation: AssetAllocation
}

const props = defineProps<Props>()

const chartRef = ref<HTMLDivElement>()
let chartInstance: echarts.ECharts | null = null

const initChart = () => {
  if (!chartRef.value) return
  
  if (chartInstance) {
    chartInstance.dispose()
  }
  
  chartInstance = echarts.init(chartRef.value)
  
  // 准备树图数据 - 完整的资产配置结构
  const children: any[] = []
  
  // 股票资产
  if (props.assetAllocation.stocks > 0) {
    const stockChildren = props.stockHoldings.map(holding => ({
      name: holding.stockName,
      value: holding.holdRatio,
      stockCode: holding.stockCode,
      holdShares: holding.holdShares,
      holdValue: holding.holdValue,
      type: 'stock',
    }))
    
    // 其他未列出的股票
    const listedStockRatio = props.stockHoldings.reduce((sum, h) => sum + h.holdRatio, 0)
    const otherStockRatio = props.assetAllocation.stocks - listedStockRatio
    
    if (otherStockRatio > 0.01) {
      stockChildren.push({
        name: '其他股票',
        value: otherStockRatio,
        type: 'stock-other',
      })
    }
    
    if (stockChildren.length > 0) {
      children.push({
        name: `股票 ${props.assetAllocation.stocks.toFixed(2)}%`,
        value: props.assetAllocation.stocks,
        children: stockChildren,
        itemStyle: {
          color: '#5470c6',
        },
      })
    }
  }
  
  // 债券资产
  if (props.assetAllocation.bonds > 0) {
    const bondChildren = props.bondHoldings.map(holding => ({
      name: holding.bondName,
      value: holding.holdRatio,
      bondCode: holding.bondCode,
      holdValue: holding.holdValue,
      type: 'bond',
    }))
    
    // 其他未列出的债券
    const listedBondRatio = props.bondHoldings.reduce((sum, h) => sum + h.holdRatio, 0)
    const otherBondRatio = props.assetAllocation.bonds - listedBondRatio
    
    if (otherBondRatio > 0.01) {
      bondChildren.push({
        name: '其他债券',
        value: otherBondRatio,
        type: 'bond-other',
      })
    }
    
    if (bondChildren.length > 0) {
      children.push({
        name: `债券 ${props.assetAllocation.bonds.toFixed(2)}%`,
        value: props.assetAllocation.bonds,
        children: bondChildren,
        itemStyle: {
          color: '#91cc75',
        },
      })
    }
  }
  
  // 现金资产
  if (props.assetAllocation.cash > 0) {
    children.push({
      name: `现金 ${props.assetAllocation.cash.toFixed(2)}%`,
      value: props.assetAllocation.cash,
      type: 'cash',
      itemStyle: {
        color: '#fac858',
      },
    })
  }
  
  // 其他资产
  if (props.assetAllocation.other > 0) {
    children.push({
      name: `其他 ${props.assetAllocation.other.toFixed(2)}%`,
      value: props.assetAllocation.other,
      type: 'other',
      itemStyle: {
        color: '#ee6666',
      },
    })
  }
  
  const treeData = {
    name: '资产配置',
    children,
  }
  
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const data = params.data
        if (data.type === 'stock') {
          return `
            <div style="padding: 4px 0;">
              <div style="font-weight: 600; margin-bottom: 6px;">${data.name} (${data.stockCode})</div>
              <div style="color: #666;">占净值比例: <span style="font-weight: 600;">${data.value.toFixed(2)}%</span></div>
              <div style="color: #666;">持股数: <span style="font-weight: 600;">${data.holdShares.toFixed(2)}万股</span></div>
              <div style="color: #666;">持仓市值: <span style="font-weight: 600;">${data.holdValue.toFixed(2)}万元</span></div>
            </div>
          `
        } else if (data.type === 'bond') {
          return `
            <div style="padding: 4px 0;">
              <div style="font-weight: 600; margin-bottom: 6px;">${data.name} (${data.bondCode})</div>
              <div style="color: #666;">占净值比例: <span style="font-weight: 600;">${data.value.toFixed(2)}%</span></div>
              <div style="color: #666;">持仓市值: <span style="font-weight: 600;">${data.holdValue.toFixed(2)}万元</span></div>
            </div>
          `
        } else if (data.value !== undefined) {
          return `
            <div style="padding: 4px 0;">
              <div style="font-weight: 600; margin-bottom: 6px;">${data.name}</div>
              <div style="color: #666;">占比: <span style="font-weight: 600;">${data.value.toFixed(2)}%</span></div>
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
            if (params.data.value !== undefined && params.data.name) {
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
          {
            colorSaturation: [0.3, 0.6],
            itemStyle: {
              borderWidth: 0,
              gapWidth: 1,
              borderColor: 'transparent',
            },
            label: {
              position: 'inside',
              verticalAlign: 'middle',
              align: 'center',
              fontSize: 12,
            },
          },
        ],
        visualMin: 0,
        visualMax: 100,
        colorAlpha: [0.6, 1],
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

watch(() => [props.stockHoldings, props.bondHoldings, props.assetAllocation], () => {
  initChart()
}, { deep: true })
</script>

<template>
  <div class="fund-holding-chart">
    <div class="chart-header">
      <h3 class="chart-title">资产配置分布</h3>
      <p class="chart-desc">股票、债券、现金及其他资产</p>
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
