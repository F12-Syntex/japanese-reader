<template>
  <div ref="viewerContainer" class="w-full h-full bg-base-100 rounded-lg shadow-lg overflow-hidden"></div>
</template>

<script setup lang="ts">
import ePub from 'epubjs'
import type { Book, Rendition, NavItem } from 'epubjs'

interface Props {
  bookData: string
}

interface Emits {
  (e: 'text-extracted', text: string): void
  (e: 'vertical-detected', isVertical: boolean): void
  (e: 'toc-loaded', toc: NavItem[]): void
  (e: 'progress-updated', data: { progress: number; canGoPrev: boolean; canGoNext: boolean }): void
  (e: 'ready'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const viewerContainer = ref<HTMLElement | null>(null)

let book: Book | null = null
let rendition: Rendition | null = null
let currentCfi: string | null = null

const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}

const detectVerticalText = (iframe: Document): boolean => {
  const html = iframe.documentElement
  const body = iframe.body
  
  if (!html || !body) return false
  
  const htmlStyle = iframe.defaultView?.getComputedStyle(html)
  const bodyStyle = iframe.defaultView?.getComputedStyle(body)
  
  const checkWritingMode = (mode: string | undefined): boolean => {
    if (!mode) return false
    return mode === 'vertical-rl' || 
           mode === 'vertical-lr' || 
           mode === 'tb-rl' || 
           mode === 'tb-lr'
  }
  
  if (checkWritingMode(htmlStyle?.writingMode) || checkWritingMode(bodyStyle?.writingMode)) {
    return true
  }
  
  const walker = iframe.createTreeWalker(body, NodeFilter.SHOW_ELEMENT)
  let element: Node | null
  let verticalElements = 0
  let totalTextElements = 0
  
  while (element = walker.nextNode()) {
    if (!(element instanceof HTMLElement)) continue
    
    const hasText = element.textContent?.trim()
    if (!hasText || hasText.length < 10) continue
    
    totalTextElements++
    
    const style = iframe.defaultView?.getComputedStyle(element)
    if (checkWritingMode(style?.writingMode)) {
      verticalElements++
    }
  }
  
  return totalTextElements > 5 && verticalElements / totalTextElements > 0.5
}

const extractVisibleText = (iframe: Document): string => {
  const body = iframe.body
  if (!body) return ''

  const win = iframe.defaultView
  if (!win) return ''

  const viewportWidth = win.innerWidth
  const viewportHeight = win.innerHeight
  const textSegments: string[] = []
  
  const isElementVisible = (element: HTMLElement): boolean => {
    const rect = element.getBoundingClientRect()
    
    return rect.right > 0 && 
           rect.left < viewportWidth &&
           rect.bottom > 0 && 
           rect.top < viewportHeight &&
           rect.width > 0 &&
           rect.height > 0
  }
  
  const processNode = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim()
      if (!text) return
      
      const parent = node.parentElement
      if (!parent) return
      
      const tagName = parent.tagName.toLowerCase()
      if (tagName === 'rt' || tagName === 'rp') return
      
      const style = win.getComputedStyle(parent)
      if (style.display === 'none' || style.visibility === 'hidden') return
      
      if (!isElementVisible(parent)) return
      
      const fontSize = parseFloat(style.fontSize || '16')
      if (fontSize < 10) return
      
      textSegments.push(text)
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement
      const tagName = element.tagName.toLowerCase()
      
      if (!isElementVisible(element)) return
      
      if (tagName === 'br') {
        textSegments.push('\n')
        return
      }
      
      if (['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li'].includes(tagName)) {
        for (const child of Array.from(node.childNodes)) {
          processNode(child)
        }
        textSegments.push('\n')
      } else {
        for (const child of Array.from(node.childNodes)) {
          processNode(child)
        }
      }
    }
  }
  
  processNode(body)
  
  return textSegments.join('')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n')
}

const extractText = async () => {
  if (!rendition) return

  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 500))

  const contents = (rendition.getContents() as unknown) as any[] || []
  if (contents.length === 0) return

  const iframe = contents[0]?.document
  if (!iframe) return

  emit('vertical-detected', detectVerticalText(iframe))
  emit('text-extracted', extractVisibleText(iframe))
}

const updateProgress = () => {
  if (!book || !rendition) return
  
  const location = rendition.currentLocation() as any
  if (!location?.start) return
  
  emit('progress-updated', {
    progress: (location.start.percentage || 0) * 100,
    canGoPrev: !location.atStart,
    canGoNext: !location.atEnd
  })
}

const next = async () => {
  if (!rendition) return
  await rendition.next()
  currentCfi = rendition.location?.start?.cfi || null
  await extractText()
  updateProgress()
}

const prev = async () => {
  if (!rendition) return
  await rendition.prev()
  currentCfi = rendition.location?.start?.cfi || null
  await extractText()
  updateProgress()
}

const goTo = async (href: string) => {
  if (!rendition) return
  await rendition.display(href)
  currentCfi = rendition.location?.start?.cfi || null
  await extractText()
  updateProgress()
}

defineExpose({
  next,
  prev,
  goTo
})

onMounted(async () => {
  try {
    const arrayBuffer = base64ToArrayBuffer(props.bookData)
    book = ePub(arrayBuffer)
    
    await book.ready
    
    const nav = await book.loaded.navigation
    emit('toc-loaded', nav.toc)

    if (!viewerContainer.value) return
    
    rendition = book.renderTo(viewerContainer.value, {
      width: '100%',
      height: '100%',
      spread: 'none',
      flow: 'paginated'
    })

    rendition.on('relocated', updateProgress)

    await rendition.display()
    currentCfi = rendition.location?.start?.cfi || null
    await extractText()
    updateProgress()
    emit('ready')
  } catch (error) {
    console.error('Failed to load book:', error)
  }
})

onUnmounted(() => {
  if (rendition) {
    rendition.destroy()
  }
})
</script>