export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { apiKey, sentence, words, allSentences } = body

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

Focus on particles and their connections. Explain each particle's role clearly.`

  const userPrompt = `Analyze this Japanese sentence:

Sentence: ${sentence}

Words breakdown: ${JSON.stringify(words)}

${allSentences.length > 1 ? `Story context (other sentences): ${allSentences.join(', ')}` : ''}

Provide the analysis in the specified JSON format.`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })
    })

    if (!response.ok) {
      throw new Error('OpenAI API request failed')
    }

    const data = await response.json()
    const content = data.choices[0].message.content
    const analysis = JSON.parse(content)

    return {
      analysis
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message
    })
  }
})