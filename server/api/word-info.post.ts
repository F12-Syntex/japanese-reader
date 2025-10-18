export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const apiKey = body?.apiKey || ''
  const word = body?.word || ''

  if (!apiKey || !word) {
    setResponseStatus(event, 400)
    return { error: 'Missing apiKey or word' }
  }

  try {
    const messages = [
      {
        role: 'system',
        content: 'You are a strict JSON generator. Respond with a single JSON object and nothing else. The schema must be: { "kanji": string, "reading": string, "meaning": string, "pos": string, "example": string, "jlptLevel": string, "pitchAccent": string }. If you are unsure about a field, return an empty string for that field.'
      },
      {
        role: 'user',
        content: `Provide the JSON object for the single Japanese word: "${word}"`
      }
    ]

    const res = await $fetch<any>('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: {
        model: 'gpt-5-nano-2025-08-07',
        messages,
        temperature: 0.05,
        max_tokens: 600
      }
    })

    const content = res?.choices?.[0]?.message?.content || ''
    let parsed: any = null

    try {
      parsed = JSON.parse(content.trim())
    } catch (e) {
      const match = content.match(/\{[\s\S]*\}/)
      if (match) {
        try {
          parsed = JSON.parse(match[0])
        } catch (err) {
          parsed = null
        }
      }
    }

    if (!parsed) {
      setResponseStatus(event, 502)
      return { error: 'Failed to parse model response', raw: String(content).slice(0, 200) }
    }

    const normalized = {
      kanji: typeof parsed.kanji === 'string' ? parsed.kanji : '',
      reading: typeof parsed.reading === 'string' ? parsed.reading : '',
      meaning: typeof parsed.meaning === 'string' ? parsed.meaning : '',
      pos: typeof parsed.pos === 'string' ? parsed.pos : '',
      example: typeof parsed.example === 'string' ? parsed.example : '',
      jlptLevel: typeof parsed.jlptLevel === 'string' ? parsed.jlptLevel : '',
      pitchAccent: typeof parsed.pitchAccent === 'string' ? parsed.pitchAccent : ''
    }

    return { success: true, data: normalized }
  } catch (err: any) {
    setResponseStatus(event, 500)
    return { error: err?.message || 'GPT request failed' }
  }
})