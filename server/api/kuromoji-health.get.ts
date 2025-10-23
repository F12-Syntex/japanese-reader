// server/api/kuromoji-health.get.ts
import kuromoji from 'kuromoji'

let built: any = null

export default defineEventHandler(async () => {
  if (!built) {
    built = await new Promise((resolve, reject) => {
      kuromoji.builder({ dicPath: '/dict/' }).build((err, t) => {
        if (err) return reject(err)
        resolve(t)
      })
    })
  }
  const sample = built.tokenize('すもももももももものうち')
  return { ok: true, tokens: sample.slice(0, 3) }
})