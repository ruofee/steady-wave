<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import Page from '@/components/Layout/Page.vue'
import FundSearchInput from '@/components/FundSearchInput.vue'
import StatsCards from './StatsCards.vue'
import FundsPosition from './FundsPosition.vue'
import AssetAllocation from './AssetAllocation.vue'
import { useFundsStore, useAIAnalysisStore } from '@/store'
import { inferAssetType } from '@/store/aiAnalysis'

interface FundSearchItem {
  fundCode: string
  fundName: string
  fundType: string
}

const router = useRouter()
const fundsStore = useFundsStore()
const aiAnalysisStore = useAIAnalysisStore()
const searchKeyword = ref('')

// 检查是否有持仓
const hasHoldings = computed(() => {
  return fundsStore.funds.length > 0
})

const handleFundSelect = (fund: FundSearchItem) => {
  // 跳转到基金详情页
  router.push(`/fund/${fund.fundCode}`)
  // 清空搜索关键字
  searchKeyword.value = ''
}

// 处理 AI 分析
const handleAIAnalysis = async () => {
  if (!hasHoldings.value) {
    alert('请先添加持仓基金')
    return
  }

  // 计算总金额
  const totalAmount = fundsStore.funds.reduce((sum, fund) => sum + fund.currentValue, 0)

  // 转换持仓数据为 AI 分析格式
  const holdings = fundsStore.funds.map(fund => {
    const ratio = fund.currentValue / totalAmount
    const assetType = inferAssetType(fund.fundType)
    
    return {
      fund_code: fund.fundCode,
      amount: fund.currentValue,
      ratio: ratio,
      asset_type: assetType
    }
  })

  try {
    // 调用 AI 分析服务
    console.log('开始 AI 分析...', holdings)
    const result = await aiAnalysisStore.analyzePortfolio({ holdings })
    console.log('AI 分析结果:', result)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'AI 分析失败'
    console.error('AI 分析失败:', errorMessage)
    alert(`AI 分析失败: ${errorMessage}`)
  }
}
</script>

<template>
  <Page title="Steady Wave Dashboard">
    <template #header-right>
      <div class="header-actions">
        <button 
          class="ai-analysis-btn" 
          :disabled="!hasHoldings || aiAnalysisStore.loading" 
          @click="handleAIAnalysis"
        >
          <span v-if="aiAnalysisStore.loading" class="ai-analysis-loading">分析中...</span>
          <span v-else>AI 分析</span>
        </button>
        <div class="search-wrapper">
          <FundSearchInput
            v-model="searchKeyword"
            placeholder="搜索基金"
            @select="handleFundSelect"
          />
        </div>
      </div>
    </template>
    <template #container>
      <StatsCards />
      <div class="dashboard-content">
        <FundsPosition />
      </div>
    </template>
  </Page>
</template>

<style lang="scss" scoped>
.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ai-analysis-btn {
  padding: 10px 20px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background-color: var(--color-bg);
  color: var(--color-text-primary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    border-color: var(--color-primary);
    color: var(--color-primary);
    background-color: var(--color-primary-light);
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.ai-analysis-loading {
  display: inline-block;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.search-wrapper {
  min-width: 260px;
  max-width: 400px;
  
  @media (max-width: 768px) {
    min-width: 200px;
  }

  @media (max-width: 480px) {
    min-width: 150px;
  }
}

.dashboard-content {
  margin-top: 24px;
}

@container (max-width: 500px) {
  .dashboard-content {
    grid-template-columns: 1fr;
  }
}
</style>
