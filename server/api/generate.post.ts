export default defineEventHandler(async (event) => {
  try {
    const { apiKey, level } = await readBody(event)

    if (!apiKey) {
      throw createError({
        statusCode: 400,
        message: 'API key is required'
      })
    }

    const { default: OpenAI } = await import('openai')
    const openai = new OpenAI({ apiKey })

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a Japanese language teacher. Generate Japanese text suitable for ${level} learners. Return ONLY valid JSON in this exact format, no markdown, no code blocks:
{"sentences": [{"words": [{"kanji": "string", "kana": "string", "meaning": "string", "pos": "noun|verb|adjective|particle|adverb"}]}]}

Rules:
- pos must be one of: noun, verb, adjective, particle, adverb
- Include 6-10 sentences
- Use appropriate ${level} vocabulary
- Each word must have all fields`
        },
        {
          role: 'user',
          content: `Generate a short story or text passage for ${level} level Japanese learners. Return only the JSON object.`
        }
      ],
      temperature: 0.8,
      stream: true
    })

    setResponseHeaders(event, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    })

    const encoder = new TextEncoder()
    
    return sendStream(event, new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content
            if (content) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (error) {
          console.error('Stream error:', error)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`))
          controller.close()
        }
      }
    }))
  } catch (error: any) {
    console.error('API error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to generate text'
    })
  }
})