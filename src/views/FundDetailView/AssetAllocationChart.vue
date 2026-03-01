<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'
import Card from '@/components/Card.vue'

interface AssetAllocation {
  stocks: number
  bonds: number
  cash: number
  other: number
  updateDate: string
}

interface Props {
  assetAllocation: AssetAllocation
}

const props = defineProps<Props>()
const chartRef = ref<HTMLDivElement>()
let chartInstance: echarts.ECharts | null = null

const initChart = () => {
  if (!chartRef.value) return
  
  chartInstance = echarts.init(chartRef.value)
  
  const data = [
    { name: '股票', value: props.assetAllocation.stocks },
    { name: '债券', value: props.assetAllocation.bonds },
    { name: '现金', value: props.assetAllocation.cash },
    { name: '其他', value: props.assetAllocation.other },
  ].filter(item => item.value > 0)
  
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}% ({d}%)',
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
          formatter: '{b}\n{c}%',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold',
          },
        },
        data,
      },
    ],
    color: ['#5470c6', '#91cc75', '#fac858', '#ee6666'],
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

watch(() => props.assetAllocation, () => {
  initChart()
}, { deep: true })
</script>

<template>
  <Card title="资产配置分布">
    <div ref="chartRef" class="chart"></div>
  </Card>
</template>

<style lang="scss" scoped>
.chart {
  width: 100%;
  height: 400px;
}
</style>
