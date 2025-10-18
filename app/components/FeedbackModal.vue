<template>
  <BaseModal :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" title="How was this text?" subtitle="Help us adjust the difficulty for you" size="md">
    <template #default>
      <div class="p-6 space-y-6">
        <p class="text-base-content/70 text-center">Rate the difficulty of what you just read</p>

        <div class="grid grid-cols-1 gap-4">
          <button 
            @click="submitFeedback('easy')"
            class="btn btn-lg btn-success gap-3 justify-start"
          >
            <IconThumbsUp class="w-6 h-6" />
            <div class="text-left flex-1">
              <div class="font-bold">Too Easy</div>
              <div class="text-xs opacity-70">I understood everything</div>
            </div>
          </button>

          <button 
            @click="submitFeedback('okay')"
            class="btn btn-lg btn-primary gap-3 justify-start"
          >
            <IconMinus class="w-6 h-6" />
            <div class="text-left flex-1">
              <div class="font-bold">Just Right</div>
              <div class="text-xs opacity-70">Challenging but manageable</div>
            </div>
          </button>

          <button 
            @click="submitFeedback('hard')"
            class="btn btn-lg btn-error gap-3 justify-start"
          >
            <IconThumbsDown class="w-6 h-6" />
            <div class="text-left flex-1">
              <div class="font-bold">Too Hard</div>
              <div class="text-xs opacity-70">I struggled to understand</div>
            </div>
          </button>
        </div>

        <div class="divider">Current Level</div>

        <div class="stats shadow w-full">
          <div class="stat">
            <div class="stat-title">Proficiency</div>
            <div class="stat-value text-primary text-2xl">{{ currentDifficulty.toFixed(1) }}</div>
            <div class="stat-desc">{{ currentLevel }}</div>
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

const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue', 'feedback'])

const { difficulty, getLevelFromScore } = useDifficulty()

const currentDifficulty = computed(() => difficulty.value)
const currentLevel = computed(() => getLevelFromScore(difficulty.value))

const submitFeedback = (feedback) => {
  emit('feedback', feedback)
  emit('update:modelValue', false)
}
</script>