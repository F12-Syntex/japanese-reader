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
        class="absolute w-3 h-3 bg-base-100 transform rotate-45 border-l border-t border-primary/30"
        :style="arrowStyle"
      ></div>

      <div
        class="rounded-2xl shadow-2xl border-2 bg-base-100 border-primary/30 overflow-hidden"
        :class="{
          'w-64': settings.tooltipSize === 'sm',
          'w-80': settings.tooltipSize === 'md',
          'w-96': settings.tooltipSize === 'lg'
        }"
      >
        <div class="h-1.5 bg-gradient-to-r from-primary to-secondary"></div>

        <div 
          class="p-4 sm:p-5 overflow-y-auto"
          :class="{
            'h-48': settings.tooltipSize === 'sm',
            'h-64': settings.tooltipSize === 'md',
            'h-80': settings.tooltipSize === 'lg'
          }"
        >
          <div class="flex items-start justify-between gap-3 mb-3">
            <div class="min-w-0 flex-1">
              <div 
                class="font-bold text-base-content leading-tight break-words"
                :class="{
                  'text-lg': settings.tooltipSize === 'sm',
                  'text-xl sm:text-2xl': settings.tooltipSize === 'md',
                  'text-2xl sm:text-3xl': settings.tooltipSize === 'lg'
                }"
              >
                {{ word?.kanji || word?.kana }}
              </div>
              <div 
                v-if="word?.kana && word?.kanji" 
                class="text-primary mt-1"
                :class="{
                  'text-sm': settings.tooltipSize === 'sm',
                  'text-base sm:text-lg': settings.tooltipSize === 'md',
                  'text-lg sm:text-xl': settings.tooltipSize === 'lg'
                }"
              >
                {{ word.kana }}
              </div>
            </div>
          </div>

          <div class="divider my-2"></div>

          <div class="mb-3">
            <div v-if="loading" class="flex flex-col gap-2">
              <div class="skeleton h-4 w-full"></div>
              <div class="skeleton h-4 w-3/4"></div>
            </div>
            <p 
              v-else
              class="text-base-content/80 leading-relaxed"
              :class="{
                'text-xs': settings.tooltipSize === 'sm',
                'text-sm sm:text-base': settings.tooltipSize === 'md',
                'text-base sm:text-lg': settings.tooltipSize === 'lg'
              }"
            >
              {{ word?.meaning || 'No translation available' }}
            </p>
          </div>

          <div v-if="!loading && settings.showPartOfSpeech && word?.pos" class="mb-3">
            <span 
              class="badge badge-primary"
              :class="{
                'badge-xs': settings.tooltipSize === 'sm',
                'badge-sm': settings.tooltipSize === 'md',
                'badge-md': settings.tooltipSize === 'lg'
              }"
            >
              {{ formatPos(word.pos) }}
            </span>
          </div>

          <div v-if="!loading && settings.showJLPTLevel && word?.jlptLevel" class="mb-3">
            <span 
              class="badge badge-secondary"
              :class="{
                'badge-xs': settings.tooltipSize === 'sm',
                'badge-sm': settings.tooltipSize === 'md',
                'badge-md': settings.tooltipSize === 'lg'
              }"
            >
              JLPT {{ word.jlptLevel }}
            </span>
          </div>

          <div v-if="!loading && settings.showPitchAccent && word?.pitchAccent" class="mb-3">
            <label class="text-xs font-semibold text-base-content/60 uppercase tracking-wide block mb-1">
              Pitch Accent
            </label>
            <div 
              class="font-mono bg-base-200 rounded-lg p-2"
              :class="{
                'text-xs': settings.tooltipSize === 'sm',
                'text-xs sm:text-sm': settings.tooltipSize === 'md',
                'text-sm sm:text-base': settings.tooltipSize === 'lg'
              }"
            >
              {{ word.pitchAccent }}
            </div>
          </div>

          <div v-if="!loading && settings.showExample && word?.example" class="mb-3">
            <label class="text-xs font-semibold text-base-content/60 uppercase tracking-wide block mb-1">
              Example
            </label>
            <div 
              class="bg-base-200 rounded-lg p-2 italic"
              :class="{
                'text-xs': settings.tooltipSize === 'sm',
                'text-xs sm:text-sm': settings.tooltipSize === 'md',
                'text-sm sm:text-base': settings.tooltipSize === 'lg'
              }"
            >
              {{ word.example }}
            </div>
          </div>

          <div v-if="!loading && word?.isKnown" class="flex items-center gap-2 text-xs text-success">
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
import { useReaderSettingsStore } from '~/stores/useReaderSettingsStore'
import type { ParsedWord } from '~/types/japanese'
import type { CSSProperties } from 'vue'

interface Props {
  visible: boolean
  word: ParsedWord | null
  anchorElement?: HTMLElement | null
  loading?: boolean
  showExtras?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  showExtras: false
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