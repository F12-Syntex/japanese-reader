<template>
  <div class="h-screen flex flex-col bg-base-100">
    <div class="navbar bg-base-200 shadow-lg">
      <div class="flex-1">
        <button @click="navigateTo('/books')" class="btn btn-ghost btn-sm">
          ← Back
        </button>
        <h1 class="text-xl font-bold ml-4">{{ currentBook?.title }}</h1>
      </div>
      <div class="flex-none gap-2">
        <div class="flex items-center gap-2 border-r border-base-300 pr-4">
          <label class="text-xs">Zoom:</label>
          <input
            v-model.number="pdfReader.zoom.value"
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            class="range range-xs range-primary w-24"
          />
          <span class="text-xs">{{ Math.round(pdfReader.zoom.value * 100) }}%</span>
        </div>

        <div class="flex items-center gap-2 border-r border-base-300 pr-4">
          <label class="label cursor-pointer gap-2">
            <span class="text-xs">Bounds</span>
            <input v-model="showBounds" type="checkbox" class="toggle toggle-xs toggle-primary" />
          </label>
        </div>

        <div class="flex items-center gap-2">
          <button @click="pdfReader.prevPage()" :disabled="!pdfReader.canGoPrev.value" class="btn btn-sm btn-primary">
            ←
          </button>
          <span class="text-sm">{{ pdfReader.currentPageIndex.value + 1 }} / {{ pdfReader.totalPages.value }}</span>
          <button @click="pdfReader.nextPage()" :disabled="!pdfReader.canGoNext.value" class="btn btn-sm btn-primary">
            →
          </button>
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-auto flex items-start justify-center p-4 bg-base-300">
      <div v-if="pdfReader.isLoading.value" class="flex flex-col items-center gap-4 p-8">
        <span class="loading loading-spinner loading-lg text-primary"></span>
        <p class="text-base-content">Loading page {{ pdfReader.currentPageIndex.value + 1 }}...</p>
        <p v-if="pdfReader.isProcessing.value" class="text-sm text-primary">Processing text with Kuromoji...</p>
      </div>

      <div
        v-else-if="pdfReader.pageCanvasUrl.value"
        class="relative mx-auto shadow-2xl rounded-lg overflow-hidden bg-white"
        :style="{
          width: pdfReader.pageWidth.value * pdfReader.zoom.value + 'px',
          height: pdfReader.pageHeight.value * pdfReader.zoom.value + 'px'
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
          class="pointer-events-none"
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
            backgroundColor: hoveredWordIndex === idx ? 'hsl(var(--p) / 0.5)' : (showBounds ? `${word.color}33` : 'transparent'),
            pointerEvents: 'auto',
            cursor: 'pointer',
            transition: 'background-color 0.15s ease',
            zIndex: hoveredWordIndex === idx ? 50 : idx
          }"
          @mouseenter="handleWordMouseEnter(word.parsedWord, $event, idx)"
          @mouseleave="handleWordMouseLeave"
          @click="word.parsedWord ? handleWordClick(word.parsedWord) : null"
        />
      </div>
    </div>

    <WordToolTip
      v-if="tooltip.visible"
      :visible="tooltip.visible"
      :word="tooltip.word"
      :anchor-element="tooltip.anchorElement"
      :show-extras="readerSettings.showExample"
      @mouse-enter="handleTooltipMouseEnter"
      @mouse-leave="handleTooltipMouseLeave"
    />
  </div>
</template>

<script setup lang="ts">
import { useBooksStore } from '~/stores/useBooksStore'
import { usePdfReader } from '~/composables/usePdfReader'
import { useReaderSettingsStore } from '~/stores/useReaderSettingsStore'
import WordToolTip from './WordToolTip.vue'
import type { ParsedWord } from '~/types/japanese'

definePageMeta({
  ssr: false
})

const booksStore = useBooksStore()
const pdfReader = usePdfReader()
const readerSettingsStore = useReaderSettingsStore()
const currentBook = computed(() => booksStore.currentBook)
const readerSettings = computed(() => readerSettingsStore.settings)

const showBounds = ref(false)

const tooltip = ref<{
  visible: boolean
  word: ParsedWord | null
  anchorElement: HTMLElement | null
}>({
  visible: false,
  word: null,
  anchorElement: null
})

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
      anchorElement: target
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
  console.log('Clicked word:', {
    kanji: word.kanji,
    kana: word.kana,
    meaning: word.meaning,
    pos: word.pos,
    isKnown: word.isKnown
  })
}

onMounted(async () => {
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
  pdfReader.destroy()
  if (hideTimeout) clearTimeout(hideTimeout)
  if (showTimeout) clearTimeout(showTimeout)
})
</script>