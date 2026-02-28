import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Fund } from './funds'

export const useFundDrawerStore = defineStore('fundDrawer', () => {
  const visible = ref(false)
  const editingFund = ref<Fund | null>(null)

  const open = (fund?: Fund) => {
    editingFund.value = fund ?? null
    visible.value = true
  }

  const close = () => {
    visible.value = false
    editingFund.value = null
  }

  const isEditMode = () => !!editingFund.value

  return {
    visible,
    editingFund,
    open,
    close,
    isEditMode,
  }
})
