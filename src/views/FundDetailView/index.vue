<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useFundDrawerStore, useFundsStore } from '@/store'

import Page from '@/components/Layout/Page.vue'
import Card from '@/components/Card.vue'
import AssetAllocationChart from './AssetAllocationChart.vue'
import StockHoldingChart from './StockHoldingChart.vue'
import BondHoldingChart from './BondHoldingChart.vue'
import SectorAllocationChart from './SectorAllocationChart.vue'
import NetDiagramChart from './NetDiagramChart.vue'

import { get } from '@/packages/request'

import backIcon from '@/assets/icons/back.svg'

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

interface SectorAllocation {
  industryName: string
  ratio: number
  date: string
  marketValue: number
}

interface FundBasicInfo {
  fundCode: string
  fundName: string
  fundType: string
  fundFeature: string
  riskLevel: string
  unitNav: number
  accumulatedNav: number
  dailyGrowth: number
  rate: string
  sourceRate: string
  subscribeStatus: string
  redeemStatus: string
  minSubscribe: string
  fundCompany: string
  fundCompanyId: string
  establishDate: string
  indexCode: string
  indexName: string
  rating: string
  sharp1: string
  sharp2: string
  sharp3: string
  maxDrawdown: string
  description: string
  benchmark: string
  investmentIdea: string
}

const router = useRouter()
const route = useRoute()
const fundCode = computed(() => route.params.code as string)

const fundDrawerStore = useFundDrawerStore()
const fundsStore = useFundsStore()
const { funds } = storeToRefs(fundsStore)

const loading = ref(false)
const error = ref('')
const holdingInfo = ref<FundHoldingInfo | null>(null)
const sectorAllocations = ref<SectorAllocation[]>([])
const basicInfo = ref<FundBasicInfo | null>(null)

// 检查当前基金是否已添加到持仓
const isInHolding = computed(() => {
  return funds.value.some(fund => fund.fundCode === fundCode.value)
})

// 获取当前基金的持仓信息
const currentFund = computed(() => {
  return funds.value.find(fund => fund.fundCode === fundCode.value)
})

const handleAddFund = () => {
  if (!basicInfo.value) return
  
  // 打开抽屉(新增模式),预填充基金名称、代码和成本价(使用最新单位净值)
  fundDrawerStore.openWithPreFill({
    fundName: basicInfo.value.fundName,
    fundCode: basicInfo.value.fundCode,
    cost: basicInfo.value.unitNav,  // 使用最新单位净值作为成本价
  })
}

const handleEditFund = () => {
  if (!currentFund.value) return
  
  // 打开抽屉(编辑模式),传入当前基金信息
  fundDrawerStore.open(currentFund.value)
}

const fetchHolding = async () => {
  if (!fundCode.value) return
  
  loading.value = true
  error.value = ''
  
  try {
    const [holdingRes, sectorRes, basicRes] = await Promise.all([
      get<FundHoldingInfo>(`/funds/${fundCode.value}/holding`),
      get<SectorAllocation[]>(`/funds/${fundCode.value}/sector`).catch(() => ({ data: [] })),
      get<FundBasicInfo>(`/funds/${fundCode.value}/info`),
    ])
    
    holdingInfo.value = holdingRes.data || null
    sectorAllocations.value = sectorRes.data || []
    basicInfo.value = basicRes.data || null
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
  <Page title="基金详情">
    <template #header-right>
      <div class="action-buttons">
        <button v-if="!isInHolding" class="action-btn add-btn" @click="handleAddFund">
          <span class="btn-icon">+</span>
          <span>新增基金</span>
        </button>
        <button v-else class="action-btn edit-btn" @click="handleEditFund">
          <span class="btn-icon">✎</span>
          <span>编辑基金</span>
        </button>
      </div>
    </template>
    <template #container>
      <div>
        <button class="back-btn" @click="router.back()">
          <img :src="backIcon" alt="back" class="back-icon" />
          <span class="back-btn-text">返回上一页</span>
        </button>
      </div>

      <div class="fund-detail">
        <div v-if="loading" class="loading">
          <div class="loading-spinner"></div>
          <p>加载中...</p>
        </div>
        
        <div v-else-if="error" class="error">
          <p>{{ error }}</p>
          <button class="retry-btn" @click="fetchHolding">重试</button>
        </div>
        
        <div v-else-if="holdingInfo && basicInfo" class="fund-content">
          <Card>
            <div class="fund-info">
              <div class="fund-info-item">
                <div class="info-item">
                  <span class="label">基金名称</span>
                  <span class="value">{{ basicInfo.fundName }}</span>
                </div>
                <div class="info-item">
                  <span class="label">基金代码</span>
                  <span class="value">{{ basicInfo.fundCode }}</span>
                </div>
                <div class="info-item">
                  <span class="label">基金类型</span>
                  <span class="value">{{ basicInfo.fundType }}</span>
                </div>
                <div class="info-item">
                  <span class="label">风险等级</span>
                  <span class="value">{{ basicInfo.riskLevel }}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div class="fund-info">
              <div class="fund-info-item">
                <div class="info-item">
                  <span class="label">单位净值</span>
                  <span class="value">{{ basicInfo.unitNav.toFixed(4) }}</span>
                </div>
                <div class="info-item">
                  <span class="label">累计净值</span>
                  <span class="value">{{ basicInfo.accumulatedNav.toFixed(4) }}</span>
                </div>
                <div class="info-item">
                  <span class="label">日涨跌幅</span>
                  <span class="value" :class="{ 'growth-positive': basicInfo.dailyGrowth > 0, 'growth-negative': basicInfo.dailyGrowth < 0 }">
                    {{ basicInfo.dailyGrowth > 0 ? '+' : '' }}{{ basicInfo.dailyGrowth.toFixed(2) }}%
                  </span>
                </div>
                <div class="info-item">
                  <span class="label">基金公司</span>
                  <span class="value">{{ basicInfo.fundCompany }}</span>
                </div>
                <div class="info-item">
                  <span class="label">成立日期</span>
                  <span class="value">{{ basicInfo.establishDate }}</span>
                </div>
                <div class="info-item">
                  <span class="label">数据更新日期</span>
                  <span class="value">{{ holdingInfo.updateDate }}</span>
                </div>
              </div>
            </div>
          </Card>
          
          <NetDiagramChart :fund-code="fundCode" />
          
          <div class="charts-grid">
            <AssetAllocationChart 
              :asset-allocation="holdingInfo.assetAllocation"
            />
            
            <SectorAllocationChart 
              v-if="sectorAllocations.length > 0"
              :sector-allocations="sectorAllocations"
            />
          </div>
          
          <StockHoldingChart 
            v-if="holdingInfo.stockHoldings.length > 0"
            :stock-holdings="holdingInfo.stockHoldings"
            :total-ratio="holdingInfo.assetAllocation.stocks"
          />
          
          <BondHoldingChart 
            v-if="holdingInfo.bondHoldings.length > 0"
            :bond-holdings="holdingInfo.bondHoldings"
            :total-ratio="holdingInfo.assetAllocation.bonds"
          />

          <div v-if="holdingInfo.stockHoldings.length === 0 && holdingInfo.bondHoldings.length === 0" class="empty">
            <p>暂无持仓数据</p>
          </div>
        </div>
      </div>
    </template>
  </Page>
</template>

<style lang="scss" scoped>
.back-btn {
  display: flex;
  align-items: center;
  column-gap: 8px;
  padding: 0;
  margin-bottom: 18px;
  border: none;

  .back-icon {
    width: 16px;
    height: 16px;
  }

  &-text {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-primary);
    transition: color 0.2s;
  }

  &:hover {
    .back-btn-text {
      color: var(--color-primary);
    }
  }
}

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

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.fund-info {
  display: flex;
  flex-direction: column;
  row-gap: 24px;

  .fund-info-item {
    display: flex;
    flex-direction: row;
    column-gap: 44px;
  }
  
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
  
  .growth-positive {
    color: #e74c3c;
  }
  
  .growth-negative {
    color: #27ae60;
  }
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-size: 0.875rem;
  font-weight: 500;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  
  .btn-icon {
    font-size: 1rem;
    font-weight: bold;
  }
  
  &.add-btn {
    background: var(--color-primary);
    color: #fff;
    
    &:hover {
      background: var(--color-primary-hover, #1d4ed8);
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
    }
  }
  
  &.edit-btn {
    background: var(--color-bg-white);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border);
    
    &:hover {
      border-color: var(--color-primary);
      color: var(--color-primary);
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
  }
  
  @media (max-width: 768px) {
    padding: 6px 12px;
    font-size: 0.8125rem;
    
    span:not(.btn-icon) {
      display: none;
    }
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
