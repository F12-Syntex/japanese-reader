<template>
  <div class="h-screen flex flex-col bg-base-100">
    <div class="navbar bg-base-200 shadow-lg sticky top-0 z-50 border-b border-base-300">
      <div class="flex-1">
        <button @click="navigateTo('/books')" class="btn btn-ghost btn-sm gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div class="flex flex-col ml-2">
          <h1 class="text-lg font-bold leading-tight">{{ currentBook?.title }}</h1>
          <span class="text-xs text-base-content/60">{{ pdfReader.totalPages.value }} pages</span>
        </div>
      </div>
      <div class="flex-none gap-3 items-center">
        <div class="flex items-center gap-2 border-r border-base-300 pr-3">
          <label class="text-xs font-medium text-base-content/70">View:</label>
          <select v-model="viewMode" class="select select-xs select-bordered w-32 bg-base-100">
            <option value="pdf">PDF Parser</option>
            <option value="reader">Reader Content</option>
          </select>
        </div>

        <div v-if="viewMode === 'pdf'" class="flex items-center gap-2 border-r border-base-300 pr-3">
          <label class="text-xs font-medium text-base-content/70">Zoom:</label>
          <div class="flex items-center gap-2">
            <button 
              @click="pdfReader.zoom.value = Math.max(0.5, pdfReader.zoom.value - 0.1)"
              class="btn btn-xs btn-ghost btn-square"
              title="Zoom out"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
              </svg>
            </button>
            <input
              v-model.number="pdfReader.zoom.value"
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              class="range range-xs range-primary w-20"
            />
            <button 
              @click="pdfReader.zoom.value = Math.min(3, pdfReader.zoom.value + 0.1)"
              class="btn btn-xs btn-ghost btn-square"
              title="Zoom in"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <span class="text-xs font-medium min-w-[3rem] text-center">{{ Math.round(pdfReader.zoom.value * 100) }}%</span>
          </div>
        </div>

        <div v-if="viewMode === 'pdf'" class="flex items-center gap-2 border-r border-base-300 pr-3">
          <label class="label cursor-pointer gap-2">
            <span class="text-xs font-medium text-base-content/70">Bounds</span>
            <input v-model="showBounds" type="checkbox" class="toggle toggle-xs toggle-primary" />
          </label>
        </div>

        <div class="flex items-center gap-2">
          <button 
            @click="pdfReader.prevPage()" 
            :disabled="!pdfReader.canGoPrev.value" 
            class="btn btn-sm btn-primary btn-square"
            title="Previous page"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div class="flex flex-col items-center min-w-[4rem]">
            <span class="text-sm font-bold">{{ pdfReader.currentPageIndex.value + 1 }}</span>
            <span class="text-xs text-base-content/60">/ {{ pdfReader.totalPages.value }}</span>
          </div>
          <button 
            @click="pdfReader.nextPage()" 
            :disabled="!pdfReader.canGoNext.value" 
            class="btn btn-sm btn-primary btn-square"
            title="Next page"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-auto bg-gradient-to-br from-base-200 via-base-100 to-base-200">
      <div v-if="pdfReader.isLoading.value" class="flex flex-col items-center gap-4 p-8">
        <span class="loading loading-spinner loading-lg text-primary"></span>
        <p class="text-base-content font-medium">Loading page {{ pdfReader.currentPageIndex.value + 1 }}...</p>
        <p v-if="pdfReader.isProcessing.value" class="text-sm text-primary/80 flex items-center gap-2">
          <span class="loading loading-dots loading-sm"></span>
          Processing text with Kuromoji...
        </p>
      </div>

      <!-- PDF Parser View -->
      <div
        v-else-if="viewMode === 'pdf' && pdfReader.pageCanvasUrl.value"
        class="flex items-start justify-center p-4 sm:p-6"
      >
        <div
          class="relative mx-auto shadow-2xl rounded-xl overflow-hidden bg-white border-2 border-base-300 transition-all duration-300"
          :style="{
            width: pdfReader.pageWidth.value * pdfReader.zoom.value + 'px',
            height: pdfReader.pageHeight.value * pdfReader.zoom.value + 'px',
            maxWidth: '100%',
            maxHeight: 'calc(100vh - 120px)'
          }"
        >
          <img
            :src="pdfReader.pageCanvasUrl.value"
            :style="{
              position: 'absolute',
              left: '0',
              top: '0',
              width: pdfReader.pageWidth.value * pdfReader.zoom.value + 'px',
              height: pdfReader.pageHeight.value * pdfReader.zoom.value + 'px'
            }"
            class="pointer-events-none select-none"
            alt="PDF Page"
          />

          <div
            v-for="(word, idx) in pdfReader.wordBounds.value"
            :key="`word-${idx}`"
            :style="{
              position: 'absolute',
              left: word.x * pdfReader.zoom.value + 'px',
              top: word.y * pdfReader.zoom.value + 'px',
              width: word.width * pdfReader.zoom.value + 'px',
              height: word.height * pdfReader.zoom.value + 'px',
              border: showBounds ? `2px solid ${word.color}` : 'none',
              backgroundColor: hoveredWordIndex === idx ? 'hsl(var(--p) / 0.3)' : (showBounds ? `${word.color}20` : 'transparent'),
              pointerEvents: 'auto',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease, border-color 0.2s ease',
              zIndex: hoveredWordIndex === idx ? 50 : idx,
              borderRadius: hoveredWordIndex === idx ? '4px' : '0'
            }"
            @mouseenter="handleWordMouseEnter(word.parsedWord, $event, idx)"
            @mouseleave="handleWordMouseLeave"
            @click="word.parsedWord ? handleWordClick(word.parsedWord) : null"
          />
        </div>
      </div>

      <!-- Reader Content View -->
      <div v-else-if="viewMode === 'reader'" class="w-full h-full flex relative" data-reader-view>
        <!-- Text Content on Left -->
        <div class="flex-1 overflow-y-auto min-w-0">
          <ReaderContent
            :content="textContent"
            :settings="readerSettings"
            :streaming-text="''"
            @word-click="handleWordClick"
            @sentence-analyze="handleSentenceAnalyze"
          />
        </div>

        <!-- Resize Handle -->
        <div
          v-if="pdfImageUrl"
          @mousedown="startResize"
          class="w-1 bg-base-300 hover:bg-primary cursor-col-resize transition-colors flex-shrink-0 z-10"
          :class="{ 'bg-primary': isResizing }"
        />

        <!-- PDF Image on Right -->
        <div
          v-if="pdfImageUrl"
          class="flex-shrink-0 overflow-auto bg-base-200 border-l border-base-300 flex items-start justify-center p-4"
          :style="{ width: `${pdfPanelWidth}px` }"
        >
          <img
            :src="pdfImageUrl"
            :style="{
              maxWidth: '100%',
              height: 'auto',
              objectFit: 'contain',
              aspectRatio: pdfReader.pageWidth.value && pdfReader.pageHeight.value 
                ? `${pdfReader.pageWidth.value} / ${pdfReader.pageHeight.value}`
                : 'auto'
            }"
            class="shadow-2xl rounded-lg border-2 border-base-300 select-none"
            alt="PDF Page"
            draggable="false"
          />
        </div>
      </div>
    </div>

    <WordToolTip
      v-if="tooltip.visible"
      :visible="tooltip.visible"
      :word="tooltip.word"
      :anchor-element="tooltip.anchorElement"
      :loading="tooltip.loading || false"
      :show-extras="readerSettings.showExample"
      @mouse-enter="handleTooltipMouseEnter"
      @mouse-leave="handleTooltipMouseLeave"
    />

    <ReaderWordModal
      :model-value="showWordModal"
      @update:model-value="showWordModal = $event"
      :word="selectedWord"
    />

    <SentenceAnalysisModal
      :model-value="showAnalysisModal"
      @update:model-value="showAnalysisModal = $event"
      :sentence="selectedSentence"
    />
  </div>
</template>

<script setup lang="ts">
import { useBooksStore } from '~/stores/useBooksStore'
import { usePdfReader } from '~/composables/usePdfReader'
import { useReaderSettingsStore } from '~/stores/useReaderSettingsStore'
import { useWordMetadataStore } from '~/stores/useWordMetadataStore'
import { useOpenAI } from '~/composables/useOpenAI'
import WordToolTip from './WordToolTip.vue'
import ReaderContent from './ReaderContent.vue'
import ReaderWordModal from './ReaderWordModal.vue'
import SentenceAnalysisModal from './SentenceAnalysisModal.vue'
import type { ParsedWord, ParsedSentence } from '~/types/japanese'

definePageMeta({
  ssr: false
})

const booksStore = useBooksStore()
const pdfReader = usePdfReader()
const readerSettingsStore = useReaderSettingsStore()
const metadataStore = useWordMetadataStore()
const currentBook = computed(() => booksStore.currentBook)
const readerSettings = computed(() => readerSettingsStore.settings)
const isLoadingMetadata = ref(false)

const viewMode = ref<'pdf' | 'reader'>('pdf')
const showBounds = ref(false)
const showWordModal = ref(false)
const selectedWord = ref<ParsedWord | null>(null)
const showAnalysisModal = ref(false)
const selectedSentence = ref<ParsedSentence | null>(null)
const pdfPanelWidth = ref(384) // Default width in pixels
const isResizing = ref(false)

// Separate text and image content for split layout
const textContent = computed(() => {
  if (pdfReader.pageSentences.value.length === 0) {
    return []
  }
  return [{
    type: 'text' as const,
    sentences: pdfReader.pageSentences.value
  }]
})

const pdfImageUrl = computed(() => pdfReader.pageCanvasUrl.value)

// Resize handlers
const startResize = (event: MouseEvent) => {
  isResizing.value = true
  event.preventDefault()
  event.stopPropagation()
}

const onResize = (event: MouseEvent) => {
  if (!isResizing.value) return
  
  // Get the parent container (the flex container)
  const readerView = document.querySelector('[data-reader-view]') as HTMLElement
  if (!readerView) return
  
  const containerRect = readerView.getBoundingClientRect()
  // Calculate width from right edge of container
  const newWidth = containerRect.right - event.clientX
  
  // Constrain width between 200px and 60% of container width
  const minWidth = 200
  const maxWidth = containerRect.width * 0.6
  pdfPanelWidth.value = Math.max(minWidth, Math.min(maxWidth, newWidth))
  
  event.preventDefault()
}

const stopResize = () => {
  isResizing.value = false
}

// Attach resize listeners only when resizing
watch(isResizing, (resizing) => {
  if (resizing) {
    window.addEventListener('mousemove', onResize)
    window.addEventListener('mouseup', stopResize)
  } else {
    window.removeEventListener('mousemove', onResize)
    window.removeEventListener('mouseup', stopResize)
  }
})

const tooltip = ref<{
  visible: boolean
  word: ParsedWord | null
  anchorElement: HTMLElement | null
  loading?: boolean
}>({
  visible: false,
  word: null,
  anchorElement: null,
  loading: false
})

// Enrich word data when meaning is missing
const enrichWordData = async (word: ParsedWord) => {
  const kanji = word?.kanji ?? ''
  if (!kanji) return

  // Check if we already have metadata for this word
  if (metadataStore.hasWord(kanji)) {
    const cached = metadataStore.getWord(kanji)
    if (cached?.meaning) {
      return // Already have meaning, no need to fetch
    }
  }

  // Only fetch if word has no meaning
  const hasMeaning = word?.meaning && word.meaning.trim() !== ''
  if (hasMeaning && metadataStore.hasWord(kanji)) {
    return // Already have meaning from dictionary
  }

  isLoadingMetadata.value = true
  tooltip.value.loading = true
  try {
    const { getApiKey } = useOpenAI()
    const apiKey = getApiKey()
    if (!apiKey) {
      isLoadingMetadata.value = false
      tooltip.value.loading = false
      return
    }

    const response = await $fetch<{ data?: Record<string, any> }>('/api/word-metadata', {
      method: 'POST',
      body: {
        apiKey,
        words: [kanji],
        model: 'gpt-4o-mini'
      }
    })

    if (response?.data && response.data[kanji]) {
      const metadata = { kanji, ...response.data[kanji] }
      // Preserve existing meaning if new one is empty
      if (!metadata.meaning || metadata.meaning.trim() === '') {
        metadata.meaning = word?.meaning || ''
      }
      metadataStore.setWord(kanji, metadata)
      // Update tooltip word with new metadata
      if (tooltip.value.word && tooltip.value.word.kanji === kanji) {
        tooltip.value.word = {
          ...tooltip.value.word,
          meaning: metadata.meaning || tooltip.value.word.meaning,
          pos: metadata.pos || tooltip.value.word.pos,
          pitchAccent: metadata.pitchAccent || tooltip.value.word.pitchAccent,
          example: metadata.example || tooltip.value.word.example,
          jlptLevel: metadata.jlptLevel || tooltip.value.word.jlptLevel
        }
      }
    }
  } catch (error) {
    console.error('Failed to enrich word data:', error)
  } finally {
    isLoadingMetadata.value = false
    tooltip.value.loading = false
  }
}

const hoveredWordIndex = ref<number | null>(null)
let hideTimeout: NodeJS.Timeout | null = null
let showTimeout: NodeJS.Timeout | null = null

const handleWordMouseEnter = (word: ParsedWord | undefined, event: MouseEvent, idx: number) => {
  if (!word || !readerSettings.value.showTooltip) return

  if (hideTimeout) {
    clearTimeout(hideTimeout)
    hideTimeout = null
  }

  hoveredWordIndex.value = idx

  if (showTimeout) {
    clearTimeout(showTimeout)
  }

  showTimeout = setTimeout(() => {
    const target = event.target as HTMLElement
    tooltip.value = {
      visible: true,
      word,
      anchorElement: target,
      loading: false
    }
    // Enrich word data if meaning is missing
    if (!word.meaning || word.meaning.trim() === '') {
      enrichWordData(word)
    }
  }, readerSettings.value.tooltipDelay)
}

const handleWordMouseLeave = () => {
  if (showTimeout) {
    clearTimeout(showTimeout)
    showTimeout = null
  }

  hideTimeout = setTimeout(() => {
    tooltip.value.visible = false
    tooltip.value.anchorElement = null
    hoveredWordIndex.value = null
  }, 300)
}

const handleTooltipMouseEnter = () => {
  if (hideTimeout) {
    clearTimeout(hideTimeout)
    hideTimeout = null
  }
}

const handleTooltipMouseLeave = () => {
  tooltip.value.visible = false
  tooltip.value.anchorElement = null
  hoveredWordIndex.value = null
}

const handleWordClick = (word: ParsedWord) => {
  selectedWord.value = word
  showWordModal.value = true
  // Close tooltip when opening modal
  tooltip.value.visible = false
}

const handleSentenceAnalyze = (payload: { index: number; sentence: ParsedSentence }) => {
  selectedSentence.value = payload.sentence
  showAnalysisModal.value = true
}

onMounted(async () => {
  metadataStore.loadCache()
  
  if (!currentBook.value) {
    navigateTo('/books')
    return
  }

  try {
    await pdfReader.loadPdf(currentBook.value.path)
  } catch (error) {
    console.error('Error loading PDF:', error)
  }
})

onUnmounted(() => {
  // Clean up resize listeners
  if (isResizing.value) {
    window.removeEventListener('mousemove', onResize)
    window.removeEventListener('mouseup', stopResize)
  }
  pdfReader.destroy()
  if (hideTimeout) clearTimeout(hideTimeout)
  if (showTimeout) clearTimeout(showTimeout)
})
</script>