import { defineEventHandler, readBody } from 'h3'
import { createOpenAIClient, parseJSON } from './utils/openai'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { apiKey, sentence, words, allSentences, model } = body

  if (!apiKey?.trim() || !sentence?.trim()) {
    throw createError({
      statusCode: 400,
      message: 'Missing required fields: apiKey, sentence'
    })
  }

  const systemPrompt = `You are a Japanese grammar expert. Analyze the given sentence and provide a detailed breakdown including word meanings, readings, and parts of speech.

Return your response in this exact JSON format:
{
  "translation": "English translation of the sentence",
  "storyContext": "Brief context if this is part of a story (empty if not applicable)",
  "words": [
    {
      "kanji": "漢字",
      "reading": "かな",
      "meaning": "English meaning (only the most relevant meaning for this context)",
      "pos": "noun/verb/adjective/adverb/particle/conjunction/etc"
    }
  ],
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
- For "words" array, include ALL words in the sentence in order, with accurate readings, meanings, and parts of speech.
- For meanings, provide only the most relevant meaning for this sentence context (not all dictionary meanings).
- For parts of speech, use: noun, verb, adjective, adverb, particle, conjunction, prefix, suffix, interjection, etc.
- Focus on particles and their connections. Explain each particle's role clearly.
- If no story context is available, set "storyContext" to an empty string.`

  const userPrompt = `Analyze this Japanese sentence:

Sentence: ${sentence}

Parser words breakdown (may be incomplete or incorrect, especially for conjunctions):
${JSON.stringify(words?.slice(0, 30) ?? [])}

Important: 
- Provide ALL words in the sentence in the "words" array, including conjunctions and particles that the parser might have missed.
- Match words by their position in the sentence as closely as possible.
- For each word, provide the most accurate reading (hiragana/katakana) and the most relevant meaning for this sentence context.
- Ensure parts of speech are accurate (e.g., identify conjunctions, particles, etc. correctly).

${Array.isArray(allSentences) && allSentences.length > 0 ? `Story context: ${allSentences.join(', ')}` : ''}`

  try {
    const client = createOpenAIClient(apiKey, model ?? 'gpt-5-mini')
    const content = await client.request({
      system: systemPrompt,
      user: userPrompt,
      maxTokens: 3500
    })

    const analysis = parseJSON(content)
    return { analysis }
  } catch (error: any) {
    throw createError({
      statusCode: error.message?.includes('401') ? 401 : 502,
      message: error.message || 'Analysis failed'
    })
  }
})