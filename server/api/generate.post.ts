import fs from 'node:fs'
import path from 'node:path'

export default defineEventHandler(async (event) => {
  const { apiKey, level, knownWords } = await readBody(event)

  const cleanedLevel = level.replace(/[+]$|[-]$/, '')


  type GrammarPoint = {
    level: string
    grammarPoint: string
    japanese: string
    english: string
  }

  //fetch from baseurl/grammar_points.csv
  const config = useRuntimeConfig()
  const baseUrl = config.public?.baseUrl ?? process.env.BASE_URL ?? 'http://localhost:3000'
  const csvContent = (await $fetch(`${baseUrl}/grammar_points.csv`)) as string
  const lines = csvContent.split('\n').filter((l: string) => l.trim())
  const grammarPoints: GrammarPoint[] = lines.slice(1).map((line: string) => {
    const parts = line.split(',')
    return {
      level: parts[0] ?? '',
      grammarPoint: parts[1] ?? '',
      japanese: parts[2] ?? '',
      english: parts[3] ?? ''
    }
  })
  const relevantGrammar = grammarPoints
    .filter((g: GrammarPoint) => g.level === cleanedLevel)
    .map((g: GrammarPoint) => ({
      point: g.grammarPoint,
      japanese: g.japanese,
      english: g.english
    }))

  const wordListText = knownWords?.length > 0 
    ? `Use ONLY these known words: ${knownWords.slice(0, 100).join(', ')}`
    : ''


  const storyThemes: string[] = [
    'medieval',
    'sci-fi',
    'fantasy',
    'school life',
    'romance',
    'adventure',
    'mystery',
    'slice of life',
    'historical',
    'comedy',
    'horror',
    'drama',
    'supernatural',
    'detective',
    'sports',
    'music',
    'travel',
    'friendship',
    'family',
    'workplace',
  ];

  const randomTheme = storyThemes[Math.floor(Math.random() * storyThemes.length)];

  const prompt = `Generate a coherent SHORT STORY (5-7 sentences) in Japanese at JLPT ${level} level.

VOCABULARY LIST PLEASE LIMIT YOURSELF TO THESE WORDS ( you may freely use particles and common grammar, but for nouns, verbs, adjectives, adverbs, etc. use only the words from this list):
${wordListText}

GRAMMAR POINTS TO INCORPORATE (use at least 3 of these grammar points in the story):
${relevantGrammar.map(g => `- ${g.point} (${g.japanese}): ${g.english}`).join('\n')}

STORY THEME: The story should be about a ${randomTheme} setting.

Return ONLY valid JSON (no markdown):
{
  "sentences": [
    {"text": "sentence in Japanese"}
  ]
}`

  const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-5-mini',
        input: [
          { role: 'system', content: 'You are a Japanese language teacher creating coherent stories for learners. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        reasoning: { effort: 'minimal' },
        text: { verbosity: 'high' },
        max_output_tokens: 2500,
        stream: true
      })
    })

  if (!response.ok) {
    throw createError({
      statusCode: response.status,
      message: 'OpenAI API request failed'
    })
  }

  setResponseHeaders(event, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  })

  const stream = response.body
  if (!stream) {
    throw createError({
      statusCode: 500,
      message: 'No response stream'
    })
  }

  const reader = stream.getReader()
  const decoder = new TextDecoder()

  const readable = new ReadableStream({
    start(controller) {
      controller.enqueue(`data: ${JSON.stringify({ type: 'grammar', data: relevantGrammar })}\n\n`)
    },
    async pull(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n').filter(line => line.trim() !== '')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') continue

              try {
                const parsed = JSON.parse(data)
                const content = parsed.delta.trim()
                if (content) {
                  console.log('Generated story content:', content)
                  controller.enqueue(`data: ${JSON.stringify({ type: 'story', content })}\n\n`)
                }
              } catch (e) {}
            }
          }
        }
      } finally {
        controller.enqueue('data: [DONE]\n\n')
        reader.releaseLock()
        controller.close()
      }
    }
  })

  return sendStream(event, readable)
})