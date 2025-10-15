// composables/useJapaneseText.ts
import { useDifficulty } from './useDifficulty'
import { useStats } from './useStats'

export const useJapaneseText = () => {
  const japaneseText = useState<any[]>('japaneseText', () => [])
  const isGenerating = useState('isGenerating', () => false)
  const generationError = useState<string | null>('generationError', () => null)
  const streamingText = useState('streamingText', () => '')

  const { streamGenerateText } = useOpenAI()
  const { knownWords } = useAnki()
  const { parseSentences } = useKuromojiParser()
  const { difficulty, getLevelFromScore } = useDifficulty()
  const { addAttempt } = useStats()

  /**
   * Generate AI text dynamically based on user proficiency level
   */
  const generateText = async () => {
    isGenerating.value = true
    generationError.value = null
    japaneseText.value = []
    streamingText.value = ''
    let accumulatedText = ''
    let rawSentences: Array<{ text: string }> = []

    try {
      const knownWordsList = Array.from(knownWords.value.keys())

      // Convert difficulty to JLPT-like level for instruction prompt
      const currentLevel = getLevelFromScore(difficulty.value)

      await streamGenerateText(currentLevel, knownWordsList, (chunk: string) => {
        accumulatedText += chunk
        streamingText.value = accumulatedText

        try {
          // Clean streaming response
          const cleaned = accumulatedText
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .replace(/^[^{]*/, '')
            .replace(/[^}]*$/, '')
            .trim()

          if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
            const parsed = JSON.parse(cleaned)
            if (parsed.sentences && Array.isArray(parsed.sentences)) {
              rawSentences = parsed.sentences
            }
          }
        } catch (e) {
          // ignore parse streaming errors
        }
      })

      if (rawSentences.length === 0) {
        throw new Error('Failed to parse generated text from the model')
      }

      // Tokenize and attach grammar tags
      const parsedSentences = await parseSentences(rawSentences)
      japaneseText.value = parsedSentences
    } catch (error: any) {
      generationError.value = error.message || 'Text generation failed'
      console.error('Generation error:', error)
    } finally {
      isGenerating.value = false
      streamingText.value = ''
    }
  }

  /**
   * Record user feedback after reading.
   * Adjust difficulty automatically.
   */
  const giveFeedback = (feedback: 'easy' | 'okay' | 'hard') => {
    const { adjustDifficulty } = useDifficulty()
    adjustDifficulty(feedback)
    addAttempt(feedback, difficulty.value)
  }

  /**
   * Clear current text
   */
  const clearText = () => {
    japaneseText.value = []
    streamingText.value = ''
  }

  return {
    japaneseText: readonly(japaneseText),
    isGenerating: readonly(isGenerating),
    generationError,
    streamingText: readonly(streamingText),
    generateText,
    clearText,
    giveFeedback
  }
}