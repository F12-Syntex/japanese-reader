// app/types/grammar.ts
export interface GrammarPoint {
  level: string
  grammarPoint: string
  japanese: string
  english: string
  userScore?: number
}

export type GrammarScores = Record<string, number>