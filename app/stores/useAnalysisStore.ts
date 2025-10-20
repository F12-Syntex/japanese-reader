// app/stores/useAnalysisStore.ts
import { defineStore } from 'pinia'
import type { AnalysisResult } from '~/types/analysis'

export const useAnalysisStore = defineStore('analysis', {
  state: () => ({
    cache: new Map<string, AnalysisResult>()
  }),
  actions: {
    get(key: string) { return this.cache.get(key) || null },
    set(key: string, value: AnalysisResult) { this.cache.set(key, value) },
    clear() { this.cache.clear() }
  }
})