<script setup lang="ts">
import { onMounted } from 'vue'

import Layout from './components/Layout/index.vue'

import { useDataStore } from './store'

const dataStore = useDataStore()

onMounted(() => {
  dataStore.getData()
})
</script>

<template>
  <Layout>
    <div v-if="dataStore.loading">Loading...</div>
    <RouterView v-else />
  </Layout>
</template>
