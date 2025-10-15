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

        <div class="px-6 sm:px-12 py-8 sm:py-12 pb-32" :style="fontStyles">
          <div :style="textStyles">
            <template v-for="(sentence, sIndex) in japaneseText" :key="sIndex">
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
                  :settings="readerSettings"
                  @hover="hoveredWord = word"
                  @leave="hoveredWord = null"
                />
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

    <div v-if="japaneseText.length > 0" class="fixed bottom-8 right-8 flex gap-3 z-10">
      <button 
        @click="showSettings = true" 
        class="btn btn-circle btn-ghost shadow-lg bg-base-100 border border-base-300"
        title="Reader settings"
      >
        <IconSettings class="w-5 h-5" />
      </button>
      
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

    <div v-if="showSettings" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" @click.self="showSettings = false">
      <div class="bg-base-100 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div class="sticky top-0 bg-base-100 border-b border-base-300 p-6 flex items-center justify-between">
          <h2 class="text-2xl font-bold">Reader Settings</h2>
          <button @click="showSettings = false" class="btn btn-ghost btn-sm btn-circle">
            <IconX class="w-5 h-5" />
          </button>
        </div>

        <div class="p-6 space-y-6">
          <div class="form-control">
            <label class="label">
              <span class="label-text font-medium">Font Family</span>
            </label>
            <select v-model="readerSettings.fontFamily" class="select select-bordered w-full">
              <option value="Noto Sans JP">Noto Sans JP</option>
              <option value="Noto Serif JP">Noto Serif JP</option>
              <option value="M PLUS Rounded 1c">M PLUS Rounded</option>
              <option value="Kosugi Maru">Kosugi Maru</option>
              <option value="Sawarabi Mincho">Sawarabi Mincho</option>
              <option value="Yu Mincho">Yu Mincho</option>
              <option value="Hiragino Sans">Hiragino Sans</option>
            </select>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text font-medium">Font Size: {{ readerSettings.fontSize }}</span>
            </label>
            <input 
              v-model="readerSettings.fontSize" 
              type="range" 
              min="16" 
              max="48" 
              step="2"
              class="range range-primary"
            />
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text font-medium">Line Height: {{ readerSettings.lineHeight }}</span>
            </label>
            <input 
              v-model="readerSettings.lineHeight" 
              type="range" 
              min="1.5" 
              max="3.5" 
              step="0.1"
              class="range range-primary"
            />
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text font-medium">Furigana Size: {{ readerSettings.furiganaSize }}</span>
            </label>
            <input 
              v-model="readerSettings.furiganaSize" 
              type="range" 
              min="0.3" 
              max="0.6" 
              step="0.05"
              class="range range-primary"
            />
          </div>

          <div class="form-control">
            <label class="label cursor-pointer">
              <span class="label-text font-medium">Always Show Furigana</span>
              <input v-model="readerSettings.showFurigana" type="checkbox" class="toggle toggle-primary" />
            </label>
          </div>

          <div class="form-control">
            <label class="label cursor-pointer">
              <span class="label-text font-medium">Show Tooltips</span>
              <input v-model="readerSettings.showTooltip" type="checkbox" class="toggle toggle-primary" />
            </label>
          </div>

          <div class="form-control">
            <label class="label cursor-pointer">
              <span class="label-text font-medium">Highlight Particles</span>
              <input v-model="readerSettings.highlightParticles" type="checkbox" class="toggle toggle-primary" />
            </label>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text font-medium">Text Color</span>
            </label>
            <div class="flex gap-2">
              <input 
                v-model="readerSettings.textColor" 
                type="color" 
                class="w-20 h-12 rounded-lg cursor-pointer"
              />
              <button 
                @click="readerSettings.textColor = ''"
                class="btn btn-outline flex-1"
              >
                Use Theme Default
              </button>
            </div>
          </div>

          <button @click="resetSettings" class="btn btn-outline w-full">
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import IconSparkles from '~icons/lucide/sparkles'
import IconInfo from '~icons/lucide/info'
import IconTrash from '~icons/lucide/trash-2'
import IconBookOpen from '~icons/lucide/book-open'
import IconX from '~icons/lucide/x'
import IconSettings from '~icons/lucide/settings'
import { sampleTexts } from '~/data/sampleTexts'

const japaneseText = ref([])
const isGenerating = ref(false)
const hoveredSentence = ref(null)
const hasSeenInfo = ref(false)
const hoveredWord = ref(null)
const showSettings = ref(false)

const defaultSettings = {
  fontFamily: 'Noto Sans JP',
  fontSize: 28,
  lineHeight: 2.8,
  furiganaSize: 0.45,
  showFurigana: false,
  showTooltip: true,
  highlightParticles: false,
  textColor: ''
}

const readerSettings = ref({ ...defaultSettings })

const fontStyles = computed(() => ({
  fontFamily: `"${readerSettings.value.fontFamily}", sans-serif`
}))

const textStyles = computed(() => ({
  fontSize: `${readerSettings.value.fontSize}px`,
  lineHeight: readerSettings.value.lineHeight,
  color: readerSettings.value.textColor || undefined
}))

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

const resetSettings = () => {
  readerSettings.value = { ...defaultSettings }
  if (process.client) {
    localStorage.setItem('readerSettings', JSON.stringify(readerSettings.value))
  }
}

watch(readerSettings, (newSettings) => {
  if (process.client) {
    localStorage.setItem('readerSettings', JSON.stringify(newSettings))
  }
}, { deep: true })

onMounted(() => {
  const seenInfo = localStorage.getItem('hasSeenInfo')
  hasSeenInfo.value = seenInfo === 'true'
  
  const savedSettings = localStorage.getItem('readerSettings')
  if (savedSettings) {
    readerSettings.value = { ...defaultSettings, ...JSON.parse(savedSettings) }
  }
})
</script>