export interface ParsedWord {
  kanji: string
  kana: string
  meaning: string
  pos: string
  isKnown: boolean
  reading?: string
  jlptLevel?: string
  pitchAccent?: string
  example?: string
  alternativeReadings?: string[]
  alternativeKanji?: string[]
  jmdictId?: string
}

export interface ParsedSentence {
  text: string
  words: ParsedWord[]
  grammar: string[]
}