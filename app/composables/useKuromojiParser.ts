// composables/useKuromojiParser.ts
export const useKuromojiParser = () => {
  const { knownWords } = useAnki()
  
  const parseText = async (text: string) => {
    try {
      const response = await fetch('/api/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      })
      
      if (!response.ok) {
        const error = await response.text()
        console.error('Parse error:', error)
        throw new Error('Failed to parse text')
      }
      
      const data = await response.json()
      
      return data.words.map((word: any) => {
        const knownWordData = knownWords.value.get(word.surface)
        
        return {
          kanji: word.surface,
          kana: word.reading || word.surface,
          meaning: knownWordData?.meaning || '',
          pos: knownWordData?.pos || word.pos,
          isKnown: !!knownWordData
        }
      })
    } catch (error) {
      console.error('parseText error:', error)
      return text.split('').map(char => ({
        kanji: char,
        kana: char,
        meaning: '',
        pos: 'other',
        isKnown: false
      }))
    }
  }

  const parseSentences = async (sentences: Array<{ text: string }>) => {
    const parsed = []
    
    for (const sentence of sentences) {
      const words = await parseText(sentence.text)
      parsed.push({ words })
    }
    
    return parsed
  }

  return {
    parseText,
    parseSentences
  }
}