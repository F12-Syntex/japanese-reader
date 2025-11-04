<template>
  <teleport v-if="shouldShow" to="body">
    <div
      ref="tooltipRef"
      class="fixed z-[100] pointer-events-auto animate-in fade-in-0 zoom-in-95 duration-200"
      :style="tooltipPosition"
      @click.stop
      @mouseenter="onMouseEnter"
      @mouseleave="onMouseLeave"
    >
      <div
        class="absolute w-3 h-3 bg-base-100 transform rotate-45 border border-base-300"
        :style="arrowStyle"
      ></div>

      <div class="rounded-xl shadow-xl border border-base-300 bg-base-100 overflow-hidden backdrop-blur-sm w-80 max-w-[90vw]">
        <div class="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 px-4 pt-4 pb-3">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 flex-1">
              <div class="font-bold text-base-content leading-tight break-words flex items-center gap-2 text-2xl">
                {{ word?.kanji || word?.kana }}
                <button
                  v-if="word?.isKnown"
                  class="btn btn-circle btn-xs btn-success pointer-events-none"
                  title="Known word"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
              <div 
                v-if="word?.kana && word?.kanji" 
                class="text-primary/80 mt-1.5 font-medium text-base"
              >
                {{ word.kana }}
              </div>
            </div>
            
            <button
              @click.stop="toggleAlignment"
              class="btn btn-xs btn-ghost btn-circle opacity-50 hover:opacity-100 transition-opacity flex-shrink-0"
              title="Toggle alignment (A)"
            >
              <svg v-if="alignment === 'auto'" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M8 3H4a2 2 0 0 0-2 2v4m18-6h-4a2 2 0 0 0-2 2v4m0 0v8a2 2 0 0 0 2 2h4M8 21h4a2 2 0 0 0 2-2v-8M8 3v8m0 0H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              </svg>
              <svg v-else-if="alignment === 'top'" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <polyline points="19 12 12 5 5 12"/>
              </svg>
              <svg v-else-if="alignment === 'bottom'" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <polyline points="5 12 12 19 19 12"/>
              </svg>
              <svg v-else-if="alignment === 'left'" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12 19 5 12 12 5"/>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          </div>

          <div v-if="!loading && (word?.pos || word?.jlptLevel)" class="flex flex-wrap gap-2 mt-3">
            <div v-if="settings.showPartOfSpeech && word?.pos" 
              class="badge badge-primary badge-md gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
              </svg>
              {{ formatPos(word.pos) }}
            </div>
            
            <div v-if="settings.showJLPTLevel && word?.jlptLevel" 
              class="badge badge-secondary badge-md gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
              </svg>
              JLPT {{ word.jlptLevel }}
            </div>
          </div>
        </div>

        <div class="px-4 py-3 space-y-3 max-h-64 overflow-y-auto">
          <div>
            <div class="flex items-center gap-2 mb-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-base-content/60" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a18.87 18.87 0 01-1.724 4.78c.29.354.596.696.914 1.026a1 1 0 11-1.44 1.389c-.188-.196-.373-.396-.554-.6a19.098 19.098 0 01-3.107 3.567 1 1 0 01-1.334-1.49 17.087 17.087 0 003.13-3.733 18.992 18.992 0 01-1.487-2.494 1 1 0 111.79-.89c.234.47.489.928.764 1.372.417-.934.752-1.913.997-2.927H3a1 1 0 110-2h3V3a1 1 0 011-1zm6 6a1 1 0 01.894.553l2.991 5.982a.869.869 0 01.02.037l.99 1.98a1 1 0 11-1.79.895L15.383 16h-4.764l-.724 1.447a1 1 0 11-1.788-.894l.99-1.98.019-.038 2.99-5.982A1 1 0 0113 8zm-1.382 6h2.764L13 11.236 11.618 14z" clip-rule="evenodd" />
              </svg>
              <span class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">
                Translation
              </span>
            </div>
            <p 
              class="text-base-content leading-relaxed text-base"
            >
              {{ word?.meaning || 'No translation available' }}
            </p>
            <div v-if="loading" class="mt-2 flex items-center gap-2 text-xs text-base-content/50">
              <span class="loading loading-spinner loading-xs"></span>
              <span>Loading enhanced details...</span>
            </div>
          </div>

          <div v-if="!loading && settings.showPitchAccent && word?.pitchAccent" class="bg-base-200/50 rounded-lg p-3">
            <div class="flex items-center gap-2 mb-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-base-content/60" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clip-rule="evenodd" />
              </svg>
              <span class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">
                Pitch Accent
              </span>
            </div>
            <div class="font-mono text-base-content text-sm line-clamp-2">
              {{ word.pitchAccent }}
            </div>
          </div>

          <div v-if="!loading && settings.showExample && word?.example" class="bg-base-200/50 rounded-lg p-3">
            <div class="flex items-center gap-2 mb-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-base-content/60" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clip-rule="evenodd" />
              </svg>
              <span class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">
                Example
              </span>
            </div>
            <div class="text-base-content/80 italic leading-relaxed text-sm line-clamp-3">
              {{ word.example }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { useReaderSettingsStore } from '~/stores/useReaderSettingsStore'
import type { ParsedWord } from '~/types/japanese'
import type { CSSProperties } from 'vue'

interface Props {
  visible: boolean
  word: ParsedWord | null
  anchorElement?: HTMLElement | null
  loading?: boolean
  showExtras?: boolean
  isVerticalText?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  showExtras: false,
  isVerticalText: false
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'mouse-enter': []
  'mouse-leave': []
}>()

const readerSettingsStore = useReaderSettingsStore()
const settings = computed(() => readerSettingsStore.settings)

const tooltipRef = ref<HTMLElement | null>(null)
const tooltipPosition = ref<CSSProperties>({})
const arrowStyle = ref<CSSProperties>({})
const isHoveringTooltip = ref(false)
const hoverTimeout = ref<NodeJS.Timeout | null>(null)

const alignment = useState<'auto' | 'top' | 'bottom' | 'left' | 'right'>('tooltip-alignment', () => 'auto')

const shouldShow = computed(() => {
  return props.visible && props.word
})

const formatPos = (pos: string): string => {
  const mapping: Record<string, string> = {
    noun: 'Noun',
    verb: 'Verb',
    adjective: 'Adjective',
    particle: 'Particle',
    adverb: 'Adverb',
    prefix: 'Prefix',
    suffix: 'Suffix',
    conjunction: 'Conjunction',
    interjection: 'Interjection'
  }
  return mapping[pos.toLowerCase()] || pos
}

const toggleAlignment = () => {
  const alignments: Array<'auto' | 'top' | 'bottom' | 'left' | 'right'> = ['auto', 'top', 'bottom', 'left', 'right']
  const currentIndex = alignments.indexOf(alignment.value)
  alignment.value = alignments[(currentIndex + 1) % alignments.length]!
  nextTick(() => {
    positionTooltip()
  })
}

const positionTooltip = () => {
  nextTick(() => {
    if (!props.anchorElement || !tooltipRef.value) return

    const anchorRect = props.anchorElement.getBoundingClientRect()
    const tooltipRect = tooltipRef.value.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth

    const PADDING = 16
    const ARROW_OFFSET = 12
    const HORIZONTAL_OFFSET = 20

    let top = 0
    let left = 0
    let arrowPos: 'top' | 'bottom' | 'left' | 'right' = 'bottom'

    // Determine preferred position based on alignment setting
    if (alignment.value === 'auto') {
      // Auto-detect best position
      const spaceAbove = anchorRect.top
      const spaceBelow = viewportHeight - anchorRect.bottom
      const spaceRight = viewportWidth - anchorRect.right
      const spaceLeft = anchorRect.left

      if (spaceAbove >= tooltipRect.height + ARROW_OFFSET + PADDING) {
        arrowPos = 'bottom'
        top = anchorRect.top - tooltipRect.height - ARROW_OFFSET
        left = anchorRect.left + anchorRect.width / 2 - tooltipRect.width / 2
      } else if (spaceBelow >= tooltipRect.height + ARROW_OFFSET + PADDING) {
        arrowPos = 'top'
        top = anchorRect.bottom + ARROW_OFFSET
        left = anchorRect.left + anchorRect.width / 2 - tooltipRect.width / 2
      } else if (spaceRight >= tooltipRect.width + HORIZONTAL_OFFSET + PADDING) {
        arrowPos = 'left'
        left = anchorRect.right + HORIZONTAL_OFFSET
        top = anchorRect.top + anchorRect.height / 2 - tooltipRect.height / 2
      } else if (spaceLeft >= tooltipRect.width + HORIZONTAL_OFFSET + PADDING) {
        arrowPos = 'right'
        left = anchorRect.left - tooltipRect.width - HORIZONTAL_OFFSET
        top = anchorRect.top + anchorRect.height / 2 - tooltipRect.height / 2
      } else {
        // Fallback to bottom if no space anywhere
        arrowPos = 'top'
        top = anchorRect.bottom + ARROW_OFFSET
        left = anchorRect.left + anchorRect.width / 2 - tooltipRect.width / 2
      }
    } else {
      // Use fixed alignment
      arrowPos = alignment.value
      
      if (arrowPos === 'top') {
        top = anchorRect.bottom + ARROW_OFFSET
        left = anchorRect.left + anchorRect.width / 2 - tooltipRect.width / 2
      } else if (arrowPos === 'bottom') {
        top = anchorRect.top - tooltipRect.height - ARROW_OFFSET
        left = anchorRect.left + anchorRect.width / 2 - tooltipRect.width / 2
      } else if (arrowPos === 'left') {
        left = anchorRect.right + HORIZONTAL_OFFSET
        top = anchorRect.top + anchorRect.height / 2 - tooltipRect.height / 2
      } else { // right
        left = anchorRect.left - tooltipRect.width - HORIZONTAL_OFFSET
        top = anchorRect.top + anchorRect.height / 2 - tooltipRect.height / 2
      }
    }

    // Ensure tooltip stays within viewport
    top = Math.max(PADDING, Math.min(top, viewportHeight - tooltipRect.height - PADDING))
    left = Math.max(PADDING, Math.min(left, viewportWidth - tooltipRect.width - PADDING))

    tooltipPosition.value = {
      top: `${top}px`,
      left: `${left}px`
    }

    // Position arrow
    const anchorCenterX = anchorRect.left + anchorRect.width / 2
    const anchorCenterY = anchorRect.top + anchorRect.height / 2

    if (arrowPos === 'top') {
      arrowStyle.value = {
        top: '-6px',
        left: `${anchorCenterX - left}px`,
        marginLeft: '-6px',
        zIndex: -1,
        transform: 'rotate(45deg)'
      }
    } else if (arrowPos === 'bottom') {
      arrowStyle.value = {
        bottom: '-6px',
        left: `${anchorCenterX - left}px`,
        marginLeft: '-6px',
        zIndex: -1,
        transform: 'rotate(45deg)'
      }
    } else if (arrowPos === 'left') {
      arrowStyle.value = {
        left: '-6px',
        top: `${anchorCenterY - top}px`,
        marginTop: '-6px',
        zIndex: -1,
        transform: 'rotate(45deg)'
      }
    } else {
      arrowStyle.value = {
        right: '-6px',
        top: `${anchorCenterY - top}px`,
        marginTop: '-6px',
        zIndex: -1,
        transform: 'rotate(45deg)'
      }
    }
  })
}

const onMouseEnter = () => {
  if (hoverTimeout.value) {
    clearTimeout(hoverTimeout.value)
    hoverTimeout.value = null
  }
  isHoveringTooltip.value = true
  emit('mouse-enter')
}

const onMouseLeave = () => {
  isHoveringTooltip.value = false
  hoverTimeout.value = setTimeout(() => {
    emit('mouse-leave')
  }, 300)
}

// Keyboard shortcut for alignment toggle
onMounted(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (shouldShow.value && (e.key === 'a' || e.key === 'A') && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
      const activeElement = document.activeElement
      if (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA') return
      e.preventDefault()
      toggleAlignment()
    }
  }
  window.addEventListener('keydown', handleKeyPress)
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyPress)
  })
})

watch(shouldShow, (show) => {
  if (show) {
    positionTooltip()
  }
})

watch(() => props.anchorElement, () => {
  if (shouldShow.value) {
    positionTooltip()
  }
})

watch(() => props.isVerticalText, () => {
  if (shouldShow.value) {
    positionTooltip()
  }
})

if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => {
    if (shouldShow.value) {
      positionTooltip()
    }
  })
}
</script>