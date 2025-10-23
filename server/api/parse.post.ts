// server/api/parse.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { extractReading, mapPOS, tokenizeText } from './utils/kuromoji'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { text } = body || {}

    if (!text || typeof text !== 'string') {
      throw createError({
        statusCode: 400,
        message: 'Text is required'
      })
    }

    const tokens = await tokenizeText(text)

    const words = tokens.map((token: any) => {
      const surface = token.surface_form
      const baseForm = token.basic_form && token.basic_form !== '*' ? token.basic_form : surface
      const reading = extractReading(token)
      const pos = mapPOS(token.pos || '')

      return { surface, baseForm, reading, pos }
    })

    return { words }
  } catch (error: any) {
    // If util throws (e.g., dict not found or network error), surface a 500
    console.error('Parse error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to parse text'
    })
  }
})