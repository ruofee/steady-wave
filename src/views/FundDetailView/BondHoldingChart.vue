<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'
import Card from '@/components/Card.vue'

interface BondHolding {
  bondCode: string
  bondName: string
  holdRatio: number
  holdValue: number
  updateDate: string
}

interface Props {
  bondHoldings: BondHolding[]
}

const props = defineProps<Props>()
const chartRef = ref<HTMLDivElement>()
let chartInstance: echarts.ECharts | null = null

const initChart = () => {
  if (!chartRef.value) return
  
  chartInstance = echarts.init(chartRef.value)
  
  const data = props.bondHoldings.map(bond => ({
    name: `${bond.bondName}\n(${bond.bondCode})`,
    value: bond.holdRatio,
    bondCode: bond.bondCode,
    bondName: bond.bondName,
    holdValue: bond.holdValue,
  }))
  
  const option: echarts.EChartsOption = {
    tooltip: {
      formatter: (params: any) => {
        const data = params.data
        let tooltip = `${data.bondName} (${data.bondCode})<br/>
                       占净值比例: ${data.value.toFixed(2)}%`
        if (data.holdValue > 0) {
          tooltip += `<br/>持仓市值: ${data.holdValue.toFixed(2)}万元`
        }
        return tooltip
      },
    },
    series: [
      {
        type: 'treemap',
        width: '100%',
        height: '100%',
        roam: false,
        nodeClick: false,
        breadcrumb: {
          show: false,
        },
        label: {
          show: true,
          formatter: (params: any) => {
            const lines = params.name.split('\n')
            return `{name|${lines[0]}}\n{code|${lines[1]}}\n{ratio|${params.value.toFixed(2)}%}`
          },
          rich: {
            name: {
              fontSize: 14,
              fontWeight: 'bold',
              lineHeight: 20,
            },
            code: {
              fontSize: 12,
              color: '#999',
              lineHeight: 18,
            },
            ratio: {
              fontSize: 14,
              fontWeight: 'bold',
              color: '#333',
              lineHeight: 20,
            },
          },
        },
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 2,
          gapWidth: 2,
        },
        levels: [
          {
            itemStyle: {
              borderWidth: 0,
              gapWidth: 5,
            },
          },
          {
            itemStyle: {
              gapWidth: 1,
            },
          },
        ],
        data,
      },
    ],
    color: ['#91cc75', '#73c0de', '#3ba272', '#5470c6', '#fac858'],
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

watch(() => props.bondHoldings, () => {
  initChart()
}, { deep: true })
</script>

<template>
  <Card title="重仓债券">
    <div ref="chartRef" class="chart"></div>
  </Card>
</template>

<style lang="scss" scoped>
.chart {
  width: 100%;
  height: 500px;
}
</style>
