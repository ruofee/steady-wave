<script setup lang="ts">
import { ref, watch, computed, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useFundDrawerStore, useFundsStore, useDataStore } from '@/store'
import { get } from '@/packages/request'

interface FundSearchItem {
  fundCode: string
  fundName: string
  fundType: string
}

const fundDrawerStore = useFundDrawerStore()
const fundsStore = useFundsStore()
const dataStore = useDataStore()

const { visible, editingFund } = storeToRefs(fundDrawerStore)

const searchKeyword = ref('')
const searchResults = ref<FundSearchItem[]>([])
const searchLoading = ref(false)
const showDropdown = ref(false)
const selectedFund = ref<FundSearchItem | null>(null)
const cost = ref<number | ''>('')
const shares = ref<number | ''>('')

let searchTimer: ReturnType<typeof setTimeout> | null = null
const DEBOUNCE_MS = 300

const doSearch = async () => {
  const q = searchKeyword.value.trim()
  if (!q) {
    searchResults.value = []
    return
  }
  searchLoading.value = true
  try {
    const res = await get<FundSearchItem[]>('/funds/search', {
      params: { q, limit: 20 },
    })
    searchResults.value = res.data ?? []
  } catch {
    searchResults.value = []
  } finally {
    searchLoading.value = false
  }
}

const scheduleSearch = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(doSearch, DEBOUNCE_MS)
}

const selectFund = (item: FundSearchItem) => {
  selectedFund.value = item
  searchKeyword.value = item.fundName
  searchResults.value = []
  showDropdown.value = false
}

watch(searchKeyword, (val) => {
  if (!val.trim()) {
    selectedFund.value = null
    searchResults.value = []
    showDropdown.value = false
    return
  }
  if (!selectedFund.value || (selectedFund.value.fundName !== val && selectedFund.value.fundCode !== val)) {
    selectedFund.value = null
  }
  showDropdown.value = true
  scheduleSearch()
})

const title = computed(() => (editingFund.value ? '编辑基金' : '新增基金'))

const submitting = ref(false)
const submitError = ref('')

const resetForm = () => {
  searchKeyword.value = ''
  selectedFund.value = null
  searchResults.value = []
  cost.value = ''
  shares.value = ''
  submitError.value = ''
}

const handleClose = () => {
  resetForm()
  fundDrawerStore.close()
}

const handleConfirm = async () => {
  const costNum = typeof cost.value === 'number' ? cost.value : parseFloat(String(cost.value))
  const sharesNum = typeof shares.value === 'number' ? shares.value : parseFloat(String(shares.value))
  
  if (Number.isNaN(costNum) || costNum <= 0) {
    submitError.value = '请输入有效的持仓成本价'
    return
  }
  
  if (Number.isNaN(sharesNum) || sharesNum <= 0) {
    submitError.value = '请输入有效的持仓数量'
    return
  }
  
  submitting.value = true
  submitError.value = ''
  
  try {
    if (editingFund.value) {
      // 编辑模式：更新基金
      await fundsStore.updateFund(editingFund.value.fundCode, {
        cost: costNum,
        shares: sharesNum,
      })
    } else {
      // 新增模式：添加基金
      const fund = selectedFund.value
      if (!fund) {
        submitError.value = '请选择基金'
        return
      }
      
      await fundsStore.addFund({
        fundName: fund.fundName,
        fundCode: fund.fundCode,
        cost: costNum,
        shares: sharesNum,
      })
    }
    
    await dataStore.getData({ isLoading: false })
    handleClose()
  } catch (e) {
    submitError.value = e instanceof Error ? e.message : '提交失败'
  } finally {
    submitting.value = false
  }
}

const handleDrawerClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.fund-drawer-search-wrap')) {
    showDropdown.value = false
  }
}

watch(visible, (v) => {
  if (v) {
    if (editingFund.value) {
      selectedFund.value = {
        fundCode: editingFund.value.fundCode,
        fundName: editingFund.value.fundName,
        fundType: '',
      }
      searchKeyword.value = `${editingFund.value.fundName} (${editingFund.value.fundCode})`
      cost.value = editingFund.value.cost
      shares.value = editingFund.value.shares
    } else {
      resetForm()
    }
  }
})

onUnmounted(() => {
  if (searchTimer) clearTimeout(searchTimer)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer-mask">
      <div v-if="visible" class="fund-drawer-mask" @click.self="handleClose">
        <div class="fund-drawer" @click="handleDrawerClick">
          <div class="fund-drawer-header">
            <h3 class="fund-drawer-title">{{ title }}</h3>
            <button type="button" class="fund-drawer-close" aria-label="关闭" @click="handleClose">
              ×
            </button>
          </div>
          <div class="fund-drawer-body">
            <div class="fund-drawer-field fund-drawer-search-wrap">
              <label class="fund-drawer-label">基金</label>
              <input
                v-model="searchKeyword"
                type="text"
                class="fund-drawer-input"
                placeholder="输入代码或基金名称搜索"
                :disabled="!!editingFund"
                autocomplete="off"
              />
              <div v-if="showDropdown && !editingFund" class="fund-drawer-dropdown">
                <div v-if="searchLoading" class="fund-drawer-dropdown-loading">搜索中...</div>
                <template v-else>
                  <button
                    v-for="item in searchResults"
                    :key="item.fundCode"
                    type="button"
                    class="fund-drawer-dropdown-item"
                    @click="selectFund(item)"
                  >
                    <span class="fund-drawer-dropdown-name">{{ item.fundName }}</span>
                    <span class="fund-drawer-dropdown-code">{{ item.fundCode }}</span>
                  </button>
                  <div
                    v-if="searchResults.length === 0 && searchKeyword.trim()"
                    class="fund-drawer-dropdown-empty"
                  >
                    未找到相关基金
                  </div>
                </template>
              </div>
            </div>
            <div class="fund-drawer-field">
              <label class="fund-drawer-label">持仓成本价</label>
              <input
                v-model.number="cost"
                type="number"
                class="fund-drawer-input"
                placeholder="请输入成本价"
                step="0.0001"
                min="0"
              />
            </div>
            <div class="fund-drawer-field">
              <label class="fund-drawer-label">持仓数量</label>
              <input
                v-model.number="shares"
                type="number"
                class="fund-drawer-input"
                placeholder="请输入持仓数量"
                step="0.01"
                min="0"
              />
            </div>
            <div v-if="submitError" class="fund-drawer-error">{{ submitError }}</div>
          </div>
          <div class="fund-drawer-footer">
            <button
              type="button"
              class="fund-drawer-btn fund-drawer-btn-primary"
              :disabled="submitting"
              @click="handleConfirm"
            >
              {{ submitting ? '提交中...' : '确认' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.fund-drawer-mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: flex-end;
}

.fund-drawer {
  width: 400px;
  max-width: 100%;
  height: 100%;
  background: var(--color-bg-white, #fff);
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  animation: drawer-slide 0.25s ease-out;
}

@keyframes drawer-slide {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.drawer-mask-enter-active,
.drawer-mask-leave-active {
  transition: opacity 0.2s ease;
}
.drawer-mask-enter-from,
.drawer-mask-leave-to {
  opacity: 0;
}
.drawer-mask-enter-active .fund-drawer,
.drawer-mask-leave-active .fund-drawer {
  transition: transform 0.25s ease-out;
}
.drawer-mask-leave-to .fund-drawer {
  transform: translateX(100%);
}

.fund-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border, #eee);
}

.fund-drawer-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary, #1a1a1a);
}

.fund-drawer-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  font-size: 1.5rem;
  line-height: 1;
  color: var(--color-text-secondary, #666);
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.2s, color 0.2s;

  &:hover {
    background: var(--color-bg-light, #f5f5f5);
    color: var(--color-text-primary, #1a1a1a);
  }
}

.fund-drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.fund-drawer-field {
  margin-bottom: 20px;
  position: relative;
}

.fund-drawer-label {
  display: block;
  margin-bottom: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary, #666);
}

.fund-drawer-input {
  width: 95%;
  padding: 10px 12px;
  font-size: 0.9375rem;
  border: 1px solid var(--color-border, #e0e0e0);
  border-radius: 6px;
  background: var(--color-bg-white, #fff);
  color: var(--color-text-primary, #1a1a1a);
  transition: border-color 0.2s;

  &::placeholder {
    color: var(--color-text-tertiary, #999);
  }
  &:focus {
    outline: none;
    border-color: var(--color-primary, #2563eb);
  }
  &:disabled {
    background: var(--color-bg-light, #f5f5f5);
    cursor: not-allowed;
  }
}

.fund-drawer-search-wrap {
  position: relative;
}

.fund-drawer-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  max-height: 280px;
  overflow-y: auto;
  background: var(--color-bg-white, #fff);
  border: 1px solid var(--color-border, #e0e0e0);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  z-index: 10;
}

.fund-drawer-dropdown-loading,
.fund-drawer-dropdown-empty {
  padding: 16px;
  font-size: 0.875rem;
  color: var(--color-text-tertiary, #999);
  text-align: center;
}

.fund-drawer-dropdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: none;
  font-size: 0.875rem;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: var(--color-bg-light, #f5f5f5);
  }
}

.fund-drawer-dropdown-name {
  flex: 1;
  color: var(--color-text-primary, #1a1a1a);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fund-drawer-dropdown-code {
  margin-left: 12px;
  font-size: 0.8125rem;
  color: var(--color-text-tertiary, #999);
  flex-shrink: 0;
}

.fund-drawer-error {
  margin-top: 12px;
  font-size: 0.875rem;
  color: var(--color-danger, #dc2626);
}

.fund-drawer-footer {
  padding: 20px 24px;
  border-top: 1px solid var(--color-border, #eee);
}

.fund-drawer-btn {
  width: 100%;
  padding: 12px 20px;
  font-size: 0.9375rem;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s, opacity 0.2s;

  &-primary {
    border: none;
    background: var(--color-primary, #2563eb);
    color: #fff;

    &:hover:not(:disabled) {
      background: var(--color-primary-hover, #1d4ed8);
    }
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}
</style>
