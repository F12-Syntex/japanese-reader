<template>
  <div class="h-full bg-base-100 flex flex-col">
    <div class="flex-1 overflow-y-auto custom-scrollbar">
      <div v-if="japaneseText.length > 0 || streamingText" class="w-full">
        <div v-if="!hasSeenInfo" class="px-6 sm:px-12 pt-6">
          <div class="alert alert-info shadow-sm">
            <IconInfo class="w-5 h-5" />
            <span>Click on words to see detailed information. Hold Ctrl and click sentences for grammar breakdown.</span>
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
          :streaming-text="streamingText"
          @word-click="handleWordClick"
          @sentence-analyze="handleSentenceAnalyze"
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
        @click="showFeedback = true" 
        class="btn btn-circle btn-primary shadow-lg"
        title="Next text"
      >
        <IconArrowRight class="w-5 h-5" />
      </button>
    </div>

    <ReaderSettingsModal
      :model-value="showSettings"
      @update:model-value="showSettings = $event"
      :settings="localSettings"
      @update:settings="updateSettings"
      @reset="resetSettings"
    />

    <ReaderWordModal
      :model-value="showWordModal"
      @update:model-value="showWordModal = $event"
      :word="selectedWord"
    />

    <SentenceAnalysisModal
      :model-value="showAnalysisModal"
      @update:model-value="showAnalysisModal = $event"
      :sentence="selectedSentence"
    />

    <FeedbackModal
      :model-value="showFeedback"
      @update:model-value="showFeedback = $event"
      @feedback="handleFeedback"
    />
  </div>
</template>

<script setup>
import IconInfo from '~icons/lucide/info'
import IconX from '~icons/lucide/x'
import IconSettings from '~icons/lucide/settings'
import IconAlertCircle from '~icons/lucide/alert-circle'
import IconArrowRight from '~icons/lucide/arrow-right'

const { japaneseText, isGenerating, generationError, streamingText, generateText, clearText, giveFeedback } = useJapaneseText()
const { getApiKey } = useOpenAI()
const { loadFromStorage } = useAnki()

const hasSeenInfo = ref(false)
const showSettings = ref(false)
const showWordModal = ref(false)
const selectedWord = ref(null)
const showAnalysisModal = ref(false)
const selectedSentence = ref(null)
const showFeedback = ref(false)

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
  highlightKnownWords: true,
  dimKnownWords: false,
  strikethroughKnown: false,
  grammarMode: false,
  grammarShowArrows: true,
  grammarShowLabels: true,
  grammarShowTranslation: true,
  grammarArrowThickness: 2.5,
  grammarArrowOpacity: 70,
  grammarSubjectColor: '#EF4444',
  grammarObjectColor: '#3B82F6',
  grammarParticleColor: '#F59E0B',
  grammarVerbColor: '#10B981',
  grammarModifierColor: '#8B5CF6',
  grammarLabelSize: 11,
  grammarLineSpacing: 40,
  grammarHighlightOnHover: true,
  grammarAnimateArrows: false,
  grammarShowNotes: true
}

const localSettings = ref({ ...defaultSettings })

const closeAllModals = () => {
  showSettings.value = false
  showWordModal.value = false
  showAnalysisModal.value = false
  showFeedback.value = false
}

const handleGenerate = async () => {
  const apiKey = getApiKey()
  if (!apiKey) {
    navigateTo('/settings')
    return
  }
  const { difficulty, getLevelFromScore } = useDifficulty()
  const level = getLevelFromScore(difficulty.value)
  await generateText(level)
}

const handleFeedback = async (feedback) => {
  giveFeedback(feedback)
  clearText()
  await handleGenerate()
}

const handleWordClick = (word) => {
  closeAllModals()
  selectedWord.value = word
  showWordModal.value = true
}

const handleSentenceAnalyze = ({ index, sentence }) => {
  closeAllModals()
  selectedSentence.value = sentence
  showAnalysisModal.value = true
}

const dismissInfo = () => {
  hasSeenInfo.value = true
  if (import.meta.client) {
    localStorage.setItem('hasSeenInfo', 'true')
  }
}

const updateSettings = (newSettings) => {
  localSettings.value = { ...newSettings }
  if (import.meta.client) {
    localStorage.setItem('readerSettings', JSON.stringify(localSettings.value))
  }
}

const resetSettings = () => {
  localSettings.value = { ...defaultSettings }
  if (import.meta.client) {
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

  loadFromStorage()
})
</script>