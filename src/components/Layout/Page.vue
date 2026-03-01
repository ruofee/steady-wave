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
$header-height: 116px;

.page {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding-top: $header-height;
  background-color: rgb(248, 249, 251);

  &-header {
    position: fixed;
    top: 0;
    left: 80px;
    right: 0;
    padding: 24px 32px;
    height: $header-height;
    border-bottom: 1px solid var(--color-border);
    background-color: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(6px);
    box-sizing: border-box;
    z-index: 100;
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
    color: var(--color-text-tertiary);
  }

  &-container {
    flex: 1;
    padding: 24px;
    background-color: rgb(248, 249, 251);
  }
}
</style>
