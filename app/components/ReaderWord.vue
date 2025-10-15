// components/ReaderWord.vue
<template>
  <span 
    class="inline-block relative transition-all cursor-pointer"
    :class="{ 
      'mr-0': !settings.showWordSpacing,
      'mx-1': settings.alwaysShowTranslation
    }"
    :style="wordContainerStyle"
    @click="$emit('click')"
    @mouseenter="showTooltip = true"
    @mouseleave="showTooltip = false"
  >
    <span 
      v-if="settings.alwaysShowTranslation && word.meaning"
      class="block text-center opacity-50 whitespace-nowrap mb-1 pointer-events-none"
      :style="translationStyle"
    >
      {{ word.meaning }}
    </span>
    
    <span
      class="inline-block relative group transition-all"
      :class="[wordHighlightClass, { 'hover:bg-primary/5': !isParticle && word.meaning }]"
    >
      <ruby class="[ruby-align:center]">
        <span :class="{ 
          'underline decoration-dashed decoration-1 underline-offset-4': settings.underlineUnknown && !word.isKnown,
          'bg-success/20 rounded px-0.5': settings.highlightKnownWords && word.isKnown,
          'opacity-40': settings.dimKnownWords && word.isKnown,
          'line-through': settings.strikethroughKnown && word.isKnown
        }">
          {{ word.kanji }}
        </span>
        <rt 
          v-if="!isParticle && settings.showFurigana && word.kana !== word.kanji"
          class="select-none transition-opacity duration-200 opacity-100"
          :style="{ 
            fontSize: `${settings.furiganaSize}em`,
            color: settings.furiganaColor || undefined
          }"
        >
          {{ word.kana }}
        </rt>
      </ruby>
      
      <div 
        v-if="settings.showTooltip && showTooltip && !isParticle && word.meaning"
        class="fixed bg-neutral text-neutral-content rounded-lg shadow-xl whitespace-nowrap pointer-events-none z-[100]"
        :class="{
          'text-xs px-2 py-1': settings.tooltipSize === 'sm',
          'text-sm px-3 py-2': settings.tooltipSize === 'md',
          'text-base px-4 py-3': settings.tooltipSize === 'lg'
        }"
        :style="tooltipStyle"
      >
        <div class="font-bold mb-1">{{ word.kanji }}</div>
        <div class="opacity-90" v-if="word.kana !== word.kanji">{{ word.kana }}</div>
        <div class="opacity-75 mt-1">{{ word.meaning }}</div>
      </div>
      
      <span 
        v-if="settings.highlightParticles && isParticle"
        class="absolute inset-0 bg-warning/20 rounded pointer-events-none"
      ></span>
      <span 
        v-if="settings.highlightVerbs && isVerb"
        class="absolute inset-0 bg-success/20 rounded pointer-events-none"
      ></span>
      <span 
        v-if="settings.highlightAdjectives && isAdjective"
        class="absolute inset-0 bg-info/20 rounded pointer-events-none"
      ></span>
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
  }
})

defineEmits(['click'])

const showTooltip = ref(false)
const tooltipStyle = ref({})

const isParticle = computed(() => props.word.pos === 'particle')
const isVerb = computed(() => props.word.pos === 'verb')
const isAdjective = computed(() => props.word.pos === 'adjective')

const wordHighlightClass = computed(() => {
  if (props.settings.highlightOnHover) {
    return 'hover:bg-primary/10'
  }
  return ''
})

const wordContainerStyle = computed(() => {
  if (props.settings.alwaysShowTranslation) {
    return {
      paddingTop: `${props.settings.translationSize + props.settings.translationGap}px`
    }
  }
  return {}
})

const translationStyle = computed(() => ({
  fontSize: `${props.settings.translationSize}px`,
  marginBottom: `${props.settings.translationGap}px`
}))

const updateTooltipPosition = (event) => {
  if (!showTooltip.value) return
  
  const rect = event.target.getBoundingClientRect()
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  
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