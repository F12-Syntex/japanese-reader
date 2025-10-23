<template>
  <div 
    class="px-6 sm:px-12 py-8 sm:py-12 pb-32 mx-auto"
    :class="maxWidthClass"
    :style="containerStyles"
  >
    <div 
      :style="textStyles"
      :class="[
        textAlignClass,
        { 'writing-mode-vertical-rl': settings.verticalText }
      ]"
    >
      <template v-for="(sentence, sIndex) in paginatedText" :key="`${currentPage}-${sIndex}`">
        <span 
          v-if="settings.showSentenceNumbers && settings.sentenceNumberPosition === 'left'"
          class="inline-block mr-2 opacity-50 text-sm"
        >
          {{ getGlobalSentenceIndex(sIndex) + 1 }}.
        </span>

        <span 
          class="inline transition-all duration-200 rounded px-1 leading-relaxed cursor-pointer"
          :class="{ 'bg-primary/10': hoveredSentence === sIndex && isCtrlPressed, 'underline decoration-2 underline-offset-[6px]': hoveredSentence === sIndex && isCtrlPressed }"
          @mouseenter="handleSentenceHover(sIndex, $event)"
          @mouseleave="hoveredSentence = null"
          @click="handleSentenceClick(getGlobalSentenceIndex(sIndex), sentence, $event)"
        >
          <ReaderWord
            v-for="(word, wIndex) in sentence.words" 
            :key="wIndex"
            :word="word"
            :settings="settings"
            :disable-hover="isCtrlPressed"
            :is-grammar-highlighted="settings.highlightGrammar && isWordGrammarHighlighted(word, sentence.grammar)"
            @click="handleWordClick(word)"
          />
        </span>

        <span 
          v-if="settings.showSentenceNumbers && settings.sentenceNumberPosition === 'right'"
          class="inline-block ml-2 opacity-50 text-sm"
        >
          .{{ getGlobalSentenceIndex(sIndex) + 1 }}
        </span>

        <span v-if="sIndex < paginatedText.length - 1" class="inline px-1">&nbsp;</span>
      </template>
      
      <span v-if="streamingText && isLastPage" class="opacity-50 animate-pulse">
        {{ streamingText }}
      </span>
    </div>

    <div v-if="totalPages > 1" class="flex justify-center items-center gap-2 mt-8">
      <button 
        @click="previousPage" 
        :disabled="currentPage === 0"
        class="btn btn-sm btn-circle"
        :class="currentPage === 0 ? 'btn-disabled' : 'btn-primary'"
      >
        ‹
      </button>
      
      <div class="join">
        <button 
          v-for="page in visiblePages" 
          :key="page"
          @click="currentPage = page"
          class="join-item btn btn-sm"
          :class="currentPage === page ? 'btn-primary' : 'btn-ghost'"
        >
          {{ page + 1 }}
        </button>
      </div>

      <button 
        @click="nextPage" 
        :disabled="currentPage === totalPages - 1"
        class="btn btn-sm btn-circle"
        :class="currentPage === totalPages - 1 ? 'btn-disabled' : 'btn-primary'"
      >
        ›
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ParsedSentence, ParsedWord } from '~/types/japanese'
import type { ReaderSettings } from '~/types/reader'

interface Props {
  text: ParsedSentence[]
  settings: ReaderSettings
  streamingText: string
  sentencesPerPage?: number
}

const props = withDefaults(defineProps<Props>(), {
  sentencesPerPage: 10
})

const emit = defineEmits<{
  'word-click': [word: ParsedWord, event?: MouseEvent]
  'sentence-analyze': [payload: { index: number; sentence: ParsedSentence }]
}>()

const hoveredSentence = ref<number | null>(null)
const isCtrlPressed = ref(false)
const currentPage = ref(0)

const totalPages = computed(() => Math.ceil(props.text.length / props.sentencesPerPage))

const paginatedText = computed(() => {
  const start = currentPage.value * props.sentencesPerPage
  const end = start + props.sentencesPerPage
  return props.text.slice(start, end)
})

const isLastPage = computed(() => currentPage.value === totalPages.value - 1)

const visiblePages = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  const pages: number[] = []
  
  if (total <= 7) {
    for (let i = 0; i < total; i++) pages.push(i)
    return pages
  }
  
  pages.push(0)
  
  if (current > 3) pages.push(-1)
  
  const start = Math.max(1, current - 1)
  const end = Math.min(total - 2, current + 1)
  
  for (let i = start; i <= end; i++) {
    if (!pages.includes(i)) pages.push(i)
  }
  
  if (current < total - 4) pages.push(-1)
  
  pages.push(total - 1)
  
  return pages
})

const maxWidthClass = computed(() => {
  const widths: Record<string, string> = {
    full: 'max-w-full',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '6xl': 'max-w-6xl'
  }
  return widths[props.settings.maxWidth] || widths.full
})

const textAlignClass = computed(() => {
  const aligns: Record<string, string> = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
    justify: 'text-justify'
  }
  return aligns[props.settings.textAlign] || aligns.left
})

const containerStyles = computed(() => ({
  fontFamily: `"${props.settings.fontFamily}", sans-serif`
}))

const textStyles = computed(() => ({
  fontSize: `${props.settings.fontSize}px`,
  lineHeight: props.settings.lineHeight,
  fontWeight: props.settings.fontWeight,
  letterSpacing: `${props.settings.letterSpacing}px`
}))

const getGlobalSentenceIndex = (localIndex: number): number => {
  return currentPage.value * props.sentencesPerPage + localIndex
}

const nextPage = () => {
  if (currentPage.value < totalPages.value - 1) {
    currentPage.value++
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const previousPage = () => {
  if (currentPage.value > 0) {
    currentPage.value--
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const isWordGrammarHighlighted = (word: ParsedWord, grammarPoints: string[]): boolean => {
  if (!grammarPoints?.length) return false
  const wordText = word.kanji || word.kana || ''
  return grammarPoints.some(point => {
    if (!point) return false
    return point.includes(wordText) || wordText.includes(point)
  })
}

const handleSentenceHover = (index: number, event: MouseEvent) => {
  const mouseEvent = event as MouseEvent
  if (mouseEvent.ctrlKey || mouseEvent.metaKey) {
    hoveredSentence.value = index
  }
}

const handleSentenceClick = (index: number, sentence: ParsedSentence, event: MouseEvent) => {
  const mouseEvent = event as MouseEvent
  if (mouseEvent.ctrlKey || mouseEvent.metaKey) {
    mouseEvent.preventDefault()
    mouseEvent.stopPropagation()
    emit('sentence-analyze', { index, sentence })
  }
}

const handleWordClick = (word: ParsedWord, event?: MouseEvent) => {
  if (!isCtrlPressed.value) {
    emit('word-click', word, event)
  }
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.ctrlKey || e.metaKey) {
    isCtrlPressed.value = true
  }
  if (e.key === 'ArrowLeft') previousPage()
  if (e.key === 'ArrowRight') nextPage()
}

const handleKeyUp = (e: KeyboardEvent) => {
  if (!e.ctrlKey && !e.metaKey) {
    isCtrlPressed.value = false
  }
}

watch(() => props.text.length, () => {
  currentPage.value = 0
})

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
})
</script>

<style scoped>
.writing-mode-vertical-rl {
  writing-mode: vertical-rl;
  text-orientation: upright;
}
</style>