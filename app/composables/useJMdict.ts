export const useJMdict = () => {
  const getTables = async (): Promise<string[]> => {
    const { data } = await useFetch<string[]>('/api/dictionary/dictionary-tables')
    return data.value ?? []
  }

  const getTableSchema = async (tableName: string): Promise<Array<{ cid: number; name: string; type: string; notnull: number; dflt_value: any; pk: number }>> => {
    const { data } = await useFetch<Array<{ cid: number; name: string; type: string; notnull: number; dflt_value: any; pk: number }>>('/api/dictionary/dictionary-schema', {
      method: 'POST',
      body: { tableName }
    })
    return data.value ?? []
  }

  const getTableCount = async (tableName: string): Promise<number> => {
    const { data } = await useFetch<number>('/api/dictionary/dictionary-count', {
      method: 'POST',
      body: { tableName }
    })
    return data.value ?? 0
  }

  const executeQuery = async (sql: string): Promise<any> => {
    const { data } = await useFetch('/api/dictionary/dictionary-query', {
      method: 'POST',
      body: { sql }
    })
    return data.value ?? null
  }

  const getAllSchemas = async (): Promise<Map<string, Array<{ cid: number; name: string; type: string; notnull: number; dflt_value: any; pk: number }>>> => {
    const { data } = await useFetch<Record<string, Array<{ cid: number; name: string; type: string; notnull: number; dflt_value: any; pk: number }>>>('/api/dictionary/dictionary-all-schemas')
    if (!data.value) return new Map()
    return new Map(Object.entries(data.value))
  }

  const searchWords = async (query: string): Promise<Array<{
    id: string
    kanji: string[]
    kana: string[]
    glosses: string[]
  }>> => {
    const { data } = await useFetch<Array<{
      id: string
      kanji: string[]
      kana: string[]
      glosses: string[]
    }>>('/api/dictionary/dictionary-search', {
      method: 'POST',
      body: { query: query.trim() }
    })
    return data.value ?? []
  }

  return { searchWords, getTables, getTableSchema, getAllSchemas, getTableCount, executeQuery }
}