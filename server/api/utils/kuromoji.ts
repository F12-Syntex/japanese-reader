// app/server/utils/kuromoji.ts
import kuromoji from 'kuromoji'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

let tokenizer: kuromoji.Tokenizer<kuromoji.IpadicFeatures> | null = null

function getBundledDictPath(): string {
  // Nitro exposes server assets under an internal virtual scheme:
  // import.meta.serverAssets is a map; but the stable way is to use
  // the runtime helper to resolve a path on disk.
  // In Nitro, you can import an asset URL like:
  //   const url = new URL('assets:dict/base.dat.gz', import.meta.url)
  // and then derive the directory.
  const anyUrl = new URL('assets:dict/base.dat.gz', import.meta.url)
  // Convert to real file path
  const baseFile = fileURLToPath(anyUrl)
  // Strip filename to get the directory path
  return baseFile.slice(0, baseFile.lastIndexOf('/'))
}

function buildTokenizerFS(dicDir: string): Promise<kuromoji.Tokenizer<kuromoji.IpadicFeatures>> {
  return new Promise((resolve, reject) => {
    // Important: dicPath must end with a slash
    const dicPath = dicDir.endsWith('/') ? dicDir : dicDir + '/'
    kuromoji.builder({ dicPath }).build((err, t) => {
      if (err) return reject(err)
      resolve(t)
    })
  })
}

export async function getTokenizer(): Promise<kuromoji.Tokenizer<kuromoji.IpadicFeatures>> {
  if (tokenizer) return tokenizer
  const dicDir = getBundledDictPath()
  tokenizer = await buildTokenizerFS(dicDir)
  return tokenizer
}