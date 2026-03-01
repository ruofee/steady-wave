import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Fund } from './funds'

export interface PreFillFund {
  fundName: string
  fundCode: string
  cost?: number  // 预填充的成本价
}

export const useFundDrawerStore = defineStore('fundDrawer', () => {
  const visible = ref(false)
  const editingFund = ref<Fund | null>(null)
  const preFillFund = ref<PreFillFund | null>(null)

  const open = (fund?: Fund) => {
    editingFund.value = fund ?? null
    preFillFund.value = null
    visible.value = true
  }

  const openWithPreFill = (fundInfo: PreFillFund) => {
    editingFund.value = null
    preFillFund.value = fundInfo
    visible.value = true
  }

  const close = () => {
    visible.value = false
    editingFund.value = null
    preFillFund.value = null
  }

  const isEditMode = () => !!editingFund.value

  return {
    visible,
    editingFund,
    preFillFund,
    open,
    openWithPreFill,
    close,
    isEditMode,
  }
})
