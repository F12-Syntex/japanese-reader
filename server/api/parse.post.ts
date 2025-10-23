import kuromoji from 'kuromoji'
import wanakana from 'wanakana'

let tokenizer: any = null

const getTokenizer = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (tokenizer) {
      resolve(tokenizer)
      return
    }

    kuromoji.builder({ dicPath: '/dict' }).build((err: any, _tokenizer: any) => {
      if (err) {
        console.error('Kuromoji build error:', err)
        reject(err)
        return
      }
      tokenizer = _tokenizer
      resolve(tokenizer)
    })
  })
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { text } = body

    if (!text) {
      throw createError({
        statusCode: 400,
        message: 'Text is required'
      })
    }

    const tokenizer = await getTokenizer()
    const tokens = tokenizer.tokenize(text)
    
    const words = tokens.map((token: any) => {
      const surface = token.surface_form
      const baseForm = token.basic_form || surface
      const reading = token.reading || surface
      
      return {
        surface,
        baseForm,
        reading: wanakana.toHiragana(reading),
        pos: mapPos(token.pos)
      }
    })

    return { words }
  } catch (error: any) {
    console.error('Parse error:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to parse text'
    })
  }
})

function mapPos(pos: string | undefined): string {
  if (!pos) return 'other'
  if (pos.includes('名詞')) return 'noun'
  if (pos.includes('動詞')) return 'verb'
  if (pos.includes('形容詞')) return 'adjective'
  if (pos.includes('助詞')) return 'particle'
  if (pos.includes('副詞')) return 'adverb'
  return 'other'
}