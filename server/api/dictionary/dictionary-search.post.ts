import initSqlJs, { type Database } from 'sql.js'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { defineEventHandler } from 'h3'

let db: Database | null = null

async function getDB(): Promise<Database> {
  if (db) return db

  const SQL = await initSqlJs()
  const buffer = await readFile(join(process.cwd(), 'public', 'jmdict_full.db'))
  db = new SQL.Database(buffer)
  return db
}

export default defineEventHandler(async (event) => {
  const { query } = await readBody(event)

  if (!query || typeof query !== 'string') {
    throw createError({ statusCode: 400, message: 'Query required' })
  }

  const database = await getDB()

  const result = database.exec(`
    SELECT DISTINCT w.id AS word_id,
                    k.text  AS kanji,
                    ka.text AS kana,
                    s.rowid AS sense_row,
                    g.text  AS gloss
    FROM words w
    LEFT JOIN kanji k ON k.word_id = w.id
    LEFT JOIN kana  ka ON ka.word_id = w.id
    LEFT JOIN sense s ON s.word_id = w.id
    LEFT JOIN sense_gloss g ON g.sense_id = s.rowid
    WHERE k.text = ? OR ka.text = ?
    ORDER BY w.id, s.rowid
  `, [query, query])

  if (!result.length || !result[0]) return []

  const wordsMap = new Map<string, {
    id: string
    kanji: string[]
    kana: string[]
    glosses: string[]
  }>()

  for (const row of result[0].values) {
    const wordId = row[0] as string
    const kanjiText = row[1] as string | null
    const kanaText = row[2] as string | null
    const glossText = row[4] as string | null

    if (!wordsMap.has(wordId)) {
      wordsMap.set(wordId, { id: wordId, kanji: [], kana: [], glosses: [] })
    }

    const entry = wordsMap.get(wordId)!
    
    if (kanjiText && !entry.kanji.includes(kanjiText)) {
      entry.kanji.push(kanjiText)
    }
    
    if (kanaText && !entry.kana.includes(kanaText)) {
      entry.kana.push(kanaText)
    }
    
    if (glossText && !entry.glosses.includes(glossText)) {
      entry.glosses.push(glossText)
    }
  }

  return Array.from(wordsMap.values())
})