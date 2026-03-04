import { defineStore } from 'pinia'
import { ref } from 'vue'
import { post } from '@/packages/request'

// 持仓输入
export interface HoldingInput {
  fund_code: string
  amount: number
  ratio: number
  asset_type: 'stock' | 'long_bond' | 'mid_bond' | 'commodity' | 'gold'
}

// 持仓输出（包含操作建议）
export interface HoldingWithAction extends HoldingInput {
  action: number  // 0=持平, 1=加仓, -1=减仓
  suggested_ratio: number  // 建议比例
  action_reason: string  // 操作原因
}

// 分析请求
export interface AnalysisRequest {
  holdings: HoldingInput[]
}

// 分析响应
export interface AnalysisResponse {
  status: string
  timestamp: string
  has_risk_warning: boolean  // 是否存在风险提示
  holdings: HoldingWithAction[]  // 持仓列表（包含操作建议）
  report: string  // 分析报告
}

/**
 * 资产类型映射
 */
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

/**
 * 根据基金类型推断资产类型
 */
export const inferAssetType = (fundType?: string): 'stock' | 'long_bond' | 'mid_bond' | 'commodity' | 'gold' => {
  if (!fundType) return 'stock'
  
  for (const [key, value] of Object.entries(assetTypeMap)) {
    if (fundType.includes(key)) {
      return value
    }
  }
  
  // 默认返回股票
  return 'stock'
}

/**
 * 资产类型中文名称
 */
export const assetTypeNameMap = {
  stock: '股票',
  long_bond: '长期国债',
  mid_bond: '中期国债',
  commodity: '商品',
  gold: '黄金',
}

export const useAIAnalysisStore = defineStore('aiAnalysis', () => {
  const result = ref<AnalysisResponse | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * 调用 AI 分析服务
   */
  const analyzePortfolio = async (request: AnalysisRequest) => {
    loading.value = true
    error.value = null
    
    try {
      // AI 分析服务地址（从环境变量获取，默认为 localhost:8001）
      const aiServiceUrl = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8001'
      
      // 使用 fetch 直接调用 AI 服务（不走 packages/request，因为是不同的服务）
      const response = await fetch(`${aiServiceUrl}/api/v1/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || '分析失败')
      }

      const data = await response.json()
      result.value = data
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'AI 分析失败'
      error.value = errorMessage
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  /**
   * 清空分析结果
   */
  const clearResult = () => {
    result.value = null
    error.value = null
  }

  return {
    result,
    loading,
    error,
    analyzePortfolio,
    clearResult,
  }
})
