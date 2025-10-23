import kuromoji from 'kuromoji'
import wanakana from 'wanakana'
import { join } from 'node:path'
import { existsSync } from 'node:fs'

let tokenizerPromise: Promise<any> | null = null

function getDictFsPath(event?: any): string {
  // Prefer the copied dict in public/dict, which is bundled into .output/public
  // Nitro provides event.node.req/resp; use runtime config or rootDir to resolve.
  // In server runtime, process.cwd() points to the server bundle root.
  // .output/public is mounted as a static dir, but also exists on disk relative to the server.
  // Try a few likely locations to be robust in dev and prod.

  // 1) Nuxt dev: project root/public/dict
  const devPublicDict = join(process.cwd(), 'public', 'dict')
  if (existsSync(devPublicDict)) return devPublicDict

  // 2) Nitro output: .output/public/dict (when running preview or on Vercel)
  const outputPublicDict = join(process.cwd(), '.output', 'public', 'dict')
  if (existsSync(outputPublicDict)) return outputPublicDict

  // 3) Fallback: node_modules (only if present at runtime; usually not on Vercel)
  const nodeModulesDict = join(process.cwd(), 'node_modules', 'kuromoji', 'dict')
  if (existsSync(nodeModulesDict)) return nodeModulesDict

  // 4) Last resort: just return public/dict (kuromoji will try fs path)
  return devPublicDict
}

function getTokenizer(event?: any): Promise<any> {
  if (tokenizerPromise) return tokenizerPromise

  tokenizerPromise = new Promise((resolve, reject) => {
    const dicPath = getDictFsPath(event)

    kuromoji.builder({ dicPath }).build((err: any, built: any) => {
      if (err) {
        console.error('Kuromoji build error:', err, 'dicPath:', dicPath)
        tokenizerPromise = null
        reject(err)
        return
      }
      resolve(built)
    })
  })

  return tokenizerPromise
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { text } = body || {}

    if (!text || typeof text !== 'string') {
      throw createError({ statusCode: 400, message: 'Text is required' })
    }

    const tokenizer = await getTokenizer(event)
    const tokens = tokenizer.tokenize(text)

    const words = tokens.map((token: any) => {
      const surface = token.surface_form
      const baseForm = token.basic_form && token.basic_form !== '*' ? token.basic_form : surface
      const reading = token.reading && token.reading !== '*' ? token.reading : surface
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
      statusCode: error.statusCode || 500,
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