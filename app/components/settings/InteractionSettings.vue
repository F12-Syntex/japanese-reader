<template>
  <div class="space-y-6 px-2 md:px-0">
    <div class="card bg-base-200/50 border border-base-300">
      <div class="card-body p-4 md:p-6">
        <h3 class="text-base font-bold flex items-center gap-2 mb-4">
          <IconMousePointer class="w-5 h-5" />
          Interaction
        </h3>

        <div class="space-y-4">
          <div class="form-control">
            <label class="label cursor-pointer">
              <span class="label-text font-medium text-sm">Click to Toggle Highlight</span>
              <input v-model="settings.clickToToggle" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
            </label>
          </div>

          <div class="form-control">
            <label class="label cursor-pointer">
              <span class="label-text font-medium text-sm">Auto Scroll</span>
              <input v-model="settings.autoScroll" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
            </label>
          </div>

          <div class="form-control">
            <div class="flex justify-between items-center mb-2">
              <label class="label-text font-medium text-sm">Focus Mode Opacity</label>
              <span class="badge badge-primary badge-sm">{{ settings.focusModeOpacity }}%</span>
            </div>
            <input v-model.number="settings.focusModeOpacity" type="range" min="0" max="100" class="range range-primary range-xs" />
          </div>
        </div>
      </div>
    </div>

    <div class="card bg-base-200/50 border border-base-300">
      <div class="card-body p-4 md:p-6">
        <h3 class="text-base font-bold flex items-center gap-2 mb-4">
          <IconRotateCcw class="w-5 h-5" />
          Presets
        </h3>

        <button @click="$emit('reset')" class="btn btn-outline btn-sm w-full gap-2">
          <IconRotateCcw class="w-4 h-4" />
          Reset to Defaults
        </button>
      </div>
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