<template>
  <div class="modal" :class="{ 'modal-open': modelValue }">
    <div class="modal-box w-full max-w-2xl">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h3 class="font-bold text-lg">Session Feedback</h3>
          <p class="text-sm text-base-content/60">Rate difficulty and note grammar challenges</p>
        </div>
        <button @click="$emit('update:modelValue', false)" class="btn btn-sm btn-circle btn-ghost">✕</button>
      </div>

      <div class="space-y-6">
        <div>
          <p class="text-sm font-semibold mb-4">How was the reading session?</p>
          <div class="grid grid-cols-3 gap-3">
            <button 
              @click="selectFeedback('easy')"
              class="btn btn-outline transition-all"
              :class="selectedFeedback === 'easy' ? 'btn-success' : ''"
            >
              <IconThumbsUp class="w-5 h-5" />
              <span class="hidden sm:inline">Easy</span>
            </button>
            <button 
              @click="selectFeedback('okay')"
              class="btn btn-outline transition-all"
              :class="selectedFeedback === 'okay' ? 'btn-info' : ''"
            >
              <IconMinus class="w-5 h-5" />
              <span class="hidden sm:inline">Just Right</span>
            </button>
            <button 
              @click="selectFeedback('hard')"
              class="btn btn-outline transition-all"
              :class="selectedFeedback === 'hard' ? 'btn-error' : ''"
            >
              <IconThumbsDown class="w-5 h-5" />
              <span class="hidden sm:inline">Hard</span>
            </button>
          </div>
        </div>

        <div class="divider my-0"></div>

        <div>
          <p class="text-sm font-semibold mb-3">Grammar challenges (Optional)</p>
          <div class="flex flex-wrap gap-2 p-3 bg-base-200/50 rounded-lg max-h-40 overflow-y-auto">
            <button
              v-for="point in sessionGrammarPoints"
              :key="point.grammarPoint"
              @click="toggleGrammar(point.grammarPoint)"
              class="badge badge-lg cursor-pointer transition-all"
              :class="selectedGrammar.includes(point.grammarPoint) ? 'badge-primary' : 'badge-ghost'"
            >
              {{ point.grammarPoint }}
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="stat bg-base-200 rounded-lg p-4">
            <div class="stat-title text-xs">Proficiency</div>
            <div class="stat-value text-xl">{{ currentDifficulty.toFixed(1) }}</div>
            <div class="stat-desc text-xs">{{ currentLevel }}</div>
          </div>
          <div class="stat bg-base-200 rounded-lg p-4">
            <div class="stat-title text-xs">Mastered</div>
            <div class="stat-value text-xl">{{ grammarMastered }}/{{ totalGrammar }}</div>
            <div class="stat-desc text-xs">80%+ points</div>
          </div>
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
    </div>
    <div class="modal-backdrop" @click="$emit('update:modelValue', false)"></div>
  </div>
</template>

<script setup lang="ts">
import IconThumbsUp from '~icons/lucide/thumbs-up'
import IconThumbsDown from '~icons/lucide/thumbs-down'
import IconMinus from '~icons/lucide/minus'
import IconCheck from '~icons/lucide/check'

interface GrammarPoint {
  grammarPoint: string
  userScore?: number
}

interface Props {
  modelValue: boolean
  sessionGrammar: string[]
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

const currentDifficulty = computed(() => difficulty.value)
const currentLevel = computed(() => getLevelFromScore(difficulty.value))
const grammarMastered = computed(() => grammarPoints.value.filter((p: GrammarPoint) => (p.userScore ?? 0) >= 80).length)
const totalGrammar = computed(() => grammarPoints.value.length)

const sessionGrammarPoints = computed(() => {
  return grammarPoints.value.filter((p: GrammarPoint) => props.sessionGrammar.includes(p.grammarPoint))
})

const selectFeedback = (feedback: string) => {
  selectedFeedback.value = feedback
  if (feedback === 'easy' && selectedGrammar.value.length > 0) {
    selectedGrammar.value = []
  }
}

const toggleGrammar = (point: string) => {
  const idx = selectedGrammar.value.indexOf(point)
  if (idx > -1) {
    selectedGrammar.value.splice(idx, 1)
  } else {
    selectedGrammar.value.push(point)
  }
}

const clearSelection = () => {
  selectedFeedback.value = ''
  selectedGrammar.value = []
}

const submitFeedback = () => {
  let feedback = selectedFeedback.value
  if (!feedback && selectedGrammar.value.length > 0) {
    feedback = 'hard'
  } else if (!feedback) {
    feedback = 'okay'
  }
  
  emit('feedback', feedback)
  
  selectedGrammar.value.forEach(point => {
    const grammarPoint = grammarPoints.value.find((p: GrammarPoint) => p.grammarPoint === point)
    if (grammarPoint) {
      grammarPoint.userScore = Math.max(0, (grammarPoint.userScore ?? 0) - 20)
    }
  })
  
  emit('grammar-update', selectedGrammar.value)
  emit('update:modelValue', false)
}
</script>