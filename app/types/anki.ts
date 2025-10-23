export interface KnownWord {
  readonly word: string
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