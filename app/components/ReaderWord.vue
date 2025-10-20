<template>
  <span
    ref="wrapperRef"
    class="inline-block relative transition-all"
    :class="{
      'mr-0': !settings?.showWordSpacing,
      'mx-1': settings?.alwaysShowTranslation,
      'text-center justify-center': settings?.alwaysShowTranslation  // Reinforce centering for longer translations
    }"
    :style="wordContainerStyle"
    @click="handleClick"
    @mouseenter="!disableHover && handleMouseEnter()"
    @mouseleave="onWrapperMouseLeave"
  >
    <span
      v-if="settings?.alwaysShowTranslation && word?.meaning && !isParticle"
      class="block text-center opacity-70 whitespace-nowrap mb-1 pointer-events-none select-none leading-none"
      :style="translationStyle"
    >
      {{ truncateMeaning(word.meaning) }}
    </span>

    <span
      class="inline-block relative group transition-colors duration-150"
      :class="{
        'rounded-md': !isParticle && word?.kanji && !disableHover
      }"
    >
      <ruby class="[ruby-align:center]">
        <span
          class="transition-colors duration-150 px-0.5 rounded-sm"
          :class="surfaceClasses"
          :style="mergedSurfaceStyle"
        >
          <span class="align-middle leading-none">
            {{ word?.kanji }}
          </span>
        </span>
        <rt
          v-if="!isParticle && settings?.showFurigana && word?.kana !== word?.kanji"
          class="select-none transition-opacity duration-150 opacity-95"
          :style="furiganaStyle"
        >
          {{ word?.kana }}
        </rt>
      </ruby>

      <div
        v-if="settings?.showTooltip && showTooltip && !isParticle"
        ref="tooltipRef"
        class="fixed z-[100] pointer-events-auto"
        @mouseenter="onTooltipMouseEnter"
        @mouseleave="onTooltipMouseLeave"
      >
        <div 
          class="absolute w-3 h-3 bg-base-100 transform rotate-45 border-l border-t border-base-300"
          :style="arrowStyle"
        ></div>
        
        <div
          class="rounded-2xl shadow-2xl border-2 bg-base-100 border-base-300 overflow-hidden"
          :class="tooltipTextSize"
          style="max-width:min(88vw,28rem)"
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
                    v-if="localWord.jlptLevel" 
                    class="px-2 py-0.5 rounded-md text-xs font-semibold shrink-0 badge badge-primary"
                  >
                    {{ localWord.jlptLevel }}
                  </div>
                </div>
                <div v-if="localWord.reading" class="text-base sm:text-lg text-base-content/70 font-medium">
                  {{ localWord.reading }}
                </div>
              </div>

              <div
                v-if="(settings?.showPartOfSpeech && localWord.pos) || localWord.isKnown !== undefined"
                class="flex flex-col gap-2 items-end shrink-0"
              >
                <span
                  v-if="settings?.showPartOfSpeech && localWord.pos"
                  class="badge badge-neutral badge-sm font-semibold"
                >
                  {{ localWord.pos }}
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
                {{ localWord.meaning || 'No meaning available' }}
              </p>
            </div>

            <div
              v-if="showTooltipExtras"
              class="space-y-2.5 pt-2 border-t border-base-300"
            >
              <div v-if="settings?.showPitchAccent && localWord.pitchAccent" class="flex items-center gap-2">
                <span class="text-xs font-semibold text-base-content/60 uppercase tracking-wider">Pitch:</span>
                <span class="text-sm font-medium text-base-content">{{ localWord.pitchAccent }}</span>
              </div>
              <div v-if="settings?.showExample && localWord.example" class="alert alert-info py-2 px-3">
                <p class="text-sm leading-relaxed italic">
                  "{{ localWord.example }}"
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </span>
  </span>
</template>

<script setup lang="ts">
import { nextTick, computed, ref, watch } from 'vue'
import type { ParsedWord } from '~/types/japanese'
import type { ReaderSettings } from '~/types/reader'
import type { CSSProperties } from 'vue'

interface Props {
  word: ParsedWord
  settings: ReaderSettings
  disableHover: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  click: [word: ParsedWord, event: MouseEvent]
}>()

const showTooltip = ref(false)
const tooltipRef = ref<HTMLElement | null>(null)
const wrapperRef = ref<HTMLElement | null>(null)
const localWord = ref<ParsedWord>({ ...props.word })
const arrowPosition = ref<'top' | 'bottom'>('top')
let keepTooltip = false

const isParticle = computed(() => localWord.value?.pos === 'particle')

const showTooltipExtras = computed(() => 
  (props.settings?.showPitchAccent && localWord.value.pitchAccent) ||
  (props.settings?.showExample && localWord.value.example)
)

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

const surfaceClasses = computed(() => ({
  'underline decoration-dashed decoration-1 underline-offset-4':
    props.settings?.underlineUnknown && !localWord.value?.isKnown,
  'ring-1 ring-offset-0':
    props.settings?.highlightKnownWords && localWord.value?.isKnown,
  'opacity-70': props.settings?.dimKnownWords && localWord.value?.isKnown,
  'line-through': props.settings?.strikethroughKnown && localWord.value?.isKnown,
}))

const wordColorStyle = computed((): CSSProperties => {
  const style: CSSProperties = {}

  if (props.settings?.highlightParticles && isParticle.value) {
    style.color = 'hsl(12, 78%, 45%)'
  } else if (props.settings?.highlightVerbs && localWord.value?.pos === 'verb') {
    style.color = 'hsl(212, 78%, 45%)'
  } else if (props.settings?.highlightAdjectives && localWord.value?.pos === 'adjective') {
    style.color = 'hsl(276, 65%, 50%)'
  } else if (props.settings?.highlightNouns && localWord.value?.pos === 'noun') {
    style.color = 'hsl(48, 85%, 45%)'
  }

  if (props.settings?.highlightKnownWords && localWord.value?.isKnown) {
    style.boxShadow = 'inset 0 0 0 9999px rgba(0,0,0,0)'
    style.borderColor = 'hsl(210, 10%, 60%)'
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

const mergedSurfaceStyle = computed((): CSSProperties => ({
  ...surfaceClampStyle.value,
  ...wordColorStyle.value
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
    lineHeight: '1',
    color: 'hsl(220, 10%, 56%)'
  }
})

const furiganaStyle = computed((): CSSProperties => {
  const em = Math.max(0.35, Math.min(0.6, props.settings?.furiganaSize ?? 0.45))
  return {
    fontSize: `${em}em`,
    color: 'hsl(220, 10%, 56%)'
  }
})

const tooltipTextSize = computed(() => {
  if (props.settings?.tooltipSize === 'sm') return 'text-xs'
  if (props.settings?.tooltipSize === 'lg') return 'text-base'
  return 'text-sm'
})

const truncateMeaning = (meaning: string): string => {
  if (!meaning) return ''
  
  // Calculate dynamic max length based on parent text (double the size)
  const parentText = localWord.value.kanji || localWord.value.kana || ''
  const maxLength = parentText.length * 10
  
  // Clean and split by sentence punctuation
  const cleaned = meaning.split(/[.,;]/).map(s => s.trim()).filter(Boolean)
  let firstMeaning = ''
  
  if (cleaned.length > 0) {
    // ensure a string is assigned even if TypeScript can't infer the index is defined
    firstMeaning = cleaned[0] ?? ''
  } else {
    // Fallback to first word if no sentence-like parts
    const words = meaning.trim().split(/\s+/)
    firstMeaning = words[0] || ''
  }
  
  // Truncate to maxLength if needed, add ellipsis
  if (firstMeaning.length > maxLength) {
    firstMeaning = firstMeaning.substring(0, maxLength) + '…'
  }
  
  return firstMeaning
}

const handleClick = (e: MouseEvent) => {
  if (!props.disableHover) {
    emit('click', localWord.value, e)
  }
}

const handleMouseEnter = async () => {
  const delay = Math.max(0, Math.min(500, props.settings?.tooltipDelay ?? 0))
  
  await new Promise(r => setTimeout(r, delay))
  
  showTooltip.value = true
  await nextTick()
  
  if (tooltipRef.value && wrapperRef.value) {
    const tooltipRect = tooltipRef.value.getBoundingClientRect()
    
    if (tooltipRect.bottom > window.innerHeight - 50) {
      arrowPosition.value = 'bottom'
    } else {
      arrowPosition.value = 'top'
    }
  }
}

const onWrapperMouseLeave = () => {
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

watch(() => props.word, (newWord) => {
  localWord.value = { ...newWord }
}, { deep: true })
</script>