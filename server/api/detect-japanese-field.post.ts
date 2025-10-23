import { defineEventHandler, readBody, createError } from 'h3'
import { createOpenAIClient } from './utils/openai'

export default defineEventHandler(async (event) => {
  const { fields, apiKey } = await readBody<{ fields: { index: number; text: string }[]; apiKey: string }>(event)

  if (!apiKey?.trim()) {
    throw createError({ statusCode: 400, message: 'API key required' })
  }

  const systemPrompt = `You are analyzing Anki flashcard fields to identify which contains Japanese vocabulary words being studied.

Output ONLY a single number (the field index). No JSON, no explanation, just the number.`

  const userPrompt = `Which field contains the primary Japanese vocabulary word?

${fields.map((f) => `Field ${f.index}: ${f.text.slice(0, 200)}`).join('\n\n')}

Return only the field index number.`

  try {
    const client = createOpenAIClient(apiKey, 'gpt-4o-mini')
    const content = await client.request({
      system: systemPrompt,
      user: userPrompt,
      maxTokens: 10
    })

    const index = parseInt(content.trim())
    return { index: isNaN(index) ? -1 : index }
  } catch (error: any) {
    console.error('AI detection failed:', error)
    return { index: -1 }
  }
})