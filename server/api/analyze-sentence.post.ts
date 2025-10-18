import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { apiKey, sentence, words, allSentences } = body || {}

  if (!apiKey || !sentence || !Array.isArray(words)) {
    throw createError({
      statusCode: 400,
      message: 'Missing required fields: apiKey, sentence, words'
    })
  }

  const systemPrompt = `You are a Japanese grammar expert. Analyze the given sentence and provide a detailed breakdown.

Return your response in this exact JSON format:
{
  "translation": "English translation of the sentence",
  "storyContext": "Brief context if this is part of a story (empty if not applicable)",
  "connections": [
    {
      "from": "word before particle",
      "particle": "the particle",
      "to": "word after particle",
      "role": "grammatical role of particle",
      "explanation": "how this particle connects the words"
    }
  ],
  "references": [
    {
      "type": "character/place/object",
      "element": "the referenced element",
      "explanation": "what it refers to in the story"
    }
  ]
}

Rules:
- Output ONLY a single JSON object. No markdown, no comments, no extra text.
- Focus on particles and their connections. Explain each particle's role clearly.
- If no story context is available, set "storyContext" to an empty string.
`

  const userPrompt = `Analyze this Japanese sentence:

Sentence: ${sentence}

Words breakdown: ${JSON.stringify(words)}

${Array.isArray(allSentences) && allSentences.length > 1 ? `Story context (other sentences): ${allSentences.join(', ')}` : ''}

Provide the analysis in the specified JSON format.`

  try {
    const resp = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-5-mini',
        // The Responses API accepts an array of role/content items for input
        input: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        reasoning: { effort: 'minimal' },
        text: { verbosity: 'low' },
        max_output_tokens: 2500
      })
    })

    const raw = await resp.text()

    if (!resp.ok) {
      throw createError({
        statusCode: resp.status === 401 ? 401 : 502,
        message: `OpenAI API request failed`,
        data: raw.slice(0, 2000)
      })
    }

    let outputText: string | null = null
    let parsed: any = null

    try {
      parsed = JSON.parse(raw)
      // Prefer the convenience field if present
      if (typeof parsed?.output_text === 'string') {
        outputText = parsed.output_text
      } else if (Array.isArray(parsed?.output)) {
        // Collect any text fragments from output[].content[].text
        const parts: string[] = []
        for (const item of parsed.output) {
          if (Array.isArray(item?.content)) {
            for (const c of item.content) {
              if (typeof c?.text === 'string') parts.push(c.text)
            }
          }
          if (typeof item?.text === 'string') parts.push(item.text)
        }
        outputText = parts.join('').trim() || null
      } else if (parsed?.choices?.[0]?.message?.content) {
        // Fallback for compatibility
        outputText = parsed.choices[0].message.content
      }
    } catch {
      // Rare fallback: try raw as-is
      outputText = raw
    }

    if (!outputText) {
      throw createError({
        statusCode: 502,
        message: 'No content from model'
      })
    }

    // Ensure we only return valid JSON object
    let analysis: any
    try {
      analysis = JSON.parse(outputText.trim())
    } catch {
      // Try to extract the first JSON object in the text
      const match = outputText.match(/\{[\s\S]*\}/)
      if (!match) {
        throw createError({
          statusCode: 502,
          message: 'Failed to parse JSON analysis',
          data: outputText.slice(0, 2000)
        })
      }
      try {
        analysis = JSON.parse(match[0])
      } catch {
        throw createError({
          statusCode: 502,
          message: 'Failed to parse JSON analysis',
          data: outputText.slice(0, 2000)
        })
      }
    }

    return { analysis }
  } catch (error: any) {
    throw createError({
      statusCode: error?.statusCode || 500,
      message: error?.message || 'Unexpected error',
      data: error?.data
    })
  }
})