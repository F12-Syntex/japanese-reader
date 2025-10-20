// app/types/japanese.ts
export interface ParsedWord {
  kanji: string
  kana: string
  meaning: string
  pos: string
  isKnown: boolean
}

export interface ParsedSentence {
  words: ParsedWord[]
}