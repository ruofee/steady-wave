<script setup lang="ts">
import dashboardIcon from '@/assets/icons/dashboard.svg'
import portfolioAnalysisIcon from '@/assets/icons/portfolioAnalysis.svg'
import aiLabIcon from '@/assets/icons/aiLab.svg'
import settingIcon from '@/assets/icons/setting.svg'

const navItems = [
  { path: '/dashboard', icon: dashboardIcon },
  { path: '/transparency', icon: portfolioAnalysisIcon },
  { path: '/ai-lab', icon: aiLabIcon },
  { path: '/assets', icon: settingIcon },
]
</script>

<template>
  <aside class="sidebar">
    <nav class="sidebar-nav">
      <RouterLink
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="nav-btn"
      >
        <img :src="item.icon" alt="" />
      </RouterLink>
    </nav>
  </aside>
</template>

<style lang="scss" scoped>
.sidebar {
  padding-top: 24px;
  width: 80px;
  min-height: 100vh;
  background-color: #0f172a;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;

  &-nav {
    display: flex;
    flex-direction: column;
    padding: 0.75rem 0;
    gap: 0.75rem;
    align-items: center;
  }
}

.nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 10px;
  text-decoration: none;
  transition: background-color 0.2s;

  img {
    width: 22px;
    height: 22px;
    filter: invert(1);
    opacity: 0.6;
    transition: opacity 0.2s;
  }

  &:hover {
    background-color: rgba(255, 255, 255, 0.08);

    img {
      opacity: 1;
    }
  }

  &.router-link-active {
    background-color: #4f6ef7;

    img {
      opacity: 1;
    }
  }
}
</style>
