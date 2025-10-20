import { ref, readonly } from 'vue'
import type { KnownWord } from '~/types/anki'

export const useAnkiStore = defineStore(
  'anki',
  () => {
    const _knownWords = ref<Map<string, KnownWord>>(new Map())
    const isLoading = ref(false)
    const error = ref<string | null>(null)

    const knownWords = computed(() => _knownWords.value)

    const processAnkiFile = async (file: File): Promise<{ success: boolean; totalWords?: number; error?: string }> => {
      isLoading.value = true
      error.value = null

      try {
        const initSqlJs = (await import('sql.js')).default
        const JSZip = (await import('jszip')).default

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

        const db = new SQL.Database(new Uint8Array(arrayBuffer))

        const notesResult = db.exec('SELECT id, mid, flds, tags FROM notes')
        const cardsResult = db.exec('SELECT nid, type, queue, ivl, reps, lapses FROM cards')

        const colResult = db.exec('SELECT models FROM col')
        let models: Record<string, any> | null = null
        if (colResult.length > 0 && colResult[0]?.values?.[0]?.[0]) {
          models = JSON.parse(colResult[0].values[0][0] as string)
        }

        const noteMap = new Map<number, any>()
        if (notesResult.length > 0 && notesResult[0]?.columns && notesResult[0]?.values) {
          const columns = notesResult[0].columns
          notesResult[0].values.forEach((row: any[]) => {
            const note: Record<string, any> = {}
            columns.forEach((col: string, i: number) => {
              note[col] = row[i]
            })
            noteMap.set(note.id, note)
          })
        }

        const seenWords = new Map<string, KnownWord>()

        if (cardsResult.length > 0 && cardsResult[0]?.columns && cardsResult[0]?.values) {
          const columns = cardsResult[0].columns
          cardsResult[0].values.forEach((row: any[]) => {
            const card: Record<string, any> = {}
            columns.forEach((col: string, i: number) => {
              card[col] = row[i]
            })

            if (card.queue === 0 && card.reps === 0) {
              return
            }

            const note = noteMap.get(card.nid)
            if (!note) return

            const fields = note.flds.split('\x1f')
            const model = models?.[note.mid]

            if (!model) return

            const fieldNames = model.flds.map((f: any) => f.name)
            const wordData: Record<string, string> = {}

            fieldNames.forEach((name: string, idx: number) => {
              wordData[name] = fields[idx] || ''
            })

            if (model.name === 'Japanese-Core') {
              const expression = cleanHTML(wordData.Expression || '')
              const reading = extractReading(wordData.Reading || '')
              const meaning = cleanHTML(wordData.Meaning || '')
              const grammar = wordData.Grammar || ''

              if (expression) {
                const cardState = getCardState(card.queue, card.type)

                seenWords.set(expression, {
                  word: expression,
                  reading: reading,
                  meaning: meaning,
                  pos: mapGrammarToPos(grammar),
                  interval: card.ivl,
                  reviews: card.reps,
                  lapses: card.lapses,
                  tags: note.tags?.trim().split(' ').filter(Boolean) || [],
                  state: cardState,
                  isKnown: cardState === 'review' || cardState === 'relearning'
                })
              }
            }
          })
        }

        db.close()

        _knownWords.value = seenWords

        if (process.client) {
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
      return _knownWords.value.has(word)
    }

    const getWordData = (word: string): KnownWord | undefined => {
      return _knownWords.value.get(word)
    }

    const getKnownWordsList = (): KnownWord[] => {
      return Array.from(_knownWords.value.values())
    }

    const clearAnkiData = (): void => {
      _knownWords.value = new Map()
      if (process.client) {
        localStorage.removeItem('ankiKnownWords')
      }
    }

    const loadFromStorage = (): void => {
      if (process.client) {
        const stored = localStorage.getItem('ankiKnownWords')
        if (stored) {
          try {
            const entries = JSON.parse(stored)
            _knownWords.value = new Map(entries)
          } catch (e) {
            console.error('Failed to load Anki data from storage:', e)
          }
        }
      }
    }

    return {
      knownWords,
      isLoading: readonly(isLoading),
      error: readonly(error),
      processAnkiFile,
      isWordKnown,
      getWordData,
      getKnownWordsList,
      clearAnkiData,
      loadFromStorage
    }
  },
  {
    persist: true
  }
)

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