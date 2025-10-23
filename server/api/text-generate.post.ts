import { defineEventHandler, readBody, setResponseHeaders, sendStream } from 'h3'
import { createOpenAIClient } from './utils/openai'
import { getGrammarByLevel, loadGrammarPoints } from './utils/grammar'

interface GrammarPoint {
  point: string
  english: string
}

export default defineEventHandler(async (event) => {
  const { apiKey, level, knownWords, model } = await readBody(event)

  if (!apiKey?.trim() || !level?.trim()) {
    throw createError({
      statusCode: 400,
      message: 'apiKey and level required'
    })
  }

  const config = useRuntimeConfig()
  const baseUrl = String(config.public?.baseUrl ?? 'http://localhost:3000')
  const cleanLevel = level.replace(/[+\-]$/, '')
  const grammarPoints = await loadGrammarPoints(baseUrl)
  const relevantGrammar = getGrammarByLevel(cleanLevel, grammarPoints)

  const wordList = knownWords?.length > 0 ? `Use only: ${knownWords.join(', ')}` : ''
  const themes = ['medieval', 'sci-fi', 'fantasy', 'school', 'romance', 'adventure', 'mystery']
  const theme = themes[Math.floor(Math.random() * themes.length)]


  const shuffleArray = <T,>(arr: T[]): T[] => {
    const a = arr.slice()
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  const shuffledGrammar = shuffleArray(relevantGrammar)

const userPrompt = `
You are a Japanese language writing assistant. Produce natural, realistic, and coherent Japanese that matches the learner’s reading level.

Task:
- Write 5–7 sentences in Japanese at the ${cleanLevel} level about the theme: ${theme}.
- All sentences must be linked and form a coherent, realistic mini-story with a beginning, development, and light resolution.
- Prefer the words in the Word List below. If the list is too short to remain natural, you may add common, level-appropriate words sparingly.
- Use at least 3 distinct grammar points from the list across the story. In each sentence, list only the grammar actually used.
- Particles count as grammar points.
- Keep vocabulary and grammar appropriate to ${cleanLevel}; avoid idioms or kanji that exceed the level unless essential.

Word List (prefer and reuse these; add minimally if needed):
- ${wordList}

Grammar Points (choose from these; use at least 3 across the story):
${shuffledGrammar
  .slice(0, 20)
  .map((g: GrammarPoint) => `- ${g.point}: ${g.english}`)
  .join('\\n')}

Style and cohesion:
- Use natural, context-rich sentences reflecting everyday situations for the chosen theme.
- Maintain cohesion (consistent subjects, time, place); use referents like それ/その日/そこで when helpful.
- Avoid overly textbook-like phrasing; prefer authentic, level-appropriate expressions.
- Vary sentence length modestly; keep readability at ${cleanLevel}.
- If you introduce a name or noun, keep it consistent throughout.
- Keep register consistent (plain or polite) unless a justified switch is clear and minimal.

Output format:
Respond ONLY with valid JSON in exactly this shape:
{
  "sentences": [
    { "text": "Japanese sentence 1", "grammar": ["point1", "point2"] },
    { "text": "Japanese sentence 2", "grammar": ["point3"] }
  ]
}

Validation rules:
- The JSON must parse.
- 5–7 sentences total.
- Each sentence must include at least one grammar point from the provided list (particles count).
- Do not include explanations, translations, romaji, furigana, or any extra fields.

Notes for naturalness:
- Prefer topic continuity with は and referents like その/この/あの.
- Use connectors suitable for ${cleanLevel} (e.g., それで, でも, だから, それから).
- Avoid sudden time or viewpoint shifts unless clearly signposted.
`;

  setResponseHeaders(event, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  })

  try {
    const client = createOpenAIClient(apiKey, model ?? 'gpt-5-mini')
    const body = await client.stream({
      user: userPrompt,
      maxTokens: 1500,
    })

    const reader = body.getReader()
    const decoder = new TextDecoder()

    const isJapanese = (char: string): boolean => {
      const code = char.charCodeAt(0)
      return (
        (code >= 0x3040 && code <= 0x309F) ||
        (code >= 0x30A0 && code <= 0x30FF) ||
        (code >= 0x4E00 && code <= 0x9FAF) ||
        (code >= 0xFF66 && code <= 0xFF9F) ||
        char === '。' || char === '、' || char === '！' || char === '？' ||
        char === '　' || char === '\n'
      )
    }

    const readable = new ReadableStream({
      start(controller) {
        controller.enqueue(`data: ${JSON.stringify({ type: 'grammar', data: relevantGrammar })}\n\n`)
      },
      async pull(controller) {
        try {
          let buffer = ''
          let accumulatedText = ''

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() ?? ''

            for (const line of lines) {
              if (!line.trim()) continue
              if (line.startsWith('event: ')) continue

              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim()
                if (data === '[DONE]') continue

                try {
                  const parsed = JSON.parse(data)
                  console.log('Parsed chunk:', parsed)

                  if (parsed.type === 'response.output_text.delta') {
                    const delta = parsed.delta ?? ''
                    accumulatedText += delta
                    
                    const japaneseOnly = Array.from(String(delta)).filter(isJapanese).join('')
                    if (japaneseOnly) {
                      controller.enqueue(`data: ${JSON.stringify({ type: 'delta', value: japaneseOnly })}\n\n`)
                    }
                  } else if (parsed.type === 'response.output_text.done') {
                    const finalText = parsed.text ?? accumulatedText
                    controller.enqueue(`data: ${JSON.stringify({ type: 'done', value: finalText })}\n\n`)
                  }
                } catch {}
              }
            }
          }
        } catch (error) {
          console.error('Stream error:', error)
          controller.enqueue(`data: ${JSON.stringify({ type: 'error', error: String(error) })}\n\n`)
        } finally {
          controller.enqueue('data: [DONE]\n\n')
          reader.releaseLock()
          controller.close()
        }
      }
    })

    return sendStream(event, readable)
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || 'Stream initialization failed'
    })
  }
})