// app/composables/useJapaneseText.ts
import { computed } from 'vue'
import { useJapaneseTextStore } from '~/stores/useJapaneseTextStore'
import { useOpenAI } from '~/composables/useOpenAI'
import { useAnki } from '~/composables/useAnki'
import { useKuromojiParser } from '~/composables/useKuromojiParser'
import { useDifficulty } from '~/composables/useDifficulty'
import { useStats } from '~/composables/useStats'
import type { ParsedSentence } from '~/types/japanese'

export const useJapaneseText = () => {
  const store = useJapaneseTextStore()
  const { streamGenerateText } = useOpenAI()
  const { knownWords } = useAnki()
  const { parseSentences } = useKuromojiParser()
  const { difficulty, getLevelFromScore, adjustDifficulty } = useDifficulty()
  const { addAttempt } = useStats()

  const generateText = async () => {
    store.setGenerating(true)
    store.setError(null)
    store.setSentences([])
    store.setStreaming('')
    let accumulated = ''
    let raw: Array<{ text: string }> = []
    try {
      const knownList = Array.from(knownWords.value.keys())
      const currentLevel = getLevelFromScore(difficulty.value)
      await streamGenerateText(currentLevel, knownList, (chunk: string) => {
        accumulated += chunk
        try {
          const cleaned = accumulated.replace(/```json\n?/g, '').replace(/```\n?/g, '')
          const textRegex = /"text"\s*:\s*"([^"]*)"/g
          let match
          const pieces: string[] = []
          while ((match = textRegex.exec(cleaned)) !== null) {
            if (match[1] !== undefined) pieces.push(match[1])
          }
          if (pieces.length) store.setStreaming(pieces.join('。') + '…')
          const full = cleaned.replace(/^[^{]*/, '').replace(/[^}]*$/, '').trim()
          if (full.startsWith('{') && full.endsWith('}')) {
            const parsed = JSON.parse(full)
            if (Array.isArray(parsed.sentences)) {
              raw = parsed.sentences
              store.setStreaming(parsed.sentences.map((s: any) => s.text).join('。'))
            }
          }
        } catch {}
      })
      if (!raw.length) throw new Error('Failed to parse generated text from the model')
      const parsed: ParsedSentence[] = await parseSentences(raw)
      store.setSentences(parsed)
    } catch (e: any) {
      store.setError(e.message || 'Text generation failed')
      console.error('Generation error:', e)
    } finally {
      store.setGenerating(false)
      store.setStreaming('')
    }
  }

  const giveFeedback = (feedback: 'easy' | 'okay' | 'hard') => {
    adjustDifficulty(feedback)
    addAttempt(feedback, difficulty.value)
  }

  const clearText = () => store.clear()

  return {
    japaneseText: computed(() => store.japaneseText),
    isGenerating: computed(() => store.isGenerating),
    generationError: computed(() => store.error),
    streamingText: computed(() => store.streamingText),
    generateText,
    clearText,
    giveFeedback
  }
}