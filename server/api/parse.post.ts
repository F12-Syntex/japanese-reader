// server/api/parse.post.ts
import kuromoji from 'kuromoji'
import { join } from 'path'
import wanakana from 'wanakana'
import { existsSync } from 'fs'

let tokenizer: any = null

const getTokenizer = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (tokenizer) {
      resolve(tokenizer)
      return
    }

    const dicPath = join(process.cwd(), 'node_modules', 'kuromoji', 'dict')
    
    if (!existsSync(dicPath)) {
      console.error('Dictionary path does not exist:', dicPath)
      reject(new Error('Kuromoji dictionary not found'))
      return
    }

    console.log('Building tokenizer with dictionary path:', dicPath)
    
    kuromoji.builder({ dicPath }).build((err: any, _tokenizer: any) => {
      if (err) {
        console.error('Kuromoji build error:', err)
        reject(err)
        return
      }
      console.log('Tokenizer built successfully')
      tokenizer = _tokenizer
      resolve(tokenizer)
    })
  })
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { text, knownWords } = body

    if (!text) {
      throw createError({
        statusCode: 400,
        message: 'Text is required'
      })
    }

    const tokenizer = await getTokenizer()
    const tokens = tokenizer.tokenize(text)
    
    // console.log('Parsed tokens:', tokens.map((t: any) => ({
    //   surface: t.surface_form,
    //   base: t.basic_form,
    //   reading: t.reading,
    //   pos: t.pos
    // })))
    
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

function mapPos(pos: string): string {
  if (!pos) return 'other'
  if (pos.includes('名詞')) return 'noun'
  if (pos.includes('動詞')) return 'verb'
  if (pos.includes('形容詞')) return 'adjective'
  if (pos.includes('助詞')) return 'particle'
  if (pos.includes('副詞')) return 'adverb'
  return 'other'
}