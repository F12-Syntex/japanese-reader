import { useKuromojiParser } from './useKuromojiParser'
import type { ParsedWord, ParsedSentence } from '~/types/japanese'

export const usePdfReader = () => {
  const { parseText, parseSentences } = useKuromojiParser()

  const currentPageIndex = ref(0)
  const totalPages = ref(0)
  const isLoading = ref(false)
  const isProcessing = ref(false)
  const canGoNext = computed(() => currentPageIndex.value < totalPages.value - 1)
  const canGoPrev = computed(() => currentPageIndex.value > 0)
  const currentPageText = ref('')
  const currentPageImage = ref('')
  const pageCanvasUrl = ref('')
  const wordBounds = ref<any[]>([])
  const parsedWords = ref<ParsedWord[]>([])
  const pageSentences = ref<ParsedSentence[]>([])
  const pageWidth = ref(0)
  const pageHeight = ref(0)
  const zoom = ref(1)
  const textDirection = ref<'auto' | 'horizontal' | 'vertical'>('auto')
  const effectiveTextDirection = ref<'horizontal' | 'vertical'>('horizontal')
  const selectedFont = ref('auto')

  let pdfDoc: any = null
  let pdfjsLib: any = null

  // Filter out furigana based on font size
  const filterFurigana = (items: any[]) => {
    if (items.length === 0) return items

    const fontSizes = items
      .filter((item: any) => item.str && item.str.trim())
      .map((item: any) => {
        const tx = item.transform
        return Math.sqrt(tx[2] * tx[2] + tx[3] * tx[3])
      })

    if (fontSizes.length === 0) return items

    const sortedSizes = [...fontSizes].sort((a, b) => a - b)
    const medianSize = sortedSizes[Math.floor(sortedSizes.length / 2)]!
    const threshold = medianSize * 0.65

    return items.filter((item: any) => {
      if (!item.str || !item.str.trim()) return false
      const tx = item.transform
      const fontSize = Math.sqrt(tx[2] * tx[2] + tx[3] * tx[3])
      return fontSize >= threshold
    })
  }

  // Generate random color for each word
  const getRandomColor = () => {
    const hue = Math.floor(Math.random() * 360)
    return `hsl(${hue}, 70%, 50%)`
  }

  // Detect text direction
  const detectTextDirection = (textContentItems: any[]): 'horizontal' | 'vertical' => {
    const positions = textContentItems
      .filter((item: any) => item.str && item.str.trim())
      .map((item: any) => ({
        x: item.transform[4],
        y: item.transform[5],
        str: item.str
      }))

    if (positions.length < 2) return 'horizontal'

    let totalXDiff = 0
    let totalYDiff = 0

    for (let i = 1; i < positions.length; i++) {
      totalXDiff += Math.abs(positions[i].x - positions[i - 1].x)
      totalYDiff += Math.abs(positions[i].y - positions[i - 1].y)
    }

    const avgXDiff = totalXDiff / (positions.length - 1)
    const avgYDiff = totalYDiff / (positions.length - 1)

    return avgYDiff > avgXDiff * 1.5 ? 'vertical' : 'horizontal'
  }

  // Calculate word bounds with line wrapping detection
  const calculateWordBounds = (
    textContentItems: any[],
    parsedWords: ParsedWord[],
    fullText: string,
    viewport: any
  ) => {
    const bounds: any[] = []
    const charToWord: (ParsedWord | null)[] = new Array(fullText.length).fill(null)
    let currentPos = 0
    let mappedWords = 0
    let unmappedWords: ParsedWord[] = []

    // First pass: map words sequentially
    for (const word of parsedWords) {
      const wordText = word.kanji
      const startPos = fullText.indexOf(wordText, currentPos)

      if (startPos !== -1) {
        for (let i = 0; i < wordText.length; i++) {
          charToWord[startPos + i] = word
        }
        currentPos = startPos + wordText.length
        mappedWords++
      } else {
        unmappedWords.push(word)
      }
    }

    // Second pass: try to map unmapped words anywhere in the text
    for (const word of unmappedWords) {
      const wordText = word.kanji
      let found = false

      for (let i = 0; i < fullText.length; i++) {
        if (fullText.substring(i, i + wordText.length) === wordText) {
          let canMap = true
          for (let j = 0; j < wordText.length; j++) {
            if (charToWord[i + j] !== null) {
              canMap = false
              break
            }
          }

          if (canMap) {
            for (let j = 0; j < wordText.length; j++) {
              charToWord[i + j] = word
            }
            mappedWords++
            found = true
            break
          }
        }
      }
    }

    // Track character rectangles for each word
    interface CharRect {
      x: number
      y: number
      width: number
      height: number
      word: ParsedWord
    }

    const charRects: CharRect[] = []
    let textPosition = 0

    // Collect individual character rectangles
    for (const item of textContentItems) {
      if (!item.str || !item.str.trim()) continue

      const tx = item.transform
      const fontHeight = Math.sqrt(tx[2] * tx[2] + tx[3] * tx[3])
      const baselineX = tx[4]
      const baselineY = viewport.height - tx[5]
      const descent = fontHeight * 0.2
      const topY = baselineY - fontHeight + descent
      const charWidth = item.width / item.str.length

      for (let i = 0; i < item.str.length; i++) {
        const word = charToWord[textPosition + i]

        if (word) {
          const charX = baselineX + (i * charWidth)
          charRects.push({
            x: charX,
            y: topY,
            width: charWidth,
            height: fontHeight,
            word
          })
        }
      }

      textPosition += item.str.length
    }

    // Group character rectangles by word
    const wordGroups = new Map<ParsedWord, CharRect[]>()
    for (const rect of charRects) {
      if (!wordGroups.has(rect.word)) {
        wordGroups.set(rect.word, [])
      }
      wordGroups.get(rect.word)!.push(rect)
    }

    // Create bounds for contiguous segments
    for (const [word, rects] of wordGroups) {
      if (rects.length === 0) continue

      rects.sort((a, b) => {
        const yDiff = a.y - b.y
        if (Math.abs(yDiff) > 5) return yDiff
        return a.x - b.x
      })

      const segments: CharRect[][] = []
      const firstRect = rects[0]
      if (!firstRect) continue

      let currentSegment: CharRect[] = [firstRect]

      for (let i = 1; i < rects.length; i++) {
        const prev = rects[i - 1]
        const curr = rects[i]
        if (!prev || !curr) continue

        const yDiff = Math.abs(curr.y - prev.y)
        const xDiff = curr.x - (prev.x + prev.width)

        if (yDiff > 5 || xDiff > prev.width * 2) {
          segments.push(currentSegment)
          currentSegment = [curr]
        } else {
          currentSegment.push(curr)
        }
      }
      segments.push(currentSegment)

      const color = getRandomColor()
      for (const segment of segments) {
        const minX = Math.min(...segment.map(r => r.x))
        const minY = Math.min(...segment.map(r => r.y))
        const maxX = Math.max(...segment.map(r => r.x + r.width))
        const maxY = Math.max(...segment.map(r => r.y + r.height))

        const width = maxX - minX
        const height = maxY - minY

        bounds.push({
          x: minX,
          y: minY,
          width,
          height,
          area: width * height,
          color,
          parsedWord: word
        })
      }
    }

    // Sort by area (largest first) for proper z-index layering
    bounds.sort((a, b) => b.area - a.area)

    return bounds
  }

  const loadPdf = async (base64Data: string) => {
    isLoading.value = true
    
    try {
      if (!pdfjsLib) {
        pdfjsLib = await import('pdfjs-dist')
        const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.mjs?url')
        pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker.default
      }

      const binaryString = atob(base64Data)
      const len = binaryString.length
      const bytes = new Uint8Array(len)
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      pdfDoc = await pdfjsLib.getDocument({ data: bytes }).promise
      totalPages.value = pdfDoc.numPages
      
      await goToPage(0)
    } catch (error) {
      console.error('Error loading PDF:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const renderPageAsImage = async (pageNum: number) => {
    if (!pdfDoc) return ''

    try {
      const page = await pdfDoc.getPage(pageNum)
      const viewport = page.getViewport({ scale: 2.0 })
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      
      if (!context) return ''
      
      canvas.width = viewport.width
      canvas.height = viewport.height
      
      await page.render({ canvasContext: context, viewport }).promise
      return canvas.toDataURL()
    } catch (error) {
      console.error('Error rendering page:', error)
      return ''
    }
  }

  const extractPageText = async (pageNum: number) => {
    if (!pdfDoc) return ''

    try {
      const page = await pdfDoc.getPage(pageNum)
      const textContent = await page.getTextContent()
      
      return textContent.items
        .map((item: any) => item.str)
        .join(' ')
        .trim()
    } catch (error) {
      console.error('Error extracting text:', error)
      return ''
    }
  }

  const goToPage = async (index: number) => {
    if (index < 0 || index >= totalPages.value) return

    isLoading.value = true
    isProcessing.value = true
    currentPageIndex.value = index

    try {
      const pageNumber = index + 1

      if (!pdfDoc) return

      const page = await pdfDoc.getPage(pageNumber)
      const viewport = page.getViewport({ scale: 1.0 })

      pageWidth.value = viewport.width
      pageHeight.value = viewport.height

      // Render the full PDF page to canvas
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')!
      canvas.width = viewport.width
      canvas.height = viewport.height

      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise

      pageCanvasUrl.value = canvas.toDataURL('image/png')

      // Extract text content with font information
      const textContent = await page.getTextContent()

      // Filter out furigana
      const filteredItems = filterFurigana(textContent.items)

      // Get full page text in reading order
      const pageText = filteredItems
        .filter((item: any) => item.str && item.str.trim())
        .map((item: any) => item.str)
        .join('')

      currentPageText.value = pageText

      // Determine text direction
      let detectedDirection: 'horizontal' | 'vertical' = 'horizontal'
      if (textDirection.value === 'auto') {
        detectedDirection = detectTextDirection(textContent.items)
      } else {
        detectedDirection = textDirection.value
      }
      effectiveTextDirection.value = detectedDirection

      // Parse the entire page text with Kuromoji
      const parsed = await parseText(pageText)
      parsedWords.value = parsed

      // Parse text into sentences for ReaderContent view
      // Split by common Japanese sentence endings
      const sentenceEndings = /([。！？\n]+)/g
      const textParts = pageText.split(sentenceEndings).filter(p => p.trim())
      const sentences: Array<{ text: string; grammar?: string[] }> = []
      
      for (let i = 0; i < textParts.length; i += 2) {
        const text = textParts[i]?.trim() || ''
        const ending = textParts[i + 1] || ''
        if (text) {
          sentences.push({ text: text + ending, grammar: [] })
        }
      }
      
      // If no sentence endings found, treat entire text as one sentence
      if (sentences.length === 0 && pageText.trim()) {
        sentences.push({ text: pageText, grammar: [] })
      }
      
      // Parse sentences with Kuromoji
      if (sentences.length > 0) {
        pageSentences.value = await parseSentences(sentences)
      } else {
        pageSentences.value = []
      }

      // Calculate word bounding boxes
      const bounds = calculateWordBounds(filteredItems, parsed, pageText, viewport)
      wordBounds.value = bounds

      isProcessing.value = false
    } catch (error) {
      console.error('Error loading page:', error)
      isProcessing.value = false
    } finally {
      isLoading.value = false
    }
  }

  const nextPage = async () => {
    if (canGoNext.value) {
      await goToPage(currentPageIndex.value + 1)
    }
  }

  const prevPage = async () => {
    if (canGoPrev.value) {
      await goToPage(currentPageIndex.value - 1)
    }
  }

  const destroy = () => {
    pdfDoc = null
    currentPageIndex.value = 0
    totalPages.value = 0
    currentPageText.value = ''
    currentPageImage.value = ''
  }

  return {
    currentPageIndex,
    totalPages,
    isLoading,
    isProcessing,
    canGoNext,
    canGoPrev,
    currentPageText,
    currentPageImage,
    pageCanvasUrl,
    wordBounds,
    parsedWords,
    pageSentences,
    pageWidth,
    pageHeight,
    zoom,
    textDirection,
    effectiveTextDirection,
    selectedFont,
    loadPdf,
    nextPage,
    prevPage,
    goToPage,
    destroy
  }
}