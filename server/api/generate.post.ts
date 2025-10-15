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
          content: `Generate Japanese text for ${level} learners. Return ONLY this JSON structure with NO markdown, NO code blocks, NO explanations:
{"sentences":[{"words":[{"kanji":"今日","kana":"きょう","meaning":"today","pos":"noun"}]}]}

Rules:
- pos: noun, verb, adjective, particle, adverb
- 3-4 sentences only
- ${level} vocabulary
- Start output immediately with {`
        },
        {
          role: 'user',
          content: `Generate ${level} Japanese text now:`
        }
      ],
      temperature: 0.7,
      max_tokens: 800,
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