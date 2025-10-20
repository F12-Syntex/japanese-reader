// app/stores/useThemeStore.ts
import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    current: 'forest' as string
  }),
  actions: {
    load() {
      if (import.meta.client) {
        const saved = localStorage.getItem('theme') || 'forest'
        this.current = saved
        document.documentElement.setAttribute('data-theme', saved)
      }
    },
    set(theme: string) {
      this.current = theme
      if (import.meta.client) {
        document.documentElement.setAttribute('data-theme', theme)
        localStorage.setItem('theme', theme)
      }
    },
    resetToSystem() {
      this.current = ''
      if (import.meta.client) {
        document.documentElement.removeAttribute('data-theme')
        localStorage.removeItem('theme')
      }
    }
  },
  persist: true
})