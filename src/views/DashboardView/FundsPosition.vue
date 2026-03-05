<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFundsStore, useFundDrawerStore, useAIAnalysisStore } from '@/store'
import type { Fund } from '@/store/funds'
import Card from '@/components/Card.vue'
import ProfitIcon from '@/assets/icons/profit.svg?raw'
import LossIcon from '@/assets/icons/loss.svg?raw'

type SortField = 'totalCost' | 'yesterdayProfit' | 'totalProfit'
type SortOrder = 'asc' | 'desc' | null

const router = useRouter()
const fundsStore = useFundsStore()
const fundDrawerStore = useFundDrawerStore()
const aiAnalysisStore = useAIAnalysisStore()

const getActionLabel = (action: number) => {
  if (action === 1) return '加仓'
  if (action === -1) return '减仓'
  return '持平'
}

const getActionClass = (action: number) => {
  if (action === 1) return 'action-buy'
  if (action === -1) return 'action-sell'
  return 'action-hold'
}

const sortField = ref<SortField | null>(null)
const sortOrder = ref<SortOrder>(null)

const funds = computed(() => {
  if (!sortField.value || !sortOrder.value) {
    return fundsStore.funds
  }

  return [...fundsStore.funds].sort((a, b) => {
    const field = sortField.value!
    const order = sortOrder.value === 'asc' ? 1 : -1
    return (a[field] - b[field]) * order
  })
})

const handleSort = (field: SortField) => {
  if (sortField.value === field) {
    if (sortOrder.value === 'asc') {
      sortOrder.value = 'desc'
    } else if (sortOrder.value === 'desc') {
      sortField.value = null
      sortOrder.value = null
    }
  } else {
    sortField.value = field
    sortOrder.value = 'asc'
  }
}

const getSortIcon = (field: SortField) => {
  if (sortField.value !== field) {
    return ''
  }
  return sortOrder.value === 'asc' ? '↑' : '↓'
}

const formatAmount = (amount: number) => {
  if (!amount) {
    return '0.00'
  }

  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

const getProfitClass = (value: number) => {
  return value >= 0 ? 'profit' : 'loss'
}

const isProfit = (value: number) => value >= 0

const handleAddFund = () => {
  fundDrawerStore.open()
}

const handleEditFund = (fund: Fund) => {
  fundDrawerStore.open(fund)
}

const handleViewDetail = (fundCode: string) => {
  router.push(`/fund/${fundCode}`)
}

const handleDeleteFund = async (fund: Fund) => {
  if (!confirm(`确定要删除基金 ${fund.fundName} (${fund.fundCode}) 吗？`)) {
    return
  }

  try {
    await fundsStore.deleteFund(fund.id)
  } catch (error) {
    alert('删除基金失败，请稍后重试')
  }
}
</script>

<template>
  <div class="funds-position">
    <Card>
      <div class="funds-position-header">
        <h2 class="funds-position-title">持仓基金</h2>
        <button class="funds-position-add-btn" @click="handleAddFund">
          新增基金
        </button>
      </div>
      <div class="funds-position-table">
        <table>
          <thead>
            <tr>
              <th>基金名称</th>
              <th class="sortable" @click="handleSort('totalCost')">
                <span class="th-content">
                  金额
                  <span class="sort-icon" :class="{ active: sortField === 'totalCost' }">
                    {{ getSortIcon('totalCost') }}
                  </span>
                </span>
              </th>
              <th class="sortable" @click="handleSort('yesterdayProfit')">
                <span class="th-content">
                  昨日收益
                  <span class="sort-icon" :class="{ active: sortField === 'yesterdayProfit' }">
                    {{ getSortIcon('yesterdayProfit') }}
                  </span>
                </span>
              </th>
              <th class="sortable" @click="handleSort('totalProfit')">
                <span class="th-content">
                  持有收益
                  <span class="sort-icon" :class="{ active: sortField === 'totalProfit' }">
                    {{ getSortIcon('totalProfit') }}
                  </span>
                </span>
              </th>
              <th v-if="aiAnalysisStore.result">AI 建议</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="fund in funds" :key="fund.id">
              <td class="fund-name">
                <div class="fund-name-content">
                  <div class="fund-name-info" @click="handleViewDetail(fund.fundCode)">
                    <div class="fund-name-text">{{ fund.fundName }}</div>
                    <div class="fund-code">{{ fund.fundCode }}</div>
                  </div>
                  <div class="fund-actions">
                    <button class="fund-action-btn fund-edit-btn" @click="handleEditFund(fund)">
                      编辑
                    </button>
                    <button class="fund-action-btn fund-delete-btn" @click="handleDeleteFund(fund)">
                      删除
                    </button>
                  </div>
                </div>
              </td>
              <td class="fund-amount">¥{{ formatAmount(fund.currentValue) }}</td>
              <td class="fund-holding-profit">
                <div class="fund-holding-profit-wrapper">
                  <span :class="['fund-profit', getProfitClass(fund.yesterdayProfit)]">
                    {{ fund.yesterdayProfit >= 0 ? '+' : '' }}¥{{ formatAmount(fund.yesterdayProfit) }}
                  </span>
                  <span class="fund-profit-tag" :class="getProfitClass(fund.yesterdayProfit)">
                    <span class="fund-profit-icon" v-html="isProfit(fund.yesterdayProfit) ? ProfitIcon : LossIcon" />
                    {{ fund.yesterdayProfitRate >= 0 ? '+' : '' }}{{ fund.yesterdayProfitRate.toFixed(2) }}%
                  </span>
                </div>
              </td>
              <td class="fund-holding-profit">
                <div class="fund-holding-profit-wrapper">
                  <span :class="['fund-profit', getProfitClass(fund.totalProfit)]">
                    {{ fund.totalProfit >= 0 ? '+' : '' }}¥{{ formatAmount(fund.totalProfit) }}
                  </span>
                  <span class="fund-profit-tag" :class="getProfitClass(fund.totalProfit)">
                    <span class="fund-profit-icon" v-html="isProfit(fund.totalProfit) ? ProfitIcon : LossIcon" />
                    {{ fund.profitRate >= 0 ? '+' : '' }}{{ fund.profitRate.toFixed(2) }}%
                  </span>
                </div>
              </td>
              <td v-if="aiAnalysisStore.result" class="fund-ai-action">
                <template v-if="aiAnalysisStore.getActionByFundCode(fund.fundCode)">
                  <span 
                    class="ai-action-tag" 
                    :class="getActionClass(aiAnalysisStore.getActionByFundCode(fund.fundCode)!.action)"
                    :title="aiAnalysisStore.getActionByFundCode(fund.fundCode)!.action_reason"
                  >
                    {{ getActionLabel(aiAnalysisStore.getActionByFundCode(fund.fundCode)!.action) }}
                    → {{ (aiAnalysisStore.getActionByFundCode(fund.fundCode)!.suggested_ratio * 100).toFixed(1) }}%
                  </span>
                </template>
                <span v-else class="ai-action-tag action-hold">--</span>
              </td>
            </tr>
            <tr v-if="funds.length === 0 && !fundsStore.loading">
              <td :colspan="aiAnalysisStore.result ? 5 : 4" style="text-align: center; padding: 40px; color: var(--color-text-tertiary);">
                暂无数据
              </td>
            </tr>
            <tr v-if="fundsStore.loading">
              <td :colspan="aiAnalysisStore.result ? 5 : 4" style="text-align: center; padding: 40px; color: var(--color-text-tertiary);">
                加载中...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  </div>
</template>

<style lang="scss" scoped>
.funds-position-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.funds-position-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.funds-position-add-btn {
  padding: 8px 16px;
  border: 1px solid var(--color-primary);
  border-radius: 6px;
  background-color: var(--color-primary);
  color: #fff;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: var(--color-primary-hover);
    border-color: var(--color-primary-hover);
  }

  &:active {
    transform: scale(0.98);
  }
}

.funds-position-table {
  overflow-x: auto;

  table {
    width: 100%;
    border-collapse: collapse;
  }

  thead {

    th {
      padding: 16px 24px;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-text-secondary);
      text-align: left;
      border-bottom: 1px solid var(--color-border);

      &.sortable {
        cursor: pointer;
        user-select: none;
        transition: color 0.2s;

        &:hover {
          color: var(--color-primary);
        }
      }
    }
  }

  tbody {
    tr {
      border-bottom: 1px solid var(--color-border);
      transition: background-color 0.2s;

      &:last-child {
        border-bottom: none;
      }

      &:hover {
        background-color: var(--color-bg-light);
      }
    }

    td {
      padding: 16px 24px;
      font-size: 0.875rem;
      color: var(--color-text-primary);
    }
  }
}

.fund-name {
  &-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  &-info {
    flex: 1;
    min-width: 0;
    cursor: pointer;
    transition: color 0.2s;

    &:hover {
      color: var(--color-primary);
    }

    &:hover .fund-name-text {
      text-decoration: underline;
    }
  }

  &-text {
    margin-bottom: 4px;
    font-weight: 500;
  }
}

.fund-code {
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
}

.fund-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.fund-action-btn {
  padding: 4px 12px;
  font-size: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background-color: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  opacity: 0;

  &:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
    background-color: var(--color-primary-light);
  }
}

.fund-edit-btn {
  // 保持默认样式
}

.fund-delete-btn {
  &:hover {
    border-color: var(--color-danger);
    color: var(--color-danger);
    background-color: var(--color-danger-light);
  }
}

tbody tr:hover .fund-action-btn {
  opacity: 1;
}

.fund-amount {
  font-weight: 500;
}

.fund-profit {
  font-weight: 500;

  &.profit {
    color: var(--color-success);
  }

  &.loss {
    color: var(--color-danger);
  }
}

.fund-holding-profit {
  &-wrapper {
    display: flex;
    align-items: center;
    gap: 12px;
  }
}

.fund-profit-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;

  &.profit {
    color: var(--color-success);
    background-color: var(--color-success-light);
  }

  &.loss {
    color: var(--color-danger);
    background-color: var(--color-danger-light);
  }
}

.fund-profit-icon {
  display: inline-flex;
  align-items: center;
  width: 14px;
  height: 14px;

  :deep(svg) {
    width: 100%;
    height: 100%;
    stroke: currentColor;
  }
}

.th-content {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.sort-icon {
  display: inline-flex;
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
  opacity: 0.5;
  transition: opacity 0.2s;

  &.active {
    color: var(--color-primary);
    opacity: 1;
  }
}

.fund-ai-action {
  white-space: nowrap;
}

.ai-action-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: default;

  &.action-buy {
    color: var(--color-success);
    background-color: var(--color-success-light);
  }

  &.action-sell {
    color: var(--color-danger);
    background-color: var(--color-danger-light);
  }

  &.action-hold {
    color: var(--color-text-tertiary);
    background-color: var(--color-bg-light);
  }
}
</style>
