// app/composables/useStats.ts
import { computed } from 'vue'
import { useStatsStore } from '~/stores/useStatsStore'

export const useStats = () => {
  const store = useStatsStore()
  return {
    history: computed(() => store.history),
    addAttempt: (feedback: 'easy' | 'okay' | 'hard', difficulty: number) =>
      store.add({ timestamp: Date.now(), feedback, score: difficulty }),
    loadHistory: () => store.load(),
    getAverageDifficulty: () => store.averageDifficulty,
    getConsistency: () => store.consistency
  }
}