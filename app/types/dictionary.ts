/**
 * Type definitions for simplified kanji meanings database
 */

export interface KanjiMeaning {
  kanji: string
  meanings: string[]
}

export interface DictionarySearchResult {
  kanji: string
  meanings: string[]
}