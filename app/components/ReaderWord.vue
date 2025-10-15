<template>
  <span 
    class="inline-block relative transition-all cursor-pointer"
    :class="{ 
      'mr-0': !settings?.showWordSpacing,
      'mx-1': settings?.alwaysShowTranslation
    }"
    :style="wordContainerStyle"
    @click="handleClick"
    @mouseenter="!disableHover && (showTooltip = true)"
    @mouseleave="showTooltip = false"
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
        v-if="settings?.showTooltip && showTooltip && !isParticle && word?.meaning && !disableHover"
        class="fixed bg-neutral text-neutral-content rounded-lg shadow-xl whitespace-nowrap pointer-events-none z-[100]"
        :class="{
          'text-xs px-2 py-1': settings?.tooltipSize === 'sm',
          'text-sm px-3 py-2': settings?.tooltipSize === 'md',
          'text-base px-4 py-3': settings?.tooltipSize === 'lg'
        }"
        :style="tooltipStyle"
      >
        <div class="font-bold mb-1">{{ word?.kanji }}</div>
        <div class="opacity-90" v-if="word?.kana !== word?.kanji">{{ word?.kana }}</div>
        <div class="opacity-75 mt-1">{{ word?.meaning }}</div>
      </div>
    </span>
  </span>
</template>

<script setup>
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
const tooltipStyle = ref({})

const COLORS = {
  particle: '#F59E0B',
  verb: '#10B981',
  adjective: '#8B5CF6',
  noun: '#3B82F6'
}

const isParticle = computed(() => props.word?.pos === 'particle')
const isVerb = computed(() => props.word?.pos === 'verb')
const isAdjective = computed(() => props.word?.pos === 'adjective')
const isNoun = computed(() => props.word?.pos?.toLowerCase().includes('noun'))

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
    emit('click', props.word, e)
  }
}

const updateTooltipPosition = (event) => {
  if (!showTooltip.value) return
  
  const rect = event.target.getBoundingClientRect()
  
  let top = rect.top - 10
  let left = rect.left + (rect.width / 2)
  
  tooltipStyle.value = {
    top: `${top}px`,
    left: `${left}px`,
    transform: 'translate(-50%, -100%)'
  }
}

watch(showTooltip, (val) => {
  if (val) {
    nextTick(() => {
      window.addEventListener('mousemove', updateTooltipPosition)
    })
  } else {
    window.removeEventListener('mousemove', updateTooltipPosition)
  }
})

onUnmounted(() => {
  window.removeEventListener('mousemove', updateTooltipPosition)
})
</script>