<template>
  <div
    :class="[
      'bg-white dark:bg-base-100 rounded-lg border',
      'border-base-200 dark:border-base-300/50',
      variant === 'desktop' ? 'p-3' : 'p-4'
    ]"
  >
    <!-- Header Section -->
    <div class="flex items-start justify-between gap-3 mb-3">
      <div class="flex-1 min-w-0">
        <h3
          :class="[
            'font-semibold text-base-content mb-1',
            variant === 'desktop' ? 'text-sm' : 'text-base'
          ]"
        >
          {{ point.grammarPoint }}
        </h3>
        <p
          :class="[
            'text-base-content/70',
            variant === 'desktop' ? 'text-xs line-clamp-1' : 'text-sm line-clamp-2'
          ]"
        >
          {{ point.english }}
        </p>
      </div>
      
      <span
        :class="[
          'badge flex-shrink-0',
          variant === 'desktop' ? 'badge-sm' : '',
          getLevelBadgeClass(point.level)
        ]"
      >
        {{ point.level }}
      </span>
    </div>
    
    <!-- Progress Section -->
    <div class="mb-3">
      <div class="flex items-center justify-between mb-1.5">
        <span :class="['text-base-content/60', variant === 'desktop' ? 'text-xs' : 'text-sm']">
          {{ getScoreLabel(point.userScore ?? 0) }}
        </span>
        <span :class="['font-semibold text-base-content', variant === 'desktop' ? 'text-xs' : 'text-sm']">
          {{ point.userScore ?? 0 }}%
        </span>
      </div>
      
      <progress
        :value="point.userScore ?? 0"
        max="100"
        :class="[
          'progress w-full',
          variant === 'desktop' ? 'h-1.5' : 'h-2',
          getProgressClass(point.userScore ?? 0)
        ]"
      />
    </div>
    
    <!-- Action Buttons -->
    <div class="flex items-center gap-2">
      <button
        @click="$emit('open-modal', point)"
        class="btn btn-xs btn-outline btn-primary gap-1.5"
      >
        <IconEdit class="w-3 h-3" />
        <span>Adjust</span>
      </button>
      
      <button
        @click="$emit('reset-score', point.grammarPoint)"
        class="btn btn-xs btn-ghost btn-square"
      >
        <IconRefreshCw class="w-3 h-3" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import IconEdit from '~icons/lucide/edit'
import IconRefreshCw from '~icons/lucide/refresh-cw'

interface Props {
  point: GrammarPoint
  variant?: 'desktop' | 'mobile'
}

interface Emits {
  (e: 'open-modal', point: GrammarPoint): void
  (e: 'reset-score', grammarPoint: string): void
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'desktop'
})

defineEmits<Emits>()

interface GrammarPoint {
  grammarPoint: string
  english: string
  level: string
  userScore?: number
}

const getLevelBadgeClass = (level: string) => ({
  N5: 'badge-success',
  N4: 'badge-info',
  N3: 'badge-warning',
  N2: 'badge-accent',
  N1: 'badge-error'
}[level] ?? 'badge-neutral')

const getProgressClass = (score: number) => {
  if (score >= 80) return 'progress-success'
  if (score >= 60) return 'progress-info'
  if (score >= 40) return 'progress-warning'
  if (score > 0) return 'progress-error'
  return 'progress-base-300'
}

const getScoreLabel = (score: number) => {
  if (score >= 80) return 'Mastered'
  if (score >= 60) return 'Proficient'
  if (score >= 40) return 'Learning'
  if (score > 0) return 'Beginner'
  return 'Not Started'
}
</script>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>