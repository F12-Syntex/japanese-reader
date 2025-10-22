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

export default defineEventHandler(async () => {
  const database = await getDB()
  const result = database.exec("SELECT name FROM sqlite_master WHERE type='table'")
  if (!result.length || !result[0]) return []
  return result[0].values.map(r => r[0] as string)
})