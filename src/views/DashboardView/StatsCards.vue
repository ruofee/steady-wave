<script setup lang="ts">
import StatCard from '@/components/StatCard.vue'

const totalPosition = 125680.50
const totalProfit = 8560.30
const totalProfitPercentage = 7.32
const todayProfit = -1250.80
const todayProfitPercentage = -0.99
</script>

<template>
  <div class="dashboard-stats">
    <StatCard
      title="总持仓金额"
      :amount="totalPosition"
      description="截至今日的总持仓金额"
    />
    <StatCard
      title="总盈亏"
      :amount="totalProfit"
      :percentage="totalProfitPercentage"
      description="累计盈亏情况"
    />
    <StatCard
      title="今日盈亏"
      :amount="todayProfit"
      :percentage="todayProfitPercentage"
      description="今日交易盈亏"
    />
  </div>
</template>

<style lang="scss" scoped>
.dashboard-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}
</style>
