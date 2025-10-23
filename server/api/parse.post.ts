// app/server/api/parse.post.ts
import kuromoji from 'kuromoji'
import wanakana from 'wanakana'

let tokenizer: kuromoji.Tokenizer<kuromoji.IpadicFeatures> | null = null
let tokenizerOrigin: string | null = null

function buildTokenizer(dicBaseUrl: string): Promise<kuromoji.Tokenizer<kuromoji.IpadicFeatures>> {
  return new Promise((resolve, reject) => {
    kuromoji.builder({ dicPath: dicBaseUrl }).build((err, built) => {
      if (err) return reject(err)
      resolve(built)
    })
  })
}

async function getTokenizer(event: any) {
  const { origin } = getRequestURL(event)
  const dicBaseUrl = `${origin}/dict/`

  // Rebuild if cold or origin changed (e.g., preview deployments)
  if (!tokenizer || tokenizerOrigin !== origin) {
    // Optional: verify reachability
    const head = await fetch(`${dicBaseUrl}base.dat.gz`, { method: 'HEAD' })
    if (!head.ok) {
      throw new Error(`HEAD ${dicBaseUrl}base.dat.gz -> ${head.status} ${head.statusText}`)
    }
    tokenizer = await buildTokenizer(dicBaseUrl)
    tokenizerOrigin = origin
  }
  return tokenizer
}

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

    const tk = await getTokenizer(event)
    const tokens = tk.tokenize(text)

    const words = tokens.map((token) => {
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