import { useApiKeyStore } from '~/stores/useApiKeyStore'

export const useOpenAI = () => {
  const apiStore = useApiKeyStore()

  if (import.meta.client && !apiStore.key) {
    apiStore.load()
  }

  const getApiKey = () => apiStore.key

  const streamGenerateText = async (
    level: string,
    knownWords: string[],
    onChunk: (chunk: string) => void
  ) => {
    const apiKey = getApiKey()
    if (!apiKey) throw new Error('API key not set')

    const response = await fetch('/api/text-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey, level, knownWords })
    })

    if (!response.ok) throw new Error('Text generation failed')
    if (!response.body) throw new Error('No response body')

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
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
              const content = parsed.value || ''

              if (parsed.type === 'content') onChunk(content)
            } catch {}
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  return {
    getApiKey,
    streamGenerateText,
    loadApiKey: () => apiStore.load()
  }
}