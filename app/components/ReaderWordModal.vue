apps/web/components/WordModal.vue
<template>
  <div v-if="modelValue && word" class="fixed inset-0 bg-black/50 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4" @click.self="closeModal">
    <div class="bg-base-100 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md transform transition-all duration-300 max-h-[90vh] sm:max-h-[85vh] flex flex-col" :class="modelValue ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'">
      <div class="p-4 sm:p-6 border-b border-base-200 flex items-start justify-between flex-shrink-0">
        <div class="flex-1 min-w-0">
          <h2 class="text-2xl sm:text-4xl font-bold break-words">{{ displayWord.kanji }}</h2>
          <p class="text-lg sm:text-2xl text-base-content/60 mt-1">{{ displayWord.kana || displayWord.reading }}</p>
        </div>
        <button @click="closeModal" class="btn btn-ghost btn-sm btn-circle flex-shrink-0 ml-2">
          <IconX class="w-5 h-5" />
        </button>
      </div>

      <div class="overflow-y-auto flex-1 custom-scrollbar">
        <div class="p-4 sm:p-6 space-y-5 sm:space-y-6">
          <div v-if="isLoading" class="flex flex-col items-center justify-center py-12 gap-4">
            <div class="flex gap-2">
              <span class="loading loading-spinner loading-lg text-primary"></span>
            </div>
            <p class="text-sm text-base-content/60 font-medium">Loading word details...</p>
          </div>

          <template v-else>
            <div v-if="displayWord.meaning" class="space-y-2">
              <label class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Meaning</label>
              <div class="text-sm sm:text-lg leading-relaxed text-base-content">{{ displayWord.meaning }}</div>
            </div>

            <div class="space-y-3">
              <div v-if="displayWord.pos" class="space-y-2">
                <label class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Part of Speech</label>
                <div class="badge badge-primary badge-sm sm:badge-md font-medium">{{ formatPos(displayWord.pos) }}</div>
              </div>

              <div v-if="displayWord.pitchAccent" class="space-y-2">
                <label class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Pitch Accent</label>
                <div class="text-xs sm:text-sm font-mono bg-base-200 rounded-lg p-2 sm:p-3">{{ displayWord.pitchAccent }}</div>
              </div>
            </div>

            <div class="divider my-1"></div>

            <div class="space-y-2">
              <label class="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-2">Learn More</label>
              <div class="flex flex-col gap-2">
                <a 
                  :href="`https://www.japandict.com/${encodeURIComponent(displayWord.kanji)}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="btn btn-primary btn-sm text-xs sm:text-sm gap-2"
                >
                  <IconExternalLink class="w-4 h-4" />
                  <span>JapanDict</span>
                </a>

                <a 
                  :href="`https://jisho.org/search/${encodeURIComponent(displayWord.kanji)}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="btn btn-outline btn-sm text-xs sm:text-sm gap-2"
                >
                  <IconExternalLink class="w-4 h-4" />
                  <span>Jisho</span>
                </a>
              </div>
            </div>

            <div v-if="displayWord.example" class="space-y-2">
              <label class="text-xs font-semibold text-base-content/60 uppercase tracking-wide">Example</label>
              <div class="alert alert-info py-2 px-3 sm:py-3 sm:px-4 text-xs sm:text-sm">
                <p class="leading-relaxed italic">{{ displayWord.example }}</p>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import IconX from '~icons/lucide/x'
import IconExternalLink from '~icons/lucide/external-link'

interface Word {
  kanji: string
  kana?: string
  reading?: string
  meaning?: string
  pos?: string
  example?: string
  pitchAccent?: string
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

const isLoading = ref(false)
const enrichedData = ref<Record<string, Partial<Word>>>({})

const displayWord = computed((): Word => {
  if (!props.word) return { kanji: '' }
  
  const base = { ...props.word }
  const kanji = base.kanji || ''
  const enriched = enrichedData.value[kanji] || {}
  
  return {
    kanji: base.kanji,
    kana: base.kana || (enriched as any)?.reading || base.reading,
    reading: base.reading || (enriched as any)?.reading,
    meaning: base.meaning || (enriched as any)?.meaning,
    pos: base.pos || (enriched as any)?.pos,
    example: base.example,
    pitchAccent: base.pitchAccent
  }
})

const closeModal = (): void => {
  emit('update:modelValue', false)
}

const formatPos = (pos: string): string => {
  const mapping: Record<string, string> = {
    noun: 'Noun',
    verb: 'Verb',
    adjective: 'Adjective',
    particle: 'Particle',
    adverb: 'Adverb',
    prefix: 'Prefix',
    suffix: 'Suffix',
    conjunction: 'Conjunction',
    interjection: 'Interjection'
  }
  return mapping[pos.toLowerCase()] || pos
}

const enrichWordData = async (kanji: string): Promise<void> => {
  if (!kanji || enrichedData.value[kanji]) return
  
  isLoading.value = true
  try {
    const { getApiKey } = useOpenAI()
    const apiKey = getApiKey()
    if (!apiKey) {
      isLoading.value = false
      return
    }

    const { data } = await $fetch('/api/word-metadata', {
      method: 'POST',
      body: {
        apiKey: apiKey,
        words: [kanji],
        model: 'gpt-5-nano'
      }
    })

    if (data && data[kanji]) {
      enrichedData.value[kanji] = data[kanji]
    }
  } catch (error) {
    console.error('Failed to enrich word data:', error)
  } finally {
    isLoading.value = false
  }
}

watch(() => props.word?.kanji, (newKanji) => {
  if (newKanji && !displayWord.value.meaning) {
    enrichWordData(newKanji)
  }
}, { immediate: true })
</script>