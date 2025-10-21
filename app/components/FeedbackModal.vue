<template>
  <div v-if="modelValue" class="fixed inset-0 bg-black/50 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4" @click.self="$emit('update:modelValue', false)">
    <div class="bg-base-100 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl transform transition-all duration-300" :class="modelValue ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'">
      <div class="sticky top-0 p-6 border-b border-base-200 bg-base-100 rounded-t-3xl sm:rounded-t-2xl flex items-start justify-between">
        <div>
          <h3 class="font-bold text-lg sm:text-xl">Session Feedback</h3>
          <p class="text-xs sm:text-sm text-base-content/60 mt-1">Rate difficulty and note grammar challenges</p>
        </div>
        <button @click="$emit('update:modelValue', false)" class="btn btn-ghost btn-sm btn-circle flex-shrink-0 ml-2">
          <IconX class="w-5 h-5" />
        </button>
      </div>

      <div class="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
        <div>
          <p class="text-sm font-semibold mb-3">How was the reading session?</p>
          <div class="grid grid-cols-3 gap-2 sm:gap-3">
            <button 
              @click="selectFeedback('easy')"
              class="btn btn-outline btn-sm sm:btn-md transition-all"
              :class="selectedFeedback === 'easy' ? 'btn-success' : ''"
            >
              <IconThumbsUp class="w-4 h-4 sm:w-5 sm:h-5" />
              <span class="hidden sm:inline text-xs sm:text-sm">Easy</span>
            </button>
            <button 
              @click="selectFeedback('okay')"
              class="btn btn-outline btn-sm sm:btn-md transition-all"
              :class="selectedFeedback === 'okay' ? 'btn-info' : ''"
            >
              <IconMinus class="w-4 h-4 sm:w-5 sm:h-5" />
              <span class="hidden sm:inline text-xs sm:text-sm">Just Right</span>
            </button>
            <button 
              @click="selectFeedback('hard')"
              class="btn btn-outline btn-sm sm:btn-md transition-all"
              :class="selectedFeedback === 'hard' ? 'btn-error' : ''"
            >
              <IconThumbsDown class="w-4 h-4 sm:w-5 sm:h-5" />
              <span class="hidden sm:inline text-xs sm:text-sm">Hard</span>
            </button>
          </div>
        </div>

        <div class="divider my-2"></div>

        <div class="grid grid-cols-2 gap-2 sm:gap-3">
          <div class="stat bg-base-200 rounded-lg p-3 sm:p-4 border border-base-300">
            <div class="stat-title text-xs">Proficiency</div>
            <div class="stat-value text-lg sm:text-2xl">{{ currentDifficulty.toFixed(1) }}</div>
            <div class="stat-desc text-xs">{{ currentLevel }}</div>
          </div>
          <div class="stat bg-base-200 rounded-lg p-3 sm:p-4 border border-base-300">
            <div class="stat-title text-xs">Mastered</div>
            <div class="stat-value text-lg sm:text-2xl">{{ grammarMastered }}/{{ totalGrammar }}</div>
            <div class="stat-desc text-xs">80%+ points</div>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row gap-2 pt-4">
          <button 
            @click="submitFeedback" 
            class="btn btn-primary btn-sm sm:btn-md flex-1"
            :disabled="!selectedFeedback && selectedGrammar.length === 0"
          >
            <IconCheck class="w-4 h-4" />
            Submit
          </button>
          <button 
            @click="clearSelection" 
            class="btn btn-ghost btn-sm sm:btn-md flex-1"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import IconThumbsUp from '~icons/lucide/thumbs-up'
import IconThumbsDown from '~icons/lucide/thumbs-down'
import IconMinus from '~icons/lucide/minus'
import IconCheck from '~icons/lucide/check'
import IconX from '~icons/lucide/x'

interface GrammarPoint {
  grammarPoint: string
  userScore?: number
}

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'feedback': [value: string]
  'grammar-update': [value: string[]]
}>()

const { difficulty, getLevelFromScore } = useDifficulty()
const { grammarPoints } = useGrammarCatalog()

const selectedFeedback = ref<string>('')
const selectedGrammar = ref<string[]>([])

const currentDifficulty = computed((): number => difficulty.value)
const currentLevel = computed((): string => getLevelFromScore(difficulty.value))
const grammarMastered = computed((): number => 
  (grammarPoints.value as GrammarPoint[]).filter((p: GrammarPoint) => (p.userScore ?? 0) >= 80).length
)
const totalGrammar = computed((): number => (grammarPoints.value as GrammarPoint[]).length)

const selectFeedback = (feedback: string): void => {
  selectedFeedback.value = feedback
  if (feedback === 'easy' && selectedGrammar.value.length > 0) {
    selectedGrammar.value = []
  }
}

const clearSelection = (): void => {
  selectedFeedback.value = ''
  selectedGrammar.value = []
}

const submitFeedback = (): void => {
  let feedback = selectedFeedback.value
  if (!feedback && selectedGrammar.value.length > 0) {
    feedback = 'hard'
  } else if (!feedback) {
    feedback = 'okay'
  }
  
  emit('feedback', feedback)
  
  selectedGrammar.value.forEach((point: string) => {
    const grammarPoint = (grammarPoints.value as GrammarPoint[]).find((p: GrammarPoint) => p.grammarPoint === point)
    if (grammarPoint) {
      grammarPoint.userScore = Math.max(0, (grammarPoint.userScore ?? 0) - 20)
    }
  })
  
  emit('grammar-update', selectedGrammar.value)
  emit('update:modelValue', false)
}
</script>