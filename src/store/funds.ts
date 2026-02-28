import { defineStore } from 'pinia'
import { ref } from 'vue'
import { get, post, del } from '@/packages/request'

export interface Fund {
  id: string
  fundName: string
  fundCode: string
  cost: number
  shares: number
  createdAt: string
  updatedAt: string
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

  const addFund = async (fundData: Omit<Fund, 'id' | 'createdAt' | 'updatedAt'>) => {
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

  const generateMockData = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await post<Fund[]>('/funds/mock')
      funds.value = response.data || []
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : '生成测试数据失败'
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
    deleteFund,
    generateMockData,
  }
})
