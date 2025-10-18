import { defineEventHandler, readBody, setResponseStatus } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const apiKey = body?.apiKey || ''
  const words = Array.isArray(body?.words) ? body.words.map(String).filter(Boolean) : []

  if (!apiKey || words.length === 0) {
    setResponseStatus(event, 400)
    return { error: 'Missing apiKey or words array' }
  }

  try {
    const system = `You are a strict JSON generator. Respond with a single JSON object and nothing else. The top-level object must map each input word (exact surface form) to an object with keys: "reading", "meaning", "pos", "jlptLevel". Use an empty string for unknown fields. If the word is native-level or not covered by JLPT, set "jlptLevel" to "Native". Do not output any extra text, comments, or markdown.`

    const user = `Return a single JSON object mapping each of these words to their metadata. Words: ${JSON.stringify(words)}`

    // Migrate to Responses API with GPT-5 parameters
    const resp = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-5-nano',
        // Combine system + user into a single input string per Responses API examples
        input: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        reasoning: { effort: 'minimal' },
        text: { verbosity: 'low' },
        max_output_tokens: 1600
      })
    })

    const text = await resp.text()

    if (!resp.ok) {
      setResponseStatus(event, resp.status === 401 ? 401 : 502)
      return { error: 'OpenAI API error', status: resp.status, raw: text.slice(0, 2000) }
    }

    // Parse Responses API shape
    // Responses API commonly returns:
    // {
    //   id, model, output: [{type: 'message', role: 'assistant', content: [{type:'output_text', text:'...'}]}], ...
    //   output_text: '...'
    // }
    let content: string | null = null
    let parsedEnvelope: any = null
    try {
      parsedEnvelope = JSON.parse(text)
      // Prefer output_text if present
      if (typeof parsedEnvelope?.output_text === 'string') {
        content = parsedEnvelope.output_text
      } else if (Array.isArray(parsedEnvelope?.output)) {
        // Concatenate any text parts from output
        const parts: string[] = []
        for (const item of parsedEnvelope.output) {
          if (item?.content && Array.isArray(item.content)) {
            for (const c of item.content) {
              if (typeof c?.text === 'string') parts.push(c.text)
            }
          }
          // Some responses might embed text directly
          if (typeof item?.text === 'string') parts.push(item.text)
        }
        content = parts.join('').trim() || null
      } else {
        // Fallback to message-like compatibility if provided
        content = parsedEnvelope?.choices?.[0]?.message?.content || null
      }
    } catch {
      // Fallback: raw text (unlikely with Responses API)
      const match = text.match(/\{[\s\S]*\}/)
      content = match ? match[0] : text
    }

    if (!content) {
      setResponseStatus(event, 502)
      return { error: 'No content from model', raw: text.slice(0, 2000) }
    }

    // Try to parse strict JSON
    let parsed: Record<string, any> | null = null
    try {
      parsed = JSON.parse(content.trim())
    } catch {
      const match = content.match(/\{[\s\S]*\}/)
      if (match) {
        try {
          parsed = JSON.parse(match[0])
        } catch {
          parsed = null
        }
      }
    }

    if (!parsed || typeof parsed !== 'object') {
      setResponseStatus(event, 502)
      return { error: 'Failed to parse model response', raw: content.slice(0, 2000) }
    }

    const normalized: Record<string, { reading: string; meaning: string; pos: string; jlptLevel: string }> = {}

    for (const w of words) {
      const entry = parsed[w] || parsed[String(w)] || {}
      normalized[w] = {
        reading: typeof entry.reading === 'string' ? entry.reading : '',
        meaning: typeof entry.meaning === 'string' ? entry.meaning : '',
        pos: typeof entry.pos === 'string' ? entry.pos : '',
        jlptLevel: typeof entry.jlptLevel === 'string' && entry.jlptLevel ? entry.jlptLevel : ''
      }
      if (!normalized[w].jlptLevel && normalized[w].meaning && /native|not jlpt|not covered|native word/i.test(normalized[w].meaning)) {
        normalized[w].jlptLevel = 'Native'
      }
      if (!normalized[w].jlptLevel && normalized[w].meaning && /N[1-5]/i.test(normalized[w].meaning)) {
        const found = normalized[w].meaning.match(/N[1-5]/i)
        normalized[w].jlptLevel = found ? found[0].toUpperCase() : normalized[w].jlptLevel
      }
    }

    return { success: true, data: normalized }
  } catch (err: any) {
    setResponseStatus(event, 500)
    return { error: err?.message || 'GPT request failed' }
  }
})