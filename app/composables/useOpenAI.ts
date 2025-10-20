// app/composables/useOpenAI.ts
import { useApiKeyStore } from '~/stores/useApiKeyStore'

export const useOpenAI = () => {
  const apiStore = useApiKeyStore()

  // Ensure store is loaded from localStorage on client
  if (import.meta.client && !apiStore.key) {
    apiStore.load()
  }

  const getApiKey = () => {
    return apiStore.key
  }

  const streamGenerateText = async (
    level: string = 'N5',
    knownWords: string[],
    onChunk: (chunk: string) => void
  ) => {
    const apiKey = getApiKey()
    if (!apiKey) {
      throw new Error('API key not found')
    }

    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ apiKey, level, knownWords })
    })

    if (!response.ok) {
      throw new Error('Failed to generate text')
    }

    if (!response.body) {
      throw new Error('No response body')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') continue
          
          try {
            const parsed = JSON.parse(data)
            if (parsed.content) {
              onChunk(parsed.content)
            }
          } catch (e) {}
        }
      }
    }
  }

  return {
    getApiKey,
    streamGenerateText,
    loadApiKey: () => apiStore.load()
  }
}