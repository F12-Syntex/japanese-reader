import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import { createOpenAIClient, parseJSON } from './utils/openai'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { apiKey, words, model } = body

  const wordList = Array.isArray(words) ? words.map(String).filter(Boolean) : []

  if (!apiKey?.trim() || wordList.length === 0) {
    setResponseStatus(event, 400)
    return { error: 'Missing apiKey or words array' }
  }

  try {
    const systemPrompt = `You are a strict JSON generator. Respond with a single JSON object and nothing else. Map each input word to: {reading, meaning, pos, jlptLevel}. Use empty string for unknown fields. For native/non-JLPT words, set jlptLevel to "Native". No extra text or markdown.`

    const userPrompt = `Return JSON mapping these words: ${JSON.stringify(wordList)}`

    const client = createOpenAIClient(apiKey, model ?? 'gpt-5-nano')
    const content = await client.request({
      system: systemPrompt,
      user: userPrompt,
      maxTokens: 1600
    })

    const parsed = parseJSON(content)

    const normalized: Record<string, { reading: string; meaning: string; pos: string; jlptLevel: string }> = {}

    for (const w of wordList) {
      const entry = parsed[w] ?? {}
      normalized[w] = {
        reading: String(entry.reading ?? ''),
        meaning: String(entry.meaning ?? ''),
        pos: String(entry.pos ?? ''),
        jlptLevel: String(entry.jlptLevel ?? '')
      }
    }

    return { success: true, data: normalized }
  } catch (err: any) {
    setResponseStatus(event, 500)
    return { error: err?.message || 'Request failed' }
  }
})