// app/stores/useGrammarStore.ts
import { defineStore } from 'pinia'
import type { GrammarPoint, GrammarScores } from '~/types/grammar'

export const useGrammarStore = defineStore('grammar', {
  state: () => ({
    points: [] as GrammarPoint[],
    scores: {} as GrammarScores,
    loaded: false as boolean
  }),
  getters: {
    all: (s) => s.points,
    byLevel: (s) => (level: string) => s.points.filter(p => p.level === level)
  },
  actions: {
    setPoints(points: GrammarPoint[]) {
      this.points = points.map(p => ({ ...p, userScore: this.scores[p.grammarPoint] ?? p.userScore ?? 0 }))
      this.loaded = true
    },
    setScore(grammarPoint: string, score: number) {
      const idx = this.points.findIndex(p => p.grammarPoint === grammarPoint)
      if (idx !== -1) {
        const val = Math.max(0, Math.min(100, score))
        const point = this.points[idx]
        if (point) {
          point.userScore = val
          this.scores[grammarPoint] = val
          if (import.meta.client) localStorage.setItem('grammarScores', JSON.stringify(this.scores))
        }
      }
    },
    loadScores() {
      if (import.meta.client) {
        try {
          const saved = localStorage.getItem('grammarScores')
          if (saved) this.scores = JSON.parse(saved)
          if (this.points.length) {
            this.points = this.points.map(p => ({ ...p, userScore: this.scores[p.grammarPoint] ?? 0 }))
          }
        } catch {
          this.scores = {}
        }
      }
    },
    resetScores() {
      this.points = this.points.map(p => ({ ...p, userScore: 0 }))
      this.scores = {}
      if (import.meta.client) localStorage.removeItem('grammarScores')
    }
  },
  persist: true
})