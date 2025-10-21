<template>
  <div v-if="modelValue && word" class="fixed inset-0 bg-black/50 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4" @click.self="closeModal">
    <div class="bg-base-100 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md transform transition-all duration-300" :class="modelValue ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'">
      <div class="p-6 border-b border-base-200 flex items-start justify-between">
        <div class="flex-1">
          <h2 class="text-3xl sm:text-4xl font-bold">{{ word.kanji }}</h2>
          <p class="text-xl sm:text-2xl text-base-content/60 mt-1">{{ word.kana }}</p>
        </div>
        <button @click="closeModal" class="btn btn-ghost btn-sm btn-circle flex-shrink-0 ml-2">
          <IconX class="w-5 h-5" />
        </button>
      </div>

      <div class="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
        <div v-if="word.meaning" class="space-y-2">
          <label class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Meaning</label>
          <div class="text-base sm:text-lg">{{ word.meaning }}</div>
        </div>

        <div v-if="word.pos" class="space-y-2">
          <label class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Part of Speech</label>
          <div class="badge badge-primary badge-lg">{{ formatPos(word.pos) }}</div>
        </div>

        <div v-if="word.isKnown !== undefined" class="space-y-2">
          <label class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Status</label>
          <div class="badge badge-lg" :class="word.isKnown ? 'badge-success' : 'badge-ghost'">
            {{ word.isKnown ? 'Known (from Anki)' : 'Unknown' }}
          </div>
        </div>

        <div class="divider my-2"></div>

        <div class="space-y-2">
          <a 
            :href="`https://www.japandict.com/${encodeURIComponent(word.kanji)}`"
            target="_blank"
            class="btn btn-primary btn-block btn-sm gap-2"
          >
            <IconExternalLink class="w-4 h-4" />
            JapanDict
          </a>

          <a 
            :href="`https://jisho.org/search/${encodeURIComponent(word.kanji)}`"
            target="_blank"
            class="btn btn-outline btn-block btn-sm gap-2"
          >
            <IconExternalLink class="w-4 h-4" />
            Jisho
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import IconX from '~icons/lucide/x'
import IconExternalLink from '~icons/lucide/external-link'

interface Word {
  kanji: string
  kana: string
  meaning?: string
  pos?: string
  isKnown?: boolean
}

interface Props {
  modelValue: boolean
  word?: Word | null
}

const props = withDefaults(defineProps<Props>(), {
  word: null
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const closeModal = (): void => {
  emit('update:modelValue', false)
}

const formatPos = (pos: string): string => {
  const mapping: Record<string, string> = {
    noun: 'Noun',
    verb: 'Verb',
    adjective: 'Adjective',
    particle: 'Particle',
    adverb: 'Adverb'
  }
  return mapping[pos] || pos
}
</script>