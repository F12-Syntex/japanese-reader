export const useOpenAI = () => {
  const getApiKey = () => {
    return localStorage.getItem('openai_api_key') || ''
  }

  const streamGenerateText = async (level: string = 'N5', onChunk: (chunk: string) => void) => {

    const apiKey = getApiKey()
    if (!apiKey) {
      throw new Error('API key not found')
    }

    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ apiKey, level })
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
    streamGenerateText
  }
}