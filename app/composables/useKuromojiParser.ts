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
        body: JSON.stringify({ 
          text,
          knownWords: Array.from(knownWords.value.keys())
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to parse text')
      }
      
      const data = await response.json()
      
      console.log('Parsed words:', data.words)
      
      return data.words.map((word: any) => {
        const surfaceMatch = knownWords.value.get(word.surface)
        const baseMatch = knownWords.value.get(word.baseForm)
        const knownWordData = baseMatch || surfaceMatch
        
        console.log(`Word: ${word.surface} (${word.baseForm}), Known: ${!!knownWordData}`, knownWordData)
        
        return {
          kanji: word.surface,
          kana: word.reading,
          meaning: knownWordData?.meaning || '',
          pos: word.pos,
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