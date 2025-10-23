import { ref, readonly } from 'vue'

export const useAnkiStore = defineStore(
  'anki',
  () => {
    const _knownWords = ref<Set<string>>(new Set())
    const isLoading = ref(false)
    const error = ref<string | null>(null)

    const knownWords = computed(() => _knownWords.value)

    const processAnkiFile = async (file: File, apiKey: string): Promise<{ success: boolean; totalWords?: number; error?: string }> => {
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

        const notesResult = db.exec('SELECT id, flds FROM notes')
        const cardsResult = db.exec('SELECT nid, queue, reps FROM cards')

        const reviewedNoteIds = new Set<number>()
        if (cardsResult.length > 0 && cardsResult[0]?.values) {
          cardsResult[0].values.forEach((row: any[]) => {
            const [nid, queue, reps] = row
            if (queue !== 0 && reps > 0) {
              reviewedNoteIds.add(nid as number)
            }
          })
        }

        const japaneseWords = new Set<string>()
        if (notesResult.length > 0 && notesResult[0]?.values) {
          notesResult[0].values.forEach((row: any[]) => {
            const noteId = row[0] as number
            if (!reviewedNoteIds.has(noteId)) return

            const fieldsRaw = row[1] as string
            const fields = fieldsRaw.split('\x1f')

            for (const field of fields) {
              if (!field) continue
              const cleaned = cleanHTML(field)
              const words = extractJapaneseWords(cleaned)
              words.forEach(word => japaneseWords.add(word))
            }
          })
        }

        db.close()

        _knownWords.value = japaneseWords

        if (process.client) {
          localStorage.setItem('ankiKnownWords', JSON.stringify([...japaneseWords]))
        }

        return {
          success: true,
          totalWords: japaneseWords.size
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

    const getKnownWordsList = (): string[] => {
      return [..._knownWords.value]
    }

    const clearAnkiData = (): void => {
      _knownWords.value = new Set()
      if (process.client) {
        localStorage.removeItem('ankiKnownWords')
      }
    }

    const loadFromStorage = (): void => {
      if (process.client) {
        const stored = localStorage.getItem('ankiKnownWords')
        if (stored) {
          try {
            const words = JSON.parse(stored)
            _knownWords.value = new Set(words)
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
      getKnownWordsList,
      clearAnkiData,
      loadFromStorage
    }
  },
  {
    persist: true
  }
)

function cleanHTML(text: string): string {
  return text.replace(/<[^>]*>/g, '').trim()
}

function extractJapaneseWords(text: string): string[] {
  const cleaned = text.replace(/\[[^\]]*\]/g, '').replace(/\([^\)]*\)/g, '')
  const words: string[] = []
  let current = ''

  for (const char of cleaned) {
    const code = char.charCodeAt(0)
    const isJapanese = 
      (code >= 0x3040 && code <= 0x309f) ||
      (code >= 0x30a0 && code <= 0x30ff) ||
      (code >= 0x4e00 && code <= 0x9faf)

    if (isJapanese) {
      current += char
    } else if (current) {
      if (current.length > 1) {
        words.push(current)
      }
      current = ''
    }
  }

  if (current && current.length > 1) {
    words.push(current)
  }

  return words
}