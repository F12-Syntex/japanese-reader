import { defineEventHandler, readBody } from 'h3'
import { createOpenAIClient, parseJSON } from './utils/openai'

export default defineEventHandler(async (event) => {
  const { apiKey, words, model } = await readBody(event)

  if (!apiKey?.trim() || !Array.isArray(words) || words.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'apiKey and words array required'
    })
  }

  const systemPrompt = `You are a JSON generator. Return only valid JSON object. Map each word to {reading, meaning, pos, jlptLevel}.`

  const userPrompt = `Map these words: ${JSON.stringify(words.slice(0, 50))}`

  try {
    const client = createOpenAIClient(apiKey, model ?? 'gpt-5-nano')
    const content = await client.request({
      system: systemPrompt,
      user: userPrompt,
      maxTokens: 1600
    })
    const data = parseJSON(content)

    const normalized: Record<string, { reading: string; meaning: string; pos: string; jlptLevel: string }> = {}
    
    for (const w of words) {
      const entry = data[w] ?? {}
      normalized[w] = {
        reading: String(entry.reading ?? ''),
        meaning: String(entry.meaning ?? ''),
        pos: String(entry.pos ?? ''),
        jlptLevel: String(entry.jlptLevel ?? '')
      }
    }

    return { success: true, data: normalized }
  } catch (error: any) {
    throw createError({
      statusCode: 502,
      message: error.message || 'Metadata fetch failed'
    })
  }
})