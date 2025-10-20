// File: stores/useItemsStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useItemsStore = defineStore(
  'items',
  () => {
    const items = ref<string[]>([])

    function addItem(item: string) {
      if (item.trim() !== '') {
        items.value.push(item)
      }
    }

    function removeItem(index: number) {
      items.value.splice(index, 1)
    }

    function clear() {
      items.value = []
    }

    return {
      items,
      addItem,
      removeItem,
      clear,
    }
  },
  {
    persist: true,
  }
)