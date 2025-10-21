import { defineStore } from 'pinia'

interface WordMetadata {
  kanji: string
  kana?: string
  reading?: string
  meaning?: string
  pos?: string
  jlptLevel?: string
  pitchAccent?: string
  example?: string
}

interface State {
  cache: Record<string, WordMetadata>
}

export const useWordMetadataStore = defineStore('wordMetadata', {
  state: (): State => ({
    cache: {}
  }),

  getters: {
    getWord: (state) => (kanji: string): WordMetadata | null => {
      return state.cache[kanji] || null
    },
    hasWord: (state) => (kanji: string): boolean => {
      return kanji in state.cache
    }
  },

  actions: {
    setWord(kanji: string, metadata: WordMetadata): void {
      this.cache[kanji] = metadata
      if (import.meta.client) {
        this.persistCache()
      }
    },

    setWords(words: Record<string, WordMetadata>): void {
      this.cache = { ...this.cache, ...words }
      if (import.meta.client) {
        this.persistCache()
      }
    },

    loadCache(): void {
      if (import.meta.client) {
        const saved = localStorage.getItem('wordMetadataCache')
        if (saved) {
          try {
            this.cache = JSON.parse(saved)
          } catch (error) {
            console.error('Failed to parse word metadata cache:', error)
          }
        }
      }
    },

    persistCache(): void {
      if (import.meta.client) {
        localStorage.setItem('wordMetadataCache', JSON.stringify(this.cache))
      }
    },

    clearCache(): void {
      this.cache = {}
      if (import.meta.client) {
        localStorage.removeItem('wordMetadataCache')
      }
    }
  }
})