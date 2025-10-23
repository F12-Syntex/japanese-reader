<template>
  <div class="h-full bg-base-100 flex flex-col relative">
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
          :settings="settings"
          :streaming-text="streamingText"
          @word-click="handleWordClick"
          @sentence-analyze="handleSentenceAnalyze"
        />
      </div>

      <ReaderEmptyState 
        v-else
        :is-generating="isGenerating"
        @generate="handleGenerate"
        @import-url="showUrlImport = true"
      />
    </div>

   <div 
      v-if="japaneseText.length > 0 && !anyModalOpen"
      class="fixed right-8 z-40"
      :class="fabContainerClasses"
    >
      <button 
        @click="showFeedback = true" 
        class="btn btn-circle btn-primary shadow-lg"
        title="Next"
      >
        <IconArrowRight class="w-5 h-5" />
      </button>
    </div>

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

    <UrlImportModal
      :model-value="showUrlImport"
      @update:model-value="showUrlImport = $event"
      @import="handleUrlImport"
    />
  </div>
</template>

<script setup>
import IconInfo from '~icons/lucide/info'
import IconX from '~icons/lucide/x'
import IconAlertCircle from '~icons/lucide/alert-circle'
import IconArrowRight from '~icons/lucide/arrow-right'
import { useReaderSettings } from '~/composables/useReaderSettings'

const { japaneseText, isGenerating, generationError, streamingText, generateText, clearText, giveFeedback, setTextFromImport } = useJapaneseText()
const { getApiKey } = useOpenAI()
const { loadFromStorage } = useAnki()
const { settings, loadSettings } = useReaderSettings()

const hasSeenInfo = ref(false)
const showWordModal = ref(false)
const selectedWord = ref(null)
const showAnalysisModal = ref(false)
const selectedSentence = ref(null)
const showFeedback = ref(false)
const showUrlImport = ref(false)

const anyModalOpen = computed(() => {
  return showWordModal.value || showAnalysisModal.value || showFeedback.value || showUrlImport.value
})

const fabContainerClasses = computed(() => {
  return ['bottom-[88px]', 'md:bottom-8']
})

const closeAllModals = () => {
  showWordModal.value = false
  showAnalysisModal.value = false
  showFeedback.value = false
  showUrlImport.value = false
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

const handleUrlImport = async (text) => {
  await setTextFromImport(text)
}

const dismissInfo = () => {
  hasSeenInfo.value = true
  if (import.meta.client) {
    localStorage.setItem('hasSeenInfo', 'true')
  }
}

onMounted(() => {
  const seenInfo = localStorage.getItem('hasSeenInfo')
  hasSeenInfo.value = seenInfo === 'true'
  
  loadSettings()
  loadFromStorage()
})
</script>