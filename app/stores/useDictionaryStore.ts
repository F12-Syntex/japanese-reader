import { defineStore } from 'pinia'
import { ref } from 'vue'
import initSqlJs from 'sql.js'

let dbInstance: any = null

export const useDictionaryStore = defineStore('dictionary', () => {
  const isLoaded = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadDictionary() {
    if (dbInstance) {
      isLoaded.value = true
      return
    }

    loading.value = true
    error.value = null

    try {
      const SQL = await initSqlJs({
        locateFile: (file: string) => `https://sql.js.org/dist/${file}`
      })

      const response = await fetch('/jmdict_kanji_meanings.db')
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      
      const buffer = await response.arrayBuffer()
      dbInstance = new SQL.Database(new Uint8Array(buffer))
      
      const schema = dbInstance.exec("SELECT name FROM sqlite_master WHERE type='table'")
      console.log('Database schema:', schema)
      
      const countResult = dbInstance.exec('SELECT COUNT(*) as count FROM word_lookup')
      console.log('Number of entries in word_lookup table:', countResult[0]?.values[0][0])
      
      const testResult = dbInstance.exec("SELECT term, kanji, meanings FROM word_lookup LIMIT 5")
      console.log('Sample entries:', testResult)
      
      isLoaded.value = true
    } catch (err: any) {
      error.value = err.message || 'Failed to load dictionary.'
      console.error('Dictionary load error:', err)
    } finally {
      loading.value = false
    }
  }
  function lookupWord(term: string): string {
    if (!dbInstance) {
      console.warn('Dictionary not loaded')
      return ''
    }

    try {
      const stmt = dbInstance.prepare('SELECT meanings FROM word_lookup WHERE term = ? OR readings LIKE ?')
      stmt.bind([term, `%${term}%`])
      
      if (stmt.step()) {
        const row = stmt.getAsObject()
        const meaningsData = row.meanings
        stmt.free()
        return typeof meaningsData === 'string' ? meaningsData : ''
      }
      stmt.free()
      return ''
    } catch (err) {
      console.error('Error looking up word:', term, err)
      return ''
    }
}

  function searchKanji(query: string): Array<{ kanji: string; meanings: string[] }> {
    if (!dbInstance || !query.trim()) return []

    try {
      const results: Array<{ kanji: string; meanings: string[] }> = []
      const stmt = dbInstance.prepare('SELECT kanji, meanings FROM word_lookup WHERE kanji LIKE ? OR term LIKE ? OR readings LIKE ? LIMIT 100')
      stmt.bind([`%${query}%`, `%${query}%`])
      
      while (stmt.step()) {
        const row = stmt.getAsObject()
        const meaningsData = row.meanings as string
        
        const meanings = meaningsData
          .split(/[;,]/)
          .map(m => m.trim())
          .filter(m => m.length > 0)
        
        results.push({
          kanji: row.kanji as string,
          meanings
        })
      }
      
      stmt.free()
      return results
    } catch (err) {
      console.error('Error searching kanji:', err)
      return []
    }
  }

  return { 
    isLoaded, 
    loading, 
    error, 
    loadDictionary,
    lookupWord,
    searchKanji
  }
})