<script setup lang="ts">
import { onMounted } from 'vue'

import Layout from './components/Layout/index.vue'

import { useFundsStore } from './store'

const fundsStore = useFundsStore()

onMounted(() => {
  fundsStore.fetchFunds()
})
</script>

<template>
  <Layout>
    <div v-if="fundsStore.loading">Loading...</div>
    <RouterView v-else />
  </Layout>
</template>
