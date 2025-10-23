// app/server/api/kuromoji-health.get.ts
import kuromoji from 'kuromoji'

let tokenizer: kuromoji.Tokenizer<kuromoji.IpadicFeatures> | null = null

function buildTokenizer(): Promise<kuromoji.Tokenizer<kuromoji.IpadicFeatures>> {
  return new Promise((resolve, reject) => {
    kuromoji.builder({ dicPath: '/dict/' }).build((err, t) => {
      if (err) return reject(err)
      resolve(t)
    })
  })
}

export default defineEventHandler(async (event) => {
  try {
    if (!tokenizer) {
      tokenizer = await buildTokenizer()
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
    // Surface the exact error so we can debug quickly in production
    return {
      ok: false,
      message: e?.message || String(e),
      stack: e?.stack
    }
  }
})