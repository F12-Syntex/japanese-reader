// app/composables/useFonts.ts
import { computed } from 'vue'
import { useFontStore } from '~/stores/useFontStore'

export const useFonts = () => {
  const store = useFontStore()
  return {
    downloadableFonts: computed(() => store.downloadableFonts),
    installedFonts: computed(() => store.installedFonts),
    isLoadingFont: computed(() => store.loading),
    loadDownloadableFonts: () => store.loadFromGoogle(),
    installFont: (font: any) => store.installFont(font),
    removeFont: (value: string) => store.removeFont(value)
  }
}