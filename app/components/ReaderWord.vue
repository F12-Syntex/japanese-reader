<template>
  <span 
    ref="wrapperRef"
    class="inline-block relative transition-all cursor-pointer"
    :class="{ 
      'mr-0': !settings?.showWordSpacing,
      'mx-1': settings?.alwaysShowTranslation
    }"
    :style="wordContainerStyle"
    @click="handleClick"
    @mouseenter="!disableHover && handleMouseEnter()"
    @mouseleave="onWrapperMouseLeave"
  >
    <span 
      v-if="settings?.alwaysShowTranslation && word?.meaning"
      class="block text-center opacity-40 whitespace-nowrap mb-1 pointer-events-none select-none text-[0.5em]"
      :style="translationStyle"
    >
      {{ truncateMeaning(word.meaning) }}
    </span>
    
    <span
      class="inline-block relative group transition-all"
      :class="{ 'hover:bg-primary/5': !isParticle && word?.kanji && !disableHover }"
    >
      <ruby class="[ruby-align:center]">
        <span 
          class="transition-colors duration-200"
          :class="{ 
            'underline decoration-dashed decoration-1 underline-offset-4': settings?.underlineUnknown && !word?.isKnown,
            'bg-success/20 rounded px-0.5': settings?.highlightKnownWords && word?.isKnown,
            'opacity-40': settings?.dimKnownWords && word?.isKnown,
            'line-through': settings?.strikethroughKnown && word?.isKnown
          }"
          :style="wordColorStyle"
        >
          {{ word?.kanji }}
        </span>
        <rt 
          v-if="!isParticle && settings?.showFurigana && word?.kana !== word?.kanji"
          class="select-none transition-opacity duration-200 opacity-100"
          :style="{ 
            fontSize: `${settings?.furiganaSize || 0.45}em`,
            color: settings?.furiganaColor || undefined
          }"
        >
          {{ word?.kana }}
        </rt>
      </ruby>
      
      <div 
        v-if="settings?.showTooltip && showTooltip && !isParticle && (localWord.meaning || isFetching)"
        ref="tooltipRef"
        class="fixed bg-base-100 text-base-content rounded-lg shadow-xl max-w-[min(80vw,28rem)] p-3 border border-base-300 z-[100] pointer-events-auto break-words"
        :class="{
          'text-xs': settings?.tooltipSize === 'sm',
          'text-sm': settings?.tooltipSize === 'md',
          'text-base': settings?.tooltipSize === 'lg'
        }"
        @mouseenter="onTooltipMouseEnter"
        @mouseleave="onTooltipMouseLeave"
      >
        <div class="flex items-start gap-3">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <div class="font-bold truncate text-lg">{{ localWord.kanji || localWord.text }}</div>
              <div v-if="localWord.jlptLevel" class="badge badge-secondary text-xs">{{ localWord.jlptLevel }}</div>
            </div>
            <div class="text-[0.92rem] opacity-90 mt-1">{{ localWord.reading }}</div>
            <div class="text-sm mt-2 opacity-80">{{ localWord.meaning || 'No meaning available' }}</div>
            <div v-if="settings?.showPartOfSpeech && localWord.pos" class="mt-2">
              <span class="badge badge-primary badge-sm">{{ localWord.pos }}</span>
              <span v-if="localWord.pitchAccent" class="ml-2 badge badge-ghost badge-sm">Pitch: {{ localWord.pitchAccent }}</span>
            </div>
            <div v-if="localWord.example" class="mt-3 italic text-sm opacity-70">“{{ localWord.example }}”</div>
          </div>

          <div class="flex flex-col gap-2 flex-shrink-0">
            <button @click="openInJisho" class="btn btn-ghost btn-xs" title="Open in Jisho">Jisho</button>
            <button @click="openInJapanDict" class="btn btn-ghost btn-xs" title="JapanDict">JD</button>
            <button @click="saveToDictionary" class="btn btn-primary btn-xs" :class="{ 'loading': saving }" title="Save">Save</button>
          </div>
        </div>
      </div>
    </span>
  </span>
</template>

<script setup>
import { nextTick } from 'vue'
import { useOpenAI } from '~/composables/useOpenAI'

const props = defineProps({
  word: {
    type: Object,
    required: true
  },
  settings: {
    type: Object,
    required: true
  },
  disableHover: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click'])

const showTooltip = ref(false)
const tooltipRef = ref(null)
const wrapperRef = ref(null)
const isFetching = ref(false)
const saving = ref(false)
const localWord = ref({ ...props.word })
let keepTooltip = false

const COLORS = {
  particle: '#F59E0B',
  verb: '#10B981',
  adjective: '#8B5CF6',
  noun: '#3B82F6'
}

const isParticle = computed(() => localWord.value?.pos === 'particle')
const isVerb = computed(() => localWord.value?.pos === 'verb')
const isAdjective = computed(() => localWord.value?.pos === 'adjective')
const isNoun = computed(() => localWord.value?.pos?.toLowerCase().includes('noun'))

const wordColorStyle = computed(() => {
  const styles = {}
  
  if (props.settings?.highlightParticles && isParticle.value) {
    styles.color = COLORS.particle
  } else if (props.settings?.highlightVerbs && isVerb.value) {
    styles.color = COLORS.verb
  } else if (props.settings?.highlightAdjectives && isAdjective.value) {
    styles.color = COLORS.adjective
  }
  
  return styles
})

const wordContainerStyle = computed(() => {
  if (props.settings?.alwaysShowTranslation) {
    return {
      paddingTop: `${(props.settings?.translationSize || 10) + (props.settings?.translationGap || 4)}px`
    }
  }
  return {}
})

const translationStyle = computed(() => ({
  fontSize: `${props.settings?.translationSize || 10}px`,
  marginBottom: `${props.settings?.translationGap || 4}px`
}))

const truncateMeaning = (meaning) => {
  if (!meaning) return ''
  
  const cleaned = meaning.split(/[.,;]/).map(s => s.trim()).filter(Boolean)
  
  if (cleaned.length === 0) {
    const words = meaning.trim().split(/\s+/)
    const firstWord = words[0]
    return firstWord.length > 12 ? firstWord.substring(0, 12) + '...' : firstWord
  }
  
  const firstMeaning = cleaned[0]
  
  if (firstMeaning.length > 12) {
    return firstMeaning.substring(0, 12) + '...'
  }
  
  return firstMeaning
}

const handleClick = (e) => {
  if (!props.disableHover) {
    emit('click', localWord.value, e)
  }
}

const { getApiKey } = useOpenAI()

const fetchWordInfo = async (wordText) => {
  const cacheKey = 'wordInfoCache'
  let cache = {}
  try {
    cache = JSON.parse(localStorage.getItem(cacheKey) || '{}')
  } catch (e) {
    cache = {}
  }
  if (cache[wordText]) {
    return cache[wordText]
  }

  const apiKey = getApiKey()
  if (!apiKey) return null

  isFetching.value = true
  try {
    const res = await $fetch('/api/word-info', {
      method: 'POST',
      body: { apiKey, word: wordText }
    })

    if (res?.success && res.data) {
      const info = res.data
      cache[wordText] = info
      localStorage.setItem(cacheKey, JSON.stringify(cache))
      localStorage.setItem('dictionary', JSON.stringify({ ...(JSON.parse(localStorage.getItem('dictionary') || '{}')), [wordText]: info }))
      return info
    }
    return null
  } catch (e) {
    return null
  } finally {
    isFetching.value = false
  }
}

const handleMouseEnter = async () => {
  const key = props.word.text || props.word.kanji
  if (!localWord.value.meaning) {
    const info = await fetchWordInfo(key)
    if (info) {
      localWord.value = { ...localWord.value, ...info }
    }
  }
  showTooltip.value = true
  await nextTick()
  updateTooltipPosition()
  window.addEventListener('resize', updateTooltipPosition)
  window.addEventListener('scroll', updateTooltipPosition, true)
}

const onWrapperMouseLeave = () => {
  if (!keepTooltip) {
    showTooltip.value = false
    window.removeEventListener('resize', updateTooltipPosition)
    window.removeEventListener('scroll', updateTooltipPosition, true)
  }
}

const onTooltipMouseEnter = () => {
  keepTooltip = true
}

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
  const margin = 10

  let top = anchorRect.top - tooltipRect.height - 8
  let left = anchorRect.left + (anchorRect.width / 2) - (tooltipRect.width / 2)

  if (top < margin) {
    top = anchorRect.bottom + 8
  }
  if (left < margin) {
    left = margin
  }
  if (left + tooltipRect.width > vw - margin) {
    left = vw - tooltipRect.width - margin
  }
  if (top + tooltipRect.height > vh - margin) {
    top = vh - tooltipRect.height - margin
  }

  tooltipRef.value.style.top = `${Math.max(margin, top)}px`
  tooltipRef.value.style.left = `${Math.max(margin, left)}px`
  tooltipRef.value.style.transform = 'none'
}

const openInJisho = () => {
  const q = encodeURIComponent(localWord.value.kanji || localWord.value.text)
  window.open(`https://jisho.org/search/${q}`, '_blank')
}

const openInJapanDict = () => {
  const q = encodeURIComponent(localWord.value.kanji || localWord.value.text)
  window.open(`https://www.japandict.com/${q}`, '_blank')
}

const saveToDictionary = async () => {
  saving.value = true
  try {
    const dictKey = 'dictionary'
    const existing = JSON.parse(localStorage.getItem(dictKey) || '{}')
    const key = localWord.value.kanji || localWord.value.text
    existing[key] = { ...(existing[key] || {}), ...localWord.value }
    localStorage.setItem(dictKey, JSON.stringify(existing))
  } finally {
    saving.value = false
  }
}

watch(() => props.word, (n) => {
  localWord.value = { ...n }
})
</script>

<style scoped>
</style>