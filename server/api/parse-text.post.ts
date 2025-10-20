import { defineEventHandler, readBody } from 'h3'
import { extractReading, mapPOS, tokenizeText } from './utils/kuromoji'

export default defineEventHandler(async (event) => {
  const { text } = await readBody(event)

  if (!text?.trim()) {
    throw createError({ statusCode: 400, message: 'text required' })
  }

  try {
    const tokens = await tokenizeText(text)

    const words = tokens.map((token: any) => ({
      surface: token.surface_form,
      baseForm: token.basic_form || token.surface_form,
      reading: extractReading(token),
      pos: mapPOS(token.pos)
    }))

    return { words }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || 'Parse failed'
    })
  }
})