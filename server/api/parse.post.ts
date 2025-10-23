// app/server/api/parse.post.ts
import wanakana from 'wanakana'
import { getTokenizer } from './utils/kuromoji'

function mapPos(pos: string): string {
  if (!pos) return 'other'
  if (pos.includes('名詞')) return 'noun'
  if (pos.includes('動詞')) return 'verb'
  if (pos.includes('形容詞')) return 'adjective'
  if (pos.includes('助詞')) return 'particle'
  if (pos.includes('副詞')) return 'adverb'
  return 'other'
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<{ text?: string }>(event)
    const text = body?.text?.trim()
    if (!text) {
      throw createError({ statusCode: 400, message: 'Text is required' })
    }

    const tk = await getTokenizer()
    const tokens = tk.tokenize(text)

    const words = tokens.map((token: any) => {
      const surface = token.surface_form
      const baseForm = token.basic_form && token.basic_form !== '*' ? token.basic_form : surface
      const reading = token.reading || surface
      return {
        surface,
        baseForm,
        reading: wanakana.toHiragana(reading),
        pos: mapPos(token.pos || '')
      }
    })

    return { words }
  } catch (error: any) {
    console.error('Parse error:', error)
    throw createError({
      statusCode: 500,
      message: error?.message || 'Failed to parse text'
    })
  }
})