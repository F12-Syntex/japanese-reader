export interface KnownWord {
  readonly word: string
  readonly reading: string
  readonly meaning: string
  readonly pos: string
  readonly interval: number
  readonly reviews: number
  readonly lapses: number
  readonly tags: readonly string[]
  readonly state: string
  readonly isKnown: boolean
}

export interface AnkiFileData {
  fileName: string
  fileSize: number
  fileType: string
  files: Array<{ name: string; size: number }>
  collectionFile: string | null
  tables: string[]
  notes: any[]
  cards: any[]
  models: Record<string, any> | null
  decks: Record<string, any> | null
  modelCount: number
  totalNotes: number
  totalCards: number
}