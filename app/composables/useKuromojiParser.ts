import { useAnki } from '~/composables/useAnki'
import type { ParsedSentence, ParsedWord } from '~/types/japanese'

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

      const words = await Promise.all((data.words ?? []).map(async (word: any): Promise<ParsedWord> => {
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
      }))

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

    for (const sentence of sentences) {
      const words = await parseText(sentence.text)
      parsed.push({
        text: sentence.text,
        words,
        grammar: sentence.grammar ?? []
      })
    }

    return parsed
  }

  return {
    parseText,
    parseSentences
  }
}