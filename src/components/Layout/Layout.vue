<script setup lang="ts">
import Sidebar from './Sidebar.vue'
</script>

<template>
  <div class="layout">
    <Sidebar />
    <main class="main-content">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
  background-color: rgb(248, 249, 251);
}

.main-content {
  flex: 1;
  overflow-y: auto;
}
</style>
