<script setup lang="ts">
defineProps<{
  title: string
}>()

const today = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})
</script>

<template>
  <div class="page">
    <header class="page-header">
      <h1 class="page-title">{{ title }}</h1>
      <span class="page-date">{{ today }}</span>
    </header>
    <div class="page-container">
      <slot name="container" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.page {
  display: flex;
  flex-direction: column;
  height: 100%;

  &-header {
    padding: 24px 32px;
    border-bottom: 1px solid #e2e8f0;
    background-color: #fff;
  }

  &-title {
    margin: 0;
    font-size: 2rem;
    font-weight: 600;
    line-height: 1.2;
  }

  &-date {
    display: block;
    margin-top: 4px;
    font-size: 1rem;
    color: #94a3b8;
  }

  &-container {
    flex: 1;
    padding: 24px;
  }
}
</style>
