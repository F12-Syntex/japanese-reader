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
        <button @click="showToc = !showToc" class="btn btn-ghost btn-sm gap-2">
          <IconList class="w-4 h-4" />
          Chapters
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-8">
      <div v-if="epubReader.isLoading.value" class="flex flex-col items-center justify-center h-full gap-4">
        <span class="loading loading-spinner loading-lg"></span>
        <p class="text-sm text-base-content/70">Loading {{ epubReader.progress.value }}%...</p>
      </div>
      <div v-else-if="isParsingPage" class="flex flex-col items-center justify-center h-full gap-4">
        <span class="loading loading-spinner loading-lg"></span>
        <p class="text-sm text-base-content/70">Parsing {{ parseProgress }}%...</p>
      </div>
      <div v-else-if="!epubReader.currentPage.value" class="flex items-center justify-center h-full">
        <p class="text-base-content/50">No text</p>
      </div>
      <ReaderContent
        v-else
        :text="parsedContent"
        :settings="readerSettings"
        :streaming-text="''"
        @word-click="handleWordClick"
      />
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
      <div class="absolute right-0 top-0 bottom-0 w-80 bg-base-100 shadow-xl p-4" @click.stop>
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
import { useBooksStore } from '~/stores/useBooksStore'
import { useReaderSettings } from '~/composables/useReaderSettings'
import { useKuromojiParser } from '~/composables/useKuromojiParser'
import { useEpubReader } from '~/composables/useEpubReader'
import type { ParsedSentence, ParsedWord } from '~/types/japanese'

const CHUNK_SIZE = 500

const booksStore = useBooksStore()
const { settings: readerSettings } = useReaderSettings()
const { parseText } = useKuromojiParser()
const epubReader = useEpubReader()

const showToc = ref(false)
const showWordModal = ref(false)
const selectedWord = ref<ParsedWord | null>(null)
const parseProgress = ref(0)
const isParsingPage = ref(false)
const parsedContent = ref<ParsedSentence[]>([])

let parseAbortController: AbortController | null = null

const pageProgress = computed(() => {
  if (epubReader.totalPages.value === 0) return 0
  return ((epubReader.currentPageIndex.value + 1) / epubReader.totalPages.value) * 100
})

const parseCurrentPage = async () => {
  if (!epubReader.currentPage.value) {
    parsedContent.value = []
    return
  }

  if (parseAbortController) {
    parseAbortController.abort()
  }
  
  parseAbortController = new AbortController()
  const signal = parseAbortController.signal
  
  isParsingPage.value = true
  parseProgress.value = 0
  
  try {
    const text = epubReader.currentPage.value.content
    if (!text.trim()) {
      parsedContent.value = []
      return
    }

    await parseLargeText(text, signal)
  } catch (error: any) {
    if (error.name !== 'AbortError') {
      console.error('Parse error:', error)
      parsedContent.value = []
    }
  } finally {
    isParsingPage.value = false
    parseProgress.value = 0
  }
}

const parseLargeText = async (text: string, signal: AbortSignal) => {
  const lines = text.split('\n').filter(line => line.trim())
  
  const sentences: string[] = []
  for (const line of lines) {
    const lineSentences = line
      .split(/([。!?])/g)
      .reduce((acc: string[], curr, idx, arr) => {
        if (idx % 2 === 0 && curr.trim()) {
          const next = arr[idx + 1]
          acc.push(curr + (next || ''))
        }
        return acc
      }, [])
      .filter(s => s.trim())
    
    sentences.push(...lineSentences)
  }

  const chunks: string[][] = []
  for (let i = 0; i < sentences.length; i += CHUNK_SIZE) {
    chunks.push(sentences.slice(i, i + CHUNK_SIZE))
  }

  const allParsed: ParsedSentence[] = []

  for (let i = 0; i < chunks.length; i++) {
    if (signal.aborted) throw new Error('AbortError')

    const chunk = chunks[i]
    if (!chunk) continue

    const chunkText = chunk.join('')
    const parsed = await parseText(chunkText)

    let normalized: ParsedSentence[] = []
    if (parsed.length > 0 && !((parsed as any)[0]?.words)) {
      normalized.push({
        text: chunkText,
        words: parsed as ParsedWord[],
        grammar: []
      })
    } else {
      normalized = parsed as unknown as ParsedSentence[]
    }

    allParsed.push(...normalized)

    parseProgress.value = Math.round(((i + 1) / chunks.length) * 100)
  }

  parsedContent.value = allParsed
}

const handleWordClick = (word: ParsedWord) => {
  selectedWord.value = word
  showWordModal.value = true
}

const nextPage = () => {
  epubReader.nextPage()
  parseCurrentPage()
}

const prevPage = () => {
  epubReader.prevPage()
  parseCurrentPage()
}

const goToChapter = (href: string) => {
  epubReader.goToChapter(href)
  showToc.value = false
  parseCurrentPage()
}

onMounted(async () => {
  if (!booksStore.currentBook) {
    navigateTo('/books')
    return
  }

  await epubReader.loadEpub(booksStore.currentBook.path)
  parseCurrentPage()
})

onUnmounted(() => {
  if (parseAbortController) {
    parseAbortController.abort()
  }
  epubReader.destroy()
})
</script>