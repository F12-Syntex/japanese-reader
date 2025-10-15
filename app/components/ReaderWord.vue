<template>
  <span 
    class="inline-block relative transition-all align-top cursor-pointer rounded px-1"
    :class="{ 
      'mr-2': settings.showWordSpacing,
      'mx-1': settings.alwaysShowTranslation
    }"
    :style="wordContainerStyle"
    @click="$emit('click')"
    @mouseenter="showTooltip = true"
    @mouseleave="showTooltip = false"
  >
    <span 
      v-if="settings.alwaysShowTranslation"
      class="block text-center opacity-50 whitespace-nowrap mb-1 pointer-events-none"
      :style="translationStyle"
    >
      <span v-if="!isParticle">{{ word.meaning }}</span>
      <span v-else class="opacity-0 select-none">{{ word.kanji }}</span>
    </span>
    
    <span
      class="inline-block relative group transition-all"
      :class="[wordHighlightClass, { 'hover:bg-primary/5': !isParticle }]"
    >
      <ruby class="[ruby-align:center]">
        <span :class="{ 'underline decoration-dashed decoration-1 underline-offset-4': settings.underlineUnknown }">
          {{ word.kanji }}
        </span>
        <rt 
          v-if="!isParticle && settings.showFurigana"
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
        v-if="settings.showTooltip && showTooltip && !isParticle"
        class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-neutral text-neutral-content rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none"
        :class="{
          'text-xs': settings.tooltipSize === 'sm',
          'text-sm': settings.tooltipSize === 'md',
          'text-base': settings.tooltipSize === 'lg'
        }"
      >
        <div class="font-bold mb-1">{{ word.kanji }}</div>
        <div class="opacity-90">{{ word.kana }}</div>
        <div class="opacity-75 mt-1">{{ word.meaning }}</div>
        <div class="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-neutral"></div>
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
</script>