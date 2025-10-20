import { $fetch } from 'ofetch'

export interface GrammarPoint {
  level: string
  grammarPoint: string
  japanese: string
  english: string
}

let cachedGrammarPoints: GrammarPoint[] | null = null

export const loadGrammarPoints = async (baseUrl: string): Promise<GrammarPoint[]> => {
  if (cachedGrammarPoints) return cachedGrammarPoints

  try {
    const csv = await $fetch<string>(`${baseUrl}/grammar_points.csv`)
    const lines = csv.split('\n').filter((l: string) => l.trim())
    
    cachedGrammarPoints = lines.slice(1).map((line: string) => {
      const [level, grammarPoint, japanese, english] = line.split(',').map(s => s.trim())
      return { level, grammarPoint, japanese, english }
    })

    return cachedGrammarPoints
  } catch (error) {
    console.error('Failed to load grammar points:', error)
    return []
  }
}

export const getGrammarByLevel = (level: string, points: GrammarPoint[]) => {
  return points
    .filter(p => p.level === level)
    .map(p => ({
      point: p.grammarPoint,
      japanese: p.japanese,
      english: p.english
    }))
}