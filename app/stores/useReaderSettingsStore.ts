// app/stores/useReaderSettingsStore.ts
import { defineStore } from 'pinia'
import type { ReaderSettings } from '~/types/reader'
import { defaultReaderSettings } from '~/types/reader'

export const useReaderSettingsStore = defineStore('readerSettings', {
  state: (): { settings: ReaderSettings } => ({
    settings: { ...defaultReaderSettings }
  }),
  actions: {
    load() {
      if (import.meta.client) {
        const saved = localStorage.getItem('readerSettings')
        if (saved) this.settings = { ...defaultReaderSettings, ...JSON.parse(saved) }
      }
    },
    reset() {
      this.settings = { ...defaultReaderSettings }
      if (import.meta.client) localStorage.removeItem('readerSettings')
    }
  },
  persist: true
})