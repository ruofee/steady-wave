<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { get } from '@/packages/request'

interface FundSearchItem {
  fundCode: string
  fundName: string
  fundType: string
}

interface Props {
  modelValue?: string
  placeholder?: string
  disabled?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'select', fund: FundSearchItem): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '输入代码或基金名称搜索',
  disabled: false,
})

const emit = defineEmits<Emits>()

const searchKeyword = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const searchResults = ref<FundSearchItem[]>([])
const searchLoading = ref(false)
const showDropdown = ref(false)

let searchTimer: ReturnType<typeof setTimeout> | null = null

const searchFunds = async (keyword: string) => {
  if (!keyword.trim()) {
    searchResults.value = []
    showDropdown.value = false
    return
  }

  searchLoading.value = true
  showDropdown.value = true

  try {
    const res = await get<FundSearchItem[]>(`/funds/search?q=${encodeURIComponent(keyword)}&limit=10`)
    searchResults.value = res.data || []
  } catch (error) {
    console.error('搜索基金失败:', error)
    searchResults.value = []
  } finally {
    searchLoading.value = false
  }
}

const selectFund = (fund: FundSearchItem) => {
  searchKeyword.value = `${fund.fundName} (${fund.fundCode})`
  showDropdown.value = false
  emit('select', fund)
}

const handleBlur = () => {
  // 延迟关闭,让点击事件先触发
  setTimeout(() => {
    showDropdown.value = false
  }, 200)
}

const handleFocus = () => {
  if (searchKeyword.value.trim() && searchResults.value.length > 0) {
    showDropdown.value = true
  }
}

watch(searchKeyword, (newVal) => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }

  searchTimer = setTimeout(() => {
    searchFunds(newVal)
  }, 300)
})
</script>

<template>
  <div class="fund-search-input">
    <input
      v-model="searchKeyword"
      type="text"
      class="input"
      :placeholder="placeholder"
      :disabled="disabled"
      autocomplete="off"
      @focus="handleFocus"
      @blur="handleBlur"
    />
    <div v-if="showDropdown && !disabled" class="dropdown">
      <div v-if="searchLoading" class="dropdown-loading">搜索中...</div>
      <template v-else>
        <button
          v-for="item in searchResults"
          :key="item.fundCode"
          type="button"
          class="dropdown-item"
          @click="selectFund(item)"
        >
          <span class="dropdown-name">{{ item.fundName }}</span>
          <span class="dropdown-code">{{ item.fundCode }}</span>
        </button>
        <div
          v-if="searchResults.length === 0 && searchKeyword.trim()"
          class="dropdown-empty"
        >
          未找到相关基金
        </div>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.fund-search-input {
  position: relative;
  width: 100%;
}

.input {
  width: 100%;
  padding: 10px 12px;
  font-size: 0.875rem;
  color: var(--color-text-primary);
  background: var(--color-bg-white);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: var(--color-primary);
  }

  &:disabled {
    background: var(--color-bg);
    cursor: not-allowed;
    opacity: 0.6;
  }

  &::placeholder {
    color: var(--color-text-tertiary);
  }
}

.dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  max-height: 300px;
  overflow-y: auto;
  background: var(--color-bg-white);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;

  &-loading {
    padding: 12px;
    text-align: center;
    font-size: 0.875rem;
    color: var(--color-text-secondary);
  }

  &-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 10px 12px;
    font-size: 0.875rem;
    text-align: left;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background: var(--color-bg);
    }

    &:not(:last-child) {
      border-bottom: 1px solid var(--color-border);
    }
  }

  &-name {
    flex: 1;
    color: var(--color-text-primary);
    font-weight: 500;
  }

  &-code {
    margin-left: 8px;
    color: var(--color-text-tertiary);
    font-size: 0.8125rem;
  }

  &-empty {
    padding: 12px;
    text-align: center;
    font-size: 0.875rem;
    color: var(--color-text-tertiary);
  }
}
</style>
