<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { marked } from 'marked'
import Page from '@/components/Layout/Page.vue'
import FundSearchInput from '@/components/FundSearchInput.vue'
import StatsCards from './StatsCards.vue'
import FundsPosition from './FundsPosition.vue'
import AILabIcon from '@/assets/icons/aiLab.svg?raw'
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

const hasHoldings = computed(() => fundsStore.funds.length > 0)

onMounted(() => {
  aiAnalysisStore.checkTodayReport()
})

const handleFundSelect = (fund: FundSearchItem) => {
  router.push(`/fund/${fund.fundCode}`)
  searchKeyword.value = ''
}

const reportHtml = computed(() => {
  if (!aiAnalysisStore.result?.report) return ''
  return marked(aiAnalysisStore.result.report) as string
})

const handleToggleReport = () => {
  aiAnalysisStore.showReport = !aiAnalysisStore.showReport
}

const handleAIAnalysis = async () => {
  if (!hasHoldings.value) {
    alert('请先添加持仓基金')
    return
  }

  const totalAmount = fundsStore.funds.reduce((sum, fund) => sum + fund.currentValue, 0)

  const holdings = fundsStore.funds.map(fund => ({
    fund_code: fund.fundCode,
    amount: fund.currentValue,
    ratio: fund.currentValue / totalAmount,
    asset_type: inferAssetType(),
  }))

  try {
    await aiAnalysisStore.submitAnalysis({ holdings })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'AI 分析失败'
    alert(`AI 分析失败: ${msg}`)
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
          <span v-else class="ai-analysis-label"><span class="ai-analysis-icon" v-html="AILabIcon" />分析</span>
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
      <!-- 风险预警 Banner -->
      <div 
        v-if="aiAnalysisStore.result?.has_risk_warning" 
        class="risk-banner"
        @click="handleToggleReport"
      >
        <span class="risk-banner-icon">⚠</span>
        <div class="risk-banner-body">
          <span class="risk-banner-text">AI 检测到投资组合存在风险，点击查看详细分析报告</span>
          <ul v-if="aiAnalysisStore.result.risk_details?.length" class="risk-banner-details">
            <li v-for="(risk, idx) in aiAnalysisStore.result.risk_details" :key="idx">{{ risk }}</li>
          </ul>
        </div>
        <span class="risk-banner-arrow">{{ aiAnalysisStore.showReport ? '收起' : '展开' }}</span>
      </div>

      <!-- 调仓建议 Banner -->
      <div 
        v-if="aiAnalysisStore.result?.has_rebalance_suggestion && !aiAnalysisStore.result?.has_risk_warning"
        class="rebalance-banner"
        @click="handleToggleReport"
      >
        <span class="rebalance-banner-icon">⚖</span>
        <span class="rebalance-banner-text">AI 建议对当前持仓进行调仓，点击查看详细建议</span>
        <span class="risk-banner-arrow">{{ aiAnalysisStore.showReport ? '收起' : '展开' }}</span>
      </div>

      <!-- 分析报告面板 -->
      <div v-if="aiAnalysisStore.showReport && aiAnalysisStore.result?.report" class="report-panel">
        <div class="report-panel-header">
          <h3 class="report-panel-title">AI 分析报告</h3>
          <button class="report-panel-close" @click="aiAnalysisStore.showReport = false">✕</button>
        </div>
        <div class="report-panel-body markdown-body" v-html="reportHtml" />
      </div>

      <StatsCards />

      <!-- 调仓建议 -->
      <div v-if="aiAnalysisStore.result?.rebalance_suggestions?.length" class="rebalance-section">
        <h3 class="rebalance-section-title">调仓建议</h3>
        <div class="rebalance-cards">
          <div v-for="(s, idx) in aiAnalysisStore.result.rebalance_suggestions" :key="idx" class="rebalance-card">
            <div class="rebalance-card-name">{{ s.name }}</div>
            <div class="rebalance-card-suggestion">{{ s.suggestion }}</div>
            <div v-if="s.reason" class="rebalance-card-reason">{{ s.reason }}</div>
          </div>
        </div>
      </div>

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

.ai-analysis-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.ai-analysis-icon {
  display: inline-flex;
  align-items: center;
  width: 16px;
  height: 16px;

  :deep(svg) {
    width: 100%;
    height: 100%;
    stroke: currentColor;
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

.risk-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  margin-bottom: 20px;
  border-radius: 8px;
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
  border: 1px solid #ffcc80;
  cursor: pointer;
  transition: all 0.2s;
  animation: bannerSlideIn 0.4s ease-out;

  &:hover {
    box-shadow: 0 2px 8px rgba(255, 152, 0, 0.15);
  }
}

@keyframes bannerSlideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.risk-banner-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.risk-banner-body {
  flex: 1;
  min-width: 0;
}

.risk-banner-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: #e65100;
}

.risk-banner-details {
  margin: 6px 0 0;
  padding-left: 1.2em;
  list-style: disc;

  li {
    font-size: 0.8125rem;
    color: #bf360c;
    line-height: 1.5;
  }
}

.risk-banner-arrow {
  font-size: 0.75rem;
  color: #bf360c;
  font-weight: 500;
  flex-shrink: 0;
}

.rebalance-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  margin-bottom: 20px;
  border-radius: 8px;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border: 1px solid #90caf9;
  cursor: pointer;
  transition: all 0.2s;
  animation: bannerSlideIn 0.4s ease-out;

  &:hover {
    box-shadow: 0 2px 8px rgba(33, 150, 243, 0.15);
  }
}

.rebalance-banner-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.rebalance-banner-text {
  flex: 1;
  font-size: 0.875rem;
  font-weight: 500;
  color: #1565c0;
}

.report-panel {
  margin-bottom: 20px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background-color: var(--color-bg);
  overflow: hidden;
  animation: panelSlideIn 0.3s ease-out;
}

@keyframes panelSlideIn {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 2000px;
  }
}

.report-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
}

.report-panel-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.report-panel-close {
  padding: 4px 8px;
  border: none;
  background: transparent;
  color: var(--color-text-tertiary);
  font-size: 1rem;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    color: var(--color-text-primary);
    background-color: var(--color-bg-light);
  }
}

.rebalance-section {
  margin-top: 24px;
}

.rebalance-section-title {
  margin: 0 0 12px;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.rebalance-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rebalance-card {
  padding: 12px 16px;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background-color: var(--color-bg);

  &-name {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: 4px;
  }

  &-suggestion {
    font-size: 0.8125rem;
    color: var(--color-primary);
    font-weight: 500;
    margin-bottom: 4px;
  }

  &-reason {
    font-size: 0.75rem;
    color: var(--color-text-tertiary);
    line-height: 1.5;
  }
}

.report-panel-body {
  padding: 20px;
  max-height: 500px;
  overflow-y: auto;
  font-size: 0.875rem;
  line-height: 1.7;
  color: var(--color-text-primary);

  :deep(h1), :deep(h2), :deep(h3), :deep(h4) {
    margin-top: 1.2em;
    margin-bottom: 0.6em;
    font-weight: 600;
    color: var(--color-text-primary);

    &:first-child {
      margin-top: 0;
    }
  }

  :deep(h1) { font-size: 1.25rem; }
  :deep(h2) { font-size: 1.125rem; }
  :deep(h3) { font-size: 1rem; }

  :deep(p) {
    margin: 0.6em 0;
  }

  :deep(ul), :deep(ol) {
    padding-left: 1.5em;
    margin: 0.6em 0;
  }

  :deep(li) {
    margin: 0.3em 0;
  }

  :deep(strong) {
    font-weight: 600;
  }

  :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 0.8em 0;

    th, td {
      padding: 8px 12px;
      border: 1px solid var(--color-border);
      text-align: left;
      font-size: 0.8125rem;
    }

    th {
      background-color: var(--color-bg-light);
      font-weight: 600;
    }
  }

  :deep(blockquote) {
    margin: 0.8em 0;
    padding: 8px 16px;
    border-left: 3px solid var(--color-primary);
    background-color: var(--color-bg-light);
    color: var(--color-text-secondary);
  }

  :deep(code) {
    padding: 2px 6px;
    border-radius: 3px;
    background-color: var(--color-bg-light);
    font-size: 0.8125rem;
  }

  :deep(pre) {
    padding: 12px 16px;
    border-radius: 6px;
    background-color: var(--color-bg-light);
    overflow-x: auto;

    code {
      padding: 0;
      background: none;
    }
  }
}
</style>
