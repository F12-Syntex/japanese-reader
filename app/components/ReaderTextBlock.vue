<template>
  <div class="h-full bg-base-100 flex flex-col">
    <!-- Text Display Section - Full Height, Scrollable -->
    <div class="flex-1 overflow-y-auto custom-scrollbar">
      <!-- Japanese Text Display -->
      <div v-if="japaneseText.length > 0" class="w-full h-full">
        <!-- Clear Button - Top Right -->
        <div class="flex justify-end px-4 pt-4 pb-2">
          <button 
            @click="clearText" 
            class="btn btn-ghost btn-sm gap-2 opacity-60 hover:opacity-100"
          >
            <IconTrash class="w-4 h-4" />
            Clear
          </button>
        </div>

        <!-- Info Hint -->
        <div 
          v-if="!hasSeenInfo"
          class="mx-4 mb-6"
        >
          <div class="alert alert-info shadow-sm">
            <IconInfo class="w-5 h-5" />
            <span>Hover over words to see readings and meanings</span>
            <button 
              @click="dismissInfo"
              class="btn btn-ghost btn-sm btn-circle"
            >
              <IconX class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Text Content - Book Style -->
        <div class="px-8 sm:px-16 md:px-24 lg:px-32 xl:px-48 pb-16">
          <div class="prose prose-lg max-w-none">
            <div class="text-justify leading-relaxed" style="line-height: 2.5;">
              <template v-for="(sentence, sIndex) in japaneseText" :key="sIndex">
                <span 
                  class="inline transition-all duration-200 rounded"
                  :class="{ 'bg-primary/10 shadow-sm': hoveredSentence === sIndex }"
                  @mouseenter="handleSentenceHover(sIndex, $event)"
                  @mouseleave="hoveredSentence = null"
                  style="text-decoration-skip-ink: auto;"
                  :style="{ 'text-decoration': hoveredSentence === sIndex ? 'underline' : 'none', 'text-decoration-thickness': '2px', 'text-underline-offset': '4px' }"
                >
                  <span 
                    v-for="(word, wIndex) in sentence.words" 
                    :key="wIndex"
                    class="inline-block relative group cursor-pointer transition-all"
                  >
                    <!-- Furigana (Kana on top) -->
                    <ruby class="text-xl sm:text-2xl">
                      {{ word.kanji }}
                      <rt class="text-[0.6rem] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {{ word.kana }}
                      </rt>
                    </ruby>
                    
                    <!-- Tooltip -->
                    <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-neutral text-neutral-content rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 text-xs">
                      <div class="font-medium">{{ word.kana }}</div>
                      <div class="text-[0.65rem] opacity-70">{{ word.meaning }}</div>
                    </div>
                  </span>
                </span>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State with Generate Button -->
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

    <!-- Floating Generate Button (when text exists) -->
    <button 
      v-if="japaneseText.length > 0"
      @click="generateText" 
      class="btn btn-circle btn-primary shadow-lg fixed bottom-8 right-8 z-10"
      :class="{ 'loading': isGenerating }"
      :disabled="isGenerating"
      title="Generate new text"
    >
      <IconSparkles v-if="!isGenerating" class="w-5 h-5" />
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import IconSparkles from '~icons/lucide/sparkles'
import IconInfo from '~icons/lucide/info'
import IconTrash from '~icons/lucide/trash-2'
import IconBookOpen from '~icons/lucide/book-open'
import IconX from '~icons/lucide/x'

const japaneseText = ref([])
const isGenerating = ref(false)
const hoveredSentence = ref(null)
const hasSeenInfo = ref(false)

// Sample Japanese text data
const sampleTexts = [
  {
    words: [
      { kanji: '今日', kana: 'きょう', meaning: 'today' },
      { kanji: 'は', kana: 'は', meaning: 'particle' },
      { kanji: '良い', kana: 'よい', meaning: 'good' },
      { kanji: '天気', kana: 'てんき', meaning: 'weather' },
      { kanji: 'ですね', kana: 'ですね', meaning: 'is' },
      { kanji: 'ね', kana: 'ね', meaning: 'right?' }
    ]
  },
  {
    words: [
      { kanji: '私', kana: 'わたし', meaning: 'I' },
      { kanji: 'は', kana: 'は', meaning: 'particle' },
      { kanji: '日本語', kana: 'にほんご', meaning: 'Japanese' },
      { kanji: 'を', kana: 'を', meaning: 'particle' },
      { kanji: '勉強', kana: 'べんきょう', meaning: 'study' },
      { kanji: 'して', kana: 'して', meaning: 'doing' },
      { kanji: 'います', kana: 'います', meaning: 'am' }
    ]
  },
  {
    words: [
      { kanji: '本', kana: 'ほん', meaning: 'book' },
      { kanji: 'を', kana: 'を', meaning: 'particle' },
      { kanji: '読む', kana: 'よむ', meaning: 'read' },
      { kanji: 'の', kana: 'の', meaning: 'particle' },
      { kanji: 'が', kana: 'が', meaning: 'particle' },
      { kanji: '好き', kana: 'すき', meaning: 'like' },
      { kanji: 'です', kana: 'です', meaning: 'is' }
    ]
  },
  {
    words: [
      { kanji: '東京', kana: 'とうきょう', meaning: 'Tokyo' },
      { kanji: 'に', kana: 'に', meaning: 'to/at' },
      { kanji: '行きたい', kana: 'いきたい', meaning: 'want to go' },
      { kanji: 'です', kana: 'です', meaning: 'is' }
    ]
  },
  {
    words: [
      { kanji: '美味しい', kana: 'おいしい', meaning: 'delicious' },
      { kanji: '食べ物', kana: 'たべもの', meaning: 'food' },
      { kanji: 'が', kana: 'が', meaning: 'particle' },
      { kanji: '大好き', kana: 'だいすき', meaning: 'love' },
      { kanji: 'です', kana: 'です', meaning: 'is' }
    ]
  },
  {
    words: [
      { kanji: '明日', kana: 'あした', meaning: 'tomorrow' },
      { kanji: 'も', kana: 'も', meaning: 'also' },
      { kanji: '頑張ります', kana: 'がんばります', meaning: 'will do my best' }
    ]
  },
  {
    words: [
      { kanji: '桜', kana: 'さくら', meaning: 'cherry blossom' },
      { kanji: 'が', kana: 'が', meaning: 'particle' },
      { kanji: '綺麗', kana: 'きれい', meaning: 'beautiful' },
      { kanji: 'です', kana: 'です', meaning: 'is' }
    ]
  },
  {
    words: [
      { kanji: '友達', kana: 'ともだち', meaning: 'friend' },
      { kanji: 'と', kana: 'と', meaning: 'with' },
      { kanji: '映画', kana: 'えいが', meaning: 'movie' },
      { kanji: 'を', kana: 'を', meaning: 'particle' },
      { kanji: '見ました', kana: 'みました', meaning: 'watched' }
    ]
  }
]

const generateText = () => {
  isGenerating.value = true
  
  setTimeout(() => {
    const numSentences = Math.floor(Math.random() * 5) + 4
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

<style scoped>
ruby {
  ruby-align: center;
}

rt {
  font-size: 0.5em;
  line-height: 1;
  user-select: none;
}

@media (max-width: 640px) {
  ruby {
    font-size: 1.25rem;
  }
}
</style>