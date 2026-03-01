<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'
import Card from '@/components/Card.vue'

interface SectorAllocation {
  industryName: string
  ratio: number
  date: string
  marketValue: number
}

interface Props {
  sectorAllocations: SectorAllocation[]
}

const props = defineProps<Props>()
const chartRef = ref<HTMLDivElement>()
let chartInstance: echarts.ECharts | null = null

const formatNumber = (num: number): string => {
  return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const initChart = () => {
  if (!chartRef.value) return
  
  chartInstance = echarts.init(chartRef.value)
  
  const data = props.sectorAllocations
    .filter(sector => sector.ratio > 0)
    .map(sector => ({
      name: sector.industryName,
      value: sector.ratio,
      marketValue: sector.marketValue,
    }))
  
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const data = params.data
        let tooltip = `${params.name}<br/>占净值比例: ${data.value.toFixed(2)}% (${params.percent}%)`
        if (data.marketValue > 0) {
          tooltip += `<br/>市值: ${formatNumber(data.marketValue)}`
        }
        return tooltip
      },
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: '{b}\n{d}%',
          fontSize: 12,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
          },
        },
        data,
      },
    ],
    color: [
      '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
      '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc', '#5ab1ef',
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

watch(() => props.sectorAllocations, () => {
  initChart()
}, { deep: true })
</script>

<template>
  <Card title="行业分布">
    <div ref="chartRef" class="chart"></div>
  </Card>
</template>

<style lang="scss" scoped>
.chart {
  width: 100%;
  height: 400px;
}
</style>
