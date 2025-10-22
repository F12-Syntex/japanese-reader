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
  
  const tablesResult = database.exec("SELECT name FROM sqlite_master WHERE type='table'")
  if (!tablesResult.length || !tablesResult[0]) return {}
  
  const tables = tablesResult[0].values.map(r => r[0] as string)
  const schemas: Record<string, Array<{ cid: number; name: string; type: string; notnull: number; dflt_value: any; pk: number }>> = {}
  
  for (const table of tables) {
    const result = database.exec(`PRAGMA table_info(${table})`)
    if (result.length && result[0]) {
      schemas[table] = result[0].values.map(r => ({
        cid: r[0] as number,
        name: r[1] as string,
        type: r[2] as string,
        notnull: r[3] as number,
        dflt_value: r[4],
        pk: r[5] as number
      }))
    }
  }
  
  return schemas
})