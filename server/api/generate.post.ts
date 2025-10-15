// server/api/generate.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { apiKey, level, knownWords } = body

  if (!apiKey) {
    throw createError({
      statusCode: 400,
      message: 'API key is required'
    })
  }

  const hasKnownWords = knownWords && knownWords.length > 0

  let prompt = ''
  
  if (hasKnownWords) {
    prompt = `You are a Japanese language teacher. Generate a short story (4-6 sentences) in Japanese using ONLY these words that the student knows:

${knownWords.slice(0, 200).join(', ')}

Requirements:
- Use ONLY words from the list above
- Generate natural, interesting sentences
- Make the story coherent and engaging
- JLPT ${level} grammar level
- Return ONLY Japanese text in the specified JSON format

Return this exact JSON structure:
{
  "sentences": [
    {
      "text": "完全な日本語の文"
    }
  ]
}

Each sentence object should only have the "text" field with the complete Japanese sentence. Do not include any English translations, meanings, or word breakdowns.`
  } else {
    prompt = `Generate a short story (4-6 sentences) in Japanese at JLPT ${level} level.

Requirements:
- Natural, interesting sentences
- Coherent and engaging story
- Appropriate for ${level} level
- Return ONLY Japanese text in the specified JSON format

Return this exact JSON structure:
{
  "sentences": [
    {
      "text": "完全な日本語の文"
    }
  ]
}

Each sentence object should only have the "text" field with the complete Japanese sentence. Do not include any English translations, meanings, or word breakdowns.`
  }

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
          content: 'You are a Japanese language teacher. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      stream: true
    })
  })

  if (!response.ok) {
    throw createError({
      statusCode: response.status,
      message: 'OpenAI API request failed'
    })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const reader = response.body?.getReader()
      if (!reader) return

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const text = new TextDecoder().decode(value)
          const lines = text.split('\n').filter(line => line.trim() !== '')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                continue
              }

              try {
                const parsed = JSON.parse(data)
                const content = parsed.choices?.[0]?.delta?.content
                if (content) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
                }
              } catch (e) {}
            }
          }
        }
      } finally {
        controller.close()
      }
    }
  })

  return sendStream(event, stream)
})