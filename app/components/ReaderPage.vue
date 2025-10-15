<template>
  <div class="h-full bg-base-100 flex flex-col">
    <div class="flex-1 overflow-y-auto custom-scrollbar">
      <div v-if="japaneseText.length > 0" class="w-full">
        <div v-if="!hasSeenInfo" class="px-6 sm:px-12 pt-6">
          <div class="alert alert-info shadow-sm">
            <IconInfo class="w-5 h-5" />
            <span>Click on words to see detailed information. Hold Ctrl to highlight sentences.</span>
            <button @click="dismissInfo" class="btn btn-ghost btn-sm btn-circle">
              <IconX class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div v-if="generationError" class="px-6 sm:px-12 pt-6">
          <div class="alert alert-error shadow-sm">
            <IconAlertCircle class="w-5 h-5" />
            <span>{{ generationError }}</span>
            <button @click="generationError = null" class="btn btn-ghost btn-sm btn-circle">
              <IconX class="w-4 h-4" />
            </button>
          </div>
        </div>

        <ReaderContent 
          :text="japaneseText"
          :settings="localSettings"
          @word-click="handleWordClick"
        />
      </div>

      <ReaderEmptyState 
        v-else
        :is-generating="isGenerating"
        @generate="handleGenerate"
      />
    </div>

    <div v-if="japaneseText.length > 0" class="fixed bottom-8 right-8 flex gap-3 z-[50]">
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
        @click="handleGenerate" 
        class="btn btn-circle btn-primary shadow-lg"
        :class="{ 'loading': isGenerating }"
        :disabled="isGenerating"
        title="Generate new text"
      >
        <IconSparkles v-if="!isGenerating" class="w-5 h-5" />
      </button>
    </div>

    <ReaderSettingsModal
      v-model="showSettings"
      :settings="localSettings"
      @update:settings="updateSettings"
      @reset="resetSettings"
    />

    <ReaderWordModal
      v-model="showWordModal"
      :word="selectedWord"
    />
  </div>
</template>

<script setup>
import IconSparkles from '~icons/lucide/sparkles'
import IconInfo from '~icons/lucide/info'
import IconTrash from '~icons/lucide/trash-2'
import IconX from '~icons/lucide/x'
import IconSettings from '~icons/lucide/settings'
import IconAlertCircle from '~icons/lucide/alert-circle'

const { japaneseText, isGenerating, generationError, generateText, clearText } = useJapaneseText()
const { getApiKey } = useOpenAI()

const hasSeenInfo = ref(false)
const showSettings = ref(false)
const showWordModal = ref(false)
const selectedWord = ref(null)

const defaultSettings = {
  fontFamily: 'Noto Sans JP',
  fontSize: 28,
  fontWeight: 400,
  lineHeight: 2.8,
  letterSpacing: 0,
  furiganaSize: 0.45,
  furiganaColor: '',
  showFurigana: false,
  showTooltip: true,
  tooltipSize: 'md',
  tooltipDelay: 0,
  alwaysShowTranslation: false,
  translationSize: 10,
  translationGap: 4,
  highlightParticles: false,
  highlightVerbs: false,
  highlightAdjectives: false,
  highlightOnHover: false,
  underlineUnknown: false,
  textColor: '',
  backgroundColor: '',
  textAlign: 'left',
  maxWidth: 'full',
  showWordSpacing: false,
  verticalText: false,
  showSentenceNumbers: false,
  clickToToggle: true,
  showPitchAccent: false,
  showPartOfSpeech: true,
  focusModeOpacity: 30,
  autoScroll: false,
  jlptLevel: 'N5'
}

const localSettings = ref({ ...defaultSettings })

const handleGenerate = async () => {
  const apiKey = getApiKey()
  if (!apiKey) {
    navigateTo('/settings')
    return
  }
  await generateText(localSettings.value.jlptLevel)
}

const handleWordClick = (word) => {
  selectedWord.value = word
  showWordModal.value = true
}

const dismissInfo = () => {
  hasSeenInfo.value = true
  if (process.client) {
    localStorage.setItem('hasSeenInfo', 'true')
  }
}

const updateSettings = (newSettings) => {
  localSettings.value = { ...newSettings }
  if (process.client) {
    localStorage.setItem('readerSettings', JSON.stringify(localSettings.value))
  }
}

const resetSettings = () => {
  localSettings.value = { ...defaultSettings }
  if (process.client) {
    localStorage.setItem('readerSettings', JSON.stringify(localSettings.value))
  }
}

onMounted(() => {
  const seenInfo = localStorage.getItem('hasSeenInfo')
  hasSeenInfo.value = seenInfo === 'true'
  
  const savedSettings = localStorage.getItem('readerSettings')
  if (savedSettings) {
    localSettings.value = { ...defaultSettings, ...JSON.parse(savedSettings) }
  }
})
</script>