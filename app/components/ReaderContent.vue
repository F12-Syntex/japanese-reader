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
          class="inline transition-all duration-200 rounded px-1 leading-relaxed cursor-pointer"
          :class="{ 'bg-primary/10': hoveredSentence === sIndex && isCtrlPressed, 'underline decoration-2 underline-offset-[6px]': hoveredSentence === sIndex && isCtrlPressed }"
          @mouseenter="handleSentenceHover(sIndex, $event)"
          @mouseleave="hoveredSentence = null"
          @click="handleSentenceClick(sIndex, sentence, $event)"
        >
          <ReaderWord
            v-for="(word, wIndex) in sentence.words" 
            :key="wIndex"
            :word="word"
            :settings="settings"
            :disable-hover="isCtrlPressed"
            @click="handleWordClick(word, $event)"
          />
        </span>
        <span v-if="sIndex < text.length - 1" class="inline px-1">&nbsp;</span>
      </template>
      
      <span v-if="streamingText" class="opacity-50 animate-pulse">
        {{ streamingText }}
      </span>
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
  },
  streamingText: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['word-click', 'sentence-analyze'])

const hoveredSentence = ref(null)
const isCtrlPressed = ref(false)

const maxWidthClass = computed(() => {
  const widths = {
    full: 'max-w-full',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '6xl': 'max-w-6xl'
  }
  return widths[props.settings.maxWidth] || widths.full
})

const textAlignClass = computed(() => {
  const aligns = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
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
  letterSpacing: `${props.settings.letterSpacing}px`,
  color: props.settings.textColor || undefined
}))

const handleSentenceHover = (index, event) => {
  if (event.ctrlKey || event.metaKey) {
    hoveredSentence.value = index
  }
}

const handleSentenceClick = (index, sentence, event) => {
  if (event.ctrlKey || event.metaKey) {
    event.preventDefault()
    event.stopPropagation()
    emit('sentence-analyze', { index, sentence })
  }
}

const handleWordClick = (word, event) => {
  if (!isCtrlPressed.value) {
    emit('word-click', word)
  }
}

const handleKeyDown = (e) => {
  if (e.ctrlKey || e.metaKey) {
    isCtrlPressed.value = true
  }
}

const handleKeyUp = (e) => {
  if (!e.ctrlKey && !e.metaKey) {
    isCtrlPressed.value = false
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
})
</script>

<style scoped>
.writing-mode-vertical-rl {
  writing-mode: vertical-rl;
  text-orientation: upright;
}
</style>