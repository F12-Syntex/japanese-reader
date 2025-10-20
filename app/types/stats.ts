// app/types/stats.ts
export interface SessionEntry {
  timestamp: number
  feedback: 'easy' | 'okay' | 'hard'
  score: number
}