<script setup lang="ts">
import { onMounted, ref, onUnmounted } from 'vue'
import Card from '@/components/Card.vue'
import * as echarts from 'echarts'
import type { EChartsType } from 'echarts'

interface AssetAllocation {
  name: string
  value: number
  color: string
}

const chartRef = ref<HTMLDivElement>()
let chartInstance: EChartsType | null = null

const assetData: AssetAllocation[] = [
  { name: '股票型基金', value: 45680.50, color: '#3b82f6' },
  { name: '债券型基金', value: 28960.00, color: '#8b5cf6' },
  { name: '混合型基金', value: 32450.80, color: '#ec4899' },
  { name: '货币型基金', value: 18820.00, color: '#10b981' },
]

const initChart = () => {
  if (!chartRef.value) return

  chartInstance = echarts.init(chartRef.value)

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const percentage = params.percent.toFixed(2)
        const value = params.value.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
        return `${params.name}<br/>¥${value} (${percentage}%)`
      },
    },
    series: [
      {
        name: '资产配置',
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}',
          fontSize: 13,
          color: '#475569',
        },
        labelLine: {
          show: true,
          length: 15,
          length2: 10,
          smooth: false,
          lineStyle: {
            color: '#cbd5e1',
            width: 1,
          },
        },
        emphasis: {
          label: {
            show: false,
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.2)',
          },
        },
        data: assetData.map(item => ({
          name: item.name,
          value: item.value,
          itemStyle: {
            color: item.color,
          },
        })),
      },
    ],
  }

  chartInstance.setOption(option)
}

const resizeChart = () => {
  chartInstance?.resize()
}

onMounted(() => {
  initChart()
  window.addEventListener('resize', resizeChart)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeChart)
  chartInstance?.dispose()
})
</script>

<template>
  <Card>
    <div class="asset-allocation">
      <h2 class="asset-allocation-title">资产配置</h2>
      <div ref="chartRef" class="asset-allocation-chart"></div>
    </div>
  </Card>
</template>

<style lang="scss" scoped>
.asset-allocation {
  &-title {
    margin: 0 0 24px;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  &-chart {
    width: 100%;
    height: 320px;
  }
}
</style>
