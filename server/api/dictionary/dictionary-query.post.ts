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
  const { sql } = await readBody(event)

  if (!sql || typeof sql !== 'string') {
    throw createError({ statusCode: 400, message: 'sql required' })
  }

  const database = await getDB()
  const result = database.exec(sql)
  if (!result.length) return null
  return result[0]
})