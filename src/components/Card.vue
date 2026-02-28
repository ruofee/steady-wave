<script setup lang="ts">
defineProps<{
  title?: string
}>()
</script>

<template>
  <div class="card">
    <div v-if="title" class="card-title">{{ title }}</div>
    <div class="card-content">
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.card {
  padding: 24px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background-color: var(--color-bg-white);

  &-title {
    margin-bottom: 16px;
    font-size: 1.25rem;
    font-weight: 600;
  }

  &-content {
    font-size: 1rem;
    line-height: 1.5;
  }
}
</style>
