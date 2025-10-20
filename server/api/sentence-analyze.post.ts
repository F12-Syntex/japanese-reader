import { defineEventHandler, readBody } from 'h3'
import { createOpenAIClient, parseJSON } from './utils/openai'

export default defineEventHandler(async (event) => {
  const { apiKey, sentence, words, allSentences } = await readBody(event)

  if (!apiKey?.trim() || !sentence?.trim()) {
    throw createError({ statusCode: 400, message: 'apiKey and sentence required' })
  }

  const client = createOpenAIClient(apiKey)

  const systemPrompt = `You are a Japanese grammar expert. Analyze sentences and provide JSON output only.

Return this structure:
{
  "translation": "English",
  "storyContext": "Context or empty string",
  "connections": [{"from":"word","particle":"は","to":"word","role":"topic","explanation":"..."}],
  "references": [{"type":"element","element":"name","explanation":"..."}]
}`

  const userPrompt = `Analyze: ${sentence}

Words: ${JSON.stringify(words?.slice(0, 20) ?? [])}

Context: ${Array.isArray(allSentences) && allSentences.length > 1 ? allSentences.join(' ') : 'None'}`

  try {
    const content = await client.request({ system: systemPrompt, user: userPrompt })
    const analysis = parseJSON(content)

    return { analysis }
  } catch (error: any) {
    throw createError({
      statusCode: 502,
      message: error.message || 'Analysis failed'
    })
  }
})