<template>
  <div class="h-full flex flex-col">
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
        <button @click="showEpubViewer = !showEpubViewer" class="btn btn-ghost btn-sm gap-2">
          <IconBook class="w-4 h-4" />
          {{ showEpubViewer ? 'Hide' : 'Show' }} EPUB
        </button>
        <button @click="showToc = !showToc" class="btn btn-ghost btn-sm gap-2">
          <IconList class="w-4 h-4" />
          Chapters
        </button>
      </div>
    </div>

    <div class="flex-1 flex overflow-hidden relative">
      <div 
        ref="leftPanel"
        :style="{ width: showEpubViewer ? `${leftWidth}px` : '100%' }" 
        class="overflow-y-auto p-8 border-r border-base-300 relative"
      >
        <div v-if="epubReader.isLoading.value" class="flex flex-col items-center justify-center h-full gap-4">
          <span class="loading loading-spinner loading-lg"></span>
          <p class="text-sm text-base-content/70">Loading {{ epubReader.progress.value }}%...</p>
        </div>
        <div v-else-if="isParsingPage" class="flex flex-col items-center justify-center h-full gap-4">
          <span class="loading loading-spinner loading-lg"></span>
          <p class="text-sm text-base-content/70">Parsing...</p>
        </div>
        <div v-else-if="!epubReader.currentPage.value" class="flex items-center justify-center h-full">
          <p class="text-base-content/50">No content</p>
        </div>
        <ReaderContent
          v-else
          :content="parsedContent"
          :settings="readerSettings"
          :streaming-text="''"
          @word-click="handleWordClick"
        />
      </div>

      <div 
        v-if="showEpubViewer"
        class="absolute top-0 bottom-0 w-1 bg-base-300 hover:bg-primary cursor-col-resize z-10"
        :style="{ left: `${leftWidth}px` }"
        @mousedown="startResize"
      ></div>

      <div 
        v-if="showEpubViewer && booksStore.currentBook" 
        :style="{ width: `${rightWidth}px` }"
        class="overflow-hidden"
      >
        <EpubViewer
          ref="epubViewerRef"
          :book-data="booksStore.currentBook.path"
          :current-cfi="epubReader.currentPage.value?.cfi"
          @ready="onEpubReady"
        />
      </div>
    </div>

    <div class="bg-base-100 border-t border-base-300 p-4">
      <div class="flex items-center justify-between">
        <button @click="prevPage" class="btn btn-ghost btn-sm gap-2" :disabled="!epubReader.canGoPrev.value || epubReader.isLoading.value">
          <IconChevronLeft class="w-4 h-4" />
          Previous
        </button>
        
        <div class="flex items-center gap-4">
          <span class="text-sm">Page {{ epubReader.currentPageIndex.value + 1 }} / {{ epubReader.totalPages.value }}</span>
          <progress class="progress progress-primary w-64" :value="pageProgress" max="100"></progress>
          <span class="text-sm">{{ Math.round(pageProgress) }}%</span>
        </div>
        
        <button @click="nextPage" class="btn btn-ghost btn-sm gap-2" :disabled="!epubReader.canGoNext.value || epubReader.isLoading.value">
          Next
          <IconChevronRight class="w-4 h-4" />
        </button>
      </div>
    </div>

    <div v-if="showToc" class="fixed inset-0 bg-black/50 z-50" @click="showToc = false">
      <div class="absolute right-0 top-0 bottom-0 w-80 bg-base-100 shadow-xl p-4 overflow-y-auto" @click.stop>
        <h3 class="text-lg font-bold mb-4">Table of Contents</h3>
        <ul class="menu bg-base-200 rounded-box">
          <li v-for="(item, index) in epubReader.toc.value" :key="index">
            <a @click="goToChapter(item.href)" class="text-sm">{{ item.label }}</a>
          </li>
        </ul>
      </div>
    </div>

    <ReaderWordModal v-model="showWordModal" :word="selectedWord" />
  </div>
</template>

<script setup lang="ts">
import IconArrowLeft from '~icons/lucide/arrow-left'
import IconChevronLeft from '~icons/lucide/chevron-left'
import IconChevronRight from '~icons/lucide/chevron-right'
import IconList from '~icons/lucide/list'
import IconBook from '~icons/lucide/book-open'
import { useBooksStore } from '~/stores/useBooksStore'
import { useReaderSettings } from '~/composables/useReaderSettings'
import { useKuromojiParser } from '~/composables/useKuromojiParser'
import { useEpubReader } from '~/composables/useEpubReader'
import type { ParsedSentence, ParsedWord } from '~/types/japanese'

const booksStore = useBooksStore()
const { settings: readerSettings } = useReaderSettings()
const { parseText } = useKuromojiParser()
const epubReader = useEpubReader()

const epubViewerRef = ref<any>(null)
const leftPanel = ref<HTMLElement | null>(null)
const showToc = ref(false)
const showEpubViewer = ref(false)
const showWordModal = ref(false)
const selectedWord = ref<ParsedWord | null>(null)
const isParsingPage = ref(false)
const parsedContent = ref<any[]>([])
const leftWidth = ref(800)
const rightWidth = ref(800)
const isResizing = ref(false)

const pageProgress = computed(() => {
  if (epubReader.totalPages.value === 0) return 0
  return ((epubReader.currentPageIndex.value + 1) / epubReader.totalPages.value) * 100
})

const parseCurrentPage = async () => {
  if (!epubReader.currentPage.value) {
    parsedContent.value = []
    return
  }

  isParsingPage.value = true
  
  try {
    await parsePageContent(epubReader.currentPage.value.content)
  } catch (error: any) {
    console.error('Parse error:', error)
    parsedContent.value = []
  } finally {
    isParsingPage.value = false
  }
}

const parsePageContent = async (html: string) => {
  const temp = document.createElement('div')
  temp.innerHTML = html

  const contentItems: any[] = []
  const nodes = Array.from(temp.childNodes)

  for (const node of nodes) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement
      const tagName = element.tagName.toLowerCase()

      if (tagName === 'img') {
        const src = element.getAttribute('src')
        const alt = element.getAttribute('alt')
        if (src) {
          contentItems.push({
            type: 'image',
            src,
            alt: alt || ''
          })
        }
      } else if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
        const level = parseInt(tagName.charAt(1))
        const text = element.textContent?.trim() || ''
        if (text) {
          contentItems.push({
            type: 'heading',
            level,
            text
          })
        }
      } else {
        const text = extractTextFromElement(element)
        if (text.trim()) {
          const parsed = await parseTextContent(text)
          if (parsed.length > 0) {
            contentItems.push({
              type: 'text',
              sentences: parsed
            })
          }
        }
      }
    } else if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim() || ''
      if (text) {
        const parsed = await parseTextContent(text)
        if (parsed.length > 0) {
          contentItems.push({
            type: 'text',
            sentences: parsed
          })
        }
      }
    }
  }

  parsedContent.value = contentItems
}

const extractTextFromElement = (element: HTMLElement): string => {
  const clone = element.cloneNode(true) as HTMLElement
  
  const rubyElements = clone.querySelectorAll('ruby')
  rubyElements.forEach(ruby => {
    const baseText = Array.from(ruby.childNodes)
      .filter(node => node.nodeName !== 'RT' && node.nodeName !== 'RP')
      .map(node => node.textContent || '')
      .join('')
    
    const textNode = document.createTextNode(baseText)
    ruby.parentNode?.replaceChild(textNode, ruby)
  })
  
  const rtElements = clone.querySelectorAll('rt, rp')
  rtElements.forEach(el => el.remove())
  
  return clone.textContent || ''
}

const parseTextContent = async (text: string): Promise<ParsedSentence[]> => {
  const parsed = await parseText(text)

  let normalized: ParsedSentence[] = []
  if (parsed.length > 0 && !((parsed as any)[0]?.words)) {
    normalized.push({
      text,
      words: parsed as ParsedWord[],
      grammar: []
    })
  } else {
    normalized = parsed as unknown as ParsedSentence[]
  }

  return normalized
}

const startResize = (e: MouseEvent) => {
  isResizing.value = true
  const startX = e.clientX
  const startLeftWidth = leftWidth.value
  
  const onMouseMove = (e: MouseEvent) => {
    if (!isResizing.value) return
    const delta = e.clientX - startX
    const containerWidth = window.innerWidth
    const newLeftWidth = Math.max(300, Math.min(containerWidth - 300, startLeftWidth + delta))
    leftWidth.value = newLeftWidth
    rightWidth.value = containerWidth - newLeftWidth
  }
  
  const onMouseUp = () => {
    isResizing.value = false
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }
  
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

const updatePanelWidths = () => {
  if (showEpubViewer.value) {
    const containerWidth = window.innerWidth
    leftWidth.value = Math.floor(containerWidth / 2)
    rightWidth.value = Math.floor(containerWidth / 2)
  }
}

watch(showEpubViewer, (newVal) => {
  if (newVal) {
    updatePanelWidths()
  }
})

const syncEpubViewer = () => {
  if (!epubViewerRef.value || !epubReader.currentPage.value) return
  epubViewerRef.value.goTo(epubReader.currentPage.value.cfi)
}

const handleWordClick = (word: ParsedWord) => {
  selectedWord.value = word
  showWordModal.value = true
}

const nextPage = async () => {
  await epubReader.nextPage()
  await parseCurrentPage()
  syncEpubViewer()
}

const prevPage = async () => {
  await epubReader.prevPage()
  await parseCurrentPage()
  syncEpubViewer()
}

const goToChapter = async (href: string) => {
  showToc.value = false
  await epubReader.goToChapter(href)
  await parseCurrentPage()
  syncEpubViewer()
}

const onEpubReady = () => {
  syncEpubViewer()
}

onMounted(async () => {
  if (!booksStore.currentBook) {
    navigateTo('/books')
    return
  }

  await epubReader.loadEpub(booksStore.currentBook.path)
  await parseCurrentPage()
})

onUnmounted(() => {
  epubReader.destroy()
})
</script>