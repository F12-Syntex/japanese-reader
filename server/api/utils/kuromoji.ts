// app/server/utils/kuromoji.ts
import kuromoji from 'kuromoji'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { gunzipSync } from 'node:zlib'

let tokenizer: kuromoji.Tokenizer<kuromoji.IpadicFeatures> | null = null
let dicDirOnDisk: string | null = null

// Files kuromoji expects for the ipadic dict packaged on npm
const DICT_FILES = [
  'base.dat.gz',
  'cc.dat.gz',
  'check.dat.gz',
  'tid.dat.gz',
  'unk.dat.gz',
  'matrix.bin.gz'
]

// Read a server-bundled asset using Nitro's runtime helper
async function readDictAsset(name: string): Promise<Buffer> {
  // assets:dict/<name> was created by nitro.serverAssets
  const url = new URL(`assets:dict/${name}`, import.meta.url)
  // Nitro maps assets: URLs to actual files and allows fetch(url)
  // But to get a Buffer reliably, use global $fetch.raw if available or Node fetch
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to read server asset ${name}: ${res.status} ${res.statusText}`)
  }
  const arrayBuf = await res.arrayBuffer()
  return Buffer.from(arrayBuf)
}

async function ensureDictOnDisk(): Promise<string> {
  if (dicDirOnDisk) return dicDirOnDisk
  const base = '/tmp/kuromoji-dict'
  await fs.mkdir(base, { recursive: true })

  // Copy each required file from server assets into /tmp
  for (const name of DICT_FILES) {
    const target = join(base, name)
    try {
      // Skip if already present (warm lambda)
      await fs.access(target)
      continue
    } catch {}
    const buf = await readDictAsset(name)
    await fs.writeFile(target, buf)
  }

  // Sanity: ensure matrix.bin exists in uncompressed form if kuromoji needs it
  // The npm dict uses matrix.bin.gz; kuromoji expects that name and will gunzip internally.
  dicDirOnDisk = base.endsWith('/') ? base : base + '/'
  return dicDirOnDisk
}

function buildTokenizer(dicPath: string): Promise<kuromoji.Tokenizer<kuromoji.IpadicFeatures>> {
  return new Promise((resolve, reject) => {
    kuromoji.builder({ dicPath }).build((err, t) => {
      if (err) return reject(err)
      resolve(t)
    })
  })
}

export async function getTokenizer(): Promise<kuromoji.Tokenizer<kuromoji.IpadicFeatures>> {
  if (tokenizer) return tokenizer
  const dicPath = await ensureDictOnDisk()
  tokenizer = await buildTokenizer(dicPath)
  return tokenizer
}