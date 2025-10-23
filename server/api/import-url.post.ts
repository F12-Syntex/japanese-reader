export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const url = body?.url

  if (!url) {
    throw createError({ statusCode: 400, message: 'URL is required' })
  }

  try {
    const response = await fetch(url)
    const html = await response.text()
    
    const scriptStyleRegex = /<(script|style|nav|header|footer|aside)[^>]*>[\s\S]*?<\/\1>/gi
    const cleanHtml = html.replace(scriptStyleRegex, '')
    const textOnly = cleanHtml.replace(/<[^>]+>/g, ' ')
    
    const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+/g
    const matches = textOnly.match(japaneseRegex)
    const japaneseText = matches ? matches.join('') : ''

    if (!japaneseText) {
      throw new Error('No Japanese text found')
    }

    return { text: japaneseText }
  } catch (error: any) {
    throw createError({ statusCode: 500, message: error.message || 'Failed to import URL' })
  }
})