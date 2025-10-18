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

        try {
          const cleaned = accumulatedText
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')

          // Extract complete "text" values progressively
          const textRegex = /"text"\s*:\s*"([^"]*)"/g
          let match
          let extractedTexts: string[] = []
          while ((match = textRegex.exec(cleaned)) !== null) {
            if (match[1] !== undefined) {
              extractedTexts.push(match[1])
            }
          }

          if (extractedTexts.length > 0) {
            streamingText.value = extractedTexts.join('。') + '…'
          }

          // Try full parse for rawSentences when possible
          const fullCleaned = cleaned.replace(/^[^{]*/, '').replace(/[^}]*$/, '').trim()
          if (fullCleaned.startsWith('{') && fullCleaned.endsWith('}')) {
            const parsed = JSON.parse(fullCleaned)
            if (parsed.sentences && Array.isArray(parsed.sentences)) {
              rawSentences = parsed.sentences
              streamingText.value = parsed.sentences.map((s: any) => s.text).join('。')
            }
          }
        } catch (e) {
          // Ignore partial parse errors, keep showing extracted text
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