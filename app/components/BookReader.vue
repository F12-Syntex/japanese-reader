<template>
  <div class="h-full flex">
    <div class="w-1/2 border-r border-base-300 flex flex-col">
      <div class="bg-base-100 border-b border-base-300 p-4">
        <div class="flex items-center gap-4">
          <button @click="navigateTo('/books')" class="btn btn-ghost btn-sm gap-2">
            <IconArrowLeft class="w-4 h-4" />
            Back
          </button>
          <div class="flex-1">
            <h2 class="text-xl font-bold">{{ booksStore.currentBook?.title }}</h2>
            <p class="text-sm text-base-content/70">{{ booksStore.currentBook?.author }}</p>
          </div>
          <button @click="showToc = !showToc" class="btn btn-ghost btn-sm gap-2">
            <IconList class="w-4 h-4" />
            Chapters
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-8">
        <div v-if="isLoading" class="flex flex-col items-center justify-center h-full gap-4">
          <span class="loading loading-spinner loading-lg"></span>
          <p class="text-sm text-base-content/70">Loading content...</p>
        </div>
        <div v-else-if="parsedContent.length === 0" class="flex items-center justify-center h-full">
          <p class="text-base-content/50">No text</p>
        </div>
        <ReaderContent
          v-else
          :text="parsedContent"
          :settings="readerSettings"
          :streaming-text="''"
          @word-highlighted="handleWordHighlight"
        />
      </div>

      <div class="bg-base-100 border-t border-base-300 p-4">
        <div class="flex items-center justify-between">
          <button @click="prevPage" class="btn btn-ghost btn-sm gap-2" :disabled="!canGoPrev">
            <IconChevronLeft class="w-4 h-4" />
            Previous
          </button>
          
          <div class="flex items-center gap-4">
            <progress class="progress progress-primary w-64" :value="progress" max="100"></progress>
            <span class="text-sm">{{ Math.round(progress) }}%</span>
          </div>
          
          <button @click="nextPage" class="btn btn-ghost btn-sm gap-2" :disabled="!canGoNext">
            Next
            <IconChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <div class="w-1/2 flex flex-col bg-base-200">
      <div class="flex-1 overflow-hidden flex items-center justify-center p-4">
        <div ref="viewerContainer" class="w-full h-full bg-base-100 rounded-lg shadow-lg"></div>
      </div>
    </div>

    <div v-if="showToc" class="fixed inset-0 bg-black/50 z-50" @click="showToc = false">
      <div class="absolute right-0 top-0 bottom-0 w-80 bg-base-100 shadow-xl p-4" @click.stop>
        <h3 class="text-lg font-bold mb-4">Table of Contents</h3>
        <ul class="menu bg-base-200 rounded-box">
          <li v-for="(item, index) in toc" :key="index">
            <a @click="goToChapter(item.href)" class="text-sm">{{ item.label }}</a>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import IconArrowLeft from '~icons/lucide/arrow-left'
import IconChevronLeft from '~icons/lucide/chevron-left'
import IconChevronRight from '~icons/lucide/chevron-right'
import IconList from '~icons/lucide/list'
import { useBooksStore } from '~/stores/useBooksStore'
import { useReaderSettings } from '~/composables/useReaderSettings'
import { useKuromojiParser } from '~/composables/useKuromojiParser'
import ePub from 'epubjs'
import type { Book, Rendition, NavItem } from 'epubjs'
import type { ParsedSentence } from '~/types/japanese'

const booksStore = useBooksStore()
const { settings: readerSettings } = useReaderSettings()
const { parseText } = useKuromojiParser()

const viewerContainer = ref<HTMLElement | null>(null)
const showToc = ref(false)
const isLoading = ref(true)

let book: Book | null = null
let rendition: Rendition | null = null

const toc = ref<NavItem[]>([])
const progress = ref(0)
const canGoPrev = ref(false)
const canGoNext = ref(true)
const parsedContent = ref<ParsedSentence[]>([])

const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}

const isVerticalText = (element: HTMLElement): boolean => {
  const computedStyle = window.getComputedStyle(element)
  const writingMode = computedStyle.writingMode
  return writingMode === 'vertical-rl' || writingMode === 'vertical-lr' || writingMode === 'tb-rl'
}

const extractTextRespectingLayout = (element: HTMLElement): string => {
  if (isVerticalText(element)) {
    const columns: string[] = []
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
    let currentColumn = ''
    let node: Node | null

    while (node = walker.nextNode()) {
      const text = node.textContent?.trim()
      if (!text) continue
      
      const parent = node.parentElement
      if (!parent) continue

      const rect = parent.getBoundingClientRect()
      const isNewColumn = currentColumn && rect.right < element.getBoundingClientRect().right - 50
      
      if (isNewColumn) {
        columns.push(currentColumn)
        currentColumn = text
      } else {
        currentColumn += text
      }
    }

    if (currentColumn) {
      columns.push(currentColumn)
    }

    return columns.reverse().join('\n')
  }

  return element.textContent || ''
}

const parseCurrentPage = async () => {
  if (!rendition) {
    isLoading.value = false
    return
  }
  
  isLoading.value = true
  
  const contents = (rendition.getContents() as unknown) as any[] || []
  if (contents.length === 0) {
    isLoading.value = false
    return
  }

  const bodyElement = contents[0]?.document?.body
  if (!bodyElement) {
    isLoading.value = false
    return
  }

  const textContent = extractTextRespectingLayout(bodyElement)
  
  if (!textContent.trim()) {
    parsedContent.value = []
    isLoading.value = false
    return
  }

  const sentences = textContent
    .split(/([。、！？．，])/g)
    .reduce((acc: string[], curr, idx, arr) => {
      if (idx % 2 === 0 && curr.trim()) {
        const punctuation = arr[idx + 1] || ''
        acc.push(curr + punctuation)
      }
      return acc
    }, [])
    .filter(s => s.trim())

  const parsed: ParsedSentence[] = []
  for (const sentence of sentences) {
    const words = await parseText(sentence)
    parsed.push({
      text: sentence,
      words,
      grammar: []
    })
  }
  
  parsedContent.value = parsed
  isLoading.value = false
}

const highlightTextInEpub = (word: string) => {
  if (!rendition) return

  const contents = (rendition.getContents() as unknown) as any[] || []
  if (contents.length === 0) return

  const iframe = contents[0]?.document
  if (!iframe) return

  const walker = document.createTreeWalker(
    iframe.body,
    NodeFilter.SHOW_TEXT,
    null
  )

  let node: Node | null
  while (node = walker.nextNode()) {
    const text = node.textContent
    if (!text) continue

    const index = text.indexOf(word)
    if (index !== -1) {
      const parent = node.parentElement
      if (!parent) continue

      const range = iframe.createRange()
      range.setStart(node, index)
      range.setEnd(node, index + word.length)

      const mark = iframe.createElement('mark')
      mark.style.backgroundColor = 'yellow'
      mark.style.color = 'black'

      range.surroundContents(mark)
      break
    }
  }
}

const handleWordHighlight = (sentenceIndex: number, wordIndex: number, word: string) => {
  highlightTextInEpub(word)
}

const initBook = async () => {
  if (!booksStore.currentBook || !viewerContainer.value) return

  const arrayBuffer = base64ToArrayBuffer(booksStore.currentBook.path)
  book = ePub(arrayBuffer)
  
  await book.ready

  rendition = book.renderTo(viewerContainer.value, {
    width: '100%',
    height: '100%',
    spread: 'none'
  })

  await rendition.display()

  const navigation = await book.loaded.navigation
  toc.value = navigation.toc

  rendition.on('relocated', async (location: any) => {
    if (book) {
      const percent = book.locations.percentageFromCfi(location.start.cfi)
      if (percent !== undefined) {
        progress.value = percent * 100
      }
    }
    
    canGoPrev.value = !location.atStart
    canGoNext.value = !location.atEnd
    
    await parseCurrentPage()
  })

  await book.locations.generate(1024)
  await parseCurrentPage()
}

const nextPage = async () => {
  if (rendition) {
    await rendition.next()
  }
}

const prevPage = async () => {
  if (rendition) {
    await rendition.prev()
  }
}

const goToChapter = async (href: string) => {
  if (rendition) {
    await rendition.display(href)
  }
  showToc.value = false
}

const handleKeydown = async (e: KeyboardEvent) => {
  if (e.key === 'ArrowLeft') {
    e.preventDefault()
    await prevPage()
  } else if (e.key === 'ArrowRight') {
    e.preventDefault()
    await nextPage()
  }
}

onMounted(async () => {
  await initBook()
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  if (rendition) {
    rendition.destroy()
  }
  if (book) {
    book.destroy()
  }
})
</script>