// composables/useStats.ts
export const useStats = () => {
  const history = useState<{ timestamp: number; feedback: string; score: number }[]>('history', () => [])

  const addAttempt = (feedback: 'easy' | 'okay' | 'hard', difficulty: number) => {
    history.value.push({ timestamp: Date.now(), feedback, score: difficulty })
    if (import.meta.client) localStorage.setItem('readerHistory', JSON.stringify(history.value))
  }

  const loadHistory = () => {
    if (import.meta.client) {
      const saved = localStorage.getItem('readerHistory')
      if (saved) history.value = JSON.parse(saved)
    }
  }

  const getAverageDifficulty = () => {
    if (history.value.length === 0) return 10
    return history.value.reduce((a, b) => a + b.score, 0) / history.value.length
  }

  const getConsistency = () => {
    if (history.value.length < 2) return 1
    const scores = history.value.map(h => h.score)
    const mean = getAverageDifficulty()
    const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length
    const stdDev = Math.sqrt(variance)
    return (1 - Math.min(stdDev / 100, 1)).toFixed(2)
  }

  return {
    history,
    addAttempt,
    loadHistory,
    getAverageDifficulty,
    getConsistency
  }
}