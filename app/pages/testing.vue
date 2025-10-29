<template>
  <div class="min-h-screen bg-base-200 p-4">
    <div class="max-w-7xl mx-auto space-y-4">
      <!-- Controls -->
      <div class="flex gap-4 items-center bg-base-100 p-4 rounded-lg shadow flex-wrap">
        <input
          type="file"
          accept="application/pdf"
          @change="loadPDF"
          class="file-input file-input-bordered file-input-primary"
        />
        
        <!-- Font Family Selector -->
        <div class="flex gap-2 items-center border-l pl-4">
          <span class="text-sm font-medium">Font:</span>
          <select v-model="selectedFont" class="select select-sm select-bordered">
            <option value="auto">Auto</option>
            <option value="noto">Noto Sans JP</option>
            <option value="mincho">Noto Serif JP</option>
            <option value="gothic">Gothic</option>
            <option value="meiryo">Meiryo</option>
            <option value="system">System</option>
          </select>
        </div>
        
        <!-- Text Direction Override -->
        <div class="flex gap-2 items-center border-l pl-4">
          <span class="text-sm font-medium">Text Mode:</span>
          <div class="btn-group">
            <button 
              @click="textDirection = 'horizontal'" 
              :class="['btn btn-sm', textDirection === 'horizontal' ? 'btn-primary' : 'btn-ghost']"
            >
              Horizontal
            </button>
            <button 
              @click="textDirection = 'auto'" 
              :class="['btn btn-sm', textDirection === 'auto' ? 'btn-primary' : 'btn-ghost']"
            >
              Auto
            </button>
            <button 
              @click="textDirection = 'vertical'" 
              :class="['btn btn-sm', textDirection === 'vertical' ? 'btn-primary' : 'btn-ghost']"
            >
              Vertical
            </button>
          </div>
        </div>
        
        <div v-if="numPages > 0" class="flex gap-2 items-center border-l pl-4">
          <button @click="prevPage" :disabled="currentPage <= 1" class="btn btn-sm">←</button>
          <span class="text-sm">{{ currentPage }} / {{ numPages }}</span>
          <button @click="nextPage" :disabled="currentPage >= numPages" class="btn btn-sm">→</button>
          <input 
            type="range" 
            v-model.number="zoom" 
            min="0.5" 
            max="3" 
            step="0.1" 
            class="range range-primary range-sm w-32"
          />
          <span class="text-sm">{{ Math.round(zoom * 100) }}%</span>
        </div>
      </div>

      <!-- Debug Info -->
      <div v-if="numPages > 0" class="bg-base-100 p-4 rounded-lg text-sm">
        <div>Page: {{ pageWidth }}x{{ pageHeight }}</div>
        <div>Text Items: {{ textItems.length }}</div>
        <div>Images: {{ pageImages.length }}</div>
        <div>Text Direction: <span class="font-bold">{{ effectiveTextDirection }}</span> ({{ textDirection }})</div>
        <div>Font: <span class="font-bold">{{ selectedFont }}</span></div>
        <div v-if="isProcessing" class="text-primary">Processing text with Kuromoji...</div>
        <div>Full Text Length: {{ fullPageText.length }} chars</div>
        <div>Parsed Words: {{ parsedWords.length }}</div>
        <div v-if="missingGlyphs.size > 0" class="text-warning mt-2">
          Missing glyphs detected: {{ Array.from(missingGlyphs).join(', ') }}
        </div>
      </div>

      <!-- Reconstructed Page -->
      <div
        v-if="numPages > 0"
        class="relative mx-auto shadow-xl bg-white overflow-hidden"
        :style="{
          width: pageWidth * zoom + 'px',
          height: pageHeight * zoom + 'px'
        }"
      >
        <!-- Full PDF Page Canvas -->
        <img
          v-if="pageCanvasUrl"
          :src="pageCanvasUrl"
          :style="{
            position: 'absolute',
            left: '0',
            top: '0',
            width: pageWidth * zoom + 'px',
            height: pageHeight * zoom + 'px',
          }"
          class="pointer-events-none"
        />

        <!-- Word Bounding Boxes -->
        <div
          v-for="(word, idx) in wordBounds"
          :key="`word-${idx}`"
          :style="{
            position: 'absolute',
            left: word.x * zoom + 'px',
            top: word.y * zoom + 'px',
            width: word.width * zoom + 'px',
            height: word.height * zoom + 'px',
            border: `2px solid ${word.color}`,
            backgroundColor: `${word.color}33`,
            pointerEvents: 'auto',
            cursor: 'pointer',
            transition: 'all 0.2s',
            zIndex: idx
          }"
          :class="'hover:scale-105'"
          @mouseenter="word.parsedWord ? showTooltip(word.parsedWord, $event) : null"
          @mouseleave="hideTooltip"
          @click="word.parsedWord ? handleWordClick(word.parsedWord) : null"
        />
      </div>

      <!-- Tooltip -->
      <div
        v-if="tooltip.visible"
        :style="{
          position: 'fixed',
          left: tooltip.x + 'px',
          top: tooltip.y + 'px',
          zIndex: 9999,
        }"
        class="bg-base-100 border border-base-300 shadow-xl rounded-lg p-3 max-w-xs pointer-events-none"
      >
        <div class="space-y-1">
          <div class="font-bold text-lg">{{ tooltip.word?.kanji }}</div>
          <div class="text-sm text-primary">{{ tooltip.word?.kana }}</div>
          <div v-if="tooltip.word?.meaning" class="text-sm text-base-content/80">
            {{ tooltip.word.meaning }}
          </div>
          <div v-if="tooltip.word?.pos" class="text-xs text-base-content/60">
            {{ tooltip.word.pos }}
          </div>
          <div v-if="tooltip.word?.isKnown" class="text-xs text-success">
            ✓ Known word
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useKuromojiParser } from '~/composables/useKuromojiParser'
import type { ParsedWord } from '~/types/japanese'

const { parseText } = useKuromojiParser()

const currentPage = ref(1)
const numPages = ref(0)
const zoom = ref(1)
const textItems = ref<any[]>([])
const pageImages = ref<any[]>([])
const pageWidth = ref(0)
const pageHeight = ref(0)
const pageCanvasUrl = ref('')
const wordBounds = ref<any[]>([])
const isProcessing = ref(false)
const fullPageText = ref('')
const parsedWords = ref<ParsedWord[]>([])
const textDirection = ref<'auto' | 'horizontal' | 'vertical'>('auto')
const effectiveTextDirection = ref<'horizontal' | 'vertical'>('horizontal')
const selectedFont = ref('auto')
const missingGlyphs = ref<Set<string>>(new Set())
const pdfFontMap = ref<Map<string, string>>(new Map())

const tooltip = ref({
  visible: false,
  x: 0,
  y: 0,
  word: null as ParsedWord | null
})

let pdfDoc: any = null
let pdfjsLib: any = null

// Filter out furigana based on font size
const filterFurigana = (items: any[]) => {
  if (items.length === 0) return items

  // Calculate font sizes for all items
  const fontSizes = items
    .filter((item: any) => item.str && item.str.trim())
    .map((item: any) => {
      const tx = item.transform
      return Math.sqrt(tx[2] * tx[2] + tx[3] * tx[3])
    })

  if (fontSizes.length === 0) return items

  // Calculate median font size
  const sortedSizes = [...fontSizes].sort((a, b) => a - b)
  const medianSize = sortedSizes[Math.floor(sortedSizes.length / 2)]!

  console.log('Font size analysis:', {
    min: Math.min(...fontSizes).toFixed(2),
    median: medianSize.toFixed(2),
    max: Math.max(...fontSizes).toFixed(2)
  })

  // Filter out items that are significantly smaller than the median (likely furigana)
  // Typically furigana is 40-60% of the main text size
  const threshold = medianSize * 0.65

  const filtered = items.filter((item: any) => {
    if (!item.str || !item.str.trim()) return false

    const tx = item.transform
    const fontSize = Math.sqrt(tx[2] * tx[2] + tx[3] * tx[3])

    return fontSize >= threshold
  })

  console.log(`Filtered out ${items.length - filtered.length} furigana items (threshold: ${threshold.toFixed(2)})`)

  return filtered
}

// Generate random color for each word
const getRandomColor = () => {
  const hue = Math.floor(Math.random() * 360)
  return `hsl(${hue}, 70%, 50%)`
}

// Font stack based on selection
const getFontFamily = (fontName: string = 'auto') => {
  const fontStacks: Record<string, string> = {
    auto: '"Noto Sans JP", "Noto Serif JP", "Yu Gothic", "Yu Mincho", "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Meiryo", "MS PGothic", "MS PMincho", sans-serif',
    noto: '"Noto Sans JP", "Hiragino Sans", "Yu Gothic", "Meiryo", sans-serif',
    mincho: '"Noto Serif JP", "Yu Mincho", "Hiragino Mincho ProN", "MS PMincho", serif',
    gothic: '"Yu Gothic", "Hiragino Kaku Gothic ProN", "MS PGothic", sans-serif',
    meiryo: '"Meiryo", "MS PGothic", "Hiragino Kaku Gothic ProN", sans-serif',
    system: 'system-ui, sans-serif'
  }

  return fontStacks[fontName] || fontStacks.auto
}

// Detect if character might not render properly
const detectMissingGlyph = (char: string, element: HTMLElement) => {
  if (!char || char.trim() === '') return false
  
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return false
  
  canvas.width = 50
  canvas.height = 50
  
  const fontSize = 20
  ctx.font = `${fontSize}px ${getFontFamily(selectedFont.value)}`
  ctx.textBaseline = 'top'
  ctx.fillText(char, 0, 0)
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const pixels = imageData.data
  
  // Check if any pixel is non-white (character was drawn)
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i] < 255 || pixels[i + 1] < 255 || pixels[i + 2] < 255) {
      return false // Character rendered
    }
  }
  
  return true // No pixels drawn, likely missing glyph
}

onMounted(async () => {
  const pdfjs = await import('pdfjs-dist')
  
  pdfjsLib = pdfjs
  const worker = await import('pdfjs-dist/build/pdf.worker.mjs?url')
  pdfjsLib.GlobalWorkerOptions.workerSrc = worker.default
  
  console.log('Loaded PDF.js')
  
  // Load Google Fonts
  const link = document.createElement('link')
  link.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&family=Noto+Serif+JP:wght@400;700&display=swap'
  link.rel = 'stylesheet'
  document.head.appendChild(link)
})

const loadPDF = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file || !pdfjsLib) return

  const arrayBuffer = await file.arrayBuffer()
  pdfDoc = await pdfjsLib.getDocument(arrayBuffer).promise
  numPages.value = pdfDoc.numPages
  currentPage.value = 1
  
  console.log('PDF loaded:', numPages.value, 'pages')
  
  await renderPage()
}

const renderPage = async () => {
  if (!pdfDoc) return

  isProcessing.value = true
  missingGlyphs.value.clear()
  pdfFontMap.value.clear()

  console.log('Rendering page', currentPage.value)
  const page = await pdfDoc.getPage(currentPage.value)
  const viewport = page.getViewport({ scale: 1.0 })

  pageWidth.value = viewport.width
  pageHeight.value = viewport.height

  console.log('Viewport:', viewport.width, 'x', viewport.height)

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
  console.log('Rendered full page to canvas')

  // Extract images
  const images = await extractImages(page, viewport)
  
  // Extract text content with font information
  const textContent = await page.getTextContent()
  console.log('Text items:', textContent.items.length)

  // Build font map from PDF
  for (const item of textContent.items) {
    if (item.fontName && item.str) {
      pdfFontMap.value.set(item.fontName, item.str)
    }
  }

  // Filter out furigana (smaller text that's typically annotation)
  const filteredItems = filterFurigana(textContent.items)
  console.log('Text items after filtering furigana:', filteredItems.length)

  // Step 1: Get full page text in reading order
  const pageText = filteredItems
    .filter((item: any) => item.str && item.str.trim())
    .map((item: any) => item.str)
    .join('')
  
  fullPageText.value = pageText
  console.log('Full page text length:', pageText.length)
  console.log('First 200 chars:', pageText.substring(0, 200))

  // Check for katakana in extracted text
  const katakanaMatch = pageText.match(/[\u30A0-\u30FF]+/g)
  if (katakanaMatch) {
    console.log('Katakana sequences in text:', katakanaMatch.slice(0, 10))
  } else {
    console.log('No katakana found in extracted text')
  }
  
  // Check if page is empty
  if (images.length === 0 && pageText.length === 0) {
    console.log('Page', currentPage.value, 'is empty, skipping...')
    if (currentPage.value < numPages.value) {
      currentPage.value++
      await renderPage()
    } else {
      if (currentPage.value > 1) {
        currentPage.value--
        await renderPage()
      }
    }
    isProcessing.value = false
    return
  }
  
  // Step 2: Parse the entire page text with Kuromoji
  const parsed = await parseText(pageText)
  parsedWords.value = parsed
  console.log('Parsed into', parsed.length, 'words')
  console.log('Sample parsed words:', parsed.slice(0, 10).map(w => w.kanji))

  // Check for katakana in parsed words
  const katakanaWords = parsed.filter(w => /[\u30A0-\u30FF]/.test(w.kanji))
  console.log('Katakana words found:', katakanaWords.length)
  if (katakanaWords.length > 0) {
    console.log('Sample katakana words:', katakanaWords.slice(0, 5).map(w => w.kanji))
  }
  
  // Step 3: Determine effective text direction
  let detectedDirection: 'horizontal' | 'vertical' = 'horizontal'
  if (textDirection.value === 'auto') {
    detectedDirection = detectTextDirection(textContent.items)
  } else {
    detectedDirection = textDirection.value
  }
  effectiveTextDirection.value = detectedDirection
  console.log('Text direction:', detectedDirection, '(mode:', textDirection.value + ')')
  
  // Step 4: Calculate word bounding boxes (using filtered items without furigana)
  const bounds = calculateWordBounds(filteredItems, parsed, pageText, viewport)

  pageImages.value = images
  wordBounds.value = bounds
  isProcessing.value = false
  
  // Check for missing glyphs after render
  await nextTick()
  checkForMissingGlyphs()
}

const checkForMissingGlyphs = () => {
  const uniqueChars = new Set(fullPageText.value.split(''))
  uniqueChars.forEach(char => {
    if (char.trim() && detectMissingGlyph(char, document.body)) {
      missingGlyphs.value.add(char)
    }
  })
  
  if (missingGlyphs.value.size > 0) {
    console.warn('Characters that may not render properly:', Array.from(missingGlyphs.value))
  }
}

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
    totalXDiff += Math.abs(positions[i].x - positions[i-1].x)
    totalYDiff += Math.abs(positions[i].y - positions[i-1].y)
  }
  
  const avgXDiff = totalXDiff / (positions.length - 1)
  const avgYDiff = totalYDiff / (positions.length - 1)
  
  console.log('Direction detection - X diff:', avgXDiff.toFixed(2), 'Y diff:', avgYDiff.toFixed(2))
  
  return avgYDiff > avgXDiff * 1.5 ? 'vertical' : 'horizontal'
}

const calculateWordBounds = (
  textContentItems: any[],
  parsedWords: ParsedWord[],
  fullText: string,
  viewport: any
) => {
  const bounds: any[] = []

  // Create a map from character position to parsed word
  const charToWord: (ParsedWord | null)[] = new Array(fullText.length).fill(null)
  let currentPos = 0
  let mappedWords = 0
  let unmappedWords: string[] = []

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
      unmappedWords.push(wordText)
      console.warn(`Could not map word "${wordText}" in text`)
    }
  }

  console.log('Character to word mapping created:', {
    totalWords: parsedWords.length,
    mappedWords,
    unmappedWords: unmappedWords.length
  })

  if (unmappedWords.length > 0 && unmappedWords.length <= 10) {
    console.log('Unmapped words:', unmappedWords)
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

    // Estimate character width
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

  // Group character rectangles by word and create contiguous segments
  const wordGroups = new Map<ParsedWord, CharRect[]>()
  for (const rect of charRects) {
    if (!wordGroups.has(rect.word)) {
      wordGroups.set(rect.word, [])
    }
    wordGroups.get(rect.word)!.push(rect)
  }

  // For each word, create separate bounds for contiguous segments
  for (const [word, rects] of wordGroups) {
    if (rects.length === 0) continue

    // Sort by position (left to right, top to bottom)
    rects.sort((a, b) => {
      const yDiff = a.y - b.y
      if (Math.abs(yDiff) > 5) return yDiff // Different lines
      return a.x - b.x // Same line, sort by x
    })

    // Group into contiguous segments (detecting line breaks)
    const segments: CharRect[][] = []
    const firstRect = rects[0]
    if (!firstRect) continue

    let currentSegment: CharRect[] = [firstRect]

    for (let i = 1; i < rects.length; i++) {
      const prev = rects[i - 1]
      const curr = rects[i]
      if (!prev || !curr) continue

      // Check if this character is on a different line or far from previous
      const yDiff = Math.abs(curr.y - prev.y)
      const xDiff = curr.x - (prev.x + prev.width)

      if (yDiff > 5 || xDiff > prev.width * 2) {
        // New segment
        segments.push(currentSegment)
        currentSegment = [curr]
      } else {
        // Continue current segment
        currentSegment.push(curr)
      }
    }
    segments.push(currentSegment)

    // Create a bounding box for each segment
    const color = getRandomColor() // Same color for all segments of the same word
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

  // Sort by area (largest first) so when we render, smaller bounds get higher z-index
  bounds.sort((a, b) => b.area - a.area)

  console.log('Calculated', bounds.length, 'word bounding boxes from', charRects.length, 'characters')
  return bounds
}

const extractImages = async (page: any, viewport: any) => {
  const images: any[] = []
  
  try {
    const ops = await page.getOperatorList()
    
    let transformStack: number[][] = [[1, 0, 0, 1, 0, 0]]
    
    for (let i = 0; i < ops.fnArray.length; i++) {
      const fn = ops.fnArray[i]
      const args = ops.argsArray[i]
      
      if (fn === pdfjsLib.OPS.transform) {
        const current = transformStack[transformStack.length - 1]
        transformStack.push(multiplyMatrices(current, args))
      } else if (fn === pdfjsLib.OPS.save) {
        transformStack.push([...transformStack[transformStack.length - 1]])
      } else if (fn === pdfjsLib.OPS.restore) {
        if (transformStack.length > 1) transformStack.pop()
      } else if (fn === pdfjsLib.OPS.paintImageXObject || fn === pdfjsLib.OPS.paintInlineImageXObject) {
        const imageName = args[0]
        const transform = transformStack[transformStack.length - 1]
        
        try {
          const image = await new Promise<any>((resolve) => {
            page.objs.get(imageName, resolve)
          })

          if (!image) continue

          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')!
          canvas.width = image.width
          canvas.height = image.height
          
          if (image.bitmap) {
            ctx.drawImage(image.bitmap, 0, 0)
          } else if (image.data) {
            const imageData = new ImageData(
              new Uint8ClampedArray(image.data),
              image.width,
              image.height
            )
            ctx.putImageData(imageData, 0, 0)
          } else {
            continue
          }
          
          const scaleX = Math.sqrt(transform[0] * transform[0] + transform[1] * transform[1])
          const scaleY = Math.sqrt(transform[2] * transform[2] + transform[3] * transform[3])
          
          const imgData = {
            src: canvas.toDataURL('image/png'),
            x: transform[4],
            y: viewport.height - transform[5] - scaleY,
            width: scaleX,
            height: scaleY
          }
          
          images.push(imgData)
          
        } catch (error) {
          console.error('Error processing image:', imageName, error)
        }
      }
    }
  } catch (error) {
    console.error('Error extracting images:', error)
  }
  
  console.log('Total images:', images.length)
  return images
}

const multiplyMatrices = (m1: number[], m2: number[]) => {
  return [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5]
  ]
}

const showTooltip = (word: ParsedWord, event: MouseEvent) => {
  const target = event.target as HTMLElement
  const rect = target.getBoundingClientRect()
  
  tooltip.value = {
    visible: true,
    x: rect.left + rect.width / 2,
    y: rect.top - 10,
    word
  }
}

const hideTooltip = () => {
  tooltip.value.visible = false
}

const handleWordClick = (word: ParsedWord) => {
  console.log('Clicked word:', {
    kanji: word.kanji,
    kana: word.kana,
    meaning: word.meaning,
    pos: word.pos,
    isKnown: word.isKnown
  })
}

const prevPage = async () => {
  if (currentPage.value > 1) {
    currentPage.value--
    await renderPage()
  }
}

const nextPage = async () => {
  if (currentPage.value < numPages.value) {
    currentPage.value++
    await renderPage()
  }
}

// Re-render when text direction or font changes
watch([textDirection, selectedFont], () => {
  if (pdfDoc && numPages.value > 0) {
    renderPage()
  }
})
</script>