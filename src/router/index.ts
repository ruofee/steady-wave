import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/dashboard',
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('../views/DashboardView/index.vue'),
    },
    {
      path: '/fund/:code',
      name: 'FundDetail',
      component: () => import('../views/FundDetailView/index.vue'),
    },
    {
      path: '/transparency',
      name: 'Transparency',
      component: () => import('../views/TransparencyView.vue'),
    },
    {
      path: '/ai-lab',
      name: 'AILab',
      component: () => import('../views/AILabView.vue'),
    },
    {
      path: '/assets',
      name: 'Assets',
      component: () => import('../views/AssetsView.vue'),
    },
  ],
  scrollBehavior(to, from, savedPosition) {
    // 如果有保存的位置(浏览器前进后退),使用保存的位置
    if (savedPosition) {
      return savedPosition
    }
    
    // 如果有锚点,滚动到锚点位置
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth',
      }
    }
    
    // 否则滚动到顶部,使用平滑滚动
    return {
      top: 0,
      behavior: 'smooth',
    }
  },
})

export default router
