<template>
  <div class="h-full bg-base-100 flex flex-col">
    <div class="flex-1 overflow-y-auto custom-scrollbar">
      <div v-if="japaneseText.length > 0" class="w-full">
        <div 
          v-if="!hasSeenInfo"
          class="px-6 sm:px-12 pt-6"
        >
          <div class="alert alert-info shadow-sm">
            <IconInfo class="w-5 h-5" />
            <span>Hover over words to see readings and meanings. Hold Ctrl to highlight sentences.</span>
            <button 
              @click="dismissInfo"
              class="btn btn-ghost btn-sm btn-circle"
            >
              <IconX class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div class="px-6 sm:px-12 py-8 sm:py-12 pb-32">
          <div class="text-[1.75rem] leading-[2.8]">
            <template v-for="(sentence, sIndex) in japaneseText" :key="sIndex">
              <span 
                class="inline transition-all duration-200 rounded px-1"
                :class="{ 'bg-primary/10': hoveredSentence === sIndex, 'underline decoration-2 underline-offset-[6px]': hoveredSentence === sIndex }"
                @mouseenter="handleSentenceHover(sIndex, $event)"
                @mouseleave="hoveredSentence = null"
              >
                <span 
                  v-for="(word, wIndex) in sentence.words" 
                  :key="wIndex"
                  class="inline-block relative group cursor-pointer transition-all"
                  @mouseenter="handleWordHover(word, $event)"
                  @mouseleave="hoveredWord = null"
                >
                  <ruby class="[ruby-align:center]">
                    {{ word.kanji }}
                    <rt class="text-[0.45em] select-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {{ word.kana }}
                    </rt>
                  </ruby>
                </span>
              </span>
              <span v-if="sIndex < japaneseText.length - 1"> </span>
            </template>
          </div>
        </div>
      </div>

      <div v-else class="h-full flex items-center justify-center">
        <div class="text-center px-4">
          <IconBookOpen class="w-20 h-20 mx-auto mb-6 opacity-20" />
          <p class="text-base-content/50 text-lg mb-8">Generate Japanese text to start reading</p>
          
          <button 
            @click="generateText" 
            class="btn btn-primary gap-2"
            :class="{ 'loading': isGenerating }"
            :disabled="isGenerating"
          >
            <IconSparkles v-if="!isGenerating" class="w-5 h-5" />
            {{ isGenerating ? 'Generating...' : 'Generate Text' }}
          </button>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div 
        v-if="hoveredWord"
        class="fixed pointer-events-none z-[9999]"
        :style="{ left: tooltipPosition.x + 'px', top: tooltipPosition.y + 'px' }"
      >
        <div class="px-3 py-2 bg-neutral text-neutral-content rounded shadow-lg whitespace-nowrap">
          <div class="font-medium text-sm">{{ hoveredWord.kana }}</div>
          <div class="text-xs opacity-70">{{ hoveredWord.meaning }}</div>
        </div>
      </div>
    </Teleport>

    <div v-if="japaneseText.length > 0" class="fixed bottom-8 right-8 flex gap-3 z-10">
      <button 
        @click="clearText" 
        class="btn btn-circle btn-error shadow-lg"
        title="Clear text"
      >
        <IconTrash class="w-5 h-5" />
      </button>
      
      <button 
        @click="generateText" 
        class="btn btn-circle btn-primary shadow-lg"
        :class="{ 'loading': isGenerating }"
        :disabled="isGenerating"
        title="Generate new text"
      >
        <IconSparkles v-if="!isGenerating" class="w-5 h-5" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import IconSparkles from '~icons/lucide/sparkles'
import IconInfo from '~icons/lucide/info'
import IconTrash from '~icons/lucide/trash-2'
import IconBookOpen from '~icons/lucide/book-open'
import IconX from '~icons/lucide/x'
import { sampleTexts } from '~/data/sampleTexts'

const japaneseText = ref([])
const isGenerating = ref(false)
const hoveredSentence = ref(null)
const hasSeenInfo = ref(false)
const hoveredWord = ref(null)
const tooltipPosition = ref({ x: 0, y: 0 })

const handleWordHover = (word, event) => {
  hoveredWord.value = word
  const rect = event.target.getBoundingClientRect()
  tooltipPosition.value = {
    x: rect.left + rect.width / 2 - 50,
    y: rect.top - 60
  }
}

const generateText = () => {
  isGenerating.value = true
  
  setTimeout(() => {
    const numSentences = Math.floor(Math.random() * 8) + 6
    japaneseText.value = []
    
    for (let i = 0; i < numSentences; i++) {
      const randomIndex = Math.floor(Math.random() * sampleTexts.length)
      japaneseText.value.push(sampleTexts[randomIndex])
    }
    
    isGenerating.value = false
  }, 800)
}

const clearText = () => {
  japaneseText.value = []
  hoveredSentence.value = null
}

const dismissInfo = () => {
  hasSeenInfo.value = true
  if (process.client) {
    localStorage.setItem('hasSeenInfo', 'true')
  }
}

const handleSentenceHover = (index, event) => {
  if (event.ctrlKey || event.metaKey) {
    hoveredSentence.value = index
  }
}

onMounted(() => {
  const seenInfo = localStorage.getItem('hasSeenInfo')
  hasSeenInfo.value = seenInfo === 'true'
})
</script>