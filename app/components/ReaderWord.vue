<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import type { ParsedWord } from '~/types/japanese'
import type { ReaderSettings } from '~/types/reader'
import type { CSSProperties } from 'vue'
import { useWordMetadataStore } from '~/stores/useWordMetadataStore'
import WordToolTip from './WordToolTip.vue'

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
const wrapperRef = ref<HTMLElement | null>(null)
const localWord = ref<ParsedWord>({ ...props.word })
const isMobile = ref(false)
const isLoadingMetadata = ref(false)
let tooltipTimeout: ReturnType<typeof setTimeout> | null = null
let keepTooltip = false

const enrichedMeaning = computed(() => {
  const kanji = localWord.value?.kanji ?? ''
  return kanji ? metadataStore.getWord(kanji) : null
})

const enrichedWord = computed((): ParsedWord => {
  const enriched = enrichedMeaning.value
  if (!enriched) return localWord.value

  return {
    ...localWord.value,
    meaning: enriched.meaning || localWord.value.meaning,
    pos: enriched.pos || localWord.value.pos,
    pitchAccent: enriched.pitchAccent || localWord.value.pitchAccent,
    example: enriched.example || localWord.value.example,
    jlptLevel: enriched.jlptLevel || localWord.value.jlptLevel
  }
})

const displayMeaning = computed(() => {
  return enrichedMeaning.value?.meaning || localWord.value?.meaning || ''
})

const pos = computed(() => enrichedMeaning.value?.pos || localWord.value?.pos)

const isParticle = computed(() => pos.value === 'particle')
const isPunctuation = computed(() => pos.value === 'punctuation')

const showTooltipExtras = computed(() => {
  const hasPitchAccent = props.settings?.showPitchAccent && (enrichedMeaning.value?.pitchAccent || localWord.value.pitchAccent)
  const hasExample = props.settings?.showExample && (enrichedMeaning.value?.example || localWord.value.example)
  return !!(hasPitchAccent || hasExample)
})

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


const handleClick = (event: MouseEvent) => {
  emit('click', localWord.value, event)
}

const isHovered = ref(false)

const handleMouseEnter = () => {
  if (props.disableHover || isMobile.value) return

  isHovered.value = true

  if (tooltipTimeout) {
    clearTimeout(tooltipTimeout)
  }

  // Show tooltip immediately with existing data
  showTooltip.value = true
  
  // Fetch enhanced metadata in background (non-blocking)
  enrichWordData()
}

const handleMouseLeave = () => {
  isHovered.value = false
  
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

  isLoadingMetadata.value = true
  try {
    const { getApiKey } = useOpenAI()
    const apiKey = getApiKey()
    if (!apiKey) {
      isLoadingMetadata.value = false
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
      metadataStore.setWord(kanji, metadata)
    }
  } catch (error) {
    console.error('Failed to enrich word data:', error)
  } finally {
    isLoadingMetadata.value = false
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
      v-if="settings?.alwaysShowTranslation && displayMeaning && !isParticle && !isPunctuation"
      class="block text-center text-base-content/70 whitespace-nowrap mb-1 pointer-events-none select-none leading-none user-select-none"
      :style="translationStyle"
      aria-hidden="true"
    >
      {{ truncateMeaning(displayMeaning) }}
    </span>

    <span
      class="inline-block relative transition-colors duration-150"
      :class="{ 
        'rounded-md': !isParticle && !isPunctuation && word?.kanji && !disableHover,
        'bg-primary/15': isHovered && !isParticle && !isPunctuation && !disableHover
      }"
    >
      <ruby class="[ruby-align:center]">
        <span
          class="transition-colors duration-150 px-0.5 rounded-sm"
          :class="[highlightClass, { 'bg-primary/10': isHovered && !isParticle && !isPunctuation && !disableHover }]"
          :style="[surfaceClampStyle, opacityAndDecorationStyle]"
        >
          <span class="align-middle leading-none">
            {{ word?.kanji }}
          </span>
        </span>
        <rt
          v-if="!isParticle && !isPunctuation&& settings?.showFurigana && word?.kana !== word?.kanji"
          class="select-none transition-opacity duration-150 opacity-70 user-select-none"
          :style="furiganaStyle"
          aria-hidden="true"
        >
          {{ word?.kana }}
        </rt>
      </ruby>

      <WordToolTip
        v-if="settings?.showTooltip && !isParticle && !isPunctuation"
        :visible="showTooltip"
        :word="enrichedWord"
        :anchor-element="wrapperRef"
        :loading="isLoadingMetadata"
        :show-extras="showTooltipExtras"
        @mouse-enter="onTooltipMouseEnter"
        @mouse-leave="onTooltipMouseLeave"
      />
    </span>
  </span>
</template>

<style scoped>
.user-select-none {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

/* Ensure furigana (rt) is not selectable */
rt {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}
</style>