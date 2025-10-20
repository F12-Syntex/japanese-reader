// app/composables/useGrammarCatalog.ts
import { computed } from 'vue'
import { useGrammarStore } from '~/stores/useGrammarStore'
import { useDifficulty } from '~/composables/useDifficulty'
import type { GrammarPoint } from '~/types/grammar'

export const useGrammarCatalog = () => {
  const store = useGrammarStore()
  const { difficulty, adjustDifficulty } = useDifficulty()

  const parseCSVLine = (line: string): [string, string, string, string] | null => {
    const parts: string[] = []
    let inQuotes = false
    let current = ''
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') inQuotes = !inQuotes
      else if (ch === ',' && !inQuotes) { parts.push(current.trim()); current = '' }
      else current += ch
    }
    parts.push(current.trim())
    if (parts.length >= 4) {
      const [level = '', grammarPoint = '', japanese = '', english = ''] = parts
      return [
        level.replace(/"/g, '').trim(),
        grammarPoint.replace(/"/g, '').trim(),
        japanese.replace(/"/g, '').trim(),
        english.replace(/"/g, '').trim().replace(/&amp;#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      ]
    }
    return null
  }

  const loadGrammarPoints = async () => {
    if (store.loaded && store.points.length) return
    try {
      const response = await fetch('/grammar_points.csv')
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const csv = await response.text()
      const lines = csv.trim().split('\n').slice(1)
      const points: GrammarPoint[] = []
      for (const line of lines) {
        if (!line.trim()) continue
        const parsed = parseCSVLine(line)
        if (parsed) {
          const [level, grammarPoint, japanese, english] = parsed
          if (level && grammarPoint && japanese && english) {
            points.push({ level, grammarPoint, japanese, english, userScore: 0 })
          }
        }
      }
      if (!points.length) throw new Error('No grammar points')
      store.loadScores()
      store.setPoints(points)
    } catch (e) {
      store.setPoints([
        { level: 'N5', grammarPoint: 'です', japanese: 'です', english: 'To be', userScore: 0 },
        { level: 'N5', grammarPoint: 'ます', japanese: 'ます', english: 'Polite verb ending', userScore: 0 },
      ])
    }
  }

  const updateScore = (grammarPoint: string, score: number, sessionGrammar?: string[]) => {
    store.setScore(grammarPoint, score)
    if (sessionGrammar && sessionGrammar.includes(grammarPoint)) {
      const val = store.points.find(p => p.grammarPoint === grammarPoint)?.userScore ?? 0
      const delta = val < 40 ? -3 : val < 60 ? -1 : 1
      adjustDifficulty(delta < 0 ? 'hard' : 'easy')
    }
  }

  const getProficiencyForLevel = (level?: string) => {
    const arr = level ? store.byLevel(level) : store.all
    if (!arr.length) return 0
    const avg = arr.reduce((s, p) => s + (p.userScore ?? 0), 0) / arr.length
    return Math.round(avg)
  }

  return {
    grammarPoints: computed(() => store.all),
    userScores: computed(() => store.scores),
    loadGrammarPoints,
    updateScore,
    getProficiencyForLevel,
    getOverallProficiency: () => getProficiencyForLevel(''),
    loadScores: () => store.loadScores(),
    resetScores: () => store.resetScores(),
    getGrammarByLevel: (l: string) => store.byLevel(l)
  }
}