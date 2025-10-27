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
      @mouseup="handleTextSelection"
    >
      <template v-for="(item, itemIndex) in content" :key="itemIndex">
        <div v-if="item.type === 'image'" class="my-8 w-full flex justify-center">
          <img 
            :src="item.src" 
            :alt="item.alt || ''"
            class="max-w-full h-auto rounded-lg shadow-lg"
            :style="imageStyles"
          />
        </div>

        <div v-else-if="item.type === 'heading'" class="my-6">
          <component 
            :is="`h${item.level || 2}`"
            class="font-bold"
            :style="headingStyles(item.level || 2)"
          >
            {{ item.text }}
          </component>
        </div>

        <template v-else-if="item.type === 'text'">
          <template v-for="(sentence, sIndex) in item.sentences || []" :key="`${itemIndex}-${sIndex}`">
            <span 
              v-if="settings.showSentenceNumbers && settings.sentenceNumberPosition === 'left'"
              class="inline-block mr-2 opacity-50 text-sm"
            >
              {{ sIndex + 1 }}.
            </span>

            <span 
              class="inline transition-all duration-200 rounded px-1 leading-relaxed cursor-pointer"
              :class="{ 'bg-primary/10': hoveredSentence === `${itemIndex}-${sIndex}` && isCtrlPressed, 'underline decoration-2 underline-offset-[6px]': hoveredSentence === `${itemIndex}-${sIndex}` && isCtrlPressed }"
              @mouseenter="handleSentenceHover(`${itemIndex}-${sIndex}`, $event)"
              @mouseleave="hoveredSentence = null"
              @click="handleSentenceClick(sIndex, sentence, $event)"
            >
              <ReaderWord
                v-for="(word, wIndex) in sentence.words" 
                :key="wIndex"
                :word="word"
                :settings="settings"
                :disable-hover="isCtrlPressed || hasSelection || showSelectionTooltip"
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

            <span v-if="sIndex < (item.sentences || []).length - 1" class="inline px-1">&nbsp;</span>
          </template>
        </template>

        <div v-else-if="item.type === 'raw-html'" v-html="item.html" class="my-4"></div>
      </template>
      
      <span v-if="streamingText" class="opacity-50 animate-pulse">
        {{ streamingText }}
      </span>
    </div>

    <teleport v-if="showSelectionTooltip" to="body">
      <div
        ref="selectionTooltipRef"
        class="fixed z-[100] pointer-events-auto animate-in fade-in duration-100"
        :style="selectionTooltipPosition"
        @click.stop
      >
        <div
          class="absolute w-3 h-3 bg-base-100 transform rotate-45 border-l border-t border-base-300"
          :style="selectionArrowStyle"
        ></div>

        <div
          class="rounded-2xl shadow-2xl border-2 bg-base-100 border-base-300 overflow-hidden"
          style="max-width:min(88vw,28rem)"
          @mouseenter="onSelectionTooltipMouseEnter"
          @mouseleave="onSelectionTooltipMouseLeave"
        >
          <div class="h-1.5 bg-primary"></div>

          <div class="p-4 sm:p-5">
            <div class="flex items-start justify-between gap-3 mb-3">
              <div class="min-w-0 flex-1">
                <div class="font-bold text-base-content text-xl sm:text-2xl leading-tight break-words">
                  {{ selectedText }}
                </div>
              </div>
            </div>

            <div class="divider my-2"></div>

            <div class="mb-3">
              <p v-if="translationLoading" class="text-sm sm:text-base text-base-content/80 leading-relaxed">
                <span class="loading loading-dots loading-sm"></span>
              </p>
              <p v-else class="text-sm sm:text-base text-base-content/80 leading-relaxed">
                {{ translationText }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import type { ParsedSentence, ParsedWord } from '~/types/japanese'
import type { ReaderSettings } from '~/types/reader'
import type { CSSProperties } from 'vue'

interface ContentItem {
  type: 'text' | 'image' | 'heading' | 'raw-html'
  sentences?: ParsedSentence[]
  src?: string
  alt?: string
  text?: string
  level?: number
  html?: string
}

interface Props {
  content: ContentItem[]
  settings: ReaderSettings
  streamingText: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'word-click': [word: ParsedWord, event?: MouseEvent]
  'sentence-analyze': [payload: { index: number; sentence: ParsedSentence }]
}>()

const hoveredSentence = ref<string | null>(null)
const isCtrlPressed = ref(false)
const showSelectionTooltip = ref(false)
const selectionTooltipRef = ref<HTMLElement | null>(null)
const selectionTooltipPosition = ref<CSSProperties>({})
const selectionArrowStyle = ref<CSSProperties>({})
const selectedText = ref('')
const hasSelection = ref(false)
const translationLoading = ref(false)
const translationText = ref('Placeholder')
let selectionTooltipTimeout: ReturnType<typeof setTimeout> | null = null
let keepSelectionTooltip = false
let currentSelectionText = ''

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

const imageStyles = computed(() => ({
  maxHeight: '600px'
}))

const headingStyles = (level: number) => ({
  fontSize: `${props.settings.fontSize * (2.5 - level * 0.3)}px`,
  marginBottom: '1rem',
  marginTop: '1.5rem'
})

const isWordGrammarHighlighted = (word: ParsedWord, grammarPoints: string[]): boolean => {
  if (!grammarPoints?.length) return false
  const wordText = word.kanji || word.kana || ''
  return grammarPoints.some(point => {
    if (!point) return false
    return point.includes(wordText) || wordText.includes(point)
  })
}

const handleSentenceHover = (key: string, event: MouseEvent) => {
  const mouseEvent = event as MouseEvent
  if (mouseEvent.ctrlKey || mouseEvent.metaKey) {
    hoveredSentence.value = key
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
  if (!isCtrlPressed.value && !hasSelection.value && !showSelectionTooltip.value) {
    emit('word-click', word, event)
  }
}

const positionSelectionTooltip = (rect: DOMRect) => {
  const viewportHeight = window.innerHeight
  const viewportWidth = window.innerWidth
  const tooltipWidth = 448
  const tooltipHeight = 200
  const arrowSize = 6

  let top = rect.top - tooltipHeight - arrowSize - 8
  let left = rect.left + rect.width / 2
  let arrowPos: 'top' | 'bottom' = 'bottom'

  if (top < 10) {
    top = rect.bottom + arrowSize + 8
    arrowPos = 'top'
  }

  if (left + tooltipWidth / 2 > viewportWidth - 10) {
    left = viewportWidth - tooltipWidth / 2 - 10
  }
  if (left - tooltipWidth / 2 < 10) {
    left = tooltipWidth / 2 + 10
  }

  selectionTooltipPosition.value = {
    top: `${top}px`,
    left: `${left}px`,
    transform: 'translateX(-50%)'
  }

  if (arrowPos === 'top') {
    selectionArrowStyle.value = {
      top: '-6px',
      left: '50%',
      marginLeft: '-6px',
      zIndex: -1
    }
  } else {
    selectionArrowStyle.value = {
      bottom: '-6px',
      left: '50%',
      marginLeft: '-6px',
      zIndex: -1
    }
  }
}

const fetchTranslation = async (text: string) => {
  const { getApiKey } = useOpenAI()
  const apiKey = getApiKey()
  
  if (!apiKey) return

  translationLoading.value = true
  translationText.value = 'Placeholder'

  try {
    const response = await $fetch<{ analysis?: { translation?: string } }>('/api/literal-translation', {
      method: 'POST',
      body: {
        apiKey,
        sentence: text,
        words: [],
        allSentences: [],
      }
    })

    if (response?.analysis?.translation) {
      translationText.value = response.analysis.translation
    }
  } catch (error) {
    translationText.value = 'Translation failed'
  } finally {
    translationLoading.value = false
  }
}

const handleTextSelection = () => {
  if (selectionTooltipTimeout) {
    clearTimeout(selectionTooltipTimeout)
    selectionTooltipTimeout = null
  }

  const selection = window.getSelection()
  if (!selection) return

  const text = selection.toString().trim()
  if (text.length > 0) {
    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    
    selectedText.value = text
    hasSelection.value = true
    currentSelectionText = text
    
    selectionTooltipTimeout = setTimeout(() => {
      if (!keepSelectionTooltip) {
        showSelectionTooltip.value = true
        positionSelectionTooltip(rect)
        fetchTranslation(text)
      }
    }, props.settings?.tooltipDelay || 10)
  } else {
    if (!keepSelectionTooltip) {
      hasSelection.value = false
      showSelectionTooltip.value = false
    }
  }
}

const onSelectionTooltipMouseEnter = () => {
  keepSelectionTooltip = true
}

const onSelectionTooltipMouseLeave = () => {
  keepSelectionTooltip = false
  showSelectionTooltip.value = false
  hasSelection.value = false
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Control' || e.key === 'Meta') {
    isCtrlPressed.value = true
  }
}

const handleKeyUp = (e: KeyboardEvent) => {
  if (e.key === 'Control' || e.key === 'Meta') {
    isCtrlPressed.value = false
    hoveredSentence.value = null
  }
}

const handleClickOutside = (e: MouseEvent) => {
  if (!keepSelectionTooltip && showSelectionTooltip.value) {
    const target = e.target as HTMLElement
    if (!selectionTooltipRef.value?.contains(target)) {
      showSelectionTooltip.value = false
      hasSelection.value = false
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  document.removeEventListener('click', handleClickOutside)
  if (selectionTooltipTimeout) {
    clearTimeout(selectionTooltipTimeout)
  }
})
</script>