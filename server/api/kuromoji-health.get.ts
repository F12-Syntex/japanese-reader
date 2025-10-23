// app/server/api/kuromoji-health.get.ts
import { fileURLToPath } from 'node:url'
import { getTokenizer } from './utils/kuromoji'

export default defineEventHandler(async () => {
  try {
    const tk = await getTokenizer()
    const tokens = tk.tokenize('すもももももももものうち')
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