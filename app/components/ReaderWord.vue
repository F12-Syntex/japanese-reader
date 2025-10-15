<template>
  <span 
    class="inline-block relative group cursor-pointer transition-all"
    @mouseenter="$emit('hover', word)"
    @mouseleave="$emit('leave')"
  >
    <ruby class="[ruby-align:center]">
      {{ word.kanji }}
      <rt 
        class="select-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        :class="{ 'opacity-100': settings.showFurigana }"
        :style="{ fontSize: settings.furiganaSize }"
      >
        {{ word.kana }}
      </rt>
    </ruby>
    <span 
      v-if="settings.showTooltip"
      class="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-3 py-2 bg-neutral text-neutral-content rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50"
    >
      <div class="font-medium text-sm">{{ word.kana }}</div>
      <div class="text-xs opacity-70">{{ word.meaning }}</div>
      <div class="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 bg-neutral rotate-45"></div>
    </span>
    <span 
      v-if="settings.highlightParticles && isParticle"
      class="absolute inset-0 bg-warning/20 rounded"
    ></span>
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

const particles = ['は', 'が', 'を', 'に', 'へ', 'と', 'で', 'から', 'まで', 'の', 'も', 'や', 'か', 'な', 'ね', 'よ']

const isParticle = computed(() => particles.includes(props.word.kanji))

defineEmits(['hover', 'leave'])
</script>