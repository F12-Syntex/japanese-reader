// app/composables/useFonts.ts
import { computed, onMounted, watch } from 'vue'
import { useFontStore } from '~/stores/useFontStore'

export const useFonts = () => {
  const store = useFontStore()
  
  onMounted(() => {
    store.loadInstalledFontsOnMount()
  })
  
  // Watch for changes and persist
  watch(() => store.installedFonts, () => {
    store.persistInstalledFonts()
  }, { deep: true })
  
  return {
    downloadableFonts: computed(() => store.downloadableFonts),
    installedFonts: computed(() => store.installedFonts),
    isLoadingFont: computed(() => store.loading),
    installFont: (font: any) => store.installFont(font),
    removeFont: (value: string) => store.removeFont(value)
  }
}