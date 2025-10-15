// composables/useAnki.ts
import type { Database } from 'sql.js'
import JSZip from 'jszip'

interface Note {
  id: number
  mid: number
  flds: string
  tags: string
}

interface Card {
  nid: number
  type: number
  queue: number
  ivl: number
  reps: number
  lapses: number
}

interface WordData {
  Expression?: string
  Reading?: string
  Meaning?: string
  Grammar?: string
  [key: string]: string | undefined
}

interface Model {
  name: string
  flds: Array<{ name: string }>
}

export const useAnki = () => {
  const knownWords = useState<Map<string, any>>('knownWords', () => new Map())
  const isLoading = useState('ankiLoading', () => false)
  const error = useState<string | null>('ankiError', () => null)

  const processAnkiFile = async (file: File) => {
    isLoading.value = true
    error.value = null

    try {
      const initSqlJs = (await import('sql.js')).default
      
      const zip = new JSZip()
      const contents = await zip.loadAsync(file)

      const collectionFile = contents.file('collection.anki21') || contents.file('collection.anki2')
      
      if (!collectionFile) {
        throw new Error('No collection database found in file')
      }

      const arrayBuffer = await collectionFile.async('arraybuffer')
      
      const SQL = await initSqlJs({
        locateFile: (filename: string) => `https://sql.js.org/dist/${filename}`
      })

      const db: Database = new SQL.Database(new Uint8Array(arrayBuffer))

      const notesResult = db.exec('SELECT id, mid, flds, tags FROM notes')
      const cardsResult = db.exec('SELECT nid, type, queue, ivl, reps, lapses FROM cards')
      
      const colResult = db.exec('SELECT models FROM col')
      let models: Record<string, Model> | null = null
      if (colResult.length > 0 && colResult[0]?.values?.[0]?.[0]) {
        models = JSON.parse(colResult[0].values[0][0] as string)
      }

      const noteMap = new Map<number, Note>()
      if (notesResult.length > 0 && notesResult[0]?.columns && notesResult[0]?.values) {
        const columns = notesResult[0].columns
        notesResult[0].values.forEach((row: any[]) => {
          const note: any = {}
          columns.forEach((col: string, i: number) => {
            note[col] = row[i]
          })
          noteMap.set(note.id, note as Note)
        })
      }

      const seenWords = new Map<string, any>()
      
      if (cardsResult.length > 0 && cardsResult[0]?.columns && cardsResult[0]?.values) {
        const columns = cardsResult[0].columns
        cardsResult[0].values.forEach((row: any[]) => {
          const card: any = {}
          columns.forEach((col: string, i: number) => {
            card[col] = row[i]
          })

          if ((card as Card).queue === 0 && (card as Card).reps === 0) {
            return
          }

          const note = noteMap.get((card as Card).nid)
          if (!note) return

          const fields = note.flds.split('\x1f')
          const model = models?.[note.mid]
          
          if (!model) return

          const fieldNames = model.flds.map((f: any) => f.name)
          const wordData: WordData = {}
          
          fieldNames.forEach((name: string, idx: number) => {
            wordData[name] = fields[idx] || ''
          })

          if (model.name === 'Japanese-Core') {
            const expression = cleanHTML(wordData.Expression || '')
            const reading = extractReading(wordData.Reading || '')
            const meaning = cleanHTML(wordData.Meaning || '')
            const grammar = wordData.Grammar || ''
            
            if (expression) {
              const cardState = getCardState((card as Card).queue, (card as Card).type)
              
              seenWords.set(expression, {
                word: expression,
                reading: reading,
                meaning: meaning,
                pos: mapGrammarToPos(grammar),
                interval: (card as Card).ivl,
                reviews: (card as Card).reps,
                lapses: (card as Card).lapses,
                tags: note.tags?.trim().split(' ').filter(Boolean) || [],
                state: cardState,
                isKnown: cardState === 'review' || cardState === 'relearning'
              })
            }
          }
        })
      }

      db.close()

      knownWords.value = seenWords

      if (import.meta.client) {
        const serialized = Array.from(seenWords.entries())
        localStorage.setItem('ankiKnownWords', JSON.stringify(serialized))
      }

      return {
        success: true,
        totalWords: seenWords.size
      }
    } catch (err: any) {
      error.value = err.message
      console.error('Anki import error:', err)
      return {
        success: false,
        error: err.message
      }
    } finally {
      isLoading.value = false
    }
  }

  const isWordKnown = (word: string): boolean => {
    return knownWords.value.has(word)
  }

  const getWordData = (word: string) => {
    return knownWords.value.get(word)
  }

  const getKnownWordsList = () => {
    return Array.from(knownWords.value.values())
  }

  const clearAnkiData = () => {
    knownWords.value = new Map()
    if (import.meta.client) {
      localStorage.removeItem('ankiKnownWords')
    }
  }

  const loadFromStorage = () => {
    if (import.meta.client) {
      const stored = localStorage.getItem('ankiKnownWords')
      if (stored) {
        try {
          const entries = JSON.parse(stored)
          knownWords.value = new Map(entries)
        } catch (e) {
          console.error('Failed to load Anki data from storage:', e)
        }
      }
    }
  }

  return {
    knownWords: readonly(knownWords),
    isLoading: readonly(isLoading),
    error: readonly(error),
    processAnkiFile,
    isWordKnown,
    getWordData,
    getKnownWordsList,
    clearAnkiData,
    loadFromStorage
  }
}

function getCardState(queue: number, type: number): string {
  if (queue === -1) return 'suspended'
  if (queue === -2 || queue === -3) return 'buried'
  if (queue === 0) return 'new'
  if (queue === 1) return 'learning'
  if (queue === 2) return 'review'
  if (queue === 3) return 'relearning'
  return 'unknown'
}

function cleanHTML(text: string): string {
  return text.replace(/<[^>]*>/g, '').trim()
}

function extractReading(reading: string): string {
  const match = reading.match(/\[([^\]]+)\]/)
  return match && match[1] ? match[1] : cleanHTML(reading) || ''
}

function mapGrammarToPos(grammar: string): string {
  const lower = grammar.toLowerCase()
  
  if (lower.includes('noun')) return 'noun'
  if (lower.includes('verb')) return 'verb'
  if (lower.includes('adjective')) return 'adjective'
  if (lower.includes('particle')) return 'particle'
  if (lower.includes('adverb')) return 'adverb'
  
  return 'noun'
}