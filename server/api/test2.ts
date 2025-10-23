import { defineEventHandler } from 'h3'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'

export default defineEventHandler(async () => {
  // In Nitro on Vercel, process.cwd() points to the server working dir.
  // Public assets are emitted under a public folder in the output.
  // Accessing via join(process.cwd(), 'public', ...) is safe for runtime read.
  const baseDir = join(process.cwd(), 'public', 'dict')

  try {
    const entries = await fs.readdir(baseDir, { withFileTypes: true })
    const files = entries
      .filter(e => e.isFile())
      .map(e => e.name)

    // Read a sample file if present (adjust file name/logic as needed)
    let sampleFile = null
    let sampleContent = null
    if (files.length > 0) {
      sampleFile = files[0]
      sampleContent = await fs.readFile(join(baseDir, sampleFile), 'utf8')
    }

    return {
      ok: true,
      baseDir,
      files,
      sampleFile,
      samplePreview: sampleContent?.slice(0, 200) ?? null
    }
  } catch (err: any) {
    return {
      ok: false,
      baseDir,
      error: err?.message || String(err)
    }
  }
})