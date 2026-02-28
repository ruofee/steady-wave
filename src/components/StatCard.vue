<script setup lang="ts">
import ProfitIcon from '@/assets/icons/profit.svg?raw'
import LossIcon from '@/assets/icons/loss.svg?raw'

const props = defineProps<{
  title: string
  amount: number
  percentage?: number
  description?: string
}>()

const formatAmount = (amount: number) => {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

const getAmountClass = () => {
  if (props.percentage !== undefined) {
    return props.amount >= 0 ? 'profit' : 'loss'
  }
  return ''
}

const isProfit = () => props.amount >= 0
</script>

<template>
  <div class="stat-card">
    <div class="stat-card-title">{{ title }}</div>
    <div class="stat-card-amount-wrapper">
      <div class="stat-card-amount" :class="getAmountClass()">
        ¥{{ formatAmount(amount) }}
      </div>
      <span v-if="percentage !== undefined" class="stat-card-tag" :class="getAmountClass()">
        <span class="stat-card-icon" v-html="isProfit() ? ProfitIcon : LossIcon" />
        {{ percentage >= 0 ? '+' : '' }}{{ percentage.toFixed(2) }}%
      </span>
    </div>
    <div v-if="description" class="stat-card-description">{{ description }}</div>
  </div>
</template>

<style lang="scss" scoped>
.stat-card {
  padding: 24px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background-color: var(--color-bg-white);

  &-title {
    margin-bottom: 16px;
    font-size: 0.875rem;
    color: var(--color-text-secondary);
  }

  &-amount-wrapper {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }

  &-amount {
    font-size: 2rem;
    font-weight: 600;
    line-height: 1.2;

    &.profit {
      color: var(--color-success);
    }

    &.loss {
      color: var(--color-danger);
    }
  }

  &-tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.875rem;
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

  &-icon {
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

  &-description {
    font-size: 0.75rem;
    color: var(--color-text-tertiary);
  }
}
</style>
