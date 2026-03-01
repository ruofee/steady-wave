<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Page from '@/components/Layout/Page.vue'
import FundSearchInput from '@/components/FundSearchInput.vue'
import StatsCards from './StatsCards.vue'
import FundsPosition from './FundsPosition.vue'
import AssetAllocation from './AssetAllocation.vue'

interface FundSearchItem {
  fundCode: string
  fundName: string
  fundType: string
}

const router = useRouter()
const searchKeyword = ref('')

const handleFundSelect = (fund: FundSearchItem) => {
  // 跳转到基金详情页
  router.push(`/fund/${fund.fundCode}`)
  // 清空搜索关键字
  searchKeyword.value = ''
}
</script>

<template>
  <Page title="Steady Wave Dashboard">
    <template #header-right>
      <div class="search-wrapper">
        <FundSearchInput
          v-model="searchKeyword"
          placeholder="搜索基金"
          @select="handleFundSelect"
        />
      </div>
    </template>
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
.search-wrapper {
  min-width: 260px;
  max-width: 400px;
  
  @media (max-width: 768px) {
    min-width: 200px;
  }
}

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
