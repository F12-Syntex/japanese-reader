import { defineEventHandler, readBody, setResponseHeaders, sendStream } from 'h3'
import { createOpenAIClient } from './utils/openai'
import { getGrammarByLevel, loadGrammarPoints } from './utils/grammar'

export default defineEventHandler(async (event) => {
  const { apiKey, level, knownWords } = await readBody(event)

  if (!apiKey?.trim() || !level?.trim()) {
    throw createError({ statusCode: 400, message: 'apiKey and level required' })
  }

  const client = createOpenAIClient(apiKey)
  const config = useRuntimeConfig()
  const baseUrl = String(config.public?.baseUrl ?? 'http://localhost:3000')

  const cleanLevel = level.replace(/[+\-]$/, '')
  const grammarPoints = await loadGrammarPoints(baseUrl)
  const relevantGrammar = getGrammarByLevel(cleanLevel, grammarPoints)

  const wordList = knownWords?.length > 0 ? `Use only: ${knownWords.slice(0, 100).join(', ')}` : ''
  const themes = ['medieval', 'sci-fi', 'fantasy', 'school', 'romance', 'adventure', 'mystery']
  const theme = themes[Math.floor(Math.random() * themes.length)]

  const systemPrompt = `You are a Japanese language teacher. Generate a N${cleanLevel} story about ${theme}.
CRITICAL: Respond ONLY with valid JSON. No markdown, no explanation.
{"sentences": [{"text": "Japanese sentence here"}]}`

  const userPrompt = `Generate 5-7 sentences in Japanese at N${cleanLevel} level about a ${theme} theme.
${wordList}

Grammar points (use at least 3):
${relevantGrammar.slice(0, 5).map(g => `- ${g.point}: ${g.english}`).join('\n')}

RESPOND ONLY WITH JSON:`

  setResponseHeaders(event, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  })

  try {
    const body = await client.stream({
      system: systemPrompt,
      user: userPrompt,
      maxTokens: 1500,
      temperature: 0.7
    })

    const reader = body.getReader()
    const decoder = new TextDecoder()

    const readable = new ReadableStream({
      start(controller) {
        controller.enqueue(`data: ${JSON.stringify({ type: 'grammar', data: relevantGrammar })}\n\n`)
      },
      async pull(controller) {
        try {
          let buffer = ''

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (!line.trim()) continue
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim()
                if (data === '[DONE]') continue

                try {
                  const parsed = JSON.parse(data)
                  const content = parsed?.choices?.[0]?.delta?.content || 
                                 parsed?.delta || 
                                 parsed?.content || ''
                  
                  if (content) {
                    controller.enqueue(`data: ${JSON.stringify({ type: 'content', value: content })}\n\n`)
                  }
                } catch {}
              }
            }
          }

          if (buffer.trim()) {
            try {
              const parsed = JSON.parse(buffer)
              const content = parsed?.choices?.[0]?.delta?.content || parsed?.delta || parsed?.content || ''
              if (content) {
                controller.enqueue(`data: ${JSON.stringify({ type: 'content', value: content })}\n\n`)
              }
            } catch {}
          }
        } catch (error) {
          console.error('Stream error:', error)
          controller.enqueue(`data: ${JSON.stringify({ type: 'error', error: String(error) })}\n\n`)
        } finally {
          controller.enqueue('data: [DONE]\n\n')
          reader.releaseLock()
          controller.close()
        }
      }
    })

    return sendStream(event, readable)
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || 'Stream initialization failed'
    })
  }
})