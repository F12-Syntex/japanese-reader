<script setup lang="ts">
import { nextTick, computed, ref, watch, onMounted, onUnmounted } from 'vue'
import type { ParsedWord } from '~/types/japanese'
import type { ReaderSettings } from '~/types/reader'
import type { CSSProperties } from 'vue'
import { useWordMetadataStore } from '~/stores/useWordMetadataStore'

interface Props {
  word: ParsedWord
  settings: ReaderSettings
  disableHover: boolean
  isGrammarHighlighted?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isGrammarHighlighted: false
})

const emit = defineEmits<{
  click: [word: ParsedWord, event: MouseEvent]
}>()

const metadataStore = useWordMetadataStore()
const showTooltip = ref(false)
const tooltipRef = ref<HTMLElement | null>(null)
const wrapperRef = ref<HTMLElement | null>(null)
const localWord = ref<ParsedWord>({ ...props.word })
const arrowPosition = ref<'top' | 'bottom'>('top')
const tooltipPosition = ref<CSSProperties>({})
const isMobile = ref(false)
let tooltipTimeout: ReturnType<typeof setTimeout> | null = null
let keepTooltip = false

const enrichedMeaning = computed(() => {
  const kanji = localWord.value?.kanji ?? ''
  return kanji ? metadataStore.getWord(kanji) : null
})

const displayMeaning = computed(() => {
  return enrichedMeaning.value?.meaning || localWord.value?.meaning || ''
})

const pos = computed(() => enrichedMeaning.value?.pos || localWord.value?.pos)

const isParticle = computed(() => pos.value === 'particle')

const showTooltipExtras = computed(() =>
  (props.settings?.showPitchAccent && (enrichedMeaning.value?.pitchAccent || localWord.value.pitchAccent)) ||
  (props.settings?.showExample && (enrichedMeaning.value?.example || localWord.value.example))
)

const highlightClass = computed(() => {
  if (isGrammarHighlighted.value && props.settings?.highlightGrammar) {
    return 'text-success'
  }
  if (pos.value === 'particle' && props.settings?.highlightParticles) {
    return 'text-warning'
  }
  if (pos.value === 'verb' && props.settings?.highlightVerbs) {
    return 'text-info'
  }
  if (pos.value === 'adjective' && props.settings?.highlightAdjectives) {
    return 'text-accent'
  }
  if (pos.value === 'noun' && props.settings?.highlightNouns) {
    return 'text-primary'
  }
  return 'text-inherit'
})

const opacityAndDecorationStyle = computed((): CSSProperties => {
  const style: CSSProperties = {}

  if (props.settings?.highlightKnownWords && localWord.value.isKnown) {
    if (props.settings?.dimKnownWords) {
      style.opacity = 0.6
    } else {
      style.opacity = (props.settings?.knownWordOpacity ?? 100) / 100
    }
  } else {
    style.opacity = 1
  }

  if (props.settings?.strikethroughKnown && localWord.value.isKnown) {
    style.textDecoration = 'line-through'
    style.textDecorationColor = 'currentColor'
  } else if (props.settings?.underlineUnknown && !localWord.value.isKnown) {
    style.textDecoration = 'underline dashed'
    style.textDecorationColor = 'currentColor'
    style.textUnderlineOffset = '4px'
  }

  return style
})

const arrowStyle = computed((): CSSProperties => {
  const baseStyle: CSSProperties = { zIndex: -1 }

  if (arrowPosition.value === 'bottom') {
    return {
      ...baseStyle,
      top: '-6px',
      left: '50%',
      marginLeft: '-6px'
    }
  }
  return {
    ...baseStyle,
    bottom: '-6px',
    left: '50%',
    marginLeft: '-6px'
  }
})

const surfaceClampStyle = computed((): CSSProperties => ({
  maxWidth: '24ch',
  display: 'inline-block',
  verticalAlign: 'baseline',
  lineHeight: '1.06',
  wordBreak: 'keep-all',
  overflow: 'hidden'
}))

const wordContainerStyle = computed((): CSSProperties => {
  if (props.settings?.alwaysShowTranslation) {
    const size = Math.max(8, Math.min(14, props.settings?.translationSize ?? 10))
    const gap = Math.max(2, Math.min(8, props.settings?.translationGap ?? 4))
    return { paddingTop: `${size + gap}px` }
  }
  return {}
})

const translationStyle = computed((): CSSProperties => {
  const size = Math.max(8, Math.min(14, props.settings?.translationSize ?? 10))
  const gap = Math.max(2, Math.min(8, props.settings?.translationGap ?? 4))
  return {
    fontSize: `${size}px`,
    marginBottom: `${gap}px`,
    lineHeight: '1'
  }
})

const furiganaStyle = computed((): CSSProperties => {
  const em = Math.max(0.35, Math.min(0.6, props.settings?.furiganaSize ?? 0.45))
  return {
    fontSize: `${em}em`
  }
})

const tooltipTextSize = computed(() => {
  if (props.settings?.tooltipSize === 'sm') return 'text-xs'
  if (props.settings?.tooltipSize === 'lg') return 'text-base'
  return 'text-sm'
})

const isGrammarHighlighted = computed(() => props.isGrammarHighlighted)

const truncateMeaning = (meaning: string): string => {
  if (!meaning) return ''

  const parentText = localWord.value.kanji || localWord.value.kana || ''
  const maxLength = parentText.length * 10

  const cleaned = meaning.split(/[.,;]/).map(s => s.trim()).filter(Boolean)
  let firstMeaning = ''

  if (cleaned.length > 0) {
    firstMeaning = cleaned[0] ?? ''
  }

  if (firstMeaning.length > maxLength) {
    return firstMeaning.substring(0, maxLength) + '...'
  }
  return firstMeaning
}

const positionTooltip = () => {
  nextTick(() => {
    if (!wrapperRef.value || !tooltipRef.value) return

    const wordRect = wrapperRef.value.getBoundingClientRect()
    const tooltipRect = tooltipRef.value.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth

    const spaceAbove = wordRect.top
    const spaceBelow = viewportHeight - wordRect.bottom

    let top = 0
    if (spaceBelow >= tooltipRect.height + 20) {
      arrowPosition.value = 'top'
      top = wordRect.bottom + 12
    } else if (spaceAbove >= tooltipRect.height + 20) {
      arrowPosition.value = 'bottom'
      top = wordRect.top - tooltipRect.height - 12
    } else {
      arrowPosition.value = 'bottom'
      top = Math.max(10, wordRect.top - tooltipRect.height - 12)
    }

    let left = wordRect.left + wordRect.width / 2

    if (left + tooltipRect.width / 2 > viewportWidth - 10) {
      left = viewportWidth - tooltipRect.width / 2 - 10
    }
    if (left - tooltipRect.width / 2 < 10) {
      left = tooltipRect.width / 2 + 10
    }

    tooltipPosition.value = {
      top: `${top}px`,
      left: `${left}px`,
      transform: 'translateX(-50%)'
    }
  })
}

const handleClick = (event: MouseEvent) => {
  emit('click', localWord.value, event)
}

const handleMouseEnter = () => {
  if (props.disableHover) return
  
  if (tooltipTimeout) {
    clearTimeout(tooltipTimeout)
  }

  tooltipTimeout = setTimeout(() => {
    if (!keepTooltip && !props.disableHover) {
      showTooltip.value = true
      positionTooltip()
      enrichWordData()
    }
  }, props.settings?.tooltipDelay || 300)
}

const handleMouseLeave = () => {
  if (tooltipTimeout) {
    clearTimeout(tooltipTimeout)
    tooltipTimeout = null
  }

  if (!keepTooltip) {
    showTooltip.value = false
  }
}

const onTooltipMouseEnter = () => {
  keepTooltip = true
}

const onTooltipMouseLeave = () => {
  keepTooltip = false
  showTooltip.value = false
}

const enrichWordData = async () => {
  const kanji = localWord.value?.kanji ?? ''
  if (!kanji || metadataStore.hasWord(kanji)) return

  try {
    const { getApiKey } = useOpenAI()
    const apiKey = getApiKey()
    if (!apiKey) return

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
      metadataStore.setWord(kanji, metadata)
    }
  } catch (error) {
    console.error('Failed to enrich word data:', error)
  }
}

watch(() => props.word, (newWord) => {
  localWord.value = { ...newWord }
}, { deep: true })

watch(() => props.disableHover, (disabled) => {
  if (disabled) {
    if (tooltipTimeout) {
      clearTimeout(tooltipTimeout)
      tooltipTimeout = null
    }
    showTooltip.value = false
    keepTooltip = false
  }
})

onMounted(() => {
  metadataStore.loadCache()
  isMobile.value = 'ontouchstart' in window
})
</script>

<template>
  <span
    ref="wrapperRef"
    class="inline-block relative transition-all"
    :class="{ 'mx-1': settings?.alwaysShowTranslation }"
    :style="wordContainerStyle"
    @click="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <span
      v-if="settings?.alwaysShowTranslation && displayMeaning && !isParticle"
      class="block text-center text-base-content/70 whitespace-nowrap mb-1 pointer-events-none select-none leading-none"
      :style="translationStyle"
    >
      {{ truncateMeaning(displayMeaning) }}
    </span>

    <span
      class="inline-block relative transition-colors duration-150"
      :class="{ 'rounded-md': !isParticle && word?.kanji && !disableHover }"
    >
      <ruby class="[ruby-align:center]">
        <span
          class="transition-colors duration-150 px-0.5 rounded-sm"
          :class="highlightClass"
          :style="[surfaceClampStyle, opacityAndDecorationStyle]"
        >
          <span class="align-middle leading-none">
            {{ word?.kanji }}
          </span>
        </span>
        <rt
          v-if="!isParticle && settings?.showFurigana && word?.kana !== word?.kanji"
          class="select-none transition-opacity duration-150 opacity-70"
          :style="furiganaStyle"
        >
          {{ word?.kana }}
        </rt>
      </ruby>

      <teleport v-if="showTooltip && settings?.showTooltip && !isParticle && !isMobile" to="body">
        <div
          ref="tooltipRef"
          class="fixed z-[100] pointer-events-auto animate-in fade-in duration-100"
          :style="tooltipPosition"
        >
          <div
            class="absolute w-3 h-3 bg-base-100 transform rotate-45 border-l border-t border-base-300"
            :style="arrowStyle"
          ></div>

          <div
            class="rounded-2xl shadow-2xl border-2 bg-base-100 border-base-300 overflow-hidden"
            :class="tooltipTextSize"
            style="max-width:min(88vw,28rem)"
            @mouseenter="onTooltipMouseEnter"
            @mouseleave="onTooltipMouseLeave"
          >
            <div class="h-1.5 bg-primary"></div>

            <div class="p-4 sm:p-5">
              <div class="flex items-start justify-between gap-3 mb-3">
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2.5 mb-1">
                    <div class="font-bold text-base-content text-xl sm:text-2xl leading-tight">
                      {{ localWord.kanji }}
                    </div>
                    <div
                      v-if="enrichedMeaning?.jlptLevel"
                      class="px-2 py-0.5 rounded-md text-xs font-semibold shrink-0 badge badge-primary"
                    >
                      {{ enrichedMeaning.jlptLevel }}
                    </div>
                  </div>
                  <div v-if="enrichedMeaning?.reading || localWord.reading" class="text-base sm:text-lg text-base-content/70 font-medium">
                    {{ enrichedMeaning?.reading || localWord.reading }}
                  </div>
                </div>

                <div
                  v-if="(settings?.showPartOfSpeech && (enrichedMeaning?.pos || localWord.pos)) || localWord.isKnown !== undefined"
                  class="flex flex-col gap-2 items-end shrink-0"
                >
                  <span
                    v-if="settings?.showPartOfSpeech && (enrichedMeaning?.pos || localWord.pos)"
                    class="badge badge-neutral badge-sm font-semibold"
                  >
                    {{ enrichedMeaning?.pos || localWord.pos }}
                  </span>
                  <span
                    v-if="localWord.isKnown !== undefined"
                    class="badge badge-sm font-semibold"
                    :class="localWord.isKnown
                      ? 'badge-success badge-outline'
                      : 'badge-warning badge-outline'"
                  >
                    {{ localWord.isKnown ? 'Known' : 'Learning' }}
                  </span>
                </div>
              </div>

              <div class="divider my-2"></div>

              <div class="mb-3">
                <p class="text-sm sm:text-base text-base-content/80 leading-relaxed line-clamp-4">
                  {{ displayMeaning || 'No meaning available' }}
                </p>
              </div>

              <div
                v-if="showTooltipExtras"
                class="space-y-2.5 pt-2 border-t border-base-300"
              >
                <div v-if="settings?.showPitchAccent && (enrichedMeaning?.pitchAccent || localWord.pitchAccent)" class="flex items-center gap-2">
                  <span class="text-xs font-semibold text-base-content/60 uppercase tracking-wider">Pitch:</span>
                  <span class="text-sm font-medium text-base-content">{{ enrichedMeaning?.pitchAccent || localWord.pitchAccent }}</span>
                </div>
                <div v-if="settings?.showExample && (enrichedMeaning?.example || localWord.example)" class="alert alert-info py-2 px-3">
                  <p class="text-sm leading-relaxed italic">
                    "{{ enrichedMeaning?.example || localWord.example }}"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </teleport>
    </span>
  </span>
</template>