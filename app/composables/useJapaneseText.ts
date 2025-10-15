export const useJapaneseText = () => {
  const japaneseText = useState<any[]>('japaneseText', () => [])
  const isGenerating = useState('isGenerating', () => false)
  const generationError = useState<string | null>('generationError', () => null)
  const { streamGenerateText } = useOpenAI()

  const generateText = async (level: string = 'N5') => {
    isGenerating.value = true
    generationError.value = null
    japaneseText.value = []
    let accumulatedText = ''

    try {
      await streamGenerateText(level, (chunk: string) => {
        accumulatedText += chunk
        
        try {
          const cleaned = accumulatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
          const parsed = JSON.parse(cleaned)
          if (parsed.sentences && Array.isArray(parsed.sentences)) {
            japaneseText.value = [...parsed.sentences]
          }
        } catch (e) {
        }
      })

      if (japaneseText.value.length === 0) {
        throw new Error('Failed to parse generated text')
      }
    } catch (error: any) {
      generationError.value = error.message
      console.error('Generation error:', error)
    } finally {
      isGenerating.value = false
    }
  }

  const clearText = () => {
    japaneseText.value = []
  }

  return {
    japaneseText: readonly(japaneseText),
    isGenerating: readonly(isGenerating),
    generationError,
    generateText,
    clearText
  }
}