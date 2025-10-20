// app/composables/useReaderSettings.ts
import { computed, watch } from 'vue'
import { useReaderSettingsStore } from '~/stores/useReaderSettingsStore'
import { defaultReaderSettings } from '~/types/reader'

export const useReaderSettings = () => {
  const store = useReaderSettingsStore()
  if (import.meta.client) {
    watch(() => store.settings, (s) => {
      localStorage.setItem('readerSettings', JSON.stringify(s))
    }, { deep: true })
  }
  const settings = computed(() => store.settings)
  return {
    settings,
    loadSettings: () => store.load(),
    resetSettings: () => store.reset(),
    defaultSettings: defaultReaderSettings
  }
}