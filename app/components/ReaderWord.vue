// components/ReaderWord.vue
<template>
  <span 
    class="inline-block relative transition-all align-top cursor-pointer hover:bg-primary/5 rounded px-1"
    :class="{ 
      'mr-2': settings.showWordSpacing,
      'mx-1': settings.alwaysShowTranslation
    }"
    :style="wordContainerStyle"
    @click="$emit('click')"
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
      :class="wordHighlightClass"
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

const particles = ['は', 'が', 'を', 'に', 'へ', 'と', 'で', 'から', 'まで', 'の', 'も', 'や', 'か', 'ね', 'ね', 'よ']

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