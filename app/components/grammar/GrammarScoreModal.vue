<template>
  <BaseModal
    v-model="isOpen"
    title="Set Mastery Level"
    size="md"
  >
    <div v-if="point" class="space-y-6">
      <!-- Grammar Point Info -->
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-lg">{{ point.grammarPoint }}</p>
          <p class="text-sm text-base-content/60 mt-1">{{ point.english }}</p>
        </div>
        <span class="badge flex-shrink-0" :class="getLevelBadgeClass(point.level)">
          {{ point.level }}
        </span>
      </div>
      
      <!-- Score Slider -->
      <div class="space-y-4">
        <div>
          <input 
            v-model.number="tempScore" 
            type="range" 
            min="0" 
            max="100" 
            step="5" 
            class="range range-primary" 
          />
          <div class="w-full flex justify-between text-xs px-2 mt-2 text-base-content/50">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>
        
        <!-- Score Display -->
        <div class="text-center p-4 rounded-lg bg-primary/10">
          <div class="text-4xl font-bold text-primary">{{ tempScore }}%</div>
          <div class="text-sm text-base-content/60 mt-1">{{ getScoreLabel(tempScore) }}</div>
        </div>
      </div>
    </div>

    <template #footer>
      <button @click="close" class="btn btn-ghost">Cancel</button>
      <button @click="save" class="btn btn-primary">Save Score</button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">

interface GrammarPoint {
  grammarPoint: string
  english: string
  level: string
  userScore?: number
}

interface Props {
  modelValue: boolean
  point: GrammarPoint | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', score: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const tempScore = ref(0)

watch(() => props.point, (newPoint) => {
  if (newPoint) {
    tempScore.value = newPoint.userScore ?? 0
  }
}, { immediate: true })

const getLevelBadgeClass = (level: string) => ({
  N5: 'badge-success',
  N4: 'badge-info',
  N3: 'badge-warning',
  N2: 'badge-secondary',
  N1: 'badge-error'
}[level] ?? 'badge-neutral')

const getScoreLabel = (score: number) => {
  if (score >= 80) return 'Mastered'
  if (score >= 60) return 'Proficient'
  if (score >= 40) return 'Learning'
  if (score > 0) return 'Beginner'
  return 'Not Started'
}

const close = () => {
  isOpen.value = false
}

const save = () => {
  emit('save', tempScore.value)
  close()
}
</script>