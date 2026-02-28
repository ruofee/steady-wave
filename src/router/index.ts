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
      component: () => import('../views/DashboardView.vue'),
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
})

export default router
