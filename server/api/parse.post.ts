import kuromoji from 'kuromoji'
import wanakana from 'wanakana'

let tokenizerPromise: Promise<any> | null = null

function getDicHttpBase(event: any): string {
  // Build an absolute HTTP base to static /dict so kuromoji can fetch files in prod
  const config = useRuntimeConfig(event)
  // Prefer public baseURL if set (Nuxt app.baseURL). Build absolute from request.
  const baseURL = (config.app?.baseURL as string) || '/'
  const req = event.node?.req
  // Derive origin from request (works on Vercel)
  const proto = (req?.headers['x-forwarded-proto'] as string) || 'https'
  const host = (req?.headers['x-forwarded-host'] as string) || (req?.headers['host'] as string) || ''
  const origin = host ? `${proto}://${host}` : ''
  const base = baseURL.endsWith('/') ? baseURL : baseURL + '/'
  return origin ? `${origin}${base}dict` : `${base}dict`
}

function getTokenizer(event: any): Promise<any> {
  if (tokenizerPromise) return tokenizerPromise

  tokenizerPromise = new Promise((resolve, reject) => {
    // Always use HTTP path in prod so the compiled dict files are fetched correctly.
    const dicPath = getDicHttpBase(event)

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