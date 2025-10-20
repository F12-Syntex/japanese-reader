// app/stores/useFontStore.ts
import { defineStore } from 'pinia'
import type { FontItem } from '~/types/fonts'

export const useFontStore = defineStore('fonts', {
  state: () => ({
    downloadable: [] as FontItem[],
    installed: [{ name: 'System Default', value: 'Noto Sans JP', source: 'system' }] as FontItem[],
    loading: false as boolean
  }),
  getters: {
    downloadableFonts: (s) => s.downloadable,
    installedFonts: (s) => s.installed
  },
  actions: {
    async loadFromGoogle() {
      if (this.downloadable.length) return
      this.loading = true
      try {
        // You can implement your fetch here (or keep mocked)
        // this.downloadable = [...]
      } finally {
        this.loading = false
      }
    },
    installFont(font: FontItem) {
      if (!this.installed.find(f => f.value === font.value)) {
        this.installed.push({ ...font })
      }
    },
    removeFont(fontValue: string) {
      this.installed = this.installed.filter(f => f.value !== fontValue)
    }
  },
  persist: true
})