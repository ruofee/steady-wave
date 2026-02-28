import { defineStore } from 'pinia'
import { ref } from 'vue'
import { get, post, del, put } from '@/packages/request'

export interface Fund {
  id: string
  fundName: string
  fundCode: string
  cost: number
  shares: number
  totalCost: number
  totalProfit: number
  profitRate: number
  currentValue: number
  yesterdayProfit: number
  yesterdayProfitRate: number
  netAssetValue?: number
  accumulatedValue?: number
  netValueDate?: string
  dayGrowthRate?: number
  createdAt: string
  updatedAt: string
}

export interface FundWithProfit extends Fund {
  currentValue: number        // 当前市值
  totalProfit: number         // 持有收益
  profitRate: number          // 持有收益率(%)
  yesterdayProfit: number     // 昨日收益
  yesterdayProfitRate: number // 昨日收益率(%)
}

export const useFundsStore = defineStore('funds', () => {
  const funds = ref<Fund[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchFunds = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await get<Fund[]>('/funds')
      funds.value = response.data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取基金列表失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  const addFund = async (fundData: Pick<Fund, 'fundName' | 'fundCode' | 'cost' | 'shares'>) => {
    loading.value = true
    error.value = null
    try {
      const response = await post<Fund>('/funds', fundData)
      if (response.data) {
        funds.value.push(response.data)
      }
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : '添加基金失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateFund = async (fundCode: string, fundData: Partial<Pick<Fund, 'cost' | 'shares'>>) => {
    loading.value = true
    error.value = null
    try {
      const response = await put<Fund>(`/funds/${fundCode}`, fundData)
      if (response.data) {
        const index = funds.value.findIndex(f => f.fundCode === fundCode)
        if (index !== -1) {
          funds.value[index] = response.data
        }
      }
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新基金失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteFund = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      await del(`/funds/${id}`)
      funds.value = funds.value.filter(fund => fund.id !== id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除基金失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    funds,
    loading,
    error,
    fetchFunds,
    addFund,
    updateFund,
    deleteFund,
  }
})
