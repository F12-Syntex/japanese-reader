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
    const reqURL = getRequestURL(event)
    // Build a proper absolute URL with trailing slash
    const dicBase = new URL('/dict/', reqURL.origin).toString()

    if (!tokenizer) {
      // Verify reachability
      const head = await fetch(new URL('base.dat.gz', dicBase), { method: 'HEAD' })
      if (!head.ok) {
        throw new Error(`HEAD ${new URL('base.dat.gz', dicBase)} -> ${head.status} ${head.statusText}`)
      }
      tokenizer = await buildTokenizer(dicBase)
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