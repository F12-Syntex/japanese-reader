// app/server/api/kuromoji-health.get.ts
import kuromoji from 'kuromoji'
import { promises as fs } from 'node:fs'
import { join, resolve as pathResolve } from 'node:path'
import os from 'node:os'

type Diag = {
  step: string
  ok: boolean
  detail?: any
  error?: string
}

let tokenizer: kuromoji.Tokenizer<kuromoji.IpadicFeatures> | null = null
let tokenizerSource: 'http' | 'fs' | null = null
let tokenizerDicPath: string | null = null

function diagOk(step: string, detail?: any): Diag {
  return { step, ok: true, detail }
}
function diagErr(step: string, e: any): Diag {
  return { step, ok: false, error: e?.stack || e?.message || String(e) }
}

async function testHead(url: URL | string): Promise<Diag> {
  const step = `HEAD ${url}`
  try {
    const res = await fetch(url, { method: 'HEAD' })
    const headers = Object.fromEntries(res.headers.entries())
    return diagOk(step, { status: res.status, ok: res.ok, headers })
  } catch (e: any) {
    return diagErr(step, e)
  }
}

async function testGet(url: URL | string, bytes = 64): Promise<Diag> {
  const step = `GET ${url}`
  try {
    const res = await fetch(url)
    const headers = Object.fromEntries(res.headers.entries())
    let preview: string | null = null
    let len: number | null = null
    let textPreview: string | null = null
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer())
      len = buf.length
      preview = buf.slice(0, Math.min(bytes, buf.length)).toString('hex')
      // If looks like text, include some text preview
      const text = buf.slice(0, Math.min(128, buf.length)).toString('utf8')
      if (/^[\x09\x0A\x0D\x20-\x7E]/.test(text)) textPreview = text
    }
    return diagOk(step, { ok: res.ok, status: res.status, headers, len, hexPreview: preview, textPreview })
  } catch (e: any) {
    return diagErr(step, e)
  }
}

async function safeStat(p: string) {
  try {
    const s = await fs.stat(p)
    return { ok: true, stat: { isFile: s.isFile(), isDir: s.isDirectory(), size: s.size, mtime: s.mtime.toISOString() } }
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) }
  }
}

async function listDirRecursive(base: string, maxEntries = 500) {
  const out: any[] = []
  let count = 0
  async function walk(dir: string, rel = ''): Promise<void> {
    if (count >= maxEntries) return
    let entries: string[]
    try {
      entries = await fs.readdir(dir)
    } catch (e: any) {
      out.push({ rel, error: e?.message || String(e) })
      return
    }
    for (const name of entries) {
      if (count >= maxEntries) break
      const full = join(dir, name)
      const relPath = rel ? `${rel}/${name}` : name
      try {
        const st = await fs.stat(full)
        if (st.isDirectory()) {
          out.push({ type: 'dir', path: relPath })
          await walk(full, relPath)
        } else {
          count++
          let previewHex: string | undefined
          try {
            const fh = await fs.open(full, 'r')
            const buf = Buffer.alloc(32)
            const { bytesRead } = await fh.read(buf, 0, 32, 0)
            await fh.close()
            previewHex = buf.slice(0, bytesRead).toString('hex')
          } catch {}
          out.push({ type: 'file', path: relPath, size: st.size, mtime: st.mtime.toISOString(), previewHex })
        }
      } catch (e: any) {
        out.push({ type: 'unknown', path: relPath, error: e?.message || String(e) })
      }
    }
  }
  await walk(base)
  return out
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

  // Runtime info
  diagnostics.push(diagOk('env.runtime', {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    cwd: process.cwd(),
    pid: process.pid,
    memory: process.memoryUsage(),
    envSubset: {
      VERCEL: process.env.VERCEL,
      NITRO_PRESET: process.env.NITRO_PRESET,
      NUXT_ENV: process.env.NUXT_ENV,
      NODE_ENV: process.env.NODE_ENV,
      RUNTIME: process.env.RUNTIME
    },
    tmpdir: os.tmpdir()
  }))

  // Request info
  diagnostics.push(diagOk('request.info', {
    origin,
    url: reqURL.toString(),
    method: getMethod(event),
    host: headers.host,
    xForwardedProto: headers['x-forwarded-proto'],
    xForwardedHost: headers['x-forwarded-host'],
    xForwardedFor: headers['x-forwarded-for'],
    userAgent: headers['user-agent']
  }))

  // Construct canonical /dict/ HTTP base
  const dictHttpBase = new URL('/dict/', origin)
  diagnostics.push(diagOk('dict.http.base', { url: dictHttpBase.toString() }))

  // Probe a broad set of expected files over HTTP
  const httpFiles = [
    'base.dat.gz', 'cc.dat.gz', 'check.dat.gz', 'tid.dat.gz', 'tid.map.gz',
    'unk.dat.gz', 'unk.map.gz', 'matrix.bin.gz',
    'char.def', 'unk.def', 'pos-id.def'
  ]
  for (const f of httpFiles) {
    diagnostics.push(await testHead(new URL(f, dictHttpBase)))
  }
  // GET a couple for length/preview
  diagnostics.push(await testGet(new URL('base.dat.gz', dictHttpBase)))
  diagnostics.push(await testGet(new URL('matrix.bin.gz', dictHttpBase)))
  diagnostics.push(await testGet(new URL('char.def', dictHttpBase)))

  // Filesystem reconnaissance: try a list of candidate roots and list contents if possible
  const fsCandidates = [
    '/var/task/public',                 // common on Vercel
    '/var/task/.output/public',
    '/var/task/.output',
    '/var/task',
    './public',
    '.output/public',
    '.output',
    './',
    '/tmp',
    '/var/runtime',
    '/var/task/node_modules/kuromoji/dict',
    './node_modules/kuromoji/dict'
  ]

  for (const base of fsCandidates) {
    const abs = pathResolve(base)
    const st = await safeStat(abs)
    diagnostics.push(diagOk('fs.candidate.stat', { base, abs, stat: st }))
    if (st.ok && st.stat?.isDir) {
      // Shallow list
      try {
        const firstLevel = await fs.readdir(abs)
        diagnostics.push(diagOk('fs.candidate.readdir', { base: abs, entries: firstLevel.slice(0, 200) }))
      } catch (e: any) {
        diagnostics.push(diagErr(`fs.readdir ${abs}`, e))
      }
      // If looks like a dict dir, dump recursive up to 500 entries
      if (abs.endsWith('/dict')) {
        try {
          const listing = await listDirRecursive(abs, 500)
          diagnostics.push(diagOk('fs.dict.recursive', { base: abs, entries: listing }))
        } catch (e: any) {
          diagnostics.push(diagErr('fs.dict.recursive', e))
        }
      }
      // If contains a 'dict' subdir, list it
      try {
        const dictDir = join(abs, 'dict')
        const dictStat = await safeStat(dictDir)
        diagnostics.push(diagOk('fs.dict.stat', { dictDir, dictStat }))
        if (dictStat.ok && dictStat.stat?.isDir) {
          const listing = await listDirRecursive(dictDir, 500)
          diagnostics.push(diagOk('fs.dict.recursive2', { base: dictDir, entries: listing }))
        }
      } catch (e: any) {
        diagnostics.push(diagErr('fs.dict.check', e))
      }
    }
  }

  // Try building tokenizer via HTTP dicPath first
  let httpBuildError: any = null
  try {
    const tk = await buildTokenizer(dictHttpBase.toString())
    tokenizer = tk
    tokenizerSource = 'http'
    tokenizerDicPath = dictHttpBase.toString()
    diagnostics.push(diagOk('kuromoji.build.http.success', { dicPath: tokenizerDicPath }))
  } catch (e: any) {
    httpBuildError = e
    diagnostics.push(diagErr('kuromoji.build.http.fail', e))
  }

  // If HTTP failed, attempt FS builds from various candidates
  const fsBuildCandidates = [
    '/var/task/public/dict',
    '/var/task/.output/public/dict',
    '/var/task/.output/server/chunks/../../public/dict', // odd but try
    './public/dict',
    '.output/public/dict',
    '/var/task/node_modules/kuromoji/dict',
    './node_modules/kuromoji/dict'
  ]

  if (!tokenizer) {
    for (const base of fsBuildCandidates) {
      const abs = pathResolve(base)
      const probe = await safeStat(join(abs, 'base.dat.gz'))
      diagnostics.push(diagOk('kuromoji.fs.probe', { base: abs, baseDatGz: probe }))
      if (!probe.ok || !probe.stat?.isFile) continue

      try {
        const tk = await buildTokenizer(abs.endsWith('/') ? abs : abs + '/')
        tokenizer = tk
        tokenizerSource = 'fs'
        tokenizerDicPath = abs
        diagnostics.push(diagOk('kuromoji.build.fs.success', { dicPath: tokenizerDicPath }))
        break
      } catch (e: any) {
        diagnostics.push(diagErr(`kuromoji.build.fs.fail:${abs}`, e))
      }
    }
  }

  // If tokenizer exists, tokenize sample
  if (tokenizer) {
    try {
      const sample = 'すもももももももものうち'
      const tokens = tokenizer.tokenize(sample)
      return {
        ok: true,
        source: tokenizerSource,
        dicPath: tokenizerDicPath,
        tokenCount: tokens.length,
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

  return {
    ok: false,
    message: 'Failed to initialize tokenizer',
    httpBuildError: httpBuildError ? (httpBuildError?.message || String(httpBuildError)) : null,
    diagnostics
  }
})