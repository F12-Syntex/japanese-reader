// app/stores/useDifficultyStore.ts
import { defineStore } from 'pinia'
import type { DifficultyFeedback } from '~/types/difficulty'

export const useDifficultyStore = defineStore('difficulty', {
  state: () => ({
    score: 10 as number
  }),
  actions: {
    load() {
      if (import.meta.client) {
        const saved = localStorage.getItem('difficulty')
        if (saved) this.score = parseFloat(saved)
      }
    },
    set(score: number) {
      this.score = Math.max(0, Math.min(100, score))
      if (import.meta.client) localStorage.setItem('difficulty', String(this.score))
    },
    adjust(feedback: DifficultyFeedback) {
      const delta = feedback === 'easy' ? 1 : feedback === 'hard' ? -1 : 0.5
      this.set(this.score + delta)
    }
  },
  persist: true
})