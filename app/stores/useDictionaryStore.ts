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
      // Load sql.js
      const SQL = await initSqlJs({
        locateFile: (file: string) => `https://sql.js.org/dist/${file}`
      })

      // Fetch the database file
      const response = await fetch('/jmdict_kanji_meanings.db')
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      
      const buffer = await response.arrayBuffer()
      dbInstance = new SQL.Database(new Uint8Array(buffer))
      
      // Debug logging
      const schema = dbInstance.exec("SELECT name FROM sqlite_master WHERE type='table'")
      console.log('Database schema:', schema)
      
      const countResult = dbInstance.exec('SELECT COUNT(*) as count FROM kanji_meaning')
      console.log('Number of entries in kanji_meaning table:', countResult[0]?.values[0][0])
      
      // Test lookup to see the actual data format
      const testResult = dbInstance.exec("SELECT kanji, meanings FROM kanji_meaning LIMIT 5")
      console.log('Sample entries:', testResult)
      
      isLoaded.value = true
    } catch (err: any) {
      error.value = err.message || 'Failed to load dictionary.'
      console.error('Dictionary load error:', err)
    } finally {
      loading.value = false
    }
  }

  function lookupKanji(kanji: string): string[] {
    if (!dbInstance) {
      console.warn('Dictionary not loaded, cannot lookup:', kanji)
      return []
    }

    console.log('Looking up kanji:', kanji)

    try {
      const stmt = dbInstance.prepare('SELECT meanings FROM kanji_meaning WHERE kanji = ?')
      stmt.bind([kanji])
      
      if (stmt.step()) {
        const row = stmt.getAsObject()
        const meaningsData = row.meanings as string
        stmt.free()
        
        // Try to parse as JSON first
        try {
          const meanings = JSON.parse(meaningsData)
          console.log('Found meanings (JSON) for', kanji, ':', meanings)
          return Array.isArray(meanings) ? meanings : [meanings]
        } catch (jsonError) {
          // If JSON parsing fails, it might be a plain string
          // Split by semicolon or comma and clean up
          const meanings = meaningsData
            .split(/[;,]/)
            .map(m => m.trim())
            .filter(m => m.length > 0)
          
          console.log('Found meanings (text) for', kanji, ':', meanings)
          return meanings
        }
      }
      
      stmt.free()
      console.log('No meanings found for:', kanji)
      return []
    } catch (err) {
      console.error('Error looking up kanji:', kanji, err)
      return []
    }
  }

  function searchKanji(query: string): Array<{ kanji: string; meanings: string[] }> {
    if (!dbInstance || !query.trim()) return []

    try {
      const results: Array<{ kanji: string; meanings: string[] }> = []
      const stmt = dbInstance.prepare('SELECT kanji, meanings FROM kanji_meaning WHERE kanji LIKE ? LIMIT 100')
      stmt.bind([`%${query}%`])
      
      while (stmt.step()) {
        const row = stmt.getAsObject()
        const meaningsData = row.meanings as string
        
        let meanings: string[]
        try {
          const parsed = JSON.parse(meaningsData)
          meanings = Array.isArray(parsed) ? parsed : [parsed]
        } catch {
          // Plain text fallback
          meanings = meaningsData
            .split(/[;,]/)
            .map(m => m.trim())
            .filter(m => m.length > 0)
        }
        
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
    lookupKanji,
    searchKanji
  }
})