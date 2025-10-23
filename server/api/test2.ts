import { defineEventHandler } from 'h3'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'

export default defineEventHandler(async () => {
  // Matches your deployed structure: /dict/*.dat.gz
  const baseDir = join(process.cwd(), 'public', 'dict')

  try {
    const entries = await fs.readdir(baseDir, { withFileTypes: true })
    const files = entries.filter(e => e.isFile()).map(e => e.name)

    let sampleFile = null
    let samplePreview = null
    let size = null

    if (files.length) {
      sampleFile = files[0]
      const buf = await fs.readFile(join(baseDir, sampleFile))
      size = buf.length
      // Show a tiny preview of gzip header bytes in hex
      samplePreview = [...buf.slice(0, 16)].map(b => b.toString(16).padStart(2, '0')).join(' ')
    }

    return { ok: true, baseDir, files, sampleFile, size, samplePreview }
  } catch (e: any) {
    return { ok: false, baseDir, error: e?.message || String(e) }
  }
})