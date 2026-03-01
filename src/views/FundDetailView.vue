<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import Page from '@/components/Layout/Page.vue'
import FundHoldingChart from '@/components/FundDetail/FundHoldingChart.vue'
import { get } from '@/packages/request'

interface StockHolding {
  stockCode: string
  stockName: string
  holdRatio: number
  holdShares: number
  holdValue: number
  updateDate: string
}

interface BondHolding {
  bondCode: string
  bondName: string
  holdRatio: number
  holdValue: number
  updateDate: string
}

interface AssetAllocation {
  stocks: number
  bonds: number
  cash: number
  other: number
  updateDate: string
}

interface FundHoldingInfo {
  fundCode: string
  fundName: string
  assetAllocation: AssetAllocation
  stockHoldings: StockHolding[]
  bondHoldings: BondHolding[]
  updateDate: string
}

const route = useRoute()
const fundCode = computed(() => route.params.code as string)

const loading = ref(false)
const error = ref('')
const holdingInfo = ref<FundHoldingInfo | null>(null)

const fetchHolding = async () => {
  if (!fundCode.value) return
  
  loading.value = true
  error.value = ''
  
  try {
    const res = await get<FundHoldingInfo>(`/funds/${fundCode.value}/holding`)
    holdingInfo.value = res.data || null
  } catch (e) {
    error.value = e instanceof Error ? e.message : '获取持仓数据失败'
    console.error('Failed to fetch fund holding:', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchHolding()
})
</script>

<template>
  <Page :title="holdingInfo?.fundName || `基金详情 - ${fundCode}`">
    <template #container>
      <div class="fund-detail">
        <div v-if="loading" class="loading">
          <div class="loading-spinner"></div>
          <p>加载中...</p>
        </div>
        
        <div v-else-if="error" class="error">
          <p>{{ error }}</p>
          <button class="retry-btn" @click="fetchHolding">重试</button>
        </div>
        
        <div v-else-if="holdingInfo" class="fund-content">
          <div class="fund-info">
            <div class="info-item">
              <span class="label">基金代码</span>
              <span class="value">{{ holdingInfo.fundCode }}</span>
            </div>
            <div class="info-item">
              <span class="label">数据更新日期</span>
              <span class="value">{{ holdingInfo.updateDate }}</span>
            </div>
            <div class="info-item">
              <span class="label">股票仓位</span>
              <span class="value">{{ holdingInfo.assetAllocation.stocks.toFixed(2) }}%</span>
            </div>
            <div class="info-item">
              <span class="label">债券仓位</span>
              <span class="value">{{ holdingInfo.assetAllocation.bonds.toFixed(2) }}%</span>
            </div>
            <div class="info-item">
              <span class="label">现金占比</span>
              <span class="value">{{ holdingInfo.assetAllocation.cash.toFixed(2) }}%</span>
            </div>
          </div>
          
          <FundHoldingChart 
            v-if="holdingInfo.stockHoldings.length > 0 || holdingInfo.bondHoldings.length > 0"
            :stock-holdings="holdingInfo.stockHoldings"
            :bond-holdings="holdingInfo.bondHoldings"
            :asset-allocation="holdingInfo.assetAllocation"
          />
          
          <div v-else class="empty">
            <p>暂无持仓数据</p>
          </div>
        </div>
      </div>
    </template>
  </Page>
</template>

<style lang="scss" scoped>
.fund-detail {
  max-width: 1400px;
  margin: 0 auto;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--color-text-secondary);
  
  &-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--color-border);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  
  p {
    margin-top: 16px;
    font-size: 0.875rem;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  
  p {
    margin: 0 0 16px;
    color: var(--color-danger);
    font-size: 0.875rem;
  }
}

.retry-btn {
  padding: 8px 24px;
  font-size: 0.875rem;
  color: var(--color-primary);
  background: transparent;
  border: 1px solid var(--color-primary);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: var(--color-primary);
    color: #fff;
  }
}

.fund-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.fund-info {
  display: flex;
  gap: 24px;
  padding: 20px 24px;
  background: var(--color-bg-white);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 16px;
  }
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  
  .label {
    font-size: 0.875rem;
    color: var(--color-text-tertiary);
  }
  
  .value {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text-primary);
  }
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background: var(--color-bg-white);
  border-radius: 12px;
  
  p {
    margin: 0;
    color: var(--color-text-tertiary);
    font-size: 0.875rem;
  }
}
</style>
