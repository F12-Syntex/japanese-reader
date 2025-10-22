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
  const { tableName } = await readBody(event)

  if (!tableName || typeof tableName !== 'string') {
    throw createError({ statusCode: 400, message: 'tableName required' })
  }

  const database = await getDB()
  const result = database.exec(`SELECT COUNT(*) as count FROM ${tableName}`)
  if (!result.length || !result[0]?.values.length) return 0
  const raw = result[0]?.values?.[0]?.[0] ?? 0
  return (typeof raw === 'number') ? raw : Number(raw)
})