import { useAnki } from '~/composables/useAnki'
import type { ParsedSentence, ParsedWord } from '~/types/japanese'

const BATCH_SIZE = 50

export const useKuromojiParser = () => {
  const { knownWords, isWordKnown } = useAnki()
  const { lookupWord } = useDictionaryStore()

  const sanitizeText = (text: string): string => {
    return text
      .replace(/\x00/g, '')
      .replace(/︒/g, '。')
      .replace(/﹁/g, '「')
      .replace(/﹂/g, '」')
      .replace(/︑/g, '、')
      .replace(/︙/g, '…')
      .replace(/︰/g, '：')
      .replace(/︱/g, '|')
      .replace(/︓/g, '：')
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
  }

  const parseText = async (text: string): Promise<ParsedWord[]> => {
    try {
      const sanitized = sanitizeText(text)
      
      if (!sanitized.trim()) {
        console.warn('Text is empty after sanitization')
        return []
      }

      console.log('Parsing text:', sanitized.substring(0, 100) + '...')
      
      const response = await fetch('/api/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: sanitized,
          knownWords: Array.from(knownWords.value.keys())
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Server error:', response.status, errorText)
        throw new Error(`Failed to parse text: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.words || !Array.isArray(data.words)) {
        console.error('Invalid response from server:', data)
        throw new Error('Invalid response format')
      }

      if (data.words.length === 0) {
        console.warn('Server returned no words for text:', sanitized.substring(0, 100))
        throw new Error('No words parsed')
      }

      console.log('Successfully parsed', data.words.length, 'words')

      const words = data.words.map((word: any): ParsedWord => {
        const meaningEntries = lookupWord(word.baseForm)
        const meaning = meaningEntries || ''
        
        return {
          kanji: word.surface ?? '',
          kana: word.reading ?? '',
          meaning,
          pos: word.pos ?? 'other',
          isKnown: isWordKnown(word.surface),
          reading: word.reading ?? '',
          jlptLevel: '',
          pitchAccent: '',
          example: ''
        }
      })

      return words
    } catch (error) {
      console.error('parseText error:', error)
      console.error('Original text length:', text.length)
      console.error('First 200 chars:', text.substring(0, 200))
      
      const sanitized = sanitizeText(text)
      return sanitized.split('').map((char): ParsedWord => ({
        kanji: char,
        kana: char,
        meaning: '',
        pos: 'other',
        isKnown: false,
        reading: char,
        jlptLevel: '',
        pitchAccent: '',
        example: ''
      }))
    }
  }

  const parseSentences = async (sentences: Array<{ text: string; grammar?: string[] }>): Promise<ParsedSentence[]> => {
    const parsed: ParsedSentence[] = []

    for (let i = 0; i < sentences.length; i += BATCH_SIZE) {
      const batch = sentences.slice(i, i + BATCH_SIZE)
      
      const batchResults = await Promise.all(
        batch.map(async (sentence) => {
          const words = await parseText(sentence.text)
          return {
            text: sentence.text,
            words,
            grammar: sentence.grammar ?? []
          }
        })
      )
      
      parsed.push(...batchResults)
      await new Promise(resolve => setTimeout(resolve, 0))
    }

    return parsed
  }

  return {
    parseText,
    parseSentences,
    sanitizeText
  }
}