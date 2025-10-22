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
  const result = database.exec(`PRAGMA table_info(${tableName})`)
  if (!result.length || !result[0]) return []
  
  return result[0].values.map(r => ({
    cid: r[0] as number,
    name: r[1] as string,
    type: r[2] as string,
    notnull: r[3] as number,
    dflt_value: r[4],
    pk: r[5] as number
  }))
})