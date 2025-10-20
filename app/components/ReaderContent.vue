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
      <template v-for="(sentence, sIndex) in text" :key="sIndex">
        <span 
          v-if="settings.showSentenceNumbers && settings.sentenceNumberPosition === 'left'"
          class="inline-block mr-2 opacity-50 text-sm"
        >
          {{ sIndex + 1 }}.
        </span>

        <span 
          class="inline transition-all duration-200 rounded px-1 leading-relaxed cursor-pointer"
          :class="{ 'bg-primary/10': hoveredSentence === sIndex && isCtrlPressed, 'underline decoration-2 underline-offset-[6px]': hoveredSentence === sIndex && isCtrlPressed }"
          @mouseenter="handleSentenceHover(sIndex, $event)"
          @mouseleave="hoveredSentence = null"
          @click="handleSentenceClick(sIndex, sentence, $event)"
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
          .{{ sIndex + 1 }}
        </span>

        <span v-if="sIndex < text.length - 1" class="inline px-1">&nbsp;</span>
      </template>
      
      <span v-if="streamingText" class="opacity-50 animate-pulse">
        {{ streamingText }}
      </span>
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
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'word-click': [word: ParsedWord, event?: MouseEvent]
  'sentence-analyze': [payload: { index: number; sentence: ParsedSentence }]
}>()

const hoveredSentence = ref<number | null>(null)
const isCtrlPressed = ref(false)

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
}

const handleKeyUp = (e: KeyboardEvent) => {
  if (!e.ctrlKey && !e.metaKey) {
    isCtrlPressed.value = false
  }
}

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