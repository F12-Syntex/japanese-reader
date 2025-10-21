import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    current: '' as string
  }),
  actions: {
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
    },
    load() {
      if (import.meta.client) {
        const saved = localStorage.getItem('theme')
        if (saved) {
          this.current = saved
          document.documentElement.setAttribute('data-theme', saved)
        }
      }
    }
  },
  persist: true
})