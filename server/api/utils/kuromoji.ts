// app/server/api/kuromoji-health.get.ts
import kuromoji from 'kuromoji'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

type Diag = {
  step: string
  ok: boolean
  detail?: any
  error?: string
}

let tokenizer: kuromoji.Tokenizer<kuromoji.IpadicFeatures> | null = null
let tokenizerSource: 'http' | 'fs' | null = null

function diagOk(step: string, detail?: any): Diag {
  return { step, ok: true, detail }
}
function diagErr(step: string, e: any): Diag {
  return { step, ok: false, error: (e?.stack || e?.message || String(e)) }
}

async function testHead(url: URL | string): Promise<Diag> {
  const step = `HEAD ${url}`
  try {
    const res = await fetch(url, { method: 'HEAD' })
    return diagOk(step, { status: res.status, ok: res.ok, headers: Object.fromEntries(res.headers) })
  } catch (e: any) {
    return diagErr(step, e)
  }
}

async function testGet(url: URL | string, bytes = 64): Promise<Diag> {
  const step = `GET ${url}`
  try {
    const res = await fetch(url)
    const ok = res.ok
    const status = res.status
    let preview: string | null = null
    let len: number | null = null
    if (ok) {
      const buf = Buffer.from(await res.arrayBuffer())
      len = buf.length
      preview = buf.slice(0, Math.min(bytes, buf.length)).toString('hex')
    }
    return diagOk(step, { ok, status, contentLength: res.headers.get('content-length'), len, preview })
  } catch (e: any) {
    return diagErr(step, e)
  }
}

async function testFs(path: string): Promise<Diag> {
  const step = `fs.readFile ${path}`
  try {
    const buf = await fs.readFile(path)
    return diagOk(step, { len: buf.length, preview: buf.slice(0, 64).toString('hex') })
  } catch (e: any) {
    return diagErr(step, e)
  }
}

function buildTokenizer(dicPath: string): Promise<kuromoji.Tokenizer<kuromoji.IpadicFeatures>> {
  return new Promise((resolve, reject) => {
    kuromoji.builder({ dicPath }).build((err, t) => {
      if (err) return reject(err)
      resolve(t)
    })
  })
}

export default defineEventHandler(async (event) => {
  const diagnostics: Diag[] = []
  const reqURL = getRequestURL(event)
  const origin = reqURL.origin
  const headers = getRequestHeaders(event)

  // Basic request echo
  diagnostics.push(diagOk('request.info', {
    origin,
    url: reqURL.toString(),
    host: headers.host,
    xForwardedProto: headers['x-forwarded-proto'],
    xForwardedHost: headers['x-forwarded-host'],
    xForwardedFor: headers['x-forwarded-for'],
    userAgent: headers['user-agent'],
  }))

  // Construct canonical /dict/ URL
  const dictHttpBase = new URL('/dict/', origin)
  diagnostics.push(diagOk('dictHttpBase', { dictHttpBase: dictHttpBase.toString() }))

  // Probe expected Kuromoji files over HTTP
  const dictFiles = [
    'base.dat.gz',
    'cc.dat.gz',
    'check.dat.gz',
    'tid.dat.gz',
    'tid.map.gz',
    'unk.dat.gz',
    'unk.map.gz',
    'matrix.bin.gz',
    'char.def',
    'unk.def',
    'pos-id.def',
  ]

  for (const name of dictFiles) {
    const url = new URL(name, dictHttpBase)
    diagnostics.push(await testHead(url))
  }

  // Do a full GET for base.dat.gz and matrix.bin.gz for extra certainty
  diagnostics.push(await testGet(new URL('base.dat.gz', dictHttpBase)))
  diagnostics.push(await testGet(new URL('matrix.bin.gz', dictHttpBase)))

  // Try building tokenizer via HTTP dicPath
  let httpBuildErr: any = null
  try {
    const tk = await buildTokenizer(dictHttpBase.toString())
    tokenizer = tk
    tokenizerSource = 'http'
    diagnostics.push(diagOk('kuromoji.build.http', { dicPath: dictHttpBase.toString() }))
  } catch (e: any) {
    httpBuildErr = e
    diagnostics.push(diagErr('kuromoji.build.http', e))
  }

  // If HTTP failed, attempt FS fallbacks:
  // 1) public/dict relative to Nitro runtime CWD
  // 2) node_modules/kuromoji/dict bundled path (not usually available at runtime)
  if (!tokenizer) {
    // Try reading a file to find a viable FS path we can pass as dicPath
    const fsCandidates = [
      '/var/task/public/dict',           // sometimes where public ends up on Vercel
      '/var/task/.output/public/dict',   // Nitro output structure
      '/var/task/.output/public/_nuxt/../dict', // odd case
      './public/dict',                   // relative
      '.output/public/dict',             // local build convention
      './node_modules/kuromoji/dict',    // unlikely on serverless, but test
    ]

    let fsBase: string | null = null
    for (const base of fsCandidates) {
      const p = join(base, 'base.dat.gz')
      const res = await testFs(p)
      diagnostics.push(res)
      if (res.ok) {
        fsBase = base
        break
      }
    }

    if (fsBase) {
      try {
        const tk = await buildTokenizer(fsBase.endsWith('/') ? fsBase : fsBase + '/')
        tokenizer = tk
        tokenizerSource = 'fs'
        diagnostics.push(diagOk('kuromoji.build.fs', { dicPath: fsBase }))
      } catch (e: any) {
        diagnostics.push(diagErr('kuromoji.build.fs', e))
      }
    }
  }

  // Tokenize a sample if we got a tokenizer
  if (tokenizer) {
    try {
      const sample = 'すもももももももものうち'
      const tokens = tokenizer.tokenize(sample)
      return {
        ok: true,
        source: tokenizerSource,
        count: tokens.length,
        sample: tokens.slice(0, 6).map(t => ({
          surface: t.surface_form,
          base: t.basic_form && t.basic_form !== '*' ? t.basic_form : t.surface_form,
          reading: t.reading || t.surface_form,
          pos: t.pos
        })),
        diagnostics
      }
    } catch (e: any) {
      diagnostics.push(diagErr('tokenize.sample', e))
    }
  }

  // If we reach here, it failed
  return {
    ok: false,
    message: 'Failed to initialize tokenizer',
    httpBuildError: httpBuildErr?.message || null,
    diagnostics
  }
})