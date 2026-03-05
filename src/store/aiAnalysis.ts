import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface HoldingInput {
  fund_code: string
  amount: number
  ratio: number
  asset_type: 'stock' | 'long_bond' | 'mid_bond' | 'commodity' | 'gold'
}

export interface HoldingWithAction extends HoldingInput {
  action: number  // 0=持平, 1=加仓, -1=减仓
  suggested_ratio: number
  action_reason: string
}

export interface AnalysisRequest {
  holdings: HoldingInput[]
}

export interface RebalanceSuggestion {
  name: string
  suggestion: string
  reason: string
}

export interface AnalysisResponse {
  status: string
  timestamp: string
  has_risk_warning: boolean
  risk_details: string[]
  has_rebalance_suggestion: boolean
  rebalance_suggestions: RebalanceSuggestion[]
  holdings: HoldingWithAction[]
  report: string
}

export type TaskStatus = 'idle' | 'in_progress' | 'success' | 'no_task' | 'failed'

export const assetTypeMap: Record<string, 'stock' | 'long_bond' | 'mid_bond' | 'commodity' | 'gold'> = {
  '股票': 'stock',
  '股票型': 'stock',
  '混合型': 'stock',
  '债券': 'long_bond',
  '债券型': 'long_bond',
  '货币': 'mid_bond',
  '货币型': 'mid_bond',
  'QDII': 'commodity',
  'QDII型': 'commodity',
  'ETF': 'gold',
  '指数型': 'gold',
}

export const inferAssetType = (fundType?: string): 'stock' | 'long_bond' | 'mid_bond' | 'commodity' | 'gold' => {
  if (!fundType) return 'stock'
  for (const [key, value] of Object.entries(assetTypeMap)) {
    if (fundType.includes(key)) return value
  }
  return 'stock'
}

export const assetTypeNameMap = {
  stock: '股票',
  long_bond: '长期国债',
  mid_bond: '中期国债',
  commodity: '商品',
  gold: '黄金',
}

const POLL_INTERVAL = 3000

export const useAIAnalysisStore = defineStore('aiAnalysis', () => {
  const result = ref<AnalysisResponse | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const showReport = ref(false)
  const taskStatus = ref<TaskStatus>('idle')

  let pollTimer: ReturnType<typeof setInterval> | null = null

  const getServiceUrl = () =>
    import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8001'

  const submitAnalysis = async (request: AnalysisRequest) => {
    loading.value = true
    error.value = null

    try {
      // 先检查后端是否已有进行中或已完成的任务
      const reportRes = await fetch(`${getServiceUrl()}/api/v1/report`)
      if (reportRes.ok) {
        const reportData = await reportRes.json()
        if (reportData.status === 'in_progress') {
          taskStatus.value = 'in_progress'
          startPolling()
          return
        }
        if (reportData.status === 'success' && reportData.data) {
          result.value = reportData.data
          taskStatus.value = 'success'
          loading.value = false
          return
        }
      }

      // 没有进行中的任务，提交新任务
      taskStatus.value = 'in_progress'
      const response = await fetch(`${getServiceUrl()}/api/v1/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || '提交分析任务失败')
      }

      startPolling()
    } catch (err) {
      const msg = err instanceof Error ? err.message : '提交分析任务失败'
      error.value = msg
      loading.value = false
      taskStatus.value = 'failed'
      throw new Error(msg)
    }
  }

  const fetchReport = async () => {
    try {
      const response = await fetch(`${getServiceUrl()}/api/v1/report`)
      if (!response.ok) throw new Error('获取报告失败')

      const data = await response.json()

      if (data.status === 'success' && data.data) {
        result.value = data.data
        taskStatus.value = 'success'
        loading.value = false
        stopPolling()
        return true
      }

      if (data.status === 'in_progress') {
        taskStatus.value = 'in_progress'
        return false
      }

      if (data.status === 'failed') {
        error.value = data.message || '分析失败'
        taskStatus.value = 'failed'
        loading.value = false
        stopPolling()
        return true
      }

      // no_task
      taskStatus.value = 'no_task'
      loading.value = false
      stopPolling()
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : '获取报告失败'
      error.value = msg
      taskStatus.value = 'failed'
      loading.value = false
      stopPolling()
      return true
    }
  }

  const startPolling = () => {
    stopPolling()
    pollTimer = setInterval(async () => {
      const done = await fetchReport()
      if (done) stopPolling()
    }, POLL_INTERVAL)
  }

  const stopPolling = () => {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  const getActionByFundCode = (fundCode: string): HoldingWithAction | null => {
    if (!result.value) return null
    return result.value.holdings.find(h => h.fund_code === fundCode) ?? null
  }

  const clearResult = () => {
    result.value = null
    error.value = null
    showReport.value = false
    taskStatus.value = 'idle'
    stopPolling()
  }

  /**
   * 页面加载时检查是否有今天的报告
   */
  const checkTodayReport = async () => {
    await fetchReport()
  }

  return {
    result,
    loading,
    error,
    showReport,
    taskStatus,
    submitAnalysis,
    fetchReport,
    checkTodayReport,
    getActionByFundCode,
    clearResult,
  }
})
