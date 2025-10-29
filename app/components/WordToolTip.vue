<template>
  <teleport v-if="shouldShow" to="body">
    <div
      ref="tooltipRef"
      class="fixed z-[100] pointer-events-auto animate-in fade-in duration-100"
      :style="tooltipPosition"
      @click.stop
      @mouseenter="onMouseEnter"
      @mouseleave="onMouseLeave"
    >
      <div
        class="absolute w-3 h-3 bg-base-100 transform rotate-45 border-l border-t border-base-300"
        :style="arrowStyle"
      ></div>

      <div
        class="rounded-2xl shadow-2xl border-2 bg-base-100 border-base-300 overflow-hidden w-80"
      >
        <div class="h-1.5 bg-primary"></div>

        <div class="p-4 sm:p-5 h-64 overflow-y-auto">
          <div class="flex items-start justify-between gap-3 mb-3">
            <div class="min-w-0 flex-1">
              <div class="font-bold text-base-content text-xl sm:text-2xl leading-tight break-words">
                {{ word?.kanji || word?.kana }}
              </div>
              <div v-if="word?.kana && word?.kanji" class="text-base sm:text-lg text-primary mt-1">
                {{ word.kana }}
              </div>
            </div>
          </div>

          <div class="divider my-2"></div>

          <div class="mb-3">
            <p class="text-sm sm:text-base text-base-content/80 leading-relaxed">
              {{ word?.meaning || 'No translation available' }}
            </p>
          </div>

          <div v-if="word?.pos" class="mb-3">
            <span class="badge badge-primary badge-sm">{{ formatPos(word.pos) }}</span>
          </div>

          <div v-if="showExtras && word?.pitchAccent" class="mb-3">
            <label class="text-xs font-semibold text-base-content/60 uppercase tracking-wide block mb-1">
              Pitch Accent
            </label>
            <div class="text-xs sm:text-sm font-mono bg-base-200 rounded-lg p-2">
              {{ word.pitchAccent }}
            </div>
          </div>

          <div v-if="showExtras && word?.example" class="mb-3">
            <label class="text-xs font-semibold text-base-content/60 uppercase tracking-wide block mb-1">
              Example
            </label>
            <div class="text-xs sm:text-sm bg-base-200 rounded-lg p-2 italic">
              {{ word.example }}
            </div>
          </div>

          <div v-if="word?.isKnown" class="flex items-center gap-2 text-xs text-success">
            <span>✓</span>
            <span>Known word</span>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type { ParsedWord } from '~/types/japanese'
import type { CSSProperties } from 'vue'

interface Props {
  visible: boolean
  word: ParsedWord | null
  anchorElement?: HTMLElement | null
  loading?: boolean
  showExtras?: boolean
  maxWidth?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  showExtras: false,
  maxWidth: 'min(88vw,28rem)'
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'mouse-enter': []
  'mouse-leave': []
}>()

const tooltipRef = ref<HTMLElement | null>(null)
const tooltipPosition = ref<CSSProperties>({})
const arrowStyle = ref<CSSProperties>({})

const shouldShow = computed(() => {
  return props.visible && !props.loading && props.word?.meaning
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

const positionTooltip = () => {
  nextTick(() => {
    if (!props.anchorElement || !tooltipRef.value) return

    const anchorRect = props.anchorElement.getBoundingClientRect()
    const tooltipRect = tooltipRef.value.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth

    const PADDING = 10
    const ARROW_OFFSET = 12

    const spaceAbove = anchorRect.top
    const spaceBelow = viewportHeight - anchorRect.bottom

    let top = 0
    let arrowPos: 'top' | 'bottom' = 'bottom'

    if (spaceBelow >= tooltipRect.height + ARROW_OFFSET + PADDING) {
      arrowPos = 'top'
      top = anchorRect.bottom + ARROW_OFFSET
    } else if (spaceAbove >= tooltipRect.height + ARROW_OFFSET + PADDING) {
      arrowPos = 'bottom'
      top = anchorRect.top - tooltipRect.height - ARROW_OFFSET
    } else {
      if (spaceBelow > spaceAbove) {
        arrowPos = 'top'
        top = anchorRect.bottom + ARROW_OFFSET
      } else {
        arrowPos = 'bottom'
        top = anchorRect.top - tooltipRect.height - ARROW_OFFSET
      }
    }

    top = Math.max(PADDING, Math.min(top, viewportHeight - tooltipRect.height - PADDING))

    let left = anchorRect.left + anchorRect.width / 2

    const tooltipLeftEdge = left - tooltipRect.width / 2
    const tooltipRightEdge = left + tooltipRect.width / 2

    if (tooltipRightEdge > viewportWidth - PADDING) {
      left = viewportWidth - tooltipRect.width / 2 - PADDING
    }
    if (tooltipLeftEdge < PADDING) {
      left = tooltipRect.width / 2 + PADDING
    }

    tooltipPosition.value = {
      top: `${top}px`,
      left: `${left}px`,
      transform: 'translateX(-50%)'
    }

    if (arrowPos === 'top') {
      arrowStyle.value = {
        top: '-6px',
        left: '50%',
        marginLeft: '-6px',
        zIndex: -1
      }
    } else {
      arrowStyle.value = {
        bottom: '-6px',
        left: '50%',
        marginLeft: '-6px',
        zIndex: -1
      }
    }
  })
}

const onMouseEnter = () => {
  emit('mouse-enter')
}

const onMouseLeave = () => {
  emit('mouse-leave')
}

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

if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => {
    if (shouldShow.value) {
      positionTooltip()
    }
  })
}
</script>