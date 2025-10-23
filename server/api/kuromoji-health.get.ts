// app/server/api/kuromoji-health.get.ts
import kuromoji from 'kuromoji'

let tokenizer: kuromoji.Tokenizer<kuromoji.IpadicFeatures> | null = null

function buildTokenizer(dicBaseUrl: string): Promise<kuromoji.Tokenizer<kuromoji.IpadicFeatures>> {
  return new Promise((resolve, reject) => {
    kuromoji.builder({ dicPath: dicBaseUrl }).build((err, t) => {
      if (err) return reject(err)
      resolve(t)
    })
  })
}

export default defineEventHandler(async (event) => {
  try {
    const { origin } = getRequestURL(event)
    // Important: absolute URL so Kuromoji fetches via HTTP, not fs
    const dicBaseUrl = `${origin}/dict/`

    if (!tokenizer) {
      // Optional quick check the static file is reachable from the server
      const head = await fetch(`${dicBaseUrl}base.dat.gz`, { method: 'HEAD' })
      if (!head.ok) {
        throw new Error(`HEAD ${dicBaseUrl}base.dat.gz -> ${head.status} ${head.statusText}`)
      }
      tokenizer = await buildTokenizer(dicBaseUrl)
    }

    const text = 'すもももももももものうち'
    const tokens = tokenizer.tokenize(text)
    return {
      ok: true,
      count: tokens.length,
      sample: tokens.slice(0, 6).map(t => ({
        surface: t.surface_form,
        base: t.basic_form && t.basic_form !== '*' ? t.basic_form : t.surface_form,
        reading: t.reading || t.surface_form,
        pos: t.pos
      }))
    }
  } catch (e: any) {
    return {
      ok: false,
      message: e?.message || String(e),
      stack: e?.stack
    }
  }
})