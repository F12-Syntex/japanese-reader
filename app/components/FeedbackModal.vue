<template>
  <BaseModal :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" title="Session Feedback" subtitle="Rate difficulty and note grammar challenges" size="lg">
    <template #default>
      <div class="p-6 space-y-6">
        <div class="text-center">
          <p class="text-base-content/70 mb-6">How was the reading session?</p>

          <div class="grid grid-cols-1 gap-4 max-w-md mx-auto">
            <button 
              @click="selectFeedback('easy')"
              class="btn btn-lg btn-success gap-3 justify-start"
              :class="{ 'btn-active scale-105': selectedFeedback === 'easy' }"
            >
              <IconThumbsUp class="w-6 h-6" />
              <div class="text-left flex-1">
                <div class="font-bold">Too Easy</div>
                <div class="text-xs opacity-70">Understood everything</div>
              </div>
            </button>

            <button 
              @click="selectFeedback('okay')"
              class="btn btn-lg btn-primary gap-3 justify-start"
              :class="{ 'btn-active scale-105': selectedFeedback === 'okay' }"
            >
              <IconMinus class="w-6 h-6" />
              <div class="text-left flex-1">
                <div class="font-bold">Just Right</div>
                <div class="text-xs opacity-70">Challenging but good</div>
              </div>
            </button>

            <button 
              @click="selectFeedback('hard')"
              class="btn btn-lg btn-error gap-3 justify-start"
              :class="{ 'btn-active scale-105': selectedFeedback === 'hard' }"
            >
              <IconThumbsDown class="w-6 h-6" />
              <div class="text-left flex-1">
                <div class="font-bold">Too Hard</div>
                <div class="text-xs opacity-70">Struggled to understand</div>
              </div>
            </button>
          </div>
        </div>

        <div class="divider">Grammar Challenges</div>

        <div class="space-y-4">
          <p class="text-sm text-base-content/70">Which grammar points gave you trouble? (Optional)</p>
          
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
            <label
              v-for="point in sessionGrammarPoints"
              :key="point.grammarPoint"
              class="label cursor-pointer justify-start gap-2 p-2 hover:bg-base-200 rounded"
            >
              <input
                type="checkbox"
                v-model="selectedGrammar"
                :value="point.grammarPoint"
                class="checkbox checkbox-primary checkbox-sm"
              />
              <span class="label-text text-xs truncate max-w-[120px]">{{ point.grammarPoint }}</span>
            </label>
          </div>

          <div class="flex gap-2 pt-4">
            <button 
              @click="submitFeedback" 
              class="btn btn-primary flex-1"
              :disabled="!selectedFeedback && selectedGrammar.length === 0"
            >
              <IconCheck class="w-4 h-4" />
              Submit
            </button>
            <button 
              @click="clearSelection" 
              class="btn btn-ghost flex-1"
            >
              Clear
            </button>
          </div>
        </div>

        <div class="divider">Current Progress</div>

        <div class="stats shadow w-full">
          <div class="stat">
            <div class="stat-title">Proficiency</div>
            <div class="stat-value text-primary text-2xl">{{ currentDifficulty.toFixed(1) }}</div>
            <div class="stat-desc">{{ currentLevel }}</div>
          </div>
          <div class="stat">
            <div class="stat-title">Grammar Mastered</div>
            <div class="stat-value text-secondary">{{ grammarMastered }}/{{ totalGrammar }}</div>
            <div class="stat-desc">Points at 80%+</div>
          </div>
        </div>
      </div>
    </template>
  </BaseModal>
</template>

<script setup>
import IconThumbsUp from '~icons/lucide/thumbs-up'
import IconThumbsDown from '~icons/lucide/thumbs-down'
import IconMinus from '~icons/lucide/minus'
import IconCheck from '~icons/lucide/check'

const props = defineProps({
  modelValue: Boolean,
  sessionGrammar: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'feedback', 'grammar-update'])

const { difficulty, getLevelFromScore, getProficiencyDescription } = useDifficulty()
const { grammarPoints, getOverallProficiency, getProficiencyForLevel } = useGrammarCatalog()

const selectedFeedback = ref('')
const selectedGrammar = ref([])
const currentDifficulty = computed(() => difficulty.value)
const currentLevel = computed(() => getLevelFromScore(difficulty.value))
const grammarMastered = computed(() => grammarPoints.value.filter(p => (p.userScore ?? 0) >= 80).length)
const totalGrammar = computed(() => grammarPoints.value.length)

const sessionGrammarPoints = computed(() => {
  return grammarPoints.value.filter(p => props.sessionGrammar.includes(p.grammarPoint))
})

const selectFeedback = (feedback) => {
  selectedFeedback.value = feedback
  if (feedback === 'easy' && selectedGrammar.value.length > 0) {
    selectedGrammar.value = []
  }
}

const clearSelection = () => {
  selectedFeedback.value = ''
  selectedGrammar.value = []
}

const submitFeedback = async () => {
  let feedback = selectedFeedback.value
  if (!feedback && selectedGrammar.value.length > 0) {
    feedback = 'hard'
  } else if (!feedback) {
    feedback = 'okay'
  }
  
  if (feedback) {
    emit('feedback', feedback)
    
    selectedGrammar.value.forEach(point => {
      const grammarPoint = grammarPoints.value.find(p => p.grammarPoint === point)
      if (grammarPoint) {
        const newScore = Math.max(0, (grammarPoint.userScore ?? 0) - 20)
        grammarPoint.userScore = newScore
      }
    })
    
    emit('grammar-update', selectedGrammar.value)
  }
  emit('update:modelValue', false)
}
</script>