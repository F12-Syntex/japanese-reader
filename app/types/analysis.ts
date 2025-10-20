// app/types/analysis.ts
export interface ColoredWord {
  word: string
  reading: string
  meaning: string
  pos: string
  color: string
}

export interface Connection {
  order: number
  contextBefore: string
  from: string
  fromReading: string
  particle: string
  particleReading: string
  to: string
  toReading: string
  contextAfter: string
  role: string
  explanation: string
  fromColor: string
  toColor: string
  particleColor: string
}

export interface VerbInfo {
  word: string
  reading: string
  meaning: string
}

export interface AnalysisResult {
  translation: string
  storyContext: string
  connections: Connection[]
  coloredWords: ColoredWord[]
  verb: VerbInfo | null
  steps: Array<{ word: string; reading: string; explanation: string }>
  references: Array<{ type: string; element: string; explanation: string }>
}