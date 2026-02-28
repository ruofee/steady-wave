<script setup lang="ts">
import { computed } from 'vue'
import { useOverviewStore } from '@/store'
import StatCard from '@/components/StatCard.vue'

const overviewStore = useOverviewStore()

const totalPosition = computed(() => overviewStore.overview.totalValue)
const totalProfit = computed(() => overviewStore.overview.totalProfit)
const totalProfitPercentage = computed(() => overviewStore.overview.totalProfitRate)
const todayProfit = computed(() => overviewStore.overview.yesterdayProfit)
const todayProfitPercentage = computed(() => overviewStore.overview.yesterdayProfitRate)

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
      title="昨日盈亏"
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
