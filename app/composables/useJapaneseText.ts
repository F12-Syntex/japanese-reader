// composables/useJapaneseText.ts
export const useJapaneseText = () => {
  const japaneseText = useState<any[]>('japaneseText', () => [])
  const isGenerating = useState('isGenerating', () => false)
  const generationError = useState<string | null>('generationError', () => null)
  const streamingText = useState('streamingText', () => '')
  const { streamGenerateText } = useOpenAI()
  const { knownWords } = useAnki()
  const { parseSentences } = useKuromojiParser()

  const generateText = async (level: string = 'N5') => {
    isGenerating.value = true
    generationError.value = null
    japaneseText.value = []
    streamingText.value = ''
    let accumulatedText = ''
    let rawSentences: Array<{ text: string }> = []

    try {
      const knownWordsList = Array.from(knownWords.value.keys())
      
      await streamGenerateText(level, knownWordsList, (chunk: string) => {
        accumulatedText += chunk
        streamingText.value = accumulatedText
        
        try {
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
        } catch (e) {}
      })

      if (rawSentences.length === 0) {
        throw new Error('Failed to parse generated text')
      }

      const parsedSentences = await parseSentences(rawSentences)
      japaneseText.value = parsedSentences

    } catch (error: any) {
      generationError.value = error.message
      console.error('Generation error:', error)
    } finally {
      isGenerating.value = false
      streamingText.value = ''
    }
  }

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
    clearText
  }
}