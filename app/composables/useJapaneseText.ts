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

    try {
      const knownList = Array.from(knownWords.value.keys())
      const currentLevel = getLevelFromScore(difficulty.value)

      await streamGenerateText(
        currentLevel,
        knownList,
        (chunk: string) => {
          accumulated += chunk
          store.setStreaming(accumulated)
        },
        async (finalText: string) => {
          try {
            const parsed = JSON.parse(finalText)
            if (!Array.isArray(parsed.sentences)) throw new Error('Invalid response structure')

            const sentences: ParsedSentence[] = await parseSentences(parsed.sentences)
            store.setSentences(sentences)
          } catch (e: any) {
            store.setError(e.message || 'Failed to parse final response')
            console.error('Parse error:', e)
          }
        }
      )
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