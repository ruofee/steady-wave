<script setup lang="ts">
import Sidebar from './Sidebar.vue'
</script>

<template>
  <div class="layout">
    <Sidebar class="sidebar" />
    <main class="main-content">
      <slot />
    </main>
  </div>
</template>

<style lang="scss" scoped>
.layout {
  display: flex;
  padding-left: 80px;
  height: 100vh;

  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 100;
  }
}

.main-content {
  height: 100vh;
  flex: 1;
}
</style>
