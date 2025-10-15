// components/ReaderWordModal.vue
<template>
  <div v-if="modelValue && word" class="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4" @click.self="closeModal">
    <div class="bg-base-100 rounded-lg shadow-xl w-full max-w-md">
      <div class="p-6">
        <div class="flex items-start justify-between mb-6">
          <div>
            <h2 class="text-4xl font-bold mb-2">{{ word.kanji }}</h2>
            <p class="text-2xl text-base-content/70">{{ word.kana }}</p>
          </div>
          <button @click="closeModal" class="btn btn-ghost btn-sm btn-circle">
            <IconX class="w-5 h-5" />
          </button>
        </div>

        <div class="space-y-4">
          <div>
            <div class="text-sm font-medium text-base-content/60 mb-1">Meaning</div>
            <div class="text-lg">{{ word.meaning }}</div>
          </div>

          <div>
            <div class="text-sm font-medium text-base-content/60 mb-1">Part of Speech</div>
            <div class="badge badge-primary">{{ formatPos(word.pos) }}</div>
          </div>

          <div v-if="word.pos === 'verb'">
            <div class="text-sm font-medium text-base-content/60 mb-1">Type</div>
            <div class="text-base">{{ getVerbType(word.kana) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import IconX from '~icons/lucide/x'

const props = defineProps({
  modelValue: Boolean,
  word: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue'])

const closeModal = () => {
  emit('update:modelValue', false)
}

const formatPos = (pos) => {
  const mapping = {
    noun: 'Noun',
    verb: 'Verb',
    adjective: 'Adjective',
    particle: 'Particle',
    adverb: 'Adverb'
  }
  return mapping[pos] || pos
}

const getVerbType = (kana) => {
  const lastChar = kana.slice(-1)
  if (lastChar === 'る') return 'Ichidan (ru-verb)'
  if (['う', 'く', 'ぐ', 'す', 'つ', 'ぬ', 'ぶ', 'む', 'る'].includes(lastChar)) {
    return 'Godan (u-verb)'
  }
  return 'Unknown type'
}
</script>