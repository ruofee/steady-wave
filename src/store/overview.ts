import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Overview {
  totalValue: number
  totalCost: number
  totalProfit: number
  totalProfitRate: number
  yesterdayProfit: number
  yesterdayProfitRate: number
  updatedAt: string
}

export const useOverviewStore = defineStore('overview', () => {
  const overview = ref<Overview>({
    totalValue: 0,
    totalCost: 0,
    totalProfit: 0,
    totalProfitRate: 0,
    yesterdayProfit: 0,
    yesterdayProfitRate: 0,
    updatedAt: '',
  })

  const setOverview = (data: Overview) => {
    overview.value = data
  }

  return {
    overview,
    setOverview,
  }
})
