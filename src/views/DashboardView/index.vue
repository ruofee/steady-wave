<script setup lang="ts">
import Page from '@/components/Layout/Page.vue'
import StatsCards from './StatsCards.vue'
import FundsPosition from './FundsPosition.vue'
import AssetAllocation from './AssetAllocation.vue'
</script>

<template>
  <Page title="Steady Wave Dashboard">
    <template #container>
      <StatsCards />
      <div class="dashboard-content">
        <FundsPosition />
        <!-- <FundsPosition />
        <AssetAllocation /> -->
      </div>
    </template>
  </Page>
</template>

<style lang="scss" scoped>
.dashboard-content {
  // display: grid;
  // grid-template-columns: minmax(300px, 60%) 1fr;
  // gap: 24px;
  margin-top: 24px;

  // @media (max-width: 768px) {
  //   grid-template-columns: 1fr;
  // }

  // @media (min-width: 769px) and (max-width: 1200px) {
  //   grid-template-columns: minmax(300px, 1fr);
  // }
}

@container (max-width: 500px) {
  .dashboard-content {
    grid-template-columns: 1fr;
  }
}
</style>
