export default defineEventHandler(async (event) => {
  const { apiKey, level, knownWords } = await readBody(event)

  const wordListText = knownWords?.length > 0 
    ? `Use ONLY these known words: ${knownWords.slice(0, 100).join(', ')}`
    : ''

  const prompt = `Generate a coherent SHORT STORY (5-7 sentences) in Japanese at JLPT ${level} level.

${wordListText}

IMPORTANT STORY REQUIREMENTS:
- Create a connected narrative with a beginning, middle, and end
- Characters, objects, and places should be referenced across multiple sentences
- Use pronouns (彼, 彼女, それ, etc.) to refer back to previously mentioned things
- Each sentence should build on the previous ones
- Include cause and effect relationships between sentences
- Use connecting words like だから, それで, しかし when appropriate

Return ONLY valid JSON (no markdown):
{
  "sentences": [
    {"text": "sentence in Japanese"}
  ]
}

Example of good story flow:
1. Introduce character/setting
2. Describe action/event
3. Show consequence
4. Continue with related action
5. Conclude the mini-story`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a Japanese language teacher creating coherent stories for learners. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 1000,
      stream: true
    })
  })

  if (!response.ok) {
    throw createError({
      statusCode: response.status,
      message: 'OpenAI API request failed'
    })
  }

  setResponseHeaders(event, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  })

  const stream = response.body
  if (!stream) {
    throw createError({
      statusCode: 500,
      message: 'No response stream'
    })
  }

  const reader = stream.getReader()
  const decoder = new TextDecoder()

  const readable = new ReadableStream({
    async pull(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n').filter(line => line.trim() !== '')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') continue

              try {
                const parsed = JSON.parse(data)
                const content = parsed.choices?.[0]?.delta?.content || ''
                if (content) {
                  controller.enqueue(`data: ${JSON.stringify({ content })}\n\n`)
                }
              } catch (e) {}
            }
          }
        }
      } finally {
        controller.enqueue('data: [DONE]\n\n')
        reader.releaseLock()
        controller.close()
      }
    }
  })

  return sendStream(event, readable)
})