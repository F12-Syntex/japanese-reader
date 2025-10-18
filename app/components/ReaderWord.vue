<template>
  <span
    ref="wrapperRef"
    class="inline-block relative transition-all"
    :class="{
      'mr-0': !settings?.showWordSpacing,
      'mx-1': settings?.alwaysShowTranslation
    }"
    :style="wordContainerStyle"
    @click="handleClick"
    @mouseenter="!disableHover && handleMouseEnter()"
    @mouseleave="onWrapperMouseLeave"
  >
    <!-- Inline mini-translation -->
    <span
      v-if="settings?.alwaysShowTranslation && word?.meaning"
      class="block text-center opacity-70 whitespace-nowrap mb-1 pointer-events-none select-none leading-none"
      :style="translationStyle"
    >
      {{ truncateMeaning(word.meaning) }}
    </span>

    <!-- Word surface + ruby -->
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
          :style="[wordColorStyle, surfaceClampStyle]"
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

      <!-- Tooltip (theme-adaptive) -->
      <div
        v-if="settings?.showTooltip && showTooltip && !isParticle"
        ref="tooltipRef"
        class="fixed z-[100] pointer-events-auto"
        @mouseenter="onTooltipMouseEnter"
        @mouseleave="onTooltipMouseLeave"
      >
        <!-- Arrow pointer -->
        <div 
          class="absolute w-3 h-3 bg-base-100 transform rotate-45 border-l border-t border-base-300"
          :style="arrowStyle"
        ></div>
        
        <div
          class="rounded-2xl shadow-2xl border-2 bg-base-100 border-base-300 overflow-hidden"
          :class="tooltipTextSize"
          style="max-width:min(88vw,28rem)"
        >
          <!-- Colored top accent bar -->
          <div 
            class="h-1.5"
            :style="{ backgroundColor: accentColor }"
          ></div>
          
          <div class="p-4 sm:p-5">
            <!-- Header row -->
            <div class="flex items-start justify-between gap-3 mb-3">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2.5 mb-1">
                  <div class="font-bold text-base-content text-xl sm:text-2xl leading-tight">
                    {{ localWord.kanji || localWord.text }}
                  </div>
                  <div 
                    v-if="localWord.jlptLevel" 
                    class="px-2 py-0.5 rounded-md text-xs font-semibold shrink-0"
                    :style="{ backgroundColor: accentColor + '20', color: accentColor }"
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
                  {{ localWord.isKnown ? '✓ Known' : '📚 Learning' }}
                </span>
              </div>
            </div>

            <!-- Divider -->
            <div class="divider my-2"></div>

            <!-- Meaning -->
            <div class="mb-3">
              <p class="text-sm sm:text-base text-base-content/80 leading-relaxed line-clamp-4">
                {{ localWord.meaning || 'No meaning available' }}
              </p>
            </div>

            <!-- Pitch + Example -->
            <div
              v-if="localWord.pitchAccent || localWord.example"
              class="space-y-2.5 pt-2 border-t border-base-300"
            >
              <div v-if="localWord.pitchAccent" class="flex items-center gap-2">
                <span class="text-xs font-semibold text-base-content/60 uppercase tracking-wider">Pitch:</span>
                <span class="text-sm font-medium text-base-content">{{ localWord.pitchAccent }}</span>
              </div>
              <div v-if="localWord.example" class="alert alert-info py-2 px-3">
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

<script setup>
import { nextTick } from 'vue'
import { useOpenAI } from '~/composables/useOpenAI'
import { useAnki } from '~/composables/useAnki'

const props = defineProps({
  word: { type: Object, required: true },
  settings: { type: Object, required: true },
  disableHover: { type: Boolean, default: false }
})
const emit = defineEmits(['click'])

const showTooltip = ref(false)
const tooltipRef = ref(null)
const wrapperRef = ref(null)
const isFetching = ref(false)
const saving = ref(false)
const localWord = ref({ ...props.word })
const arrowPosition = ref('top')
let keepTooltip = false

// Distinct role colors (not just tints). HSL chosen to be perceptually distinct.
const ROLE_COLORS = {
  particle: 'hsl(12, 78%, 45%)',    // red-orange
  verb: 'hsl(212, 78%, 45%)',       // strong blue
  adjective: 'hsl(276, 65%, 50%)'   // violet
}

const isParticle = computed(() => localWord.value?.pos === 'particle')
const isVerb = computed(() => localWord.value?.pos === 'verb')
const isAdjective = computed(() => localWord.value?.pos === 'adjective')

const accentColor = computed(() => {
  if (isParticle.value) return ROLE_COLORS.particle
  if (isVerb.value) return ROLE_COLORS.verb
  if (isAdjective.value) return ROLE_COLORS.adjective
  return 'hsl(220, 70%, 50%)' // default blue
})

const arrowStyle = computed(() => {
  const baseStyle = {
    zIndex: -1
  }
  
  if (arrowPosition.value === 'bottom') {
    return {
      ...baseStyle,
      top: '-6px',
      left: '50%',
      marginLeft: '-6px'
    }
  } else {
    return {
      ...baseStyle,
      bottom: '-6px',
      left: '50%',
      marginLeft: '-6px'
    }
  }
})

const surfaceClasses = computed(() => {
  return {
    'underline decoration-dashed decoration-1 underline-offset-4':
      props.settings?.underlineUnknown && !localWord.value?.isKnown,
    'ring-1 ring-offset-0':
      props.settings?.highlightKnownWords && localWord.value?.isKnown,
    'opacity-70': props.settings?.dimKnownWords && localWord.value?.isKnown,
    'line-through': props.settings?.strikethroughKnown && localWord.value?.isKnown,
  }
})

const wordColorStyle = computed(() => {
  const style = {}
  if (props.settings?.highlightParticles && isParticle.value) {
    style.color = ROLE_COLORS.particle
  } else if (props.settings?.highlightVerbs && isVerb.value) {
    style.color = ROLE_COLORS.verb
  } else if (props.settings?.highlightAdjectives && isAdjective.value) {
    style.color = ROLE_COLORS.adjective
  } else {
    style.color = 'inherit'
  }

  // Known highlight uses a distinct outline rather than a tint
  if (props.settings?.highlightKnownWords && localWord.value?.isKnown) {
    style.boxShadow = 'inset 0 0 0 9999px rgba(0,0,0,0)' // no fill
    style.borderColor = 'hsl(210, 10%, 60%)'
  }
  return style
})

// Clamp surface width/flow to prevent blowouts
const surfaceClampStyle = computed(() => {
  return {
    maxWidth: '24ch',
    display: 'inline-block',
    verticalAlign: 'baseline',
    lineHeight: 1.06,
    wordBreak: 'keep-all',
    overflowWrap: 'anywhere'
  }
})

const wordContainerStyle = computed(() => {
  if (props.settings?.alwaysShowTranslation) {
    const size = clampNumber(props.settings?.translationSize, 8, 14) // px
    const gap = clampNumber(props.settings?.translationGap, 2, 8)
    return { paddingTop: `${size + gap}px` }
  }
  return {}
})

const translationStyle = computed(() => {
  const size = clampNumber(props.settings?.translationSize, 8, 14)
  const gap = clampNumber(props.settings?.translationGap, 2, 8)
  return {
    fontSize: `${size}px`,
    marginBottom: `${gap}px`,
    lineHeight: 1,
    color: 'hsl(220, 10%, 56%)'
  }
})

const furiganaStyle = computed(() => {
  const em = clampNumber(props.settings?.furiganaSize, 0.35, 0.6) || 0.45
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

const truncateMeaning = (meaning) => {
  if (!meaning) return ''
  const cleaned = meaning.split(/[.,;]/).map(s => s.trim()).filter(Boolean)
  if (cleaned.length === 0) {
    const words = meaning.trim().split(/\s+/)
    const firstWord = words[0] || ''
    return firstWord.length > 14 ? firstWord.substring(0, 14) + '…' : firstWord
  }
  const firstMeaning = cleaned[0]
  return firstMeaning.length > 22 ? firstMeaning.substring(0, 22) + '…' : firstMeaning
}

const handleClick = (e) => {
  if (!props.disableHover) emit('click', localWord.value, e)
}

const { getApiKey } = useOpenAI()
const { getWordData } = useAnki()

const readLocalCache = (key) => {
  try {
    const cache1 = JSON.parse(localStorage.getItem('wordInfoCache') || '{}')
    if (cache1 && cache1[key]) return cache1[key]
  } catch {}
  try {
    const cache2 = JSON.parse(localStorage.getItem('dictionary') || '{}')
    if (cache2 && cache2[key]) return cache2[key]
  } catch {}
  return null
}

const saveToCaches = (key, info) => {
  try {
    const cacheKey = 'wordInfoCache'
    const cache = JSON.parse(localStorage.getItem(cacheKey) || '{}')
    cache[key] = info
    localStorage.setItem(cacheKey, JSON.stringify(cache))
  } catch {}
  try {
    const dict = JSON.parse(localStorage.getItem('dictionary') || '{}')
    dict[key] = info
    localStorage.setItem('dictionary', JSON.stringify(dict))
  } catch {}
}

const fetchBatchInfo = async (words) => {
  const apiKey = getApiKey()
  if (!apiKey) return null
  try {
    const res = await $fetch('/api/word-batch', {
      method: 'POST',
      body: { apiKey, words }
    })
    return res?.success ? res.data : null
  } catch {
    return null
  }
}

const handleMouseEnter = async () => {
  const key = props.word.kanji || props.word.text || props.word.surface || ''
  const ankiData = getWordData(key)
  if (ankiData) localWord.value = { ...localWord.value, ...ankiData }

  const localInfo = readLocalCache(key)
  if (localInfo) localWord.value = { ...localWord.value, ...localInfo }

  showTooltip.value = true
  await nextTick()
  updateTooltipPosition()
  window.addEventListener('resize', updateTooltipPosition)
  window.addEventListener('scroll', updateTooltipPosition, true)

  if (!localWord.value.meaning) {
    isFetching.value = true
    try {
      const batch = await fetchBatchInfo([key])
      const info = batch && batch[key] ? batch[key] : null
      if (info) {
        const normalized = {
          kanji: info.kanji || key,
          reading: info.reading || localWord.value.kana || '',
          meaning: info.meaning || '',
          pos: info.pos || localWord.value.pos || '',
          example: info.example || '',
          jlptLevel: info.jlptLevel || '',
          pitchAccent: info.pitchAccent || '',
          isKnown: localWord.value.isKnown ?? false
        }
        localWord.value = { ...localWord.value, ...normalized }
        saveToCaches(key, normalized)
      }
    } finally {
      isFetching.value = false
    }
  }
}

const onWrapperMouseLeave = () => {
  if (!keepTooltip) {
    showTooltip.value = false
    window.removeEventListener('resize', updateTooltipPosition)
    window.removeEventListener('scroll', updateTooltipPosition, true)
  }
}

const onTooltipMouseEnter = () => { keepTooltip = true }
const onTooltipMouseLeave = () => {
  keepTooltip = false
  showTooltip.value = false
  window.removeEventListener('resize', updateTooltipPosition)
  window.removeEventListener('scroll', updateTooltipPosition, true)
}

const updateTooltipPosition = () => {
  if (!tooltipRef.value || !wrapperRef.value) return
  const anchorRect = wrapperRef.value.getBoundingClientRect()
  const tooltipRect = tooltipRef.value.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight
  const margin = 12
  const arrowSize = 6
  
  let top = anchorRect.top - tooltipRect.height - arrowSize - 8
  let left = anchorRect.left + (anchorRect.width / 2) - (tooltipRect.width / 2)
  
  // Check if tooltip fits above
  if (top < margin) {
    // Place below instead
    top = anchorRect.bottom + arrowSize + 8
    arrowPosition.value = 'bottom'
  } else {
    arrowPosition.value = 'top'
  }
  
  // Horizontal positioning
  if (left < margin) left = margin
  if (left + tooltipRect.width > vw - margin) left = vw - tooltipRect.width - margin
  
  // Final vertical check
  if (top + tooltipRect.height > vh - margin) top = vh - tooltipRect.height - margin
  
  tooltipRef.value.style.top = `${Math.max(margin, top)}px`
  tooltipRef.value.style.left = `${Math.max(margin, left)}px`
  tooltipRef.value.style.transform = 'none'
}

watch(() => props.word, (n) => { localWord.value = { ...n } })

function clampNumber(val, min, max) {
  const num = typeof val === 'number' ? val : Number(val)
  if (Number.isFinite(num)) return Math.min(max, Math.max(min, num))
  return (min + max) / 2
}
</script>

<style scoped>
/* Clamp long text in tooltip for consistency */
.line-clamp-4 {
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>