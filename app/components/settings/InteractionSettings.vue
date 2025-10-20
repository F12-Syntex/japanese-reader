<template>
  <div class="space-y-6">
    <div class="space-y-4">
      <h3 class="text-base font-bold flex items-center gap-2">
        <IconMousePointer class="w-4 h-4" />
        Interaction
      </h3>

      <div class="form-control">
        <label class="label cursor-pointer">
          <span class="label-text font-medium text-sm">Click to Toggle Highlight</span>
          <input v-model="settings.clickToToggle" type="checkbox" class="toggle toggle-primary toggle-sm" />
        </label>
      </div>

      <div class="form-control">
        <label class="label cursor-pointer">
          <span class="label-text font-medium text-sm">Auto Scroll</span>
          <input v-model="settings.autoScroll" type="checkbox" class="toggle toggle-primary toggle-sm" />
        </label>
      </div>

      <div class="form-control">
        <label class="label">
          <span class="label-text font-medium text-sm">Focus Mode Opacity: {{ settings.focusModeOpacity }}%</span>
        </label>
        <input v-model.number="settings.focusModeOpacity" type="range" min="0" max="100" class="range range-primary range-xs" />
      </div>
    </div>

    <div class="divider"></div>

    <div class="space-y-4">
      <h3 class="text-base font-bold flex items-center gap-2">
        <IconRotateCcw class="w-4 h-4" />
        Presets
      </h3>

      <button @click="$emit('reset')" class="btn btn-outline btn-sm w-full gap-2">
        <IconRotateCcw class="w-4 h-4" />
        Reset to Defaults
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import IconMousePointer from '~icons/lucide/mouse-pointer'
import IconRotateCcw from '~icons/lucide/rotate-ccw'
import { type ReaderSettings } from '~/types/reader'

defineProps<{
  settings: ReaderSettings
}>()

defineEmits<{
  reset: []
}>()
</script>