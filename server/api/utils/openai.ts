export interface OpenAIConfig {
  apiKey: string
  model: string
}

export const createOpenAIClient = (apiKey: string, model: string = 'gpt-5-mini') => {
  if (!apiKey) throw new Error('API key required')
  
  return {
    async request(params: {
      system: string
      user: string
      maxTokens?: number
    }) {
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          input: [
            { role: 'system', content: params.system },
            { role: 'user', content: params.user }
          ],
          reasoning: { effort: 'minimal' },
          text: { verbosity: 'low' },
          max_output_tokens: params.maxTokens ?? 2000
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }

      const data = await response.json()
      return extractContent(data)
    },

    async stream(params: {
      system: string
      user: string
      maxTokens?: number
    }) {
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          input: [
            { role: 'system', content: params.system },
            { role: 'user', content: params.user }
          ],
          reasoning: { effort: 'minimal' },
          text: { verbosity: 'high' },
          max_output_tokens: params.maxTokens ?? 2500,
          stream: true
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      return response.body
    }
  }
}

function extractContent(envelope: any): string {
  if (typeof envelope?.output_text === 'string') {
    return envelope.output_text
  }

  if (Array.isArray(envelope?.output)) {
    const parts: string[] = []
    for (const item of envelope.output) {
      if (item?.content && Array.isArray(item.content)) {
        for (const c of item.content) {
          if (typeof c?.text === 'string') parts.push(c.text)
        }
      }
      if (typeof item?.text === 'string') parts.push(item.text)
    }
    const joined = parts.join('').trim()
    if (joined) return joined
  }

  if (envelope?.choices?.[0]?.message?.content) {
    return envelope.choices[0].message.content
  }

  throw new Error('Unable to extract content from response')
}

export const parseJSON = (text: string): Record<string, any> => {
  try {
    return JSON.parse(text.trim())
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) {
      return JSON.parse(match[0])
    }
    throw new Error('Invalid JSON')
  }
}