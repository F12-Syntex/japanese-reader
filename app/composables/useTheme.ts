// app/composables/useTheme.ts
import { computed } from 'vue'
import { useThemeStore } from '~/stores/useThemeStore'

export const useTheme = () => {
  const store = useThemeStore()
  return {
    currentTheme: computed(() => store.current),
    loadTheme: () => store.load(),
    setTheme: (t: string) => store.set(t),
    resetTheme: () => store.resetToSystem()
  }
}