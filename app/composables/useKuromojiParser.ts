import { useAnki } from '~/composables/useAnki'
import type { ParsedSentence, ParsedWord } from '~/types/japanese'

const BATCH_SIZE = 50

export const useKuromojiParser = () => {
  const { knownWords, isWordKnown } = useAnki()

  const parseText = async (text: string): Promise<ParsedWord[]> => {
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
      const { lookupKanji } = useDictionaryStore()

      const words = (data.words ?? []).map((word: any): ParsedWord => {
        const meaningEntries = lookupKanji(word.baseForm).join(', ')

        return {
          kanji: word.surface ?? '',
          kana: word.reading ?? '',
          meaning: meaningEntries ?? '',
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
      return text.split('').map((char): ParsedWord => ({
        kanji: char,
        kana: char,
        meaning: '',
        pos: 'other',
        isKnown: false
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
    parseSentences
  }
}