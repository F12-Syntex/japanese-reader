// app/stores/useApiKeyStore.ts
import { defineStore } from 'pinia'

export const useApiKeyStore = defineStore('apiKey', {
  state: () => ({ key: '' as string }),
  actions: {
    load() {
      if (import.meta.client) this.key = localStorage.getItem('openai_api_key') || ''
    },
    set(k: string) {
      this.key = k
      if (import.meta.client) localStorage.setItem('openai_api_key', k)
    },
    clear() {
      this.key = ''
      if (import.meta.client) localStorage.removeItem('openai_api_key')
    }
  },
  persist: true
})