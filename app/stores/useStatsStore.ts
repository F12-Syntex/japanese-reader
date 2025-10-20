// app/stores/useStatsStore.ts
import { defineStore } from 'pinia'
import type { SessionEntry } from '~/types/stats'

export const useStatsStore = defineStore('stats', {
  state: () => ({
    history: [] as SessionEntry[]
  }),
  getters: {
    averageDifficulty: (s) => s.history.length ? s.history.reduce((a, b) => a + b.score, 0) / s.history.length : 10,
    consistency: (s): number => {
      if (s.history.length < 2) return 1
      const scores = s.history.map(h => h.score)
      const mean = scores.reduce((a, b) => a + b, 0) / scores.length
      const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length
      const std = Math.sqrt(variance)
      return 1 - Math.min(std / 100, 1)
    }
  },
  actions: {
    add(entry: SessionEntry) {
      this.history.push(entry)
      if (import.meta.client) localStorage.setItem('readerHistory', JSON.stringify(this.history))
    },
    load() {
      if (import.meta.client) {
        const saved = localStorage.getItem('readerHistory')
        if (saved) this.history = JSON.parse(saved)
      }
    },
    set(history: SessionEntry[]) {
      this.history = history
      if (import.meta.client) localStorage.setItem('readerHistory', JSON.stringify(this.history))
    },
    clear() {
      this.history = []
      if (import.meta.client) localStorage.removeItem('readerHistory')
    }
  },
  persist: true
})