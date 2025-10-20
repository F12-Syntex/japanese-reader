import { defineStore } from 'pinia'
import type { ParsedSentence } from '~/types/japanese'

export const useJapaneseTextStore = defineStore('japaneseText', {
  state: () => ({
    sentences: [] as ParsedSentence[],
    streaming: '' as string,
    generating: false as boolean,
    error: null as string | null
  }),
  getters: {
    japaneseText: (s) => s.sentences,
    streamingText: (s) => s.streaming,
    isGenerating: (s) => s.generating
  },
  actions: {
    setGenerating(v: boolean) { this.generating = v },
    setError(msg: string | null) { this.error = msg },
    setStreaming(text: string) { this.streaming = text },
    setSentences(sentences: ParsedSentence[]) { this.sentences = sentences },
    clear() { this.sentences = []; this.streaming = '' }
  }
})