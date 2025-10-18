// composables/useDifficulty.ts
export const useDifficulty = () => {
  const difficulty = useState<number>('difficulty', () => 10) // starts near N5

  /** Convert numeric difficulty to JLPT label */
  const getLevelFromScore = (score: number): string => {
    if (score <= 15) return 'N5'
    if (score <= 30) return 'N4'
    if (score <= 45) return 'N3'
    if (score <= 60) return 'N2'
    if (score <= 75) return 'N1'
    return 'Native'
  }

  const adjustDifficulty = (feedback: 'easy' | 'okay' | 'hard') => {
    const delta = feedback === 'easy' ? 5 : feedback === 'hard' ? -5 : 0
    difficulty.value = Math.max(0, Math.min(100, difficulty.value + delta))
    if (import.meta.client) localStorage.setItem('difficulty', String(difficulty.value))
  }

  const setDifficulty = (newScore: number) => {
    difficulty.value = Math.max(0, Math.min(100, newScore))
    if (import.meta.client) localStorage.setItem('difficulty', String(difficulty.value))
  }

  const loadDifficulty = () => {
    if (import.meta.client) {
      const saved = localStorage.getItem('difficulty')
      if (saved) difficulty.value = parseFloat(saved)
    }
  }

  const getProficiencyDescription = (score: number) => {
    const level = getLevelFromScore(score)
    return `${level} (${score.toFixed(1)}/100)`
  }

  return {
    difficulty,
    adjustDifficulty,
    setDifficulty,
    loadDifficulty,
    getLevelFromScore,
    getProficiencyDescription
  }
}