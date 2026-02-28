import { defineStore } from 'pinia'
import { ref } from 'vue'
import { get } from '@/packages/request'
import { useFundsStore } from './funds'
import { useOverviewStore, type Overview } from './overview'

export interface FundWithProfit {
  id: string
  fundName: string
  fundCode: string
  cost: number
  shares: number
  netAssetValue?: number
  accumulatedValue?: number
  netValueDate?: string
  dayGrowthRate?: number
  currentValue: number
  totalProfit: number
  profitRate: number
  yesterdayProfit: number
  yesterdayProfitRate: number
  totalCost: number
  createdAt: string
  updatedAt: string
}

interface DataResponse {
  funds: FundWithProfit[]
  overview: Overview
}

export const useDataStore = defineStore('data', () => {
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fundsStore = useFundsStore()
  const overviewStore = useOverviewStore()

  const getData = async (forceUpdate = false) => {
    loading.value = true
    error.value = null
    
    try {
      const params = forceUpdate ? { forceUpdate: 'true' } : {}
      const response = await get<DataResponse>('/data', { params })
      
      if (response.data) {
        // 将 funds 数据转换为 funds store 的格式
        const funds = response.data.funds.map(fund => ({
          id: fund.id,
          fundName: fund.fundName,
          fundCode: fund.fundCode,
          cost: fund.cost,
          shares: fund.shares,
          netAssetValue: fund.netAssetValue,
          accumulatedValue: fund.accumulatedValue,
          netValueDate: fund.netValueDate,
          dayGrowthRate: fund.dayGrowthRate,
          createdAt: fund.createdAt,
          updatedAt: fund.updatedAt,
          totalCost: fund.totalCost,
          totalProfit: fund.totalProfit,
          yesterdayProfit: fund.yesterdayProfit,
          yesterdayProfitRate: fund.yesterdayProfitRate,
          profitRate: fund.profitRate,
        }))
        
        // 设置 funds store
        fundsStore.funds = funds
        
        // 设置 overview store
        overviewStore.setOverview(response.data.overview)
      }
      
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取数据失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    getData,
  }
})
