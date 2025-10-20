// app/composables/useDifficulty.ts
import { computed } from 'vue'
import { useDifficultyStore } from '~/stores/useDifficultyStore'

export const useDifficulty = () => {
  const store = useDifficultyStore()
  const difficulty = computed(() => store.score)

  const getLevelFromScore = (score: number): string => {
    if (score <= 15) return 'N5'
    if (score <= 30) return 'N4'
    if (score <= 45) return 'N3'
    if (score <= 60) return 'N2'
    if (score <= 75) return 'N1'
    return 'Native'
  }

  const getProficiencyDescription = (score: number) => `${getLevelFromScore(score)} (${score.toFixed(1)}/100)`

  return {
    difficulty,
    adjustDifficulty: (f: 'easy' | 'okay' | 'hard') => store.adjust(f),
    setDifficulty: (n: number) => store.set(n),
    loadDifficulty: () => store.load(),
    getLevelFromScore,
    getProficiencyDescription
  }
}