<template>
  <div 
    class="px-6 sm:px-12 py-8 sm:py-12 pb-32 mx-auto"
    :class="maxWidthClass"
    :style="containerStyles"
  >
    <div 
      :style="textStyles"
      :class="[
        textAlignClass,
        { 'writing-mode-vertical-rl': settings.verticalText }
      ]"
    >
      <template v-for="(sentence, sIndex) in text" :key="sIndex">
        <span 
          class="inline transition-all duration-200 rounded px-1"
          :class="{ 'bg-primary/10': hoveredSentence === sIndex, 'underline decoration-2 underline-offset-[6px]': hoveredSentence === sIndex }"
          @mouseenter="handleSentenceHover(sIndex, $event)"
          @mouseleave="hoveredSentence = null"
        >
          <ReaderWord
            v-for="(word, wIndex) in sentence.words" 
            :key="wIndex"
            :word="word"
            :settings="settings"
            @click="handleWordClick(word)"
          />
        </span>
        <span v-if="sIndex < text.length - 1"> </span>
      </template>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  text: {
    type: Array,
    required: true
  },
  settings: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['word-click'])

const hoveredSentence = ref(null)

const maxWidthClass = computed(() => {
  const widths = {
    full: 'max-w-full',
    '4xl': 'max-w-4xl',
    '3xl': 'max-w-3xl',
    '2xl': 'max-w-2xl',
    xl: 'max-w-xl'
  }
  return widths[props.settings.maxWidth] || widths.full
})

const textAlignClass = computed(() => {
  const aligns = {
    left: 'text-left',
    center: 'text-center',
    justify: 'text-justify'
  }
  return aligns[props.settings.textAlign] || aligns.left
})

const containerStyles = computed(() => ({
  fontFamily: `"${props.settings.fontFamily}", sans-serif`,
  backgroundColor: props.settings.backgroundColor || undefined
}))

const textStyles = computed(() => ({
  fontSize: `${props.settings.fontSize}px`,
  lineHeight: props.settings.lineHeight,
  fontWeight: props.settings.fontWeight,
  letterSpacing: `${props.settings.letterSpacing}em`,
  color: props.settings.textColor || undefined
}))

const handleSentenceHover = (index, event) => {
  if (event.ctrlKey || event.metaKey) {
    hoveredSentence.value = index
  }
}

const handleWordClick = (word) => {
  emit('word-click', word)
}
</script>

<style scoped>
.writing-mode-vertical-rl {
  writing-mode: vertical-rl;
  text-orientation: upright;
}
</style>